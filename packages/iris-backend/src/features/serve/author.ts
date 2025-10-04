import { Router } from 'express';
import { requireAuth } from '../../features/auth/index.js';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import { repoDelete, repoUpdate } from './repo.js';
import { db } from '../../db/index.js';

export const authorRouter = Router();

authorRouter.get(
	'/projects',
	requireAuth({ group: 'cms:authors' }),
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const userId = req.session.user.id;

		db.selectFrom('project_group')
			.where('user_id', '=', userId)
			.where('group_name', '=', 'owner')
			.select('project_name')
			.execute()
			.then((groups) => {
				const projects = groups.map((g) => g.project_name);
				res.json(projects);
			})
			.catch(next);
	}
);

authorRouter.delete(
	'/projects/:project',
	requireAuth({ group: 'cms:authors' }),
	(req, res, next) => {
		const { project } = req.params;
		repoDelete(project)
			.then(() => res.sendStatus(200))
			.catch(next);
	}
);

authorRouter.post(
	'/projects/upload',
	requireAuth({ group: 'cms:authors' }),
	(req, res, next) => {
		const form = formidable({ maxFiles: 1, maxFileSize: 2048 * 1024 * 1024 });

		form.parse(req, (err, _fields, files) => {
			if (err) return next(err);
			if (!files.file || !files.file.length) return res.sendStatus(400);

			const { filepath } = files.file[0];

			// Impossible
			if (req.session.user?.type !== 'registered') return;

			repoUpdate(filepath, req.session.user.id)
				.then(() => res.sendStatus(200))
				.catch(next)
				.finally(() => fs.rm(filepath));
		});
	}
);
