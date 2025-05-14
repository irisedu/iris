import { Router } from 'express';
import { db } from '../../db/index.js';
import { generateCsrfToken } from '../../csrf.js';

export const casRouter = Router();

interface CASUser {
	id: string;
	email: string;
	name?: string;
}

interface CASProvider {
	name: string;
	url: string;
	getUser: (res: unknown) => CASUser | null;
}

interface UCSBCASResponse {
	serviceResponse: {
		authenticationFailure?: unknown;
		authenticationSuccess?: {
			user?: string; // NetID
			attributes?: {
				cn?: string[]; // Full name
				mail?: string[]; // Email (umail.ucsb.edu)
			};
		};
	};
}

const providers: Record<string, CASProvider> = {
	ucsb: {
		name: 'UCSBnetID',
		url: 'https://sso.ucsb.edu/cas',
		getUser(res) {
			const r = res as UCSBCASResponse;
			const success = r.serviceResponse.authenticationSuccess;

			if (!success?.user) return null;

			return {
				id: success.user,
				email:
					(success.attributes?.mail && success.attributes?.mail[0]) ??
					success.user + '@ucsb.edu',
				name: success.attributes?.cn && success.attributes?.cn[0]
			};
		}
	}
};

function getService(provider: string) {
	return `${process.env.BASE_URL!}/auth/cas/${provider}/callback`;
}

casRouter.get('/:provider/login', (req, res) => {
	const { provider } = req.params;
	const providerData = providers[provider];
	if (!providerData) {
		res.sendStatus(404);
		return;
	}

	// Generate CSRF for development
	generateCsrfToken(req, res);

	res.redirect(`${providerData.url}/login?service=${getService(provider)}`);
});

casRouter.get('/:provider/callback', (req, res, next) => {
	const { provider } = req.params;
	const providerData = providers[provider];
	if (!providerData) {
		res.sendStatus(404);
		return;
	}

	const { ticket } = req.query;

	if (!ticket) {
		res.sendStatus(400);
		return;
	}

	fetch(
		`${providerData.url}/serviceValidate?service=${getService(provider)}&ticket=${ticket}&format=json`,
		{
			headers: {
				Accept: 'application/json'
			}
		}
	)
		.then((res) => {
			if (res.status !== 200) {
				throw new Error('Failed to authenticate');
			}

			return res.json();
		})
		.then(providerData.getUser)
		.then(async (user: CASUser | null) => {
			if (!user) {
				throw new Error('Failed to authenticate');
			}

			const existingFed = await db
				.selectFrom('user_federated_identity')
				.where('provider', '=', `cas:${provider}`)
				.where('federated_id', '=', user.id)
				.selectAll()
				.executeTakeFirst();

			if (existingFed) {
				req.session.user = {
					type: 'registered',
					id: existingFed.user_id
				};

				res.redirect('/');
			} else {
				const existingUser = await db
					.selectFrom('user_account')
					.where('email', '=', user.email)
					.selectAll()
					.executeTakeFirst();

				req.session.user = {
					type: 'pendingFederation',
					provider: `cas:${provider}`,
					providerName: providerData.name,
					data: {
						existingAccount: existingUser?.id,
						id: user.id,
						email: user.email,
						name: user.name
					}
				};

				res.redirect('/login/pending-federation');
			}
		})
		.catch(next);
});
