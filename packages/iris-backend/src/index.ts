import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { expressLogger, dbLogger } from './logger.js';
import { indexRepoFiles } from './indexer.js';
import { migrateToLatest } from './db/migrator.js';
import cookieParser from 'cookie-parser';

import { authSetup, authRouter } from './routes/auth/index.js';
import { trpcSetup } from './trpc/app.js';

expressLogger.info(`Running with NODE_ENV=${process.env.NODE_ENV}...`);

const app = express();

app.use(cookieParser(process.env.COOKIE_SECRET));

authSetup(app);
app.use('/auth', authRouter);

trpcSetup(app);

const repoRoot = process.env.BUILD_ROOT || path.join(process.cwd(), 'repo');
const contentRoot =
	process.env.CONTENT_ROOT || path.join(process.cwd(), 'content');
const spaRoot = process.env.SPA_ROOT || path.join(process.cwd(), 'spa');

// TODO: should run more smartly
fs.readdir(contentRoot)
	.then((contents) =>
		Promise.all(
			contents.map((file) =>
				fs.rm(path.join(contentRoot, file), { recursive: true })
			)
		)
	)
	.then(() => {
		indexRepoFiles(repoRoot, contentRoot);
	});

app.get('/page/:series/(*.*)', async (req, res) => {
	const series = req.params.series;
	const wildcards = req.params as unknown as string[]; // TODO
	const name = wildcards[0];
	const extension = wildcards[1];
	const slug = name + '.' + extension;

	try {
		const filePath = path.join(contentRoot, series, 'static', slug);
		const contents = await fs.readFile(filePath);

		if (extension === 'irisc') {
			res.contentType('application/json');
		} else {
			res.contentType(path.basename(slug));
		}

		res.send(contents);
	} catch {
		res.sendStatus(404);
	}
});

app.get('/series', (req, res) => {
	res.sendFile(path.join(contentRoot, 'series.json'));
});

app.use(express.static(spaRoot));

app.get('*', (req, res) => {
	res.sendFile(path.join(spaRoot, 'index.html'));
});

const port = process.env.PORT || 58063;

migrateToLatest().then(() => {
	dbLogger.info('Running migrations...');

	app.listen(port, () => {
		expressLogger.info({ port }, `Listening on port ${port}`);
	});
});
