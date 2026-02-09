import { db } from '../../db/index.js';
import archiver from 'archiver';
import unzipper from 'unzipper';
import { type RequestHandler } from 'express';
import os from 'os';
import path from 'path';
import formidable from 'formidable';
import crypto from 'crypto';
import stream from 'stream/promises';
import { promises as fs, createReadStream, type ReadStream } from 'fs';
import { s3Client } from '../obj/index.js';
import {
	HeadObjectCommand,
	NotFound,
	GetObjectCommand,
	NoSuchKey
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import type { IncomingMessage } from 'http';

const cacheDir = path.join(os.tmpdir(), 'iris-repo-cache');

export interface QuestionData {
	code?: string;
	media?: Record<string, string>;
}

async function getUserWorkspaceGroup(uid: string, wid: string) {
	return (
		await db
			.selectFrom('repo_workspace_group')
			.where('workspace_id', '=', wid)
			.where('user_id', '=', uid)
			.select('group_name')
			.executeTakeFirst()
	)?.group_name;
}

export function requireWorkspaceGroup(allowedGroups: string[]): RequestHandler {
	return (req, res, next) => {
		if (req.session.user?.type !== 'registered') {
			res.sendStatus(401);
			return;
		}

		// Required when using this middleware
		const wid = req.params.wid;
		if (!wid) {
			res.sendStatus(500);
			return;
		}

		getUserWorkspaceGroup(req.session.user.id, wid)
			.then(async (group) => {
				if (!group || !allowedGroups.includes(group)) {
					res.sendStatus(403);
					return;
				}

				next();
			})
			.catch(next);
	};
}

export async function uploadMediaFileFromForm(
	req: IncomingMessage,
	validateMime?: (mime: string | null) => boolean
): Promise<{ hash: string; name: string } | null> {
	const form = formidable({
		maxFiles: 1,
		maxFileSize: 2048 * 1024 * 1024
	});

	const [_fields, files] = await form.parse(req);
	if (!files.file || !files.file.length) return null;

	const { filepath, mimetype, originalFilename } = files.file[0];
	if ((validateMime && !validateMime(mimetype)) || !originalFilename) {
		return null;
	}

	const hash = crypto.createHash('sha256');
	await stream.pipeline(createReadStream(filepath), hash);
	const fileHash = hash.digest('hex');

	try {
		await s3Client.send(
			new HeadObjectCommand({
				Bucket: process.env.S3_QUESTION_REPO_BUCKET!,
				Key: fileHash
			})
		);
	} catch (e: unknown) {
		if (e instanceof NotFound) {
			const upload = new Upload({
				client: s3Client,
				params: {
					Bucket: process.env.S3_QUESTION_REPO_BUCKET!,
					Key: fileHash,
					Body: createReadStream(filepath),
					ContentType: 'application/zip'
				}
			});

			await upload.done();
		}
	}

	return {
		hash: fileHash,
		name: originalFilename
	};
}

export async function getMediaFileStream(
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

async function streamToBuffer(stream: ReadStream): Promise<Buffer> {
	const buffers: Buffer[] = [];

	return new Promise((res, rej) => {
		stream.on('data', (data) => {
			buffers.push(Buffer.from(data));
		});
		stream.on('end', () => res(Buffer.concat(buffers)));
		stream.on('error', rej);
	});
}

export async function getQuestionArchive(
	type: string,
	data: QuestionData
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

			if (type === 'latex') {
				archive.append(String(data.code), { name: 'question.tex' });
			}

			(async function () {
				if (data.media) {
					for (const [filename, hash] of Object.entries(data.media)) {
						const strm = await getMediaFileStream(hash);
						if (!strm) continue; // TODO

						archive.append(await streamToBuffer(strm), { name: filename });
					}
				}

				archive.finalize();
			})();
		});
	}

	return Buffer.concat(buffers);
}

export async function getQuestionPreviewArchive(
	type: string,
	data: QuestionData,
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

			getMediaFileStream(template)
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
								data.code
							);

							for (const [k, v] of Object.entries(templateReplacements)) {
								populatedTemplate = populatedTemplate.replace(k, String(v));
							}

							archive.append(populatedTemplate, { name: 'main.tex' });
						} else {
							archive.append(await entry.buffer(), { name: entry.path });
						}
					}

					if (data.media) {
						for (const [filename, hash] of Object.entries(data.media)) {
							const strm = await getMediaFileStream(hash);
							if (!strm) continue; // TODO

							archive.append(await streamToBuffer(strm), { name: filename });
						}
					}

					archive.finalize();
				});
		});
	}

	return Buffer.concat(buffers);
}
