import { Router } from 'express';
import { db } from '../db/index.js';
import path from 'path';
import { assetsRoot } from '../constants.js';

export const documentsRouter = Router();

documentsRouter.get('/page/(*.*)', async (req, res, next) => {
	const wildcards = req.params as unknown as string[]; // TODO
	const name = wildcards[0];
	const extension = wildcards[1];
	const docPath = name + '.' + extension;

	if (extension === 'irisc') {
		// Document
		db.selectFrom('document_ptr')
			.where('document_ptr.path', '=', docPath)
			.innerJoin('document', 'document.id', 'document_ptr.doc_id')
			.select('document.data as data')
			.executeTakeFirst()
			.then((doc) => {
				if (!doc) return res.sendStatus(404);
				res.contentType('application/json');
				res.json(doc.data);
			})
			.catch(next);
	} else {
		// Asset
		db.selectFrom('asset_ptr')
			.where('asset_ptr.path', '=', docPath)
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
