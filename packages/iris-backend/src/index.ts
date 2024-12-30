import express from 'express';
import path from 'path';
import { expressLogger, dbLogger } from './logger.js';
import { migrateToLatest } from './db/migrator.js';
import cookieParser from 'cookie-parser';
import { spaRoot } from './constants.js';

import { authSetup, authRouter } from './routes/auth/index.js';
import { authorRouter } from './routes/author/index.js';
import { trpcSetup } from './trpc/app.js';
import { doubleCsrfProtection, generateToken } from './csrf.js';
import { documentsRouter } from './routes/documents.js';

expressLogger.info(`Running with NODE_ENV=${process.env.NODE_ENV}...`);

const app = express();

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(doubleCsrfProtection);

app.use((req, res, next) => {
	if (req.method === 'GET') generateToken(req, res, false, false);
	next();
});

authSetup(app);

app.use('/', documentsRouter);
app.use('/auth', authRouter);
app.use('/api/author', authorRouter);

trpcSetup(app);

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
