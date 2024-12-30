import { t } from './index.js';
import { db } from '../db/index.js';
import { InferResult } from 'kysely';

import type { PendingFederationSessionData } from '../routes/auth/index.js';

const _userQuery = db.selectFrom('user_account').selectAll();

type UserResult =
	| {
			type: 'registered';
			data: InferResult<typeof _userQuery>[0];
			groups: string[];
	  }
	| {
			type: 'loggedOut';
	  }
	| PendingFederationSessionData;

export default t.router({
	info: t.procedure.query(async ({ ctx }): Promise<UserResult> => {
		const user = ctx.req.session.user;

		if (user) {
			if (user.type === 'registered') {
				const dbUser = await db
					.selectFrom('user_account')
					.where('id', '=', user.id)
					.selectAll()
					.executeTakeFirst();

				if (dbUser) {
					const groups = await db
						.selectFrom('user_group')
						.where('user_id', '=', dbUser.id)
						.selectAll()
						.execute();

					return {
						type: 'registered',
						data: dbUser,
						groups: groups.map((g) => g.group_name)
					};
				}
			} else if (user.type === 'pendingFederation') {
				return user;
			}
		}

		return { type: 'loggedOut' };
	})
});
