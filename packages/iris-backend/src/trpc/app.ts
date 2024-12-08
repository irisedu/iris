import { t, createContext } from './index.js';
import type { Express } from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';

import user from './user.js';

export const appRouter = t.router({
	user
});

export type AppRouter = typeof appRouter;

export function trpcSetup(app: Express) {
	app.use(
		'/trpc',
		trpcExpress.createExpressMiddleware({
			router: appRouter,
			createContext
		})
	);
}
