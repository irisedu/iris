import { type BackendFeature } from '../../feature.js';

import { documentsRouter } from './documents.js';
import { authorRouter } from './author.js';

import { ensureBucket } from '../obj/index.js';

export const serveFeature = {
	name: 'serve',
	async setup() {
		await ensureBucket(process.env.S3_REPO_BUCKET!, false);
		await ensureBucket(process.env.S3_CONTENT_BUCKET!, true);
	},
	routers: [
		{
			path: '/',
			router: documentsRouter
		},
		{
			path: '/api/author',
			router: authorRouter
		}
	]
} satisfies BackendFeature;
