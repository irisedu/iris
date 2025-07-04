import { type BackendFeature } from '../../feature.js';
import { Router } from 'express';
import { db } from '../../db/index.js';
import {
	gradeQuestion,
	type Question,
	QuestionSubmission
} from '@irisedu/schemas';

const router = Router();

router.get('/page/*splat/submissions', async (req, res, next) => {
	const { splat } = req.params as Record<string, string[]>; // TODO
	const docPath = splat.join('/');

	if (req.session.user?.type !== 'registered') {
		res.json({});
		return;
	}

	const userId = req.session.user.id;

	db.selectFrom('document_ptr')
		.where('document_ptr.path', '=', docPath)
		.where('document_ptr.rev', '=', 'latest')
		.selectAll()
		.executeTakeFirst()
		.then(async (ptr) => {
			if (!ptr) return res.sendStatus(404);

			const sub = await db
				.selectFrom('question_submission')
				.where('user_id', '=', userId)
				.where('question_id', '=', ptr.doc_id)
				.orderBy('created', (ob) => ob.desc())
				.selectAll()
				.executeTakeFirst();

			if (!sub) return res.json({});

			res.json({
				submission: sub.submission,
				outcome: sub.outcome
			});
		})
		.catch(next);
});

router.post('/page/*splat/submissions', async (req, res, next) => {
	const { splat } = req.params as Record<string, string[]>; // TODO
	const docPath = splat.join('/');

	const submissionRes = QuestionSubmission.safeParse(req.body);
	if (!submissionRes.success) {
		res.status(400).send('Malformed submission');
		return;
	}

	db.selectFrom('document_ptr')
		.where('document_ptr.path', '=', docPath)
		.where('document_ptr.rev', '=', 'latest')
		.innerJoin('document', 'document.id', 'document_ptr.doc_id')
		.selectAll()
		.executeTakeFirst()
		.then((doc) => {
			if (!doc) return res.sendStatus(404);

			const question = doc.data as Question;
			const outcome = req.query.saveOnly
				? undefined
				: gradeQuestion(question, submissionRes.data);

			if (req.session.user?.type === 'registered') {
				return db
					.insertInto('question_submission')
					.values({
						user_id: req.session.user.id,
						question_id: doc.id,
						submission: JSON.stringify(submissionRes.data),
						outcome: outcome && JSON.stringify(outcome)
					})
					.execute()
					.then(() => res.json(outcome ?? {}));
			} else {
				res.json(outcome ?? {});
			}
		})
		.catch(next);
});

export const judgeFeature = {
	name: 'judge',
	routers: [
		{
			path: '/api/judge',
			router
		}
	]
} satisfies BackendFeature;
