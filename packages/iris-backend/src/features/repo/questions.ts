import { Router } from 'express';
import { requireAuth } from '../auth/index.js';
import { db } from '../../db/index.js';
import { getUserWorkspaceGroup } from './utils.js';

const router = Router();

router.get(
	'/:wid/questions',
	requireAuth({ group: 'repo:users' }),
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { wid } = req.params;
		const { tags: tagData } = req.query;

		let tags: string[] = [];

		if (typeof tagData === 'string') {
			tags = [tagData];
		} else if (
			Array.isArray(tagData) &&
			tagData.every((t) => typeof t === 'string')
		) {
			tags = tagData;
		}

		getUserWorkspaceGroup(req.session.user.id, wid)
			.then(async (group) => {
				if (!group || !['owner', 'member'].includes(group)) {
					res.sendStatus(403);
					return;
				}

				const questionData = tags.length
					? await db
							.selectFrom('repo_question_tag')
							.innerJoin(
								'repo_question',
								'repo_question_tag.question_id',
								'repo_question.id'
							)
							.where('repo_question.workspace_id', '=', wid)
							.where('repo_question.deleted', '=', false)
							.where('tag_id', 'in', tags)
							.groupBy(['repo_question_tag.question_id', 'repo_question.id'])
							.having((eb) => eb.fn.countAll(), '=', tags.length)
							.selectAll('repo_question')
							.execute()
					: await db
							.selectFrom('repo_question')
							.where('workspace_id', '=', wid)
							.where('deleted', '=', false)
							.selectAll()
							.execute();

				const tasks = [];

				for (const question of questionData) {
					tasks.push(
						(async function () {
							const tags = await db
								.selectFrom('repo_question_tag')
								.innerJoin(
									'repo_tag',
									'repo_question_tag.tag_id',
									'repo_tag.id'
								)
								.where('question_id', '=', question.id)
								.select(['repo_tag.id', 'repo_tag.name'])
								.execute();

							const creator = await db
								.selectFrom('user_account')
								.where('id', '=', question.creator)
								.select(['id', 'name'])
								.executeTakeFirstOrThrow();

							return {
								...question,
								creator,
								tags
							};
						})()
					);
				}

				res.json(await Promise.all(tasks));
			})
			.catch(next);
	}
);

router.post(
	'/:wid/questions/new',
	requireAuth({ group: 'repo:users' }),
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const user = req.session.user;

		if (!req.body) {
			res.sendStatus(400);
			return;
		}

		const { wid } = req.params;
		const { tags, comment, type } = req.body;

		getUserWorkspaceGroup(user.id, wid)
			.then(async (group) => {
				if (!group || !['owner', 'member'].includes(group)) {
					res.sendStatus(403);
					return;
				}

				const data = await db.transaction().execute(async (trx) => {
					const question = await trx
						.insertInto('repo_question')
						.values({
							workspace_id: wid,
							creator: user.id,
							type: type ?? 'latex',
							comment
						})
						.returning('id')
						.executeTakeFirst();

					if (!question) {
						res.sendStatus(500);
						return undefined;
					}

					for (const tag of tags ?? []) {
						await trx
							.insertInto('repo_question_tag')
							.values({
								question_id: question.id,
								tag_id: tag
							})
							.execute();
					}

					return { id: question.id };
				});

				if (data) res.json(data);
			})
			.catch(next);
	}
);

export default router;
