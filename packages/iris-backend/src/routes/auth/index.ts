import { type Express, type RequestHandler, Router } from 'express';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { Redis } from 'ioredis';
import { db } from '../../db/index.js';
import { InferResult } from 'kysely';
import { doubleCsrfProtection, generateCsrfToken } from '../../csrf.js';

import { googleRouter } from './google.js';
import { casRouter } from './cas.js';

export interface RegisteredSessionData {
	type: 'registered';
	id: string;
}

export interface PendingFederationSessionData {
	type: 'pendingFederation';
	provider: string;
	providerName: string;
	data: {
		existingAccount?: string;
		id: string;
		email: string;
		name?: string;
	};
}

declare module 'express-session' {
	interface SessionData {
		user: RegisteredSessionData | PendingFederationSessionData;
	}
}

export function authSetup(app: Express) {
	// This + X-Forwarded-Proto is necessary for cookies to work
	if (process.env.TRUST_PROXY) {
		app.set('trust proxy', true);
	}

	app.use(
		session({
			secret: process.env.COOKIE_SECRET!,
			resave: false,
			rolling: true,
			saveUninitialized: true, // used for csrf
			store: new RedisStore({
				client: new Redis(process.env.REDIS_URL!),
				prefix: process.env.AUTH_SESSION_PREFIX
			}),
			name: 'iris.sid',
			cookie: {
				sameSite: 'lax',
				secure: process.env.NODE_ENV !== 'development',
				maxAge: 30 * 24 * 60 * 60 * 1000
			}
		})
	);

	// Must come after session (relies on SID)
	app.use((req, res, next) => {
		if (req.method === 'GET') generateCsrfToken(req, res, { overwrite: true });
		next();
	});

	app.use(doubleCsrfProtection);
}

export const authRouter = Router();

const _userQuery = db.selectFrom('user_account').selectAll();

export type UserInfoResult =
	| {
			type: 'registered';
			data: InferResult<typeof _userQuery>[0];
			groups: string[];
	  }
	| {
			type: 'loggedOut';
	  }
	| PendingFederationSessionData;

authRouter.get('/info', (req, res, next) => {
	const user = req.session.user;
	if (!user) {
		res.json({ type: 'loggedOut' });
		return;
	}

	if (user.type === 'registered') {
		db.selectFrom('user_account')
			.where('id', '=', user.id)
			.selectAll()
			.executeTakeFirst()
			.then(async (dbUser) => {
				if (!dbUser) {
					res.json({ type: 'loggedOut' });
					return;
				}

				const groups = await db
					.selectFrom('user_group')
					.where('user_id', '=', dbUser.id)
					.selectAll()
					.execute();

				res.json({
					type: 'registered',
					data: dbUser,
					groups: groups.map((g) => g.group_name)
				});
			})
			.catch(next);
	} else if (user.type === 'pendingFederation') {
		res.json(user);
	}
});

authRouter.post('/logout', (req, res, next) => {
	req.session.destroy((err) => {
		if (err) return next(err);
		res.sendStatus(200);
	});
});

authRouter.post('/confirm-federation', (req, res, next) => {
	const user = req.session.user;
	if (!user || user.type !== 'pendingFederation') {
		res.status(400).send('Account is not pending');
		return;
	}

	async function createFederatedIdentity(
		user: PendingFederationSessionData,
		id: string
	) {
		await db
			.insertInto('user_federated_identity')
			.values({
				provider: user.provider,
				user_id: id,
				federated_id: user.data.id
			})
			.execute();

		req.session.user = {
			type: 'registered',
			id
		};

		res.sendStatus(200);
	}

	if (user.data.existingAccount) {
		createFederatedIdentity(user, user.data.existingAccount).catch(next);
	} else {
		db.insertInto('user_account')
			.values({
				email: user.data.email,
				name: user.data.name
			})
			.returning('id')
			.executeTakeFirstOrThrow()
			.then((newUser) => createFederatedIdentity(user, newUser.id))
			.catch(next);
	}
});

authRouter.use('/google', googleRouter);
authRouter.use('/cas', casRouter);

export function requireAuth({ group }: { group?: string }): RequestHandler {
	return (req, res, next) => {
		const user = req.session.user;
		if (user?.type !== 'registered') {
			res.redirect('/login');
			return;
		}

		if (group) {
			db.selectFrom('user_group')
				.where('user_id', '=', user.id)
				.where('group_name', '=', group)
				.selectAll()
				.executeTakeFirst()
				.then((group) => {
					if (group) {
						next();
					} else {
						res.sendStatus(401);
					}
				})
				.catch(next);
		} else {
			next();
		}
	};
}
