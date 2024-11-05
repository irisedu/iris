import { app, ipcMain, protocol, net, type BrowserWindow } from 'electron';
import {
	resolveInternalLink,
	WatchServer,
	readConfig,
	type UserConfig
} from 'patchouli';
import path from 'node:path';
import url from 'node:url';
import chokidar, { type FSWatcher } from 'chokidar';
import fs from 'fs';

export type PatchouliCdArgs = string | undefined;
export type PatchouliSetOpenFileArgs = string | undefined;
export type PatchouliSetServerIsOpenArgs = boolean;

export default function initPatchouliIntegration(win: BrowserWindow) {
	// NOTE: this scheme does not support multiple files open at once
	let openDirectory: string | undefined;
	let openFile: string | undefined;
	let watchServer: WatchServer | undefined;
	let fileWatcher: FSWatcher | undefined;

	async function startServer(config: UserConfig) {
		if (!openDirectory) return;

		await stopServer();

		watchServer = new WatchServer(config, openDirectory);

		watchServer.on('build', (results) => {
			win.webContents.send(
				'patchouli:build',
				results.map((r) => r.toJSON())
			);
		});

		watchServer.on('buildError', (err) => {
			win.webContents.send('patchouli:buildError', err);
		});

		await watchServer.start();
	}

	async function stopServer() {
		await watchServer?.stop();
		watchServer = undefined;
	}

	async function startFileWatcher() {
		if (!openDirectory) return;

		await stopFileWatcher();

		fileWatcher = chokidar.watch(openDirectory, {
			ignoreInitial: true
		});

		fileWatcher
			.on('add', () => win.webContents.send('patchouli:dirChanged'))
			.on('unlink', () => win.webContents.send('patchouli:dirChanged'));
	}

	async function stopFileWatcher() {
		await fileWatcher?.close();
		fileWatcher = undefined;
	}

	ipcMain.on('patchouli:cd', async (_, args: PatchouliCdArgs) => {
		if (openDirectory === args) return;
		openDirectory = args;

		await stopServer();
		await startFileWatcher();
	});

	ipcMain.on('patchouli:setOpenFile', (_, args: PatchouliSetOpenFileArgs) => {
		if (openFile === args) return;
		openFile = args;
	});

	ipcMain.handle('patchouli:getServerStatus', () => {
		return (
			watchServer && {
				isOpen: watchServer.isOpen,
				openFailed: watchServer.openFailed
			}
		);
	});

	ipcMain.handle(
		'patchouli:setServerIsOpen',
		async (_, args: PatchouliSetServerIsOpenArgs) => {
			if (args && openDirectory) {
				const configPath = path.join(openDirectory, 'patchouli.toml');
				const config = await readConfig(configPath);

				// Check this after awaiting to avoid races
				if (watchServer?.isOpen) return;

				if (config) await startServer(config);
			} else {
				await stopServer();
			}
		}
	);

	app.whenReady().then(() => {
		protocol.handle('asset', async (request) => {
			if (!openDirectory || !openFile)
				return new Response('Not Found', { status: 404 });

			const assetPath = request.url.slice('asset://'.length);
			const internalLink = resolveInternalLink(assetPath, openFile, true);
			if (!internalLink) return new Response('Not Found', { status: 404 });

			const fullPath = path.join(openDirectory, 'build', internalLink);

			if (!fs.existsSync(fullPath)) {
				await watchServer?.build();
			}

			return net.fetch(url.pathToFileURL(fullPath).toString());
		});
	});
}
