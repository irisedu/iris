import { Router } from 'express';
import { requireAuth } from '../auth/index.js';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import { repoUpdate } from '../../repo.js';

export const authorRouter = Router();

authorRouter.post(
	'/upload',
	requireAuth({ group: 'authors' }),
	(req, res, next) => {
		const form = formidable({ maxFiles: 1, maxFileSize: 2048 * 1024 * 1024 });

		form.parse(req, (err, _fields, files) => {
			if (err) return next(err);
			if (!files.file || !files.file.length) return res.sendStatus(400);

			const { filepath } = files.file[0];

			if (req.session.user?.type !== 'registered') return res.sendStatus(401); // Impossible

			repoUpdate(filepath, req.session.user.id)
				.then(() => res.sendStatus(200))
				.catch(next)
				.finally(() => fs.rm(filepath));
		});
	}
);
