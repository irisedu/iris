import { type BackendFeature } from '../../feature.js';
import express from 'express';
import path from 'path';
import { spaRoot } from '../../constants.js';

export const spaFeature = {
	name: 'spa',
	setup(app) {
		app.use(express.static(spaRoot));

		app.get('/{*splat}', (_, res) => {
			res.sendFile(path.join(spaRoot, 'index.html'));
		});
	}
} satisfies BackendFeature;
