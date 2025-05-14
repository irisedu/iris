import logger from './logger.js';
import anymatch from 'anymatch';
import { EventEmitter } from 'events';
import path from 'path';
import express, { type Express } from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import chokidar, { type FSWatcher } from 'chokidar';
import { getIgnoredPaths } from './utils.js';
import build from './build.js';
import type { UserConfig } from './config.js';
import distConfig from './distConfig.json' with { type: 'json' };
import type FileInfo from './FileInfo.js';

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

	#buildInProgress?: Promise<void>;
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

	build() {
		if (this.#buildInProgress) return this.#buildInProgress;

		const doBuild = async () => {
			try {
				const initResults = await build(this.#config, this.#projectPath);
				this.emit('build', initResults);
			} catch (e: unknown) {
				this.emit('buildError', e);
			}

			this.#buildInProgress = undefined;
		};

		const p = doBuild();
		this.#buildInProgress = p;
		return p;
	}

	async start(port = 58064) {
		await this.build();

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
					path.relative(this.#projectPath, file),
					{ dot: true }
				),
			ignoreInitial: true,
			cwd: this.#projectPath
		});

		this.#watcher.on('all', async (event, path) => {
			logger.raw();
			logger.await(`File event \`${event}\` at ${path}, rebuilding ...`);

			await this.build();

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
