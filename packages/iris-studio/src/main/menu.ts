import { Menu, MenuItem } from 'electron';

const menu = new Menu();

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

export default menu;
