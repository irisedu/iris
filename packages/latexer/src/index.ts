import express from 'express';

import latexRouter, { installTexmf } from './jobs/latex.js';

const app = express();

app.use('/job/latex', latexRouter);

const port = process.env.PORT || 58060;

installTexmf().then(() => {
	app.listen(port, () => {
		console.log(`Listening on port ${port}`);
	});
});
