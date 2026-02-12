import { Router } from 'express';
import { requireAuth } from '../auth/index.js';
import {
	requireWorkspaceAccess,
	getMediaFileStream,
	uploadMediaFileFromForm
} from './utils.js';
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
	requireWorkspaceAccess('member'),
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
	requireWorkspaceAccess('member'),
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { wid, tid } = req.params;

		uploadMediaFileFromForm(req, (mime) => mime === 'application/zip')
			.then(async (fileRes) => {
				if (!fileRes) return res.sendStatus(400);

				await db
					.updateTable('repo_template')
					.set({
						hash: fileRes.hash
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
	requireWorkspaceAccess('member'),
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

				const strm = await getMediaFileStream(template.hash);
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
