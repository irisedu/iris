import { app, ipcMain, protocol, net } from 'electron';
import { resolveInternalLink } from 'patchouli';
import path from 'node:path';
import url from 'node:url';

export type PatchouliCdArgs = string | undefined;
export type PatchouliSetOpenFileArgs = string | undefined;

// NOTE: this scheme does not support multiple files open at once
let openDirectory: string | undefined;
let openFile: string | undefined;

ipcMain.on('patchouli:cd', (_, args: PatchouliCdArgs) => {
	if (openDirectory === args) return;
	openDirectory = args;
});

ipcMain.on('patchouli:setOpenFile', (_, args: PatchouliSetOpenFileArgs) => {
	if (openFile === args) return;
	openFile = args;
});

app.whenReady().then(() => {
	protocol.handle('asset', (request) => {
		if (!openDirectory || !openFile)
			return new Response('Not Found', { status: 404 });

		const assetPath = request.url.slice('asset://'.length);
		const internalLink = resolveInternalLink(assetPath, openFile);
		if (!internalLink) return new Response('Not Found', { status: 404 });

		return net.fetch(
			url.pathToFileURL(path.join(openDirectory, internalLink)).toString()
		);
	});
});
