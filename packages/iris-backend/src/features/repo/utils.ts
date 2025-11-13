import { db } from '../../db/index.js';
import archiver from 'archiver';
import unzipper from 'unzipper';
import os from 'os';
import path from 'path';
import { promises as fs, createReadStream, type ReadStream } from 'fs';
import { s3Client } from '../obj/index.js';
import { GetObjectCommand, NoSuchKey } from '@aws-sdk/client-s3';

const cacheDir = path.join(os.tmpdir(), 'iris-repo-cache');

export async function getUserWorkspaceGroup(uid: string, wid: string) {
	return (
		await db
			.selectFrom('repo_workspace_group')
			.where('workspace_id', '=', wid)
			.where('user_id', '=', uid)
			.select('group_name')
			.executeTakeFirst()
	)?.group_name;
}

export async function getTemplateFileStream(
	hash: string
): Promise<ReadStream | null> {
	await fs.mkdir(cacheDir, { recursive: true });

	const cachePath = path.join(cacheDir, hash);

	try {
		await fs.access(cachePath);
		return createReadStream(cachePath);
	} catch {
		try {
			const res = await s3Client.send(
				new GetObjectCommand({
					Bucket: process.env.S3_QUESTION_REPO_BUCKET!,
					Key: hash
				})
			);

			const body = await res.Body?.transformToByteArray();
			if (!body) return null;

			await fs.writeFile(cachePath, body);
			return createReadStream(cachePath);
		} catch (e: unknown) {
			if (e instanceof NoSuchKey) {
				return null;
			}

			throw e;
		}
	}
}

export async function getQuestionPreviewArchive(
	type: string,
	data: unknown,
	template: string,
	templateReplacements: Record<string, unknown>
): Promise<Buffer | null> {
	const buffers: Buffer[] = [];

	if (type === 'latex') {
		const archive = archiver('zip');

		await new Promise((res, rej) => {
			archive.on('data', (data) => {
				buffers.push(data);
			});
			archive.on('end', res);
			archive.on('error', rej);

			const code = (data as { code: string }).code;

			getTemplateFileStream(template)
				.then((st) => st?.pipe(unzipper.Parse({ forceStream: true })))
				.then(async (zip) => {
					if (!zip) {
						rej();
						return;
					}

					for await (const entry of zip) {
						if (entry.path === 'main.tex') {
							const template = (await entry.buffer()).toString('utf-8');
							let populatedTemplate = template.replace(
								'${[INCLUDE_CONTENT]}',
								code
							);

							for (const [k, v] of Object.entries(templateReplacements)) {
								populatedTemplate = populatedTemplate.replace(k, String(v));
							}

							archive.append(populatedTemplate, { name: 'main.tex' });
						} else {
							archive.append(await entry.buffer(), { name: entry.path });
						}
					}

					archive.finalize();
				});
		});
	}

	return Buffer.concat(buffers);
}
