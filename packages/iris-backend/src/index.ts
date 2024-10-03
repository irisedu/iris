import express from 'express';
import path from 'path';
import fs from 'fs';
import { expressLogger } from './logger.js';

const app = express();

const contentRoot =
	process.env.CONTENT_ROOT || path.join(process.cwd(), 'content');

app.get('/page/:series/*', async (req, res) => {
	const series = req.params.series;
	const slug = (req.params as unknown as string[])[0]; // TODO

	try {
		const filePath = path.join(contentRoot, series, slug);
		const contents = await fs.promises.readFile(filePath);

		if (slug.endsWith('.irisc')) {
			res.contentType('application/json');
		} else {
			res.contentType(path.basename(slug));
		}

		res.send(contents);
	} catch {
		res.sendStatus(404);
	}
});

const port = process.env.EXPRESS_PORT || 58063;

app.listen(port, () => {
	expressLogger.info({ port }, `Listening on port ${port}`);
});
