import { s3Client } from '../obj/index.js';
import { Upload } from '@aws-sdk/lib-storage';
import {
	DeleteObjectsCommand,
	waitUntilObjectNotExists,
	HeadObjectCommand,
	NotFound
} from '@aws-sdk/client-s3';
import unzipper from 'unzipper';
import path from 'path';
import { type DB, db } from '../../db/index.js';
import type { SeriesInfo } from 'patchouli';
import crypto from 'crypto';
import stream from 'stream/promises';
import { type Transaction } from 'kysely';
import { createReadStream } from 'fs';
import mime from 'mime-types';

const ignoredFiles = new Set(['build.json', 'backlinks.json', 'network.json']);

async function indexSeries(
	trx: Transaction<DB>,
	project: string,
	rev: string,
	buffer: Buffer
) {
	const contents: SeriesInfo[] = JSON.parse(buffer.toString('utf-8'));

	await trx
		.insertInto('series')
		.values(
			contents.map((s) => ({
				project_name: project,
				path: s.href,
				rev,
				data: JSON.stringify(s)
			}))
		)
		.execute();

	await trx
		.insertInto('series')
		.values(
			contents.map((s) => ({
				project_name: project,
				path: s.href,
				rev: 'latest',
				data: JSON.stringify(s)
			}))
		)
		.onConflict((c) =>
			c
				.columns(['project_name', 'path', 'rev'])
				.doUpdateSet({ data: (eb) => eb.ref('excluded.data') })
		)
		.execute();

	return contents.map((s) => s.href);
}

async function indexDocument(
	trx: Transaction<DB>,
	project: string,
	filePath: string,
	rev: string,
	buffer: Buffer
) {
	const hash = crypto.createHash('sha256').update(buffer).digest('hex');
	const data = buffer.toString('utf-8');

	let docId = (
		await db
			.selectFrom('document')
			.where('project_name', '=', project)
			.where('hash', '=', hash)
			.select('id')
			.executeTakeFirst()
	)?.id;

	if (!docId) {
		docId = (await trx
			.insertInto('document')
			.values({
				project_name: project,
				hash,
				data
			})
			.returning('id')
			.executeTakeFirst())!.id;
	}

	await trx
		.insertInto('document_ptr')
		.values({
			project_name: project,
			path: filePath,
			rev,
			doc_id: docId
		})
		.execute();

	await trx
		.insertInto('document_ptr')
		.values({
			project_name: project,
			path: filePath,
			rev: 'latest',
			doc_id: docId
		})
		.onConflict((c) =>
			c
				.columns(['path', 'rev'])
				.doUpdateSet({ doc_id: (eb) => eb.ref('excluded.doc_id') })
		)
		.execute();
}

async function indexAsset(
	trx: Transaction<DB>,
	project: string,
	filePath: string,
	rev: string,
	file: unzipper.File
) {
	const hash = crypto.createHash('sha256');
	await stream.pipeline(file.stream(), hash);
	const assetHash = hash.digest('hex');

	try {
		await s3Client.send(
			new HeadObjectCommand({
				Bucket: process.env.S3_CONTENT_BUCKET!,
				Key: assetHash
			})
		);
	} catch (e: unknown) {
		if (e instanceof NotFound) {
			const upload = new Upload({
				client: s3Client,
				params: {
					Bucket: process.env.S3_CONTENT_BUCKET!,
					Key: assetHash,
					Body: file.stream(),
					ContentType: mime.lookup(filePath) || 'application/octet-stream'
				}
			});

			await upload.done();
		}
	}

	await trx
		.insertInto('asset_ptr')
		.values({
			project_name: project,
			path: filePath,
			rev,
			hash: assetHash
		})
		.execute();

	await trx
		.insertInto('asset_ptr')
		.values({
			project_name: project,
			path: filePath,
			rev: 'latest',
			hash: assetHash
		})
		.onConflict((c) =>
			c
				.columns(['project_name', 'path', 'rev'])
				.doUpdateSet({ hash: (eb) => eb.ref('excluded.hash') })
		)
		.execute();
}

async function repoUpdateInternal(
	trx: Transaction<DB>,
	zipFile: string,
	userId: string
) {
	const zipDir = await unzipper.Open.file(zipFile);
	let roots = zipDir.files.map((f) => f.path.split('/')[0]);
	roots = [...new Set(roots)];

	if (roots.length !== 1)
		throw new Error('Archive root must contain exactly one directory');

	const zipRoot = roots[0];
	const projectName = zipRoot.toLowerCase();

	// 1. Create project and assign user group
	// TODO: authorization: check user role, send appropriate status code in response
	const existingProject = await db
		.selectFrom('project')
		.where('name', '=', projectName)
		.selectAll()
		.executeTakeFirst();

	let existingSeries: { path: string }[] = [];
	let existingDocuments: { path: string }[] = [];
	let existingAssets: { id: string; path: string }[] = [];

	if (existingProject) {
		existingSeries = await db
			.selectFrom('series')
			.where('project_name', '=', projectName)
			.where('rev', '=', 'latest')
			.select(['path'])
			.execute();
		existingDocuments = await db
			.selectFrom('document_ptr')
			.where('project_name', '=', projectName)
			.where('rev', '=', 'latest')
			.select(['path'])
			.execute();
		existingAssets = await db
			.selectFrom('asset_ptr')
			.where('project_name', '=', projectName)
			.where('rev', '=', 'latest')
			.select(['id', 'path'])
			.execute();
	} else {
		await trx
			.insertInto('project')
			.values({
				name: projectName
			})
			.onConflict((c) => c.doNothing())
			.execute();

		await trx
			.insertInto('project_group')
			.values({
				project_name: projectName,
				user_id: userId,
				group_name: 'owner'
			})
			.execute();
	}

	// 2. Index build data from ZIP
	const rev = new Date().getTime().toString();

	const indexedSeries = new Set();
	const indexedDocuments = new Set();
	const indexedAssets = new Set();

	const filesToExtract = zipDir.files.filter(
		(f) => f.type === 'File' && f.path.startsWith(zipRoot + '/')
	);

	for (const file of filesToExtract) {
		const projRelPath = path.relative(zipRoot, file.path);
		const buildPfx = 'build/';
		if (!projRelPath.startsWith(buildPfx)) continue;
		const buildRelPath = projRelPath.slice(buildPfx.length);
		if (ignoredFiles.has(buildRelPath)) continue;

		if (buildRelPath === 'series.json') {
			(await indexSeries(trx, projectName, rev, await file.buffer())).forEach(
				(href) => indexedSeries.add(href)
			);
		} else if (
			buildRelPath.endsWith('.irisc') ||
			buildRelPath.endsWith('.iq.json')
		) {
			// Document
			await indexDocument(
				trx,
				projectName,
				buildRelPath,
				rev,
				await file.buffer()
			);

			indexedDocuments.add(buildRelPath);
		} else {
			// Asset
			await indexAsset(trx, projectName, buildRelPath, rev, file);

			indexedAssets.add(buildRelPath);
		}
	}

	// 3. Remove 'latest' entry for deleted files
	for (const series of existingSeries) {
		if (indexedSeries.has(series.path)) continue;
		await trx
			.deleteFrom('series')
			.where('path', '=', series.path)
			.where('rev', '=', 'latest')
			.execute();
	}

	for (const doc of existingDocuments) {
		if (indexedDocuments.has(doc.path)) continue;
		await trx
			.deleteFrom('document_ptr')
			.where('path', '=', doc.path)
			.where('rev', '=', 'latest')
			.execute();
	}

	for (const asset of existingAssets) {
		if (indexedAssets.has(asset.path)) continue;
		await trx.deleteFrom('asset_ptr').where('id', '=', asset.id).execute();
	}

	// 4. Upload archive to S3, create rev entry
	const hash = crypto.createHash('sha256');
	await stream.pipeline(createReadStream(zipFile), hash);
	const archiveHash = hash.digest('hex');

	try {
		await s3Client.send(
			new HeadObjectCommand({
				Bucket: process.env.S3_REPO_BUCKET!,
				Key: archiveHash
			})
		);
	} catch (e: unknown) {
		if (e instanceof NotFound) {
			const upload = new Upload({
				client: s3Client,
				params: {
					Bucket: process.env.S3_REPO_BUCKET!,
					Key: archiveHash,
					Body: createReadStream(zipFile),
					ContentType: 'application/zip'
				}
			});

			await upload.done();
		}
	}

	await trx
		.insertInto('project_rev')
		.values({
			project_name: projectName,
			rev,
			hash: archiveHash
		})
		.execute();

	await trx
		.updateTable('project')
		.set({
			rev
		})
		.where('name', '=', projectName)
		.execute();
}

export function repoUpdate(zipFile: string, userId: string) {
	return db
		.transaction()
		.execute(async (trx) => await repoUpdateInternal(trx, zipFile, userId));
}

async function repoDeleteInternal(trx: Transaction<DB>, projectName: string) {
	// 1. Keep track of S3 objects that will be orphaned
	const revs = await db
		.selectFrom('project_rev')
		.where('project_name', '=', projectName)
		.select('hash')
		.execute();
	const assets = await db
		.selectFrom('asset_ptr')
		.where('project_name', '=', projectName)
		.select('hash')
		.execute();
	const sharedAssets = await db
		.selectFrom('asset_ptr')
		.where('asset_ptr.project_name', '=', projectName)
		.innerJoin('asset_ptr as asset_ptr2', 'asset_ptr.hash', 'asset_ptr2.hash')
		.where('asset_ptr2.project_name', '<>', projectName)
		.select('asset_ptr2.hash')
		.execute();

	// 2. Delete project
	// -> Delete project_rev, project_group, series, document, asset (ON CASCADE)
	// -> Delete question_submission (ON CASCADE)
	await trx.deleteFrom('project').where('name', '=', projectName).execute();

	// 3. Delete revs on S3
	const MAX_WAIT = 10;

	if (revs.length > 0) {
		await s3Client.send(
			new DeleteObjectsCommand({
				Bucket: process.env.S3_REPO_BUCKET!,
				Delete: {
					Objects: revs.map((r) => ({ Key: r.hash }))
				}
			})
		);

		for (const r of revs) {
			await waitUntilObjectNotExists(
				{ client: s3Client, maxWaitTime: MAX_WAIT },
				{ Bucket: process.env.S3_REPO_BUCKET!, Key: r.hash }
			);
		}
	}

	// 4. Delete orphaned assets on S3
	const sharedAssetsSet = new Set(sharedAssets.map((a) => a.hash));
	const assetsToDelete = assets
		.map((a) => a.hash)
		.filter((h) => !sharedAssetsSet.has(h));

	if (assetsToDelete.length > 0) {
		await s3Client.send(
			new DeleteObjectsCommand({
				Bucket: process.env.S3_CONTENT_BUCKET!,
				Delete: {
					Objects: assetsToDelete.map((h) => ({ Key: h }))
				}
			})
		);

		for (const h of assetsToDelete) {
			await waitUntilObjectNotExists(
				{ client: s3Client, maxWaitTime: MAX_WAIT },
				{ Bucket: process.env.S3_CONTENT_BUCKET!, Key: h }
			);
		}
	}
}

export async function repoDelete(projectName: string) {
	return db
		.transaction()
		.execute(async (trx) => await repoDeleteInternal(trx, projectName));
}
