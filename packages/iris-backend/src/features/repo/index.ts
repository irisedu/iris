import { type BackendFeature } from '../../feature.js';
import { ensureBucket } from '../obj/index.js';

import workspacesRouter from './workspaces.js';
import questionsRouter from './questions.js';

export const repoFeature = {
	name: 'repo',
	async setup() {
		await ensureBucket(process.env.S3_QUESTION_REPO_BUCKET!, false);
	},
	routers: [
		{
			path: '/api/repo/workspaces',
			router: workspacesRouter
		},
		{
			path: '/api/repo/workspaces',
			router: questionsRouter
		}
	]
} satisfies BackendFeature;
