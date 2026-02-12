import { Router } from 'express';
import { requireAuth } from '../auth/index.js';
import { db } from '../../db/index.js';
import {
	requireWorkspaceAccess,
	requireQuestionAccess,
	getQuestionPreviewArchive,
	uploadMediaFileFromForm,
	getMediaFileStream,
	type QuestionData,
	getQuestionArchive,
	getUserWorkspaceGroup,
	privilegeLevels,
	type RepoGroup
} from './utils.js';

const router = Router();

router.get(
	'/:wid/questions',
	requireAuth({ group: 'repo:users' }),
	requireWorkspaceAccess('member'),
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { wid } = req.params;
		const { tags: tagData } = req.query;
		const recycle = req.query.recycle === '1';

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
				const privilege = privilegeLevels[group as RepoGroup];
				const questionData = tags.length
					? await db
							.selectFrom('repo_question_tag')
							.innerJoin(
								'repo_question',
								'repo_question_tag.question_id',
								'repo_question.id'
							)
							.where('repo_question.workspace_id', '=', wid)
							.where('repo_question.deleted', '=', recycle)
							.where('repo_question.privilege', '<=', privilege)
							.where('tag_id', 'in', tags)
							.groupBy(['repo_question_tag.question_id', 'repo_question.id'])
							.having((eb) => eb.fn.countAll(), '=', tags.length)
							.orderBy('num', 'asc')
							.selectAll('repo_question')
							.execute()
					: await db
							.selectFrom('repo_question')
							.where('workspace_id', '=', wid)
							.where('deleted', '=', recycle)
							.where('privilege', '<=', privilege)
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
	requireWorkspaceAccess('member'),
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

		db.transaction()
			.execute(async (trx) => {
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
			})
			.then((data) => {
				if (data) res.json(data);
			})
			.catch(next);
	}
);

router.post(
	'/:wid/questions/:qid/recycle',
	requireAuth({ group: 'repo:users' }),
	requireWorkspaceAccess('member'),
	requireQuestionAccess,
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { wid, qid } = req.params;
		const recycle = req.query.recycle === '1';

		db.updateTable('repo_question')
			.set({
				deleted: recycle
			})
			.where('workspace_id', '=', wid)
			.where('id', '=', qid)
			.execute()
			.then(() => res.sendStatus(200))
			.catch(next);
	}
);

router.post(
	'/:wid/questions/:qid',
	requireAuth({ group: 'repo:users' }),
	requireWorkspaceAccess('member'),
	requireQuestionAccess,
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

		db.transaction()
			.execute(async (trx) => {
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
			})
			.then(() => res.sendStatus(200))
			.catch(next);
	}
);

router.post(
	'/:wid/questions/:qid/privilege',
	requireAuth({ group: 'repo:users' }),
	requireWorkspaceAccess('owner'),
	requireQuestionAccess,
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { wid, qid } = req.params;
		const { privilege } = req.body ?? {};

		if (privilege !== undefined && typeof privilege !== 'number') {
			res.sendStatus(400);
			return;
		}

		db.updateTable('repo_question')
			.set({
				privilege
			})
			.where('workspace_id', '=', wid)
			.where('id', '=', qid)
			.execute()
			.then(() => res.sendStatus(200))
			.catch(next);
	}
);

router.post(
	'/:wid/questions/:qid/revs/new',
	requireAuth({ group: 'repo:users' }),
	requireWorkspaceAccess('member'),
	requireQuestionAccess,
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;
		const user = req.session.user;

		const { wid, qid } = req.params;
		const { data, derived_from } = req.body ?? {};

		if (
			typeof data !== 'object' ||
			(derived_from !== undefined &&
				derived_from !== null &&
				typeof derived_from !== 'string')
		) {
			res.sendStatus(400);
			return;
		}

		db.selectFrom('repo_question')
			.where('workspace_id', '=', wid)
			.where('id', '=', qid)
			.executeTakeFirst()
			.then(async (question) => {
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
				.orderBy('updated', 'desc')
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
	requireWorkspaceAccess('member'),
	requireQuestionAccess,
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { wid, qid, rev } = req.params;

		getQuestionRev(wid, qid, rev)
			.then(async (result) => {
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
	'/:wid/questions/:qid/revs/:rev/download',
	requireAuth({ group: 'repo:users' }),
	requireWorkspaceAccess('member'),
	requireQuestionAccess,
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { wid, qid, rev } = req.params;

		function sendQuestionTex(num: string, contents: string) {
			res.contentType('tex/x-tex');
			res.setHeader('Content-Disposition', `attachment; filename=${num}.tex`);
			res.send(contents);
		}

		getQuestionRev(wid, qid, rev)
			.then(async (result) => {
				if (!result) {
					const question2 = await db
						.selectFrom('repo_question')
						.where('workspace_id', '=', wid)
						.where('id', '=', qid)
						.select(['type', 'num'])
						.executeTakeFirst();

					if (question2) {
						if (question2.type === 'latex') {
							sendQuestionTex(question2.num, '');
						} else {
							res.sendStatus(500);
						}
					} else {
						res.sendStatus(404);
					}

					return;
				}

				const data = result.data as QuestionData;
				if (data.media && Object.keys(data.media).length) {
					res.contentType('application/zip');
					res.setHeader(
						'Content-Disposition',
						`attachment; filename=${result.num}.zip`
					);
					res.send(await getQuestionArchive(result.type, data));
				} else {
					if (result.type === 'latex') {
						sendQuestionTex(result.num, String(data.code));
					} else {
						res.sendStatus(500);
					}
				}
			})
			.catch(next);
	}
);

router.get(
	'/:wid/questions/:qid/revs/:rev/preview/:type',
	requireAuth({ group: 'repo:users' }),
	requireWorkspaceAccess('member'),
	requireQuestionAccess,
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { wid, qid, rev, type } = req.params;
		const showAnswer = req.query.showAnswer === '1';

		if (!['pdf', 'svg'].includes(type)) {
			res.sendStatus(400);
			return;
		}

		getQuestionRev(wid, qid, rev)
			.then(async (result) => {
				if (!result) {
					res.sendStatus(404);
					return;
				}

				if (result.type === 'latex') {
					const workspace = await db
						.selectFrom('repo_workspace')
						.where('id', '=', wid)
						.select('preview_template_id')
						.executeTakeFirst();

					if (!workspace || !workspace.preview_template_id) {
						res.sendStatus(400);
						return;
					}

					const template = await db
						.selectFrom('repo_template')
						.where('id', '=', workspace.preview_template_id)
						.select('hash')
						.executeTakeFirst();

					if (!template || !template.hash) {
						res.sendStatus(400);
						return;
					}

					let jobId = `question-${result.rev_id}-${template.hash}`;
					if (showAnswer) jobId += '-ans';

					const jobRes1 = await fetch(
						`${process.env.LATEXER_URL!}/job/latex/${jobId}/result/${type}`
					);

					if (jobRes1.status === 404) {
						const archiveData = await getQuestionPreviewArchive(
							result.type,
							result.data as QuestionData,
							template.hash,
							{
								'${[SHOW_ANSWER]}': !!showAnswer
							}
						);

						if (!archiveData) {
							// TODO: better error handling
							res.sendStatus(500);
							return;
						}

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

router.post(
	'/:wid/questions/:qid/editorPreview',
	requireAuth({ group: 'repo:users' }),
	requireWorkspaceAccess('member'),
	requireQuestionAccess,
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;
		const user = req.session.user;

		const { wid, qid } = req.params;
		const showAnswer = req.query.showAnswer === '1';

		db.selectFrom('repo_question')
			.where('workspace_id', '=', wid)
			.where('id', '=', qid)
			.selectAll()
			.executeTakeFirst()
			.then(async (result) => {
				if (!result) {
					res.sendStatus(404);
					return;
				}

				if (result.type === 'latex') {
					const workspace = await db
						.selectFrom('repo_workspace')
						.where('id', '=', wid)
						.select('preview_template_id')
						.executeTakeFirst();

					if (!workspace || !workspace.preview_template_id) {
						res.sendStatus(400);
						return;
					}

					const template = await db
						.selectFrom('repo_template')
						.where('id', '=', workspace.preview_template_id)
						.select('hash')
						.executeTakeFirst();

					if (!template || !template.hash) {
						res.sendStatus(400);
						return;
					}

					const jobId = `question-editor-${user.id}-${template.hash}`;

					const archiveData = await getQuestionPreviewArchive(
						result.type,
						req.body,
						template.hash,
						{
							'${[SHOW_ANSWER]}': !!showAnswer
						}
					);

					if (!archiveData) {
						// TODO: better error handling
						res.sendStatus(500);
						return;
					}

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

					const jobRes = await fetch(
						`${process.env.LATEXER_URL!}/job/latex/${jobId}/result/pdf`
					);

					if (jobRes.status === 404) {
						res.sendStatus(500);
						return;
					}

					res.contentType(
						jobRes.headers.get('Content-Type') ?? 'application/octet-stream'
					);
					res.send(Buffer.from(await jobRes.arrayBuffer()));
				} else {
					res.sendStatus(500);
					return;
				}
			})
			.catch(next);
	}
);

router.post(
	'/:wid/questions/:qid/media',
	requireAuth({ group: 'repo:users' }),
	requireWorkspaceAccess('member'),
	requireQuestionAccess,
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;
		const user = req.session.user;

		const { wid, qid } = req.params;

		getQuestionRev(wid, qid, 'latest')
			.then(async (result) => {
				if (!result) {
					const result2 = await db
						.selectFrom('repo_question')
						.where('workspace_id', '=', wid)
						.where('id', '=', qid)
						.select('id')
						.executeTakeFirst();

					if (!result2) return res.sendStatus(404);
				}

				const data = result?.data as QuestionData | undefined;
				const fileRes = await uploadMediaFileFromForm(req);
				if (!fileRes) return res.sendStatus(400);

				const newData = {
					...data,
					media: {
						...data?.media
					}
				};

				newData.media[fileRes.name] = fileRes.hash;

				await db
					.insertInto('repo_question_rev')
					.values({
						question_id: qid,
						creator: user.id,
						derived_from: result?.derived_from,
						data: newData
					})
					.execute();

				res.sendStatus(200);
			})
			.catch(next);
	}
);

router.get(
	'/:wid/questions/:qid/media/:filename',
	requireAuth({ group: 'repo:users' }),
	requireWorkspaceAccess('member'),
	requireQuestionAccess,
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { wid, qid, filename } = req.params;

		getQuestionRev(wid, qid, 'latest')
			.then(async (result) => {
				if (!result) return res.sendStatus(404);

				const media = (result.data as QuestionData).media;
				if (!media) return res.sendStatus(404);

				const hash = media[filename];
				if (!hash) return res.sendStatus(404);

				const strm = await getMediaFileStream(hash);
				if (!strm) {
					res.sendStatus(500);
					return;
				}

				res.setHeader(
					'Content-Disposition',
					`attachment; filename=${filename}`
				);
				res.contentType(filename);
				strm.pipe(res);
			})
			.catch(next);
	}
);

router.delete(
	'/:wid/questions/:qid/media/:filename',
	requireAuth({ group: 'repo:users' }),
	requireWorkspaceAccess('member'),
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;
		const user = req.session.user;

		const { wid, qid, filename } = req.params;

		getQuestionRev(wid, qid, 'latest')
			.then(async (result) => {
				if (!result) return res.sendStatus(404);

				const data = result.data as QuestionData;
				if (!data.media) return res.sendStatus(404);

				const hash = data.media[filename];
				if (!hash) return res.sendStatus(404);

				const newData = {
					...data,
					media: {
						...data.media
					}
				};

				// TODO: currently no collection of unused media files
				// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
				delete newData.media[filename];

				await db
					.insertInto('repo_question_rev')
					.values({
						question_id: qid,
						creator: user.id,
						derived_from: result?.derived_from,
						data: newData
					})
					.execute();

				res.sendStatus(200);
			})
			.catch(next);
	}
);

export default router;
