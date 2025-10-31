import { Router } from 'express';
import { requireAuth } from '../auth/index.js';
import { db } from '../../db/index.js';
import { getUserWorkspaceGroup } from './utils.js';

const router = Router();

router.get('/', requireAuth({ group: 'repo:users' }), (req, res, next) => {
	// Impossible
	if (req.session.user?.type !== 'registered') return;

	db.selectFrom('repo_workspace_group')
		.where('user_id', '=', req.session.user.id)
		.innerJoin(
			'repo_workspace',
			'repo_workspace_group.workspace_id',
			'repo_workspace.id'
		)
		.selectAll()
		.execute()
		.then(async (workspaces) => {
			const out = [];

			for (const w of workspaces) {
				const { numQuestions } = await db
					.selectFrom('repo_question')
					.where('workspace_id', '=', w.id)
					.select(db.fn.countAll().as('numQuestions'))
					.executeTakeFirstOrThrow();

				const { numWorksheets } = await db
					.selectFrom('repo_worksheet')
					.where('workspace_id', '=', w.id)
					.select(db.fn.countAll().as('numWorksheets'))
					.executeTakeFirstOrThrow();

				const members = await db
					.selectFrom('repo_workspace_group')
					.where('workspace_id', '=', w.id)
					.innerJoin(
						'user_account',
						'repo_workspace_group.user_id',
						'user_account.id'
					)
					.select(['id', 'name', 'repo_workspace_group.group_name as group'])
					.execute();

				const tagData = await db
					.selectFrom('repo_tag')
					.where('workspace_id', '=', w.id)
					.select(['id', 'name'])
					.execute();

				const tags: {
					id: string;
					name: string;
					numQuestions: number;
				}[] = [];

				for (const data of tagData) {
					const { numQuestions } = await db
						.selectFrom('repo_question_tag')
						.where('tag_id', '=', data.id)
						.select(db.fn.countAll().as('numQuestions'))
						.executeTakeFirstOrThrow();

					tags.push({
						id: data.id,
						name: data.name,
						numQuestions: parseInt(numQuestions.toString())
					});
				}

				out.push({
					id: w.id,
					name: w.name,
					previewTemplate: w.preview_template_id,
					userGroup: w.group_name,
					numQuestions: parseInt(numQuestions.toString()),
					numWorksheets: parseInt(numWorksheets.toString()),
					members,
					tags
				});
			}

			res.json(out);
		})
		.catch(next);
});

router.post(
	'/new',
	requireAuth({ group: 'repo:instructors' }),
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const user = req.session.user;

		const { name } = req.body ?? {};
		if (typeof name !== 'string') {
			res.sendStatus(400);
			return;
		}

		db.transaction()
			.execute(async (trx) => {
				const newWorkspace = await trx
					.insertInto('repo_workspace')
					.values({
						name
					})
					.returning('id')
					.executeTakeFirst();

				await trx
					.insertInto('repo_workspace_group')
					.values({
						workspace_id: newWorkspace!.id,
						user_id: user.id,
						group_name: 'owner'
					})
					.execute();

				return { id: newWorkspace!.id };
			})
			// Wait for trx to complete
			.then(res.json)
			.catch(next);
	}
);

router.post(
	'/:id/preview-template',
	requireAuth({ group: 'repo:users' }),
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { id } = req.params;
		const { id: template } = req.body ?? {};

		getUserWorkspaceGroup(req.session.user.id, id)
			.then(async (group) => {
				if (!group || !['owner', 'member'].includes(group)) {
					res.sendStatus(403);
					return;
				}

				if (typeof template === 'string') {
					const templateData = await db
						.selectFrom('repo_template')
						.where('workspace_id', '=', id)
						.where('id', '=', template)
						.select('id')
						.executeTakeFirst();

					if (!templateData) {
						res.sendStatus(400);
						return;
					}
				}

				await db
					.updateTable('repo_workspace')
					.set({
						preview_template_id: typeof template === 'string' ? template : null
					})
					.where('id', '=', id)
					.execute();

				res.sendStatus(200);
			})
			.catch(next);
	}
);

router.post(
	'/:id/members/invite',
	requireAuth({ group: 'repo:instructors' }),
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { id } = req.params;
		const { email } = req.body ?? {};

		if (typeof email !== 'string') {
			res.sendStatus(400);
			return;
		}

		getUserWorkspaceGroup(req.session.user.id, id)
			.then(async (group) => {
				if (group !== 'owner') {
					res.sendStatus(403);
					return;
				}

				const user = await db
					.selectFrom('user_account')
					.where('email', '=', email)
					.select('id')
					.executeTakeFirst();

				if (!user) {
					res.sendStatus(404);
					return;
				}

				await db
					.insertInto('repo_workspace_group')
					.values({
						workspace_id: id,
						user_id: user.id,
						group_name: 'member'
					})
					.execute();

				res.sendStatus(200);
			})
			.catch(next);
	}
);

router.delete(
	'/:id/members/:uid',
	requireAuth({ group: 'repo:instructors' }),
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { id, uid } = req.params;

		getUserWorkspaceGroup(req.session.user.id, id)
			.then(async (group) => {
				if (group !== 'owner') {
					res.sendStatus(403);
					return;
				}

				await db
					.deleteFrom('repo_workspace_group')
					.where('workspace_id', '=', id)
					.where('user_id', '=', uid)
					.execute();

				res.sendStatus(200);
			})
			.catch(next);
	}
);

router.post(
	'/:id/members/:uid/group',
	requireAuth({ group: 'repo:instructors' }),
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { id, uid } = req.params;
		const { group: newGroup } = req.body ?? {};

		if (typeof newGroup !== 'string') {
			res.sendStatus(400);
			return;
		}

		getUserWorkspaceGroup(req.session.user.id, id)
			.then(async (group) => {
				if (group !== 'owner') {
					res.sendStatus(403);
					return;
				}

				await db
					.updateTable('repo_workspace_group')
					.set({
						group_name: newGroup
					})
					.where('workspace_id', '=', id)
					.where('user_id', '=', uid)
					.execute();

				res.sendStatus(200);
			})
			.catch(next);
	}
);

router.post(
	'/:id/tags/new',
	requireAuth({ group: 'repo:users' }),
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { id } = req.params;
		const { name } = req.body ?? {};

		if (typeof name !== 'string') {
			res.sendStatus(400);
			return;
		}

		getUserWorkspaceGroup(req.session.user.id, id)
			.then(async (group) => {
				if (!group || !['owner', 'member'].includes(group)) {
					res.sendStatus(403);
					return;
				}

				const tagId = await db
					.insertInto('repo_tag')
					.values({
						workspace_id: id,
						name
					})
					.returning('id')
					.executeTakeFirst();

				if (!tagId) {
					res.sendStatus(500);
					return;
				}

				res.json({ id: tagId.id });
			})
			.catch(next);
	}
);

router.delete(
	'/:id/tags/:tid',
	requireAuth({ group: 'repo:users' }),
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { id, tid } = req.params;

		getUserWorkspaceGroup(req.session.user.id, id)
			.then(async (group) => {
				if (!group || !['owner', 'member'].includes(group)) {
					res.sendStatus(403);
					return;
				}

				await db.deleteFrom('repo_tag').where('id', '=', tid).execute();

				res.sendStatus(200);
			})
			.catch(next);
	}
);

export default router;
