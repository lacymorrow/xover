import { app, dialog, Tray as ElectronTray, Menu } from 'electron';
import path from 'path';
import { __resources } from './paths';
import {
	addCrosshairImage,
	resetStoreSettings,
	setActiveWindowState,
} from './store-actions';
import { is } from './util';
import { openSettingsWindow } from './utils/settingsWindow';
import windows from './windows';

// mac needs dark/light versions
const systemIcon = () => {
	if (is.macos) {
		return 'tray-Template.png';
	}

	if (is.windows) {
		return 'icon.ico';
	}

	return 'icon.png';
};

const getIconPath = () => {
	return path.join(__resources, 'icons', systemIcon());
};

const initialize = () => {
	if (windows.tray) {
		return;
	}

	windows.tray = new ElectronTray(getIconPath());

	const contextMenu = Menu.buildFromTemplate([
		{
			label: 'Show App',
			click: () => {
				windows.mainWindow?.show();
				windows.mainWindow?.focus();
			},
		},
		{
			label: 'Choose Crosshair',
			click: () => {
				openSettingsWindow();
			},
		},
		{
			label: 'Custom Image...',
			click: async () => {
				const result = await dialog.showOpenDialog({
					title: 'Choose a Custom Crosshair Image',
					filters: [
						{
							name: 'Images',
							extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'],
						},
					],
					properties: ['openFile'],
				});

				if (!result.canceled && result.filePaths.length > 0) {
					const filePath = result.filePaths[0];
					addCrosshairImage(filePath);
					setActiveWindowState({ crosshair: filePath });
				}
			},
		},
		{
			label: 'Reset',
			click: () => {
				resetStoreSettings();
			},
		},
		{ type: 'separator' },
		{
			label: 'Settings...',
			accelerator: 'Command+,',
			click: () => {
				openSettingsWindow();
			},
		},
		{ role: 'about' },
		{ role: 'quit' },
	]);

	windows.tray.setToolTip(`${app.name}`);
	windows.tray.setContextMenu(contextMenu);
};

const destroy = () => {
	windows.tray?.destroy();
	windows.tray = null;
};

export default {
	initialize,
	destroy,
};
