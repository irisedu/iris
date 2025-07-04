import { simpleGit as sg } from 'simple-git';
import unzipper from 'unzipper';
import path from 'path';
import { promises as fs, createWriteStream, createReadStream } from 'fs';
import lockfile from 'proper-lockfile';
import { db } from '../../db/index.js';
import { repoRoot, assetsRoot } from '../../constants.js';
import type { SeriesInfo } from 'patchouli';
import crypto from 'crypto';
import stream from 'stream/promises';

function simpleGit(baseDir: string) {
	return sg({
		baseDir,
		timeout: {
			block: 5000
		}
	});
}

const ignoredFiles = new Set([
	'content/build/build.json',
	'content/build/backlinks.json',
	'content/build/network.json'
]);

function getFileType(file: string) {
	if (file.endsWith('.irisc') || file.endsWith('.iq.json')) return 'doc';

	return 'asset';
}

export async function indexFile(
	project: string,
	repo: string,
	file: string,
	rev: string
) {
	const relPath = path.relative('content/build', file);
	const filePath = path.join(repo, file);

	let deleted = false;

	try {
		await fs.access(filePath);
	} catch {
		deleted = true;
	}

	if (file === 'content/build/series.json') {
		const contents: SeriesInfo[] = JSON.parse(
			await fs.readFile(filePath, 'utf-8')
		);

		await db.deleteFrom('series').where('project_name', '=', project).execute();

		await db
			.insertInto('series')
			.values(
				contents.map((s) => ({
					href: s.href,
					project_name: project,
					data: JSON.stringify(s)
				}))
			)
			.execute();

		return;
	}

	const fileType = getFileType(file);

	if (fileType === 'doc') {
		// Document
		let docId: string | undefined;

		if (!deleted) {
			docId = (await db
				.insertInto('document')
				.values({
					rev,
					data: await fs.readFile(filePath, 'utf-8'),
					project_name: project
				})
				.onConflict((c) => c.doNothing())
				.returning('id')
				.executeTakeFirst())!.id;
		}

		return { type: 'doc', path: relPath, docId };
	} else if (fileType === 'asset') {
		// Asset
		let assetId: string | undefined;

		if (!deleted) {
			// https://stackoverflow.com/a/75949050
			const fstream = createReadStream(filePath);
			const hash = crypto.createHash('sha256');
			await stream.pipeline(fstream, hash);
			const assetHash = hash.digest('hex');

			const assetDir = path.join(
				assetsRoot,
				assetHash.substring(0, 2),
				assetHash.substring(0, 4)
			);
			await fs.mkdir(assetDir, { recursive: true });
			await fs.cp(filePath, path.join(assetDir, assetHash));

			await db
				.insertInto('asset')
				.values({
					id: assetHash,
					rev
				})
				.onConflict((c) => c.doNothing())
				.execute();

			assetId = assetHash;
		}

		return { type: 'asset', path: relPath, assetId };
	}
}

export async function indexRevs(
	project: string,
	repo: string,
	from: string,
	to: string
) {
	const git = simpleGit(repo);
	const diff = await git.diffSummary([from, to, '--', 'content/build/']);

	for (const file of diff.files) {
		if (ignoredFiles.has(file.file)) continue;
		const res = await indexFile(project, repo, file.file, to);
		if (!res) continue;

		if (res.type === 'doc') {
			if (res.docId) {
				await db
					.insertInto('document_ptr')
					.values({
						path: res.path,
						doc_id: res.docId,
						rev: 'latest',
						project_name: project
					})
					.onConflict((c) =>
						c.columns(['path', 'rev']).doUpdateSet({ doc_id: res.docId })
					)
					.execute();

				await db
					.insertInto('document_ptr')
					.values({
						path: res.path,
						doc_id: res.docId,
						rev: to,
						project_name: project
					})
					.execute();
			} else {
				await db
					.deleteFrom('document_ptr')
					.where('path', '=', res.path)
					.execute();
			}
		} else if (res.type === 'asset') {
			if (res.assetId) {
				await db
					.insertInto('asset_ptr')
					.values({
						path: res.path,
						asset_id: res.assetId,
						rev: 'latest',
						project_name: project
					})
					.onConflict((c) =>
						c.columns(['path', 'rev']).doUpdateSet({ asset_id: res.assetId })
					)
					.execute();

				await db
					.insertInto('asset_ptr')
					.values({
						path: res.path,
						asset_id: res.assetId,
						rev: to,
						project_name: project
					})
					.execute();
			} else {
				await db.deleteFrom('asset_ptr').where('path', '=', res.path).execute();
			}
		}
	}

	const ls = (await git.raw(['ls-files']))
		.split(/\r?\n/)
		.filter((file) => file.length);

	// Update rest of files (excluding modified)
	for (const file of ls) {
		if (ignoredFiles.has(file)) continue;

		const relPath = path.relative('content/build', file);
		const fileType = getFileType(relPath);

		if (fileType === 'doc') {
			const latest = await db
				.selectFrom('document_ptr')
				.where('path', '=', relPath)
				.where('rev', '=', 'latest')
				.selectAll()
				.executeTakeFirst();

			if (!latest) continue;

			await db
				.insertInto('document_ptr')
				.values({
					path: relPath,
					doc_id: latest.doc_id,
					rev: to,
					project_name: project
				})
				.onConflict((c) => c.doNothing())
				.execute();
		} else if (fileType === 'asset') {
			const latest = await db
				.selectFrom('asset_ptr')
				.where('path', '=', relPath)
				.where('rev', '=', 'latest')
				.selectAll()
				.executeTakeFirst();

			if (!latest) continue;

			await db
				.insertInto('asset_ptr')
				.values({
					path: relPath,
					asset_id: latest.asset_id,
					rev: to,
					project_name: project
				})
				.onConflict((c) => c.doNothing())
				.execute();
		}
	}

	await db
		.updateTable('project')
		.where('name', '=', project)
		.set({
			rev: to
		})
		.execute();
}

export async function repoUpdate(zipFile: string, userId: string) {
	const zipDir = await unzipper.Open.file(zipFile);
	let roots = zipDir.files.map((f) => f.path.split('/')[0]);
	roots = [...new Set(roots)];

	if (roots.length !== 1)
		throw new Error('Archive root must contain exactly one directory');

	const zipRoot = roots[0];
	const projectName = zipRoot.toLowerCase();

	// Step 1: Create project and assign user group
	// TODO: authorization: check user role, send appropriate status code in response
	const existingProject = await db
		.selectFrom('project')
		.where('name', '=', projectName)
		.selectAll()
		.executeTakeFirst();

	if (!existingProject) {
		await db
			.insertInto('project')
			.values({
				name: projectName
			})
			.onConflict((c) => c.doNothing())
			.execute();

		await db
			.insertInto('project_group')
			.values({
				project_name: projectName,
				user_id: userId,
				group_name: 'owner'
			})
			.execute();
	}

	// Step 2: Ensure git repo exists
	const repoDir = path.join(repoRoot, projectName);
	await fs.mkdir(repoDir, { recursive: true });

	const releaseLock = await lockfile.lock(repoDir);

	const git = simpleGit(repoDir);
	await git.init();

	// Step 3: Overwrite contents and create a new commit
	const contentDir = path.join(repoDir, 'content');
	await fs.rm(contentDir, { recursive: true, force: true });
	await fs.mkdir(contentDir);

	const filesToExtract = zipDir.files.filter(
		(f) => f.type === 'File' && f.path.startsWith(zipRoot + '/')
	);

	const promises = [];

	for (const file of filesToExtract) {
		const outPath = path.join(contentDir, path.relative(zipRoot, file.path));
		const parentDir = path.dirname(outPath);

		promises.push(
			fs.mkdir(parentDir, { recursive: true }).then(
				() =>
					new Promise<void>((resolve, reject) => {
						file
							.stream()
							.pipe(createWriteStream(outPath))
							.on('error', reject)
							.on('finish', resolve);
					})
			)
		);
	}

	await Promise.all(promises);

	const user = await db
		.selectFrom('user_account')
		.where('id', '=', userId)
		.selectAll()
		.executeTakeFirst();

	if (!user) throw new Error('User vanished!');

	const displayName = user.name ?? '<no name>';

	const commit = await git
		.addConfig('user.email', user.email)
		.addConfig('user.name', displayName)
		.add('.')
		.commit(`User file upload`);

	// Step 4: Index new commit
	if (commit.commit.length) {
		// Non-empty commit
		const beginRev =
			existingProject?.rev ??
			(await git.raw('hash-object', '-t', 'tree', '/dev/null')).trim(); // https://stackoverflow.com/a/40884093

		await indexRevs(projectName, repoDir, beginRev, commit.commit);
	}

	releaseLock();
}

export async function repoDelete(projectName: string) {
	const repoDir = path.join(repoRoot, projectName);
	const releaseLock = await lockfile.lock(repoDir);

	// 1. Delete project
	// -> Delete project_group, series, document, document_ptr, asset_ptr (ON CASCADE)
	// -> Delete question_submission (ON CASCADE)
	await db.deleteFrom('project').where('name', '=', projectName).execute();

	// 2. Delete repo directory
	await fs.rm(repoDir, { recursive: true, force: true });

	// 3. Delete orphaned assets
	const deletedAssets = await db
		.deleteFrom('asset')
		.where(({ not, exists, selectFrom }) =>
			not(
				exists(
					selectFrom('asset_ptr')
						.select('asset_ptr.asset_id')
						.whereRef('asset.id', '=', 'asset_ptr.asset_id')
				)
			)
		)
		.returning('id')
		.execute();

	const tasks = deletedAssets.map(({ id }) => {
		const assetPath = path.join(
			assetsRoot,
			id.substring(0, 2),
			id.substring(0, 4),
			id
		);

		return fs.rm(assetPath, { force: true });
	});

	await Promise.all(tasks);
	releaseLock();
}
