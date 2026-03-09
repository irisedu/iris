import { Router } from 'express';
import { requireAuth } from '../auth/index.js';
import { db } from '../../db/index.js';
import {
	requireWorkspaceAccess,
	privilegeLevels,
	type RepoGroup,
	requireWorksheetAccess,
	getUserWorkspaceGroup
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
						'template_id',
						'privilege'
					])
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
					'repo_worksheet_rev.data'
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
					'repo_worksheet_rev.data'
				])
				.executeTakeFirst();
}

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

				res.json({
					...result,
					creator,
					rev_creator: revCreator
				});
			})
			.catch(next);
	}
);

export default router;
