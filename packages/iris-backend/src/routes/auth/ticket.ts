import { Router } from 'express';
import { db } from '../../db/index.js';

export const ticketRouter = Router();

interface TicketUser {
	id: string;
	email: string;
	name: string;
}

ticketRouter.get('/login', (_, res) => {
	res.redirect(
		`${process.env.AUTH_TICKET_AUTH_URL!}?service=${process.env.AUTH_TICKET_SERVICE_ID!}`
	);
});

ticketRouter.get('/callback', (req, res, next) => {
	const { ticket } = req.query;

	if (!ticket) {
		res.sendStatus(400);
		return;
	}

	fetch(`${process.env.AUTH_TICKET_VALIDATE_URL!}?ticket=${ticket}`)
		.then((res) => {
			if (res.status !== 200) {
				throw new Error('Failed to authenticate');
			}

			return res.json();
		})
		.then(async (user: TicketUser) => {
			const existingFed = await db
				.selectFrom('user_federated_identity')
				.where('provider', '=', 'ticket')
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
					provider: 'ticket',
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
