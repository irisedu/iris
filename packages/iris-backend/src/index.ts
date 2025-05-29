import express, { type Express } from 'express';
import { type BackendFeature } from './feature.js';
import { expressLogger, dbLogger } from './logger.js';
import { migrateToLatest } from './db/migrator.js';

import { authFeature } from './features/auth/index.js';
import { serveFeature } from './features/serve/index.js';
import { spaFeature } from './features/spa/index.js';
import { judgeFeature } from './features/judge/index.js';
import { llmFeature } from './features/llm/index.js';

expressLogger.info(`Running with NODE_ENV=${process.env.NODE_ENV}...`);

const app = express();
const envFeatures = process.env.FEATURES!.split(',').map((s) => s.trim());
const features: string[] = [];

// Core functionality
app.use(express.json());

app.get('/api/features', (_, res) => {
	res.json(features);
});

function featureEnabled(name: string) {
	return envFeatures.includes(name);
}

function registerFeature(app: Express, feature: BackendFeature) {
	features.push(feature.name);

	if (feature.setup) feature.setup(app);
	if (feature.routers) {
		for (const router of feature.routers) {
			app.use(router.path, router.router);
		}
	}
}

// Register features
registerFeature(app, authFeature);
if (featureEnabled('serve')) registerFeature(app, serveFeature);
if (featureEnabled('judge')) registerFeature(app, judgeFeature);
if (featureEnabled('llm')) registerFeature(app, llmFeature);

registerFeature(app, spaFeature);

expressLogger.info({ features }, `Features: ${features}`);

// Start
const port = process.env.PORT || 58063;
migrateToLatest().then(() => {
	dbLogger.info('Running migrations...');

	app.listen(port, () => {
		expressLogger.info({ port }, `Listening on port ${port}`);
	});
});

// Expose some types to the frontend
export type * from './features/auth/index.js';
