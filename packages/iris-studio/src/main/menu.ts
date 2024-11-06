import { Menu, MenuItem } from 'electron';

export const menu = new Menu();

menu.append(
	new MenuItem({
		label: 'Inspect Element',
		accelerator: 'CmdOrCtrl+Shift+I',
		role: 'toggleDevTools'
	})
);

menu.append(
	new MenuItem({
		label: 'Refresh',
		accelerator: 'CmdOrCtrl+R',
		role: 'reload'
	})
);

menu.append(
	new MenuItem({
		label: 'Zoom',
		submenu: [
			{
				label: 'Zoom Out',
				accelerator: 'CmdOrCtrl+-',
				role: 'zoomOut'
			},
			{
				label: 'Zoom In',
				accelerator: 'CmdOrCtrl+=',
				role: 'zoomIn'
			},
			{
				label: 'Reset Zoom',
				accelerator: 'CmdOrCtrl+0',
				role: 'resetZoom'
			}
		]
	})
);

export const appMenu = new Menu();

appMenu.append(
	new MenuItem({
		label: 'Iris Studio',
		submenu: [
			{
				label: 'About Iris Studio',
				role: 'about'
			},
			{ type: 'separator' },
			{
				label: 'Quit Iris Studio',
				accelerator: 'CmdOrCtrl+Q',
				role: 'quit'
			}
		]
	})
);

appMenu.append(
	new MenuItem({
		label: 'Edit',
		submenu: [
			{
				label: 'Undo',
				accelerator: 'CmdOrCtrl+Z',
				role: 'undo'
			},
			{
				label: 'Redo',
				accelerator: 'CmdOrCtrl+Shift+Z',
				role: 'redo'
			},
			{ type: 'separator' },
			{
				label: 'Cut',
				accelerator: 'CmdOrCtrl+X',
				role: 'cut'
			},
			{
				label: 'Copy',
				accelerator: 'CmdOrCtrl+C',
				role: 'copy'
			},
			{
				label: 'Paste',
				accelerator: 'CmdOrCtrl+V',
				role: 'paste'
			}
		]
	})
);

appMenu.append(
	new MenuItem({
		label: 'View',
		submenu: [
			{
				label: 'Refresh',
				accelerator: 'CmdOrCtrl+R',
				role: 'reload'
			},
			{
				label: 'Inspect Element',
				accelerator: 'CmdOrCtrl+Shift+I',
				role: 'toggleDevTools'
			},
			{ type: 'separator' },
			{
				label: 'Zoom',
				submenu: [
					{
						label: 'Zoom Out',
						accelerator: 'CmdOrCtrl+-',
						role: 'zoomOut'
					},
					{
						label: 'Zoom In',
						accelerator: 'CmdOrCtrl+=',
						role: 'zoomIn'
					},
					{
						label: 'Reset Zoom',
						accelerator: 'CmdOrCtrl+0',
						role: 'resetZoom'
					}
				]
			}
		]
	})
);
