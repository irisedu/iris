import { Router } from 'express';
import { requireAuth } from '../auth/index.js';
import { requireWorkspaceGroup, getTemplateFileStream } from './utils.js';
import { Upload } from '@aws-sdk/lib-storage';
import crypto from 'crypto';
import stream from 'stream/promises';
import { s3Client } from '../obj/index.js';
import { HeadObjectCommand, NotFound } from '@aws-sdk/client-s3';
import formidable from 'formidable';
import fs from 'fs';
import { db } from '../../db/index.js';

const router = Router();

router.get(
	'/all/templates',
	requireAuth({ group: 'repo:users' }),
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		db.selectFrom('repo_workspace_group')
			.where('user_id', '=', req.session.user.id)
			.select('workspace_id')
			.execute()
			.then((groups) => groups.map((g) => g.workspace_id))
			.then(async (workspaces) => {
				if (!workspaces.length) {
					res.json([]);
					return;
				}

				const templates = await db
					.selectFrom('repo_template')
					.where('workspace_id', 'in', workspaces)
					.selectAll()
					.execute();

				res.json(templates);
			})
			.catch(next);
	}
);

router.post(
	'/:wid/templates/new',
	requireAuth({ group: 'repo:users' }),
	requireWorkspaceGroup(['owner', 'member']),
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		if (!req.body) {
			res.sendStatus(400);
			return;
		}

		const { wid } = req.params;
		const { name } = req.body;

		if (typeof name !== 'string') {
			res.sendStatus(400);
			return;
		}

		db.insertInto('repo_template')
			.values({
				workspace_id: wid,
				name
			})
			.execute()
			.then(() => res.sendStatus(200))
			.catch(next);
	}
);

router.post(
	'/:wid/templates/:tid/upload',
	requireAuth({ group: 'repo:users' }),
	requireWorkspaceGroup(['owner', 'member']),
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { wid, tid } = req.params;

		const form = formidable({
			maxFiles: 1,
			maxFileSize: 2048 * 1024 * 1024
		});

		form
			.parse(req)
			.then(async ([_fields, files]) => {
				if (!files.file || !files.file.length) return res.sendStatus(400);

				const { filepath, mimetype } = files.file[0];
				if (mimetype !== 'application/zip') {
					res.sendStatus(400);
					return;
				}

				const hash = crypto.createHash('sha256');
				await stream.pipeline(fs.createReadStream(filepath), hash);
				const templateHash = hash.digest('hex');

				try {
					await s3Client.send(
						new HeadObjectCommand({
							Bucket: process.env.S3_QUESTION_REPO_BUCKET!,
							Key: templateHash
						})
					);
				} catch (e: unknown) {
					if (e instanceof NotFound) {
						const upload = new Upload({
							client: s3Client,
							params: {
								Bucket: process.env.S3_QUESTION_REPO_BUCKET!,
								Key: templateHash,
								Body: fs.createReadStream(filepath),
								ContentType: 'application/zip'
							}
						});

						await upload.done();
					}
				}

				await db
					.updateTable('repo_template')
					.set({
						hash: templateHash
					})
					.where('workspace_id', '=', wid)
					.where('id', '=', tid)
					.execute();

				res.sendStatus(200);
			})
			.catch(next);
	}
);

router.get(
	'/:wid/templates/:tid/download',
	requireAuth({ group: 'repo:users' }),
	requireWorkspaceGroup(['owner', 'member']),
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { wid, tid } = req.params;

		db.selectFrom('repo_template')
			.where('workspace_id', '=', wid)
			.where('id', '=', tid)
			.selectAll()
			.executeTakeFirst()
			.then(async (template) => {
				if (!template || !template.hash) {
					res.sendStatus(404);
					return;
				}

				const strm = await getTemplateFileStream(template.hash);
				if (!strm) {
					res.sendStatus(500);
					return;
				}

				res.setHeader(
					'Content-Disposition',
					`attachment; filename=Template_${template.name}.zip`
				);
				res.contentType('application/zip');
				strm.pipe(res);
			})
			.catch(next);
	}
);

export default router;
