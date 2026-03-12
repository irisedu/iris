import { Router } from 'express';
import { requireAuth } from '../auth/index.js';
import { db } from '../../db/index.js';
import {
	requireWorkspaceAccess,
	privilegeLevels,
	type RepoGroup,
	requireWorksheetAccess,
	getUserWorkspaceGroup,
	type WorksheetData,
	getWorksheetPreviewArchive
} from './utils.js';

const router = Router();

router.get(
	'/:wid/worksheets',
	requireAuth({ group: 'repo:users' }),
	requireWorkspaceAccess('member'),
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { wid } = req.params;

		getUserWorkspaceGroup(req.session.user.id, wid)
			.then(async (group) => {
				const privilege = privilegeLevels[group as RepoGroup];
				const worksheets = await db
					.selectFrom('repo_worksheet')
					.where('workspace_id', '=', wid)
					.where('privilege', '<=', privilege)
					.select([
						'id',
						'workspace_id',
						'num',
						'name',
						'creator',
						'created',
						'privilege'
					])
					.orderBy('num', 'asc')
					.execute();

				const creatorIds = [...new Set(worksheets.map((w) => w.creator))];
				const creators = creatorIds.length
					? await db
							.selectFrom('user_account')
							.where('id', 'in', creatorIds)
							.select(['id', 'name'])
							.execute()
					: [];

				res.json(
					worksheets.map((w) => ({
						...w,
						creator: creators.find((c) => c.id === w.creator)
					}))
				);
			})
			.catch(next);
	}
);

router.post(
	'/:wid/worksheets/new',
	requireAuth({ group: 'repo:users' }),
	requireWorkspaceAccess('member'),
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { wid } = req.params;
		const { name } = req.body;

		db.insertInto('repo_worksheet')
			.values({
				name,
				workspace_id: wid,
				creator: req.session.user.id
			})
			.returning('id')
			.executeTakeFirst()
			.then((data) => res.json(data))
			.catch(next);
	}
);

async function getWorksheetRev(wid: string, wsid: string, rev: string) {
	return rev === 'latest'
		? await db
				.selectFrom('repo_worksheet')
				.innerJoin(
					'repo_worksheet_rev',
					'repo_worksheet.id',
					'repo_worksheet_rev.worksheet_id'
				)
				.where('repo_worksheet.workspace_id', '=', wid)
				.where('repo_worksheet.id', '=', wsid)
				.select([
					'repo_worksheet_rev.id as rev_id',
					'repo_worksheet.num',
					'repo_worksheet.name',
					'repo_worksheet.creator',
					'repo_worksheet.created',
					'repo_worksheet.privilege',
					'repo_worksheet_rev.creator as rev_creator',
					'repo_worksheet_rev.created as updated',
					'repo_worksheet_rev.data',
					'repo_worksheet_rev.template_id'
				])
				.orderBy('updated', 'desc')
				.executeTakeFirst()
		: await db
				.selectFrom('repo_worksheet_rev')
				.innerJoin(
					'repo_worksheet',
					'repo_worksheet_rev.worksheet_id',
					'repo_worksheet.id'
				)
				.where('repo_worksheet_rev.id', '=', rev)
				.where('repo_worksheet.workspace_id', '=', wid)
				.where('repo_worksheet.id', '=', wsid)
				.select([
					'repo_worksheet_rev.id as rev_id',
					'repo_worksheet.num',
					'repo_worksheet.name',
					'repo_worksheet.creator',
					'repo_worksheet.created',
					'repo_worksheet.privilege',
					'repo_worksheet_rev.creator as rev_creator',
					'repo_worksheet_rev.created as updated',
					'repo_worksheet_rev.data',
					'repo_worksheet_rev.template_id'
				])
				.executeTakeFirst();
}

router.post(
	'/:wid/worksheets/:wsid',
	requireAuth({ group: 'repo:users' }),
	requireWorkspaceAccess('member'),
	requireWorksheetAccess,
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { wid, wsid } = req.params;
		const { name } = req.body ?? {};

		if (name !== undefined && typeof name !== 'string') {
			res.sendStatus(400);
			return;
		}

		db.updateTable('repo_worksheet')
			.set({
				name
			})
			.where('workspace_id', '=', wid)
			.where('id', '=', wsid)
			.execute()
			.then(() => res.sendStatus(200))
			.catch(next);
	}
);

router.post(
	'/:wid/worksheets/:wsid/privilege',
	requireAuth({ group: 'repo:users' }),
	requireWorkspaceAccess('owner'),
	requireWorksheetAccess,
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { wid, wsid } = req.params;
		const { privilege } = req.body ?? {};

		if (privilege !== undefined && typeof privilege !== 'number') {
			res.sendStatus(400);
			return;
		}

		db.updateTable('repo_worksheet')
			.set({
				privilege
			})
			.where('workspace_id', '=', wid)
			.where('id', '=', wsid)
			.execute()
			.then(() => res.sendStatus(200))
			.catch(next);
	}
);

router.post(
	'/:wid/worksheets/:wsid/revs/new',
	requireAuth({ group: 'repo:users' }),
	requireWorkspaceAccess('member'),
	requireWorksheetAccess,
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;
		const user = req.session.user;

		const { wid, wsid } = req.params;
		const { data, template_id } = req.body ?? {};

		if (typeof data !== 'object' || typeof template_id !== 'string') {
			res.sendStatus(400);
			return;
		}

		db.selectFrom('repo_worksheet')
			.where('workspace_id', '=', wid)
			.where('id', '=', wsid)
			.executeTakeFirst()
			.then(async (worksheet) => {
				if (!worksheet) {
					res.sendStatus(404);
					return;
				}

				await db.transaction().execute(async (trx) => {
					await trx
						.insertInto('repo_worksheet_rev')
						.values({
							worksheet_id: wsid,
							creator: user.id,
							data,
							template_id
						})
						.execute();

					await trx
						.deleteFrom('repo_worksheet_question')
						.where('worksheet_id', '=', wsid)
						.execute();

					const { questions } = data as WorksheetData;
					const questionIds = [...new Set(questions.map((q) => q.id))];

					for (const id of questionIds) {
						await trx
							.insertInto('repo_worksheet_question')
							.values({
								worksheet_id: wsid,
								question_id: id
							})
							.execute();
					}
				});

				res.sendStatus(200);
			})
			.catch(next);
	}
);

router.get(
	'/:wid/worksheets/:wsid/revs/:rev',
	requireAuth({ group: 'repo:users' }),
	requireWorkspaceAccess('member'),
	requireWorksheetAccess,
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;

		const { wid, wsid, rev } = req.params;

		getWorksheetRev(wid, wsid, rev)
			.then(async (result) => {
				if (!result) {
					if (rev === 'latest') {
						const result2 = await db
							.selectFrom('repo_worksheet')
							.where('workspace_id', '=', wid)
							.where('id', '=', wsid)
							.select([
								'repo_worksheet.num',
								'repo_worksheet.name',
								'repo_worksheet.creator',
								'repo_worksheet.created',
								'repo_worksheet.privilege'
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
								creator
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

				const data = result.data as unknown as WorksheetData;
				const questionIds = [...new Set(data.questions.map((q) => q.id))];
				const questionData = await db
					.selectFrom('repo_question')
					.where('id', 'in', questionIds)
					.select(['id', 'workspace_id', 'num', 'comment'])
					.execute();

				res.json({
					...result,
					creator,
					rev_creator: revCreator,
					data: {
						...data,
						questions: data.questions.map((q1) =>
							questionData.find((q2) => q1.id === q2.id)
						)
					}
				});
			})
			.catch(next);
	}
);

router.post(
	'/:wid/worksheets/:wsid/editorPreview',
	requireAuth({ group: 'repo:users' }),
	requireWorkspaceAccess('member'),
	requireWorksheetAccess,
	(req, res, next) => {
		// Impossible
		if (req.session.user?.type !== 'registered') return;
		const user = req.session.user;

		const { wid, wsid } = req.params;
		const showAnswer = req.query.showAnswer === '1';

		getWorksheetRev(wid, wsid, 'latest')
			.then(async (result) => {
				if (!result) {
					res.sendStatus(404);
					return;
				}

				// TODO: question access control

				const template = await db
					.selectFrom('repo_template')
					.where('id', '=', result.template_id)
					.select('hash')
					.executeTakeFirst();

				if (!template || !template.hash) {
					res.sendStatus(400);
					return;
				}

				const jobId = `worksheet-editor-${user.id}-${template.hash}`;

				const archiveData = await getWorksheetPreviewArchive(
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
			})
			.catch(next);
	}
);

export default router;
