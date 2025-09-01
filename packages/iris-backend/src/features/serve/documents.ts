import { Router } from 'express';
import { db, JsonValue } from '../../db/index.js';

const questionToRedact = [
	'comment',
	'correct',
	'explanation',
	'catchAllExplanation'
];

// TODO: pretty bad
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function recursiveRedact(doc: any, toRedact: string[]) {
	// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
	toRedact.forEach((k) => delete doc[k]);

	for (const v of Object.values(doc)) {
		if (Array.isArray(v)) {
			v.forEach((x) => recursiveRedact(x, toRedact));
		} else if (typeof v === 'object') {
			recursiveRedact(v, toRedact);
		}
	}
}

function redactInfo(docPath: string, doc: JsonValue): JsonValue {
	if (docPath.endsWith('.iq.json')) {
		recursiveRedact(doc, questionToRedact);
	}

	return doc;
}

export const documentsRouter = Router();

documentsRouter.get('/page/*splat', (req, res, next) => {
	const { splat } = req.params as Record<string, string[]>; // TODO
	const docPath = splat.join('/');

	if (docPath.endsWith('.irisc') || docPath.endsWith('.iq.json')) {
		// Document
		db.selectFrom('document_ptr')
			.where('document_ptr.path', '=', docPath)
			.where('document_ptr.rev', '=', 'latest')
			.innerJoin('document', 'document.id', 'document_ptr.doc_id')
			.select('document.data')
			.executeTakeFirst()
			.then((doc) => {
				if (!doc) return next();
				res.json(redactInfo(docPath, doc.data));
			})
			.catch(next);
	} else {
		// Asset
		db.selectFrom('asset_ptr')
			.where('asset_ptr.path', '=', docPath)
			.where('asset_ptr.rev', '=', 'latest')
			.select('asset_ptr.hash')
			.executeTakeFirst()
			.then((asset) => {
				if (!asset) return next();
				res.redirect(
					`${process.env.AWS_ENDPOINT_URL!}/${process.env.S3_CONTENT_BUCKET!}/${asset.hash}`
				);
			})
			.catch(next);
	}
});

documentsRouter.get('/series', (req, res, next) => {
	// TODO: access control
	db.selectFrom('series')
		.where('rev', '=', 'latest')
		.selectAll()
		.execute()
		.then((series) => {
			res.json(series.map((s) => s.data));
		})
		.catch(next);
});
