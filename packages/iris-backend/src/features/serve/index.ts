import { type BackendFeature } from '../../feature.js';

import { documentsRouter } from './documents.js';
import { authorRouter } from './author.js';

export const serveFeature = {
	name: 'serve',
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
