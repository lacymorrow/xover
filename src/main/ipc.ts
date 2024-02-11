import { BrowserWindow, Menu, app, ipcMain, shell } from 'electron';
import { ipcChannels } from '../config/ipc-channels';
import { SettingsType } from '../config/settings';
import { CustomAcceleratorsType } from '../types/keyboard';
import autoUpdate from './auto-update';
import { serializeMenu, triggerMenuItemById } from './menu';
import { rendererPaths } from './paths';
import { resetApp } from './reset';
import { idle } from './startup';
import {
	getAppMessages,
	getCrosshairImages,
	getKeybinds,
	getSettings,
	setSettings,
} from './store-actions';
import { openSettingsWindow } from './utils/settingsWindow';
import {
	activeWindow,
	centerWindow,
	focusNextWindow,
} from './utils/window-utils';

import { getOS } from '../utils/getOS';
import kb from './keyboard';
import { notification } from './notifications';
import sounds from './sounds';
import { is } from './util';
import windows from './windows';

export default {
	initialize() {
		// Activate the idle state when the renderer process is ready
		ipcMain.once(ipcChannels.RENDERER_READY, () => {
			idle();
		});

		// This is called ONCE, don't use it for anything that changes
		ipcMain.handle(ipcChannels.GET_APP_INFO, () => {
			const os = getOS();
			return {
				name: app.getName(),
				version: app.getVersion(),
				os,
				isMac: os === 'mac',
				isWindows: os === 'windows',
				isLinux: os === 'linux',
				isDev: is.debug,
				paths: rendererPaths,
			};
		});

		// These send data back to the renderer process
		ipcMain.handle(ipcChannels.GET_APP_MENU, () =>
			serializeMenu(Menu.getApplicationMenu()),
		);
		ipcMain.handle(ipcChannels.GET_MESSAGES, getAppMessages);
		ipcMain.handle(ipcChannels.GET_KEYBINDS, getKeybinds);
		ipcMain.handle(ipcChannels.GET_SETTINGS, getSettings);
		ipcMain.handle(ipcChannels.GET_CROSSHAIR_IMAGES, getCrosshairImages);

		// These do not send data back to the renderer process
		ipcMain.on(
			ipcChannels.SET_KEYBIND,
			(_event, keybind: keyof CustomAcceleratorsType, accelerator: string) => {
				kb.setKeybind(keybind, accelerator);
			},
		);

		ipcMain.on(
			ipcChannels.SET_SETTINGS,
			(_event, settings: Partial<SettingsType>) => {
				setSettings(settings);
			},
		);

		// Show a notification
		ipcMain.on(ipcChannels.APP_NOTIFICATION, (_event, options: any) => {
			notification(options);
		});

		// Play a sound
		ipcMain.on(ipcChannels.PLAY_SOUND, (_event: any, sound: string) => {
			sounds.play(sound);
		});

		// These do not send data back to the renderer process
		// Trigger an app menu item by its id
		ipcMain.on(
			ipcChannels.TRIGGER_APP_MENU_ITEM_BY_ID,
			(_event: any, id: string) => {
				triggerMenuItemById(Menu.getApplicationMenu(), id);
			},
		);

		// Open a URL in the default browser
		ipcMain.on(ipcChannels.OPEN_URL, (_event: any, url: string) => {
			shell.openExternal(url);
		});

		ipcMain.on(ipcChannels.OPEN_FILE, (_event: any, file: string) => {
			// todo
		});

		ipcMain.on(ipcChannels.OPEN_SETTINGS, () => {
			openSettingsWindow();
		});

		// Close a window
		ipcMain.on(ipcChannels.CLOSE_WINDOW, (event) => {
			const window = BrowserWindow.fromId(event.sender.id) || activeWindow();
			if (!window) {
				return;
			}

			window.close();
		});

		// Quit the app
		ipcMain.on(ipcChannels.QUIT_APP, () => {
			app.quit();
		});

		ipcMain.on(ipcChannels.RESET_APP, () => {
			resetApp();
		});

		ipcMain.on(ipcChannels.UPDATE_APP, () => {
			autoUpdate.checkForUpdates();
		});

		ipcMain.on(ipcChannels.CENTER_WINDOW, (event) => {
			let window = BrowserWindow.fromId(event.sender.id);

			// Don't center the settings window
			if (window === windows.settingsWindow) {
				window = windows.mainWindow;
			}

			if (!window || window.isDestroyed()) {
				return;
			}

			centerWindow({ window, animated: true });
			sounds.play('DONE');
		});

		ipcMain.on(ipcChannels.CENTER_WINDOW_MAIN, () => {
			if (windows.mainWindow) {
				centerWindow({ window: windows.mainWindow, animated: true });
				sounds.play('DONE');
			}
		});

		ipcMain.on(ipcChannels.CENTER_WINDOW_SETTINGS, () => {
			if (windows.settingsWindow) {
				centerWindow({ window: windows.settingsWindow, animated: true });
			}
		});

		ipcMain.on(ipcChannels.FOCUS_WINDOW_MAIN, () => {
			focusNextWindow();
		});

		// OPEN_FILE,
		// SET_CROSSHAIR,
	},
};
