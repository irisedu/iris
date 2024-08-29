import logger from './logger';
import path from 'path';
import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import chokidar from 'chokidar';
import { getIgnoredPaths } from './utils';
import build from './build';
import type { UserConfig } from './config';

export default function watch(
	config: UserConfig,
	projectPath: string,
	port = 58064
) {
	const app = express();

	app.use((_, res, next) => {
		res.set({
			'Access-Control-Allow-Origin': '*'
		});

		next();
	});

	express.static.mime.define({ 'application/json': ['irisc'] });
	app.use('/page', express.static(path.join(projectPath, 'build')));

	const server = app.listen(port, '127.0.0.1', () => {
		logger.success(`Listening on 127.0.0.1:${port}`);
	});

	const wss = new WebSocketServer({ noServer: true });

	server.on('upgrade', (req, socket, head) => {
		wss.handleUpgrade(req, socket, head, (ws) => {
			wss.emit('connection', ws, socket);
		});
	});

	const watcher = chokidar.watch('.', {
		ignored: getIgnoredPaths(config),
		ignoreInitial: true,
		cwd: projectPath
	});

	watcher.on('all', async (event, path) => {
		logger.raw();
		logger.await(`File event \`${event}\` at ${path}, rebuilding ...`);

		await build(config, projectPath);

		wss.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify({ event: 'reload' }));
			}
		});
	});
}
