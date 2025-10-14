import { Router } from 'express';
import { requireAuth } from '../auth/index.js';
import { db } from '../../db/index.js';
import { getUserWorkspaceGroup, getQuestionArchive } from './utils.js';

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
							.orderBy('num', 'asc')
							.selectAll('repo_question')
							.execute()
					: await db
							.selectFrom('repo_question')
							.where('workspace_id', '=', wid)
							.where('deleted', '=', false)
							.orderBy('num', 'asc')
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
								created: +question.created,
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

router.post(
	'/:wid/questions/:qid',
	requireAuth({ group: 'repo:users' }),
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { wid, qid } = req.params;
		const { comment, tags } = req.body ?? {};

		if (
			(comment !== undefined && typeof comment !== 'string') ||
			(tags !== undefined &&
				(!Array.isArray(tags) || !tags.every((t) => typeof t === 'string')))
		) {
			res.sendStatus(400);
			return;
		}

		getUserWorkspaceGroup(req.session.user.id, wid)
			.then(async (group) => {
				if (!group || !['owner', 'member'].includes(group)) {
					res.sendStatus(403);
					return;
				}

				await db.transaction().execute(async (trx) => {
					await trx
						.updateTable('repo_question')
						.set({
							comment
						})
						.where('workspace_id', '=', wid)
						.where('id', '=', qid)
						.execute();

					await trx
						.deleteFrom('repo_question_tag')
						.where('question_id', '=', qid)
						.execute();

					for (const tag of tags) {
						await trx
							.insertInto('repo_question_tag')
							.values({
								question_id: qid,
								tag_id: tag
							})
							.execute();
					}
				});

				res.sendStatus(200);
			})
			.catch(next);
	}
);

router.post(
	'/:wid/questions/:qid/revs/new',
	requireAuth({ group: 'repo:users' }),
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const user = req.session.user;

		const { wid, qid } = req.params;
		const { data, derived_from } = req.body ?? {};

		if (
			typeof data !== 'object' ||
			(derived_from !== undefined && typeof derived_from !== 'string')
		) {
			res.sendStatus(400);
			return;
		}

		getUserWorkspaceGroup(user.id, wid)
			.then(async (group) => {
				if (!group || !['owner', 'member'].includes(group)) {
					res.sendStatus(403);
					return;
				}

				const question = await db
					.selectFrom('repo_question')
					.where('workspace_id', '=', wid)
					.where('id', '=', qid)
					.executeTakeFirst();

				if (!question) {
					res.sendStatus(404);
					return;
				}

				await db
					.insertInto('repo_question_rev')
					.values({
						question_id: qid,
						creator: user.id,
						derived_from,
						data
					})
					.execute();

				res.sendStatus(200);
			})
			.catch(next);
	}
);

async function getQuestionRev(wid: string, qid: string, rev: string) {
	return rev === 'latest'
		? await db
				.selectFrom('repo_question')
				.innerJoin(
					'repo_question_rev',
					'repo_question.id',
					'repo_question_rev.question_id'
				)
				.where('repo_question.workspace_id', '=', wid)
				.where('repo_question.id', '=', qid)
				.select([
					'repo_question_rev.id as rev_id',
					'repo_question.num',
					'repo_question.creator',
					'repo_question.created',
					'repo_question.type',
					'repo_question.comment',
					'repo_question.privilege',
					'repo_question.deleted',
					'repo_question_rev.creator as rev_creator',
					'repo_question_rev.created as updated',
					'repo_question_rev.derived_from',
					'repo_question_rev.data'
				])
				.orderBy('created', 'desc')
				.executeTakeFirst()
		: await db
				.selectFrom('repo_question_rev')
				.innerJoin(
					'repo_question',
					'repo_question_rev.question_id',
					'repo_question.id'
				)
				.where('repo_question_rev.id', '=', rev)
				.where('repo_question.workspace_id', '=', wid)
				.where('repo_question.id', '=', qid)
				.select([
					'repo_question_rev.id as rev_id',
					'repo_question.num',
					'repo_question.creator',
					'repo_question.created',
					'repo_question.type',
					'repo_question.comment',
					'repo_question.privilege',
					'repo_question.deleted',
					'repo_question_rev.creator as rev_creator',
					'repo_question_rev.created as updated',
					'repo_question_rev.derived_from',
					'repo_question_rev.data'
				])
				.executeTakeFirst();
}

router.get(
	'/:wid/questions/:qid/revs/:rev',
	requireAuth({ group: 'repo:users' }),
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { wid, qid, rev } = req.params;

		getUserWorkspaceGroup(req.session.user.id, wid)
			.then(async (group) => {
				if (!group || !['owner', 'member'].includes(group)) {
					res.sendStatus(403);
					return;
				}

				const result = await getQuestionRev(wid, qid, rev);

				const tags = await db
					.selectFrom('repo_question_tag')
					.innerJoin('repo_tag', 'repo_question_tag.tag_id', 'repo_tag.id')
					.where('question_id', '=', qid)
					.select(['repo_tag.id', 'repo_tag.name'])
					.execute();

				if (!result) {
					if (rev === 'latest') {
						const result2 = await db
							.selectFrom('repo_question')
							.where('workspace_id', '=', wid)
							.where('id', '=', qid)
							.select([
								'repo_question.num',
								'repo_question.creator',
								'repo_question.created',
								'repo_question.type',
								'repo_question.comment',
								'repo_question.privilege',
								'repo_question.deleted'
							])
							.executeTakeFirst();

						if (result2) {
							const creator = await db
								.selectFrom('user_account')
								.where('id', '=', result2.creator)
								.select(['id', 'name'])
								.executeTakeFirstOrThrow();

							res.json({
								...result2,
								creator,
								tags
							});
							return;
						}
					}

					res.sendStatus(404);
					return;
				}

				const creator = await db
					.selectFrom('user_account')
					.where('id', '=', result.creator)
					.select(['id', 'name'])
					.executeTakeFirstOrThrow();

				const revCreator = await db
					.selectFrom('user_account')
					.where('id', '=', result.rev_creator)
					.select(['id', 'name'])
					.executeTakeFirstOrThrow();

				res.json({
					...result,
					creator,
					rev_creator: revCreator,
					tags
				});
			})
			.catch(next);
	}
);

router.get(
	'/:wid/questions/:qid/revs/:rev/preview/:type',
	requireAuth({ group: 'repo:users' }),
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { wid, qid, rev, type } = req.params;

		if (!['pdf', 'svg'].includes(type)) {
			res.sendStatus(400);
			return;
		}

		getUserWorkspaceGroup(req.session.user.id, wid)
			.then(async (group) => {
				if (!group || !['owner', 'member'].includes(group)) {
					res.sendStatus(403);
					return;
				}

				const result = await getQuestionRev(wid, qid, rev);

				if (!result) {
					res.sendStatus(404);
					return;
				}

				if (result.type === 'latex') {
					const jobId = `question-${result.rev_id}`;
					const jobRes1 = await fetch(
						`${process.env.LATEXER_URL!}/job/latex/${jobId}/result/${type}`
					);

					if (jobRes1.status === 404) {
						const archiveData = await getQuestionArchive(
							result.type,
							result.data,
							'builtin'
						);
						const fetchRes = await fetch(
							`${process.env.LATEXER_URL!}/job/latex/${jobId}/submit?engine=lualatex`,
							{
								method: 'POST',
								body: new Blob([archiveData as BlobPart]),
								headers: {
									'Content-Type': 'application/zip'
								}
							}
						);

						if (fetchRes.status !== 200) {
							res.status(fetchRes.status).json(await fetchRes.json());
							return;
						}

						const jobRes2 = await fetch(
							`${process.env.LATEXER_URL!}/job/latex/${jobId}/result/${type}`
						);

						if (jobRes2.status === 404) {
							res.sendStatus(500);
							return;
						}

						res.contentType(
							jobRes2.headers.get('Content-Type') ?? 'application/octet-stream'
						);
						res.send(Buffer.from(await jobRes2.arrayBuffer()));
					} else {
						res.contentType(
							jobRes1.headers.get('Content-Type') ?? 'application/octet-stream'
						);
						res.send(Buffer.from(await jobRes1.arrayBuffer()));
					}
				} else {
					res.sendStatus(500);
					return;
				}
			})
			.catch(next);
	}
);

export default router;
