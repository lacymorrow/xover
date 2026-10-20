import { app, dialog, Tray as ElectronTray, Menu } from 'electron';
import path from 'path';
import dialogs from './dialog';
import { settingsAccelerator } from './menu';
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

const buildContextMenu = () =>
	Menu.buildFromTemplate([
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
		{ type: 'separator' },
		{
			label: 'Reset...',
			click: async () => {
				if (await dialogs.confirmResetSettings()) {
					resetStoreSettings();
				}
			},
		},
		{ type: 'separator' },
		{
			label: 'Settings...',
			...settingsAccelerator(),
			click: () => {
				openSettingsWindow();
			},
		},
		{ role: 'about' },
		{ role: 'quit' },
	]);

const initialize = () => {
	if (windows.tray) {
		return;
	}

	windows.tray = new ElectronTray(getIconPath());
	windows.tray.setToolTip(`${app.name}`);
	windows.tray.setContextMenu(buildContextMenu());
};

/**
 * Rebuild the tray menu in place. The Settings accelerator is read at build
 * time, so the master switch needs this to show up here too.
 */
const refreshMenu = () => {
	if (!windows.tray || windows.tray.isDestroyed()) {
		return;
	}

	windows.tray.setContextMenu(buildContextMenu());
};

const destroy = () => {
	windows.tray?.destroy();
	windows.tray = null;
};

export default {
	initialize,
	refreshMenu,
	destroy,
};
