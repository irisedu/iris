import express, { type Express, type ErrorRequestHandler } from 'express';
import { type BackendFeature } from './feature.js';
import { expressLogger } from './logger.js';
import { migrateToLatest } from './db/migrator.js';
import OpenApiValidator from 'express-openapi-validator';
import path from 'node:path';

import { authFeature } from './features/auth/index.js';
import { objFeature } from './features/obj/index.js';
import { serveFeature } from './features/serve/index.js';
import { spaFeature } from './features/spa/index.js';
import { judgeFeature } from './features/judge/index.js';
import { llmFeature } from './features/llm/index.js';
import { repoFeature } from './features/repo/index.js';

expressLogger.info(`Running with NODE_ENV=${process.env.NODE_ENV}...`);

const app = express();
const envFeatures = process.env.FEATURES!.split(',').map((s) => s.trim());
const features: string[] = [];

// Core functionality
app.use(express.json());
app.disable('x-powered-by');

app.use(
	OpenApiValidator.middleware({
		apiSpec: path.join(import.meta.dirname, 'openapi.json'),
		validateRequests: true,
		validateResponses: true,
		validateSecurity: true,
		validateApiSpec: true,
		ignoreUndocumented: true
	})
);

if (process.env.NODE_ENV === 'development') {
	const spec = (await import('./openapi.js')).default;
	const swaggerUi = (await import('swagger-ui-express')).default;

	expressLogger.info(`Generating OpenAPI documentation...`);

	/**
	 * @openapi
	 *
	 * /api:
	 *   get:
	 *     summary: "[DEV] Get OpenAPI description"
	 *     description: Get the OpenAPI description for this API. Available only in development.
	 *     tags:
	 *     - base
	 *     responses:
	 *       200:
	 *         description: OK
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 */
	app.get('/api', (_, res) => {
		res.json(spec);
	});

	app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));
}

/**
 * @openapi
 *
 * /api/features:
 *   get:
 *     summary: Get supported features
 *     description: Get a list of Iris features supported by the backend.
 *     tags:
 *     - base
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               examples:
 *               - [auth, obj, serve, judge, llm, repo, spa]
 */
app.get('/api/features', (_, res) => {
	res.json(features);
});

function featureEnabled(name: string) {
	return envFeatures.includes(name);
}

async function registerFeature(app: Express, feature: BackendFeature) {
	features.push(feature.name);

	if (feature.setup) await feature.setup(app);
	if (feature.routers) {
		for (const router of feature.routers) {
			app.use(router.path, router.router);
		}
	}
}

// Register features
await registerFeature(app, authFeature);
if (featureEnabled('obj')) await registerFeature(app, objFeature);
if (featureEnabled('serve')) await registerFeature(app, serveFeature);
if (featureEnabled('judge')) await registerFeature(app, judgeFeature);
if (featureEnabled('llm')) await registerFeature(app, llmFeature);
if (featureEnabled('repo')) await registerFeature(app, repoFeature);

await registerFeature(app, spaFeature);

expressLogger.info({ features }, `Features: ${features}`);

app.use(((err, _req, res, _next) => {
	res.status(err.status ?? 500).json({
		type: 'internalError',
		error: err.message,
		errorData: err.errors
	});
}) as ErrorRequestHandler);

// Start
const port = process.env.PORT || 58063;

await migrateToLatest();

app.listen(port, () => {
	expressLogger.info({ port }, `Listening on port ${port}`);
});

export type * from './types.d.js';
