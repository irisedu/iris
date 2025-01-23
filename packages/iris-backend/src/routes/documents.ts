import { Router } from 'express';
import { db, JsonValue } from '../db/index.js';
import path from 'path';
import { assetsRoot } from '../constants.js';

export const documentsRouter = Router();

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

documentsRouter.get('/page/*', (req, res, next) => {
	const wildcards = req.params as unknown as string[]; // TODO
	const docPath = wildcards[0];

	if (docPath.endsWith('.irisc') || docPath.endsWith('.iq.json')) {
		// Document
		db.selectFrom('document_ptr')
			.where('document_ptr.path', '=', docPath)
			.where('document_ptr.rev', '=', 'latest')
			.innerJoin('document', 'document.id', 'document_ptr.doc_id')
			.select('document.data as data')
			.executeTakeFirst()
			.then((doc) => {
				if (!doc) return res.sendStatus(404);
				res.json(redactInfo(docPath, doc.data));
			})
			.catch(next);
	} else {
		// Asset
		db.selectFrom('asset_ptr')
			.where('asset_ptr.path', '=', docPath)
			.where('asset_ptr.rev', '=', 'latest')
			.innerJoin('asset', 'asset.id', 'asset_ptr.asset_id')
			.select('asset.hash as hash')
			.executeTakeFirst()
			.then((asset) => {
				if (!asset) return res.sendStatus(404);
				res.contentType(path.basename(docPath));
				res.sendFile(
					path.join(
						assetsRoot,
						asset.hash.substring(0, 2),
						asset.hash.substring(0, 4),
						asset.hash
					)
				);
			})
			.catch(next);
	}
});

documentsRouter.get('/series', (req, res, next) => {
	// TODO: access control
	db.selectFrom('series')
		.selectAll()
		.execute()
		.then((series) => {
			res.json(series.map((s) => s.data));
		})
		.catch(next);
});
