import {
	app,
	shell,
	BrowserWindow,
	ipcMain,
	dialog,
	type OpenDialogSyncOptions
} from 'electron';
import path from 'path';
import os from 'os';
import fs from 'fs';
import menu from './menu';

export interface DirTreeNode {
	path: string;
	name: string;
	children?: DirTreeNode[];
}

function readDirRecursive(dir: string): DirTreeNode[] {
	return fs.readdirSync(dir, { withFileTypes: true }).map((dirent) => {
		const obj: DirTreeNode = {
			path: path.join(dir, dirent.name),
			name: dirent.name
		};

		if (dirent.isDirectory()) obj.children = readDirRecursive(obj.path);

		return obj;
	});
}

export interface WinContextMenuArgs {
	x: number;
	y: number;
}

export type WinOpenDialogArgs = OpenDialogSyncOptions;

export type FsRmArgs = string;

export interface FsRenameArgs {
	from: string;
	to: string;
}

export type FsMkdirArgs = string;

export interface FsWriteTextArgs {
	file: string;
	data: string;
}

export type FsReadTextArgs = string;
export type FsExistsArgs = string;
export type FsReadDirArgs = string;

export type ShellOpenPathArgs = string;
export type ShellShowItemArgs = string;

ipcMain.handle('window:contextmenu', (e, args: WinContextMenuArgs) => {
	const window = BrowserWindow.fromWebContents(e.sender);
	if (!window) return;

	menu.popup({
		window,
		x: args.x,
		y: args.y
	});
});

ipcMain.on('window:close', (e) => {
	BrowserWindow.fromWebContents(e.sender)?.close();
});

ipcMain.on('window:maximize', (e) => {
	const window = BrowserWindow.fromWebContents(e.sender);
	if (!window) return;

	if (window.isMaximized()) window.unmaximize();
	else window.maximize();
});

ipcMain.on('window:minimize', (e) => {
	BrowserWindow.fromWebContents(e.sender)?.minimize();
});

ipcMain.handle('window:openDialog', (e, args: WinOpenDialogArgs) => {
	const window = BrowserWindow.fromWebContents(e.sender);
	if (!window) return;

	return dialog.showOpenDialogSync(window, args);
});

ipcMain.handle('app:version', () => {
	return app.getVersion();
});

ipcMain.handle('fs:rm', (_, file: FsRmArgs) => {
	return fs.promises.rm(file, { force: true, recursive: true });
});

ipcMain.handle('fs:rename', async (_, args: FsRenameArgs) => {
	// Rename, overwrite directories, allow child to overwrite parent
	const tmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'iris-studio-'));

	const tmpDest = path.join(tmp, path.basename(args.from));

	await fs.promises.cp(args.from, tmpDest, { recursive: true });
	await fs.promises.rm(args.from, { force: true, recursive: true });

	await fs.promises.rm(args.to, { force: true, recursive: true });

	await fs.promises.cp(tmpDest, args.to, { recursive: true });
	await fs.promises.rm(tmp, { force: true, recursive: true });
});

ipcMain.handle('fs:mkdir', (_, dir: FsMkdirArgs) => {
	return fs.promises.mkdir(dir, { recursive: true });
});

ipcMain.handle('fs:writeText', (_, args: FsWriteTextArgs) => {
	return fs.promises.writeFile(args.file, args.data);
});

ipcMain.handle('fs:readText', (_, args: FsReadTextArgs) => {
	return fs.promises.readFile(args, { encoding: 'utf8' });
});

ipcMain.handle('fs:exists', async (_, args: FsExistsArgs) => {
	try {
		await fs.promises.stat(args);
		return true;
	} catch {
		return false;
	}
});

ipcMain.handle('fs:readDir', (_, args: FsReadDirArgs) => {
	return readDirRecursive(args);
});

ipcMain.handle('shell:openPath', (_, args: ShellOpenPathArgs) => {
	return shell.openPath(args);
});

ipcMain.handle('shell:showItemInFolder', (_, args: ShellShowItemArgs) => {
	return shell.showItemInFolder(args);
});
