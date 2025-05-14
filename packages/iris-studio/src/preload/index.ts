import type * as Ipc from '../main/ipc';
import type * as Patchouli from '../main/patchouliIntegration';
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import os from 'os';
import path from 'path';

const winGlobal = {
	contextmenu: (args: Ipc.WinContextMenuArgs) =>
		ipcRenderer.invoke('window:contextmenu', args),
	close: () => ipcRenderer.send('window:close'),
	toggleMaximize: () => ipcRenderer.send('window:maximize'),
	minimize: () => ipcRenderer.send('window:minimize'),
	openDialog: (args: Ipc.WinOpenDialogArgs) =>
		ipcRenderer.invoke('window:openDialog', args)
};

const processGlobal = {
	versions: process.versions,
	arch: process.arch
};

const osGlobal = {
	release: os.release(),
	homedir: os.homedir(),
	sep: path.sep
};

const appGlobal = {
	getVersion: () => ipcRenderer.invoke('app:version'),
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	on: (channel: string, cb: (...args: any[]) => void) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const ipcCb = (_: IpcRendererEvent, ...args: any[]) => {
			cb(...args);
		};

		ipcRenderer.on(channel, ipcCb);

		return () => ipcRenderer.off(channel, ipcCb);
	}
};

const fsGlobal = {
	rm: (args: Ipc.FsRmArgs) => ipcRenderer.invoke('fs:rm', args),
	rename: (args: Ipc.FsRenameArgs) => ipcRenderer.invoke('fs:rename', args),
	mkdir: (args: Ipc.FsMkdirArgs) => ipcRenderer.invoke('fs:mkdir', args),
	writeTextFile: (args: Ipc.FsWriteTextArgs) =>
		ipcRenderer.invoke('fs:writeText', args),
	readTextFile: (args: Ipc.FsReadTextArgs) =>
		ipcRenderer.invoke('fs:readText', args),
	readBase64File: (args: Ipc.FsReadBase64Args) =>
		ipcRenderer.invoke('fs:readBase64', args),
	exists: (args: Ipc.FsExistsArgs) => ipcRenderer.invoke('fs:exists', args),
	readDir: (args: Ipc.FsReadDirArgs) => ipcRenderer.invoke('fs:readDir', args)
};

const shellGlobal = {
	openPath: (args: Ipc.ShellOpenPathArgs) =>
		ipcRenderer.invoke('shell:openPath', args),
	showItemInFolder: (args: Ipc.ShellShowItemArgs) =>
		ipcRenderer.invoke('shell:showItemInFolder', args)
};

const patchouliGlobal = {
	cd: (args: Patchouli.PatchouliCdArgs) =>
		ipcRenderer.send('patchouli:cd', args),
	setOpenFile: (args: Patchouli.PatchouliSetOpenFileArgs) =>
		ipcRenderer.send('patchouli:setOpenFile', args),
	getServerStatus: () => ipcRenderer.invoke('patchouli:getServerStatus'),
	setServerIsOpen: (args: Patchouli.PatchouliSetServerIsOpenArgs) =>
		ipcRenderer.invoke('patchouli:setServerIsOpen', args)
};

export type WinGlobal = typeof winGlobal;
export type ProcessGlobal = typeof processGlobal;
export type OsGlobal = typeof osGlobal;
export type AppGlobal = typeof appGlobal;
export type FsGlobal = typeof fsGlobal;
export type ShellGlobal = typeof shellGlobal;
export type PatchouliGlobal = typeof patchouliGlobal;

contextBridge.exposeInMainWorld('win', winGlobal);
contextBridge.exposeInMainWorld('process', processGlobal);
contextBridge.exposeInMainWorld('os', osGlobal);
contextBridge.exposeInMainWorld('app', appGlobal);
contextBridge.exposeInMainWorld('fs', fsGlobal);
contextBridge.exposeInMainWorld('shell', shellGlobal);
contextBridge.exposeInMainWorld('patchouli', patchouliGlobal);
