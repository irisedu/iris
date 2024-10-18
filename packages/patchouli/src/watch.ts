import logger from './logger.js';
import anymatch from 'anymatch';
import { EventEmitter } from 'events';
import { posix as path } from 'path';
import express, { type Express } from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import chokidar, { type FSWatcher } from 'chokidar';
import { getIgnoredPaths } from './utils.js';
import build from './build.js';
import type { UserConfig } from './config.js';
import distConfig from './distConfig.json';
import type FileInfo from './FileInfo.js';

express.static.mime.define({ 'application/json': ['irisc'] });

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export declare interface WatchServer {
	on(event: 'build', listener: (fileInfo: FileInfo[]) => void): this;
	on(event: 'buildError', listener: (error: unknown) => void): this;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class WatchServer extends EventEmitter {
	#config: UserConfig;
	#projectPath: string;

	#app: Express;

	#wss?: WebSocketServer;
	#watcher?: FSWatcher;
	#server?: ReturnType<Express['listen']>;

	#isOpen = false;
	#openFailed = false;

	constructor(config: UserConfig, projectPath: string) {
		super();

		this.#config = config;
		this.#projectPath = projectPath;

		this.#app = express();

		this.#app.use((_, res, next) => {
			res.set({
				'Access-Control-Allow-Origin': distConfig.frontendOrigin
			});

			next();
		});

		this.#app.use('/page', express.static(path.join(projectPath, 'build')));

		this.#app.get('/series', (req, res) => {
			res.sendFile(path.join(projectPath, 'build', 'series.json'));
		});
	}

	async #build() {
		try {
			const initResults = await build(this.#config, this.#projectPath);
			this.emit('build', initResults);
		} catch (e: unknown) {
			this.emit('buildError', e);
		}
	}

	async start(port = 58064) {
		this.#build();

		// Start server
		this.#server = this.#app.listen(port, '127.0.0.1', () => {
			logger.success(`Watch server listening on 127.0.0.1:${port}`);
			this.#isOpen = true;
		});

		this.#server.on('error', () => {
			this.#openFailed = true;
		});

		// Start websocket
		this.#wss = new WebSocketServer({ noServer: true });
		this.#server.on('upgrade', (req, socket, head) => {
			this.#wss?.handleUpgrade(req, socket, head, (ws) => {
				this.#wss?.emit('connection', ws, socket);
			});
		});

		// Start watcher
		this.#watcher = chokidar.watch('.', {
			ignored: (file) =>
				// FIXME
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(anymatch as any)(
					getIgnoredPaths(this.#config),
					path.relative(this.#projectPath, file)
				),
			ignoreInitial: true,
			cwd: this.#projectPath
		});

		this.#watcher.on('all', async (event, path) => {
			logger.raw();
			logger.await(`File event \`${event}\` at ${path}, rebuilding ...`);

			this.#build();

			this.#wss?.clients.forEach((client) => {
				if (client.readyState === WebSocket.OPEN) {
					client.send(JSON.stringify({ event: 'reload' }));
				}
			});
		});
	}

	async stop() {
		if (!this.#isOpen) return;

		await this.#watcher?.close();
		this.#watcher = undefined;

		this.#wss?.close();
		this.#wss = undefined;

		this.#server?.close();
		this.#server = undefined;

		this.#isOpen = false;
		this.#openFailed = false;
	}

	get isOpen() {
		return this.#isOpen;
	}

	get openFailed() {
		return this.#openFailed;
	}
}
