import { Router } from 'express';
import { google } from 'googleapis';
import { generateCsrfToken, doubleCsrfProtection } from './csrf.js';
import { db } from '../../db/index.js';

export const googleRouter = Router();

const clientOpts = {
	clientId: process.env.AUTH_GOOGLE_CLIENT_ID,
	clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET,
	redirectUri: process.env.BASE_URL! + '/auth/google/callback'
};

const scopes = [
	'https://www.googleapis.com/auth/userinfo.email',
	'https://www.googleapis.com/auth/userinfo.profile'
];

googleRouter.get('/login', (req, res) => {
	const oauthClient = new google.auth.OAuth2(clientOpts);
	res.redirect(
		oauthClient.generateAuthUrl({
			scope: scopes,
			access_type: 'offline',
			state: generateCsrfToken(req, res)
		})
	);
});

googleRouter.get('/callback', doubleCsrfProtection, (req, res, next) => {
	const oauthClient = new google.auth.OAuth2(clientOpts);
	oauthClient
		.getToken(req.query.code as string)
		.then(({ tokens }) => {
			oauthClient.setCredentials(tokens);

			const oauth2 = google.oauth2({
				auth: oauthClient,
				version: 'v2'
			});

			return oauth2.userinfo.get();
		})
		.then(async (userInfo) => {
			if (!userInfo.data.id || !userInfo.data.email)
				throw new Error('Incomplete Google account');

			const existingFed = await db
				.selectFrom('user_federated_identity')
				.where('provider', '=', 'google')
				.where('federated_id', '=', userInfo.data.id)
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
					.where('email', '=', userInfo.data.email)
					.selectAll()
					.executeTakeFirst();

				req.session.user = {
					type: 'pendingFederation',
					provider: 'google',
					providerName: 'Google',
					data: {
						existingAccount: existingUser?.id,
						id: userInfo.data.id,
						email: userInfo.data.email,
						name: `${userInfo.data.given_name ?? ''} ${userInfo.data.family_name ?? ''}`.trim()
					}
				};

				res.redirect('/login/pending-federation');
			}
		})
		.catch(next);
});
