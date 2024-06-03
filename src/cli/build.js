import signale from 'signale';
import path from 'path';
import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import chokidar from 'chokidar';
import {
	findProject,
	langtoolStart,
	handleExit,
	getIgnoredPaths
} from '../utils.js';
import build from '../build.js';

function startDevServer(config, projectPath, port) {
	const app = express();

	app.use((_, res, next) => {
		res.set({
			'Access-Control-Allow-Origin': '*'
		});

		next();
	});

	app.use('/page', express.static(path.join(projectPath, 'build')));

	const server = app.listen(port, '127.0.0.1', () => {
		signale.success(`Listening on 127.0.0.1:${port}`);
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
		console.log();
		signale.await(`File event \`${event}\` at ${path}, rebuilding ...`);

		await build(config, projectPath);

		wss.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify({ event: 'reload' }));
			}
		});
	});
}

export default async function handleBuild() {
	const { config, projectPath } = await findProject();
	const langtoolProcess = await langtoolStart(config.user.languagetool);

	await build(config, projectPath);

	if (this.opts().watch) {
		startDevServer(config, projectPath, this.opts().port);
	}

	let exiting = false;

	handleExit(() => {
		if (exiting) {
			return;
		}

		exiting = true;

		signale.info('Exiting...');
		langtoolProcess.kill();
		process.exit(0);
	});

	if (!this.opts().watch) {
		process.exit(0);
	}
}
