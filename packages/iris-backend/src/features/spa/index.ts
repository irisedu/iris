import { type BackendFeature } from '../../feature.js';
import express from 'express';
import path from 'path';

const spaRoot = process.env.SPA_ROOT || path.join(process.cwd(), 'spa');

export const spaFeature = {
	name: 'spa',
	setup(app) {
		app.use(express.static(spaRoot));

		app.get('/{*splat}', (_, res) => {
			res.sendFile(path.join(spaRoot, 'index.html'));
		});
	}
} satisfies BackendFeature;
