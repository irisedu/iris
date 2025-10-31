import { db } from '../../db/index.js';
import archiver from 'archiver';
import os from 'os';
import path from 'path';
import { promises as fs, createReadStream, type ReadStream } from 'fs';
import { s3Client } from '../obj/index.js';
import { GetObjectCommand } from '@aws-sdk/client-s3';

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
	}
}

export async function getQuestionArchive(
	type: string,
	data: unknown,
	template: string
): Promise<Buffer> {
	const buffers: Buffer[] = [];

	if (type === 'latex') {
		const archive = archiver('zip');

		await new Promise((res, rej) => {
			archive.on('data', (data) => {
				buffers.push(data);
			});
			archive.on('end', res);
			archive.on('error', rej);

			let code = (data as { code: string }).code;

			if (template === 'builtin') {
				code = `\\documentclass{article}

\\begin{document}
${code}
\\end{document}
`;
			}

			archive.append(code, { name: 'main.tex' });
			archive.finalize();
		});
	}

	return Buffer.concat(buffers);
}
