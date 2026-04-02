import { db } from '../../db/index.js';
import archiver, { type Archiver } from 'archiver';
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
const templateFileExts = ['.tex', '.sty'];

export type RepoGroup = 'owner' | 'privilegedmember' | 'member';

// Sync with QuestionEdit.tsx and WorksheetEdit.tsx
export const privilegeLevels: Record<RepoGroup, number> = {
	owner: 32767, // max smallint
	privilegedmember: 128,
	member: 0
};

export interface QuestionData {
	code?: string;
	media?: Record<string, string>;
}

export interface WorksheetData {
	questions: {
		id: string;
		rev?: string;
	}[];
	vars?: Record<string, string>;
}

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

export function requireWorkspaceAccess(minGroup: RepoGroup): RequestHandler {
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
				if (
					!group ||
					privilegeLevels[group as RepoGroup] < privilegeLevels[minGroup]
				) {
					res.sendStatus(403);
					return;
				}

				next();
			})
			.catch(next);
	};
}

export const requireQuestionAccess: RequestHandler = (req, res, next) => {
	if (req.session.user?.type !== 'registered') {
		res.sendStatus(401);
		return;
	}

	// Required when using this middleware
	const { wid, qid } = req.params;
	if (!wid || !qid) {
		res.sendStatus(500);
		return;
	}

	getUserWorkspaceGroup(req.session.user.id, wid)
		.then(async (group) => {
			const question = await db
				.selectFrom('repo_question')
				.where('workspace_id', '=', wid)
				.where('id', '=', qid)
				.select('privilege')
				.executeTakeFirst();

			if (!question) {
				res.sendStatus(404);
				return;
			}

			if (privilegeLevels[group as RepoGroup] < question.privilege) {
				res.sendStatus(403);
				return;
			}

			next();
		})
		.catch(next);
};

export const requireWorksheetAccess: RequestHandler = (req, res, next) => {
	if (req.session.user?.type !== 'registered') {
		res.sendStatus(401);
		return;
	}

	// Required when using this middleware
	const { wid, wsid } = req.params;
	if (!wid || !wsid) {
		res.sendStatus(500);
		return;
	}

	getUserWorkspaceGroup(req.session.user.id, wid)
		.then(async (group) => {
			const worksheet = await db
				.selectFrom('repo_worksheet')
				.where('workspace_id', '=', wid)
				.where('id', '=', wsid)
				.select('privilege')
				.executeTakeFirst();

			if (!worksheet) {
				res.sendStatus(404);
				return;
			}

			if (privilegeLevels[group as RepoGroup] < worksheet.privilege) {
				res.sendStatus(403);
				return;
			}

			next();
		})
		.catch(next);
};

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
					Body: createReadStream(filepath)
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

function getTemplateFileVariables(contents: string): string[] {
	const parts = contents.split('${[');
	const vars = [];
	for (const part of parts) {
		if (part.includes(']}')) vars.push(part.slice(0, part.indexOf(']}')));
	}

	return vars;
}

export async function getTemplateVariables(
	templateHash: string
): Promise<string[]> {
	const st = await getMediaFileStream(templateHash);
	if (!st) return [];
	const zip = st.pipe(unzipper.Parse({ forceStream: true }));

	const vars: string[] = [];

	for await (const entry of zip) {
		if (templateFileExts.some((ext) => entry.path.endsWith(ext))) {
			vars.push(
				...getTemplateFileVariables((await entry.buffer()).toString('utf-8'))
			);
		}
	}

	return vars;
}

export async function populateTemplate(
	templateHash: string,
	getTemplateReplacements: (
		archive: Archiver
	) => Promise<Record<string, unknown>>
): Promise<Buffer> {
	const buffers: Buffer[] = [];
	const archive = archiver('zip');

	await new Promise((res, rej) => {
		archive.on('data', (data) => {
			buffers.push(data);
		});
		archive.on('end', res);
		archive.on('error', rej);

		getMediaFileStream(templateHash)
			.then((st) => st?.pipe(unzipper.Parse({ forceStream: true })))
			.then(async (zip) => {
				if (!zip) {
					rej();
					return;
				}

				const replacements = await getTemplateReplacements(archive);

				for await (const entry of zip) {
					if (templateFileExts.some((ext) => entry.path.endsWith(ext))) {
						let contents = (await entry.buffer()).toString('utf-8');
						const vars = getTemplateFileVariables(contents);

						for (const [k, v] of Object.entries(replacements)) {
							contents = contents.replace(k, String(v));
						}

						for (const v of vars) {
							const toReplace = '${[' + v + ']}';
							if (replacements[toReplace] !== undefined) continue;
							contents = contents.replace(toReplace, '');
						}

						archive.append(contents, { name: entry.path });
					} else {
						archive.append(await entry.buffer(), { name: entry.path });
					}
				}

				archive.finalize();
			});
	});

	return Buffer.concat(buffers);
}

function wrapQuestionContents(code: string) {
	return `\\begin{samepage}\\par\\nobreak\\vfil\\penalty0\\vfilneg\n${code}\n\\end{samepage}\\filbreak\n`;
}

export async function getQuestionPreviewArchive(
	type: string,
	data: QuestionData,
	template: string,
	templateReplacements: Record<string, unknown>
): Promise<Buffer | null> {
	if (type === 'latex') {
		return populateTemplate(template, async (archive) => {
			if (data.media) {
				for (const [filename, hash] of Object.entries(data.media)) {
					const strm = await getMediaFileStream(hash);
					if (!strm) continue; // TODO

					archive.append(await streamToBuffer(strm), { name: filename });
				}
			}

			return {
				...templateReplacements,
				'${[INCLUDE_CONTENT]}': wrapQuestionContents(data.code ?? '')
			};
		});
	}

	return null;
}

export async function getWorksheetPreviewArchive(
	data: WorksheetData,
	template: string,
	templateReplacements: Record<string, unknown>
): Promise<Buffer> {
	return populateTemplate(template, async (archive) => {
		let includeContent = '';

		for (const q of data.questions) {
			const questionData =
				q.rev === 'latest' || q.rev === undefined
					? await db
							.selectFrom('repo_question')
							.innerJoin(
								'repo_question_rev',
								'repo_question.id',
								'repo_question_rev.question_id'
							)
							.where('repo_question.id', '=', q.id)
							.select([
								'repo_question.num',
								'repo_question.type',
								'repo_question_rev.created as updated',
								'repo_question_rev.data'
							])
							.orderBy('updated', 'desc')
							.executeTakeFirst()
					: await db
							.selectFrom('repo_question_rev')
							.innerJoin(
								'repo_question',
								'repo_question_rev.question_id',
								'repo_question.id'
							)
							.where('repo_question_rev.id', '=', q.rev)
							.where('repo_question.id', '=', q.id)
							.select([
								'repo_question.num',
								'repo_question.type',
								'repo_question_rev.created as updated',
								'repo_question_rev.data'
							])
							.executeTakeFirst();

			if (!questionData) continue;

			if (questionData.type === 'latex') {
				const { code, media } = questionData.data as unknown as QuestionData;
				// Put every question into its own directory. Avoids media filename clashing
				archive.append(code ?? '', { name: `${questionData.num}/main.tex` });

				if (media) {
					for (const [filename, hash] of Object.entries(media)) {
						const strm = await getMediaFileStream(hash);
						if (!strm) continue; // TODO

						archive.append(await streamToBuffer(strm), {
							name: `${questionData.num}/${filename}`
						});
					}
				}

				includeContent += wrapQuestionContents(
					`\\import{${questionData.num}/}{main.tex}`
				);
			}
		}

		const preDocumentInject = '\\usepackage{import}';

		return {
			...templateReplacements,
			// HACK
			'\\begin{document}': `${preDocumentInject}\n\n\\begin{document}`,
			'${[INCLUDE_CONTENT]}': includeContent
		};
	});
}
