import express from 'express';
import { expressLogger } from './logger.js';

const app = express();

app.get('/', (req, res) => {
	res.send('Hello World');
});

const port = process.env.EXPRESS_PORT || 58063;

app.listen(port, () => {
	expressLogger.info({ port }, `Listening on port ${port}`);
});
