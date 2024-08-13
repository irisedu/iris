import { app, shell, BrowserWindow } from 'electron';
import path from 'path';
import icon from '../../public/icon.png?asset';
import menu from './menu';
import './ipc';

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
	app.setAppUserModelId('seki.pw.iris-studio');

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
