import { app, shell, BrowserWindow, Menu } from 'electron';
import path from 'node:path';
import icon from '../../public/icon.png?asset';
import { menu, appMenu } from './menu';

import './ipc';
import initPatchouliIntegration from './patchouliIntegration';

function createWindow() {
	const mainWindow = new BrowserWindow({
		width: 900,
		height: 670,
		show: false,
		autoHideMenuBar: true,
		frame: process.platform === 'darwin',
		...(process.platform === 'linux' ? { icon } : {}),
		webPreferences: {
			preload: path.join(import.meta.dirname, '../preload/index.cjs'),
			sandbox: false
		}
	});

	initPatchouliIntegration(mainWindow);

	Menu.setApplicationMenu(appMenu);
	mainWindow.setMenu(menu);

	mainWindow.on('ready-to-show', () => {
		mainWindow.show();
	});

	mainWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url);
		return { action: 'deny' };
	});

	if (process.env['ELECTRON_RENDERER_URL']) {
		mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
	} else {
		mainWindow.loadFile(
			path.join(import.meta.dirname, '../renderer/index.html')
		);
	}
}

app.whenReady().then(() => {
	app.setAppUserModelId('cc.ucsb.iris-studio');

	createWindow();

	app.on('activate', function () {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
