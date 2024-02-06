<<<<<<< HEAD
import { BrowserWindow, Menu, app, ipcMain, shell } from 'electron';
=======
import { Menu, app, ipcMain, shell } from 'electron';
import { CustomAcceleratorsType } from '../types/keyboard';
>>>>>>> upstream/main
import { ipcChannels } from '../config/ipc-channels';
import { SettingsType } from '../config/settings';
import autoUpdate from './auto-update';
import { serializeMenu, triggerMenuItemById } from './menu';
import { rendererPaths } from './paths';
import { resetApp } from './reset';
import { idle } from './startup';
<<<<<<< HEAD
import { getAppMessages, getSettings, setSettings } from './store-actions';
import { openSettingsWindow } from './utils/openSettingsWindow';
import { centerWindow } from './utils/windows';
=======
import {
	getAppMessages,
	getKeybinds,
	getSettings,
	setSettings,
} from './store-actions';
import kb from './keyboard';
>>>>>>> upstream/main

export default {
	initialize() {
		// Activate the idle state when the renderer process is ready
		ipcMain.once(ipcChannels.RENDERER_READY, () => {
			idle();
		});

		// These send data back to the renderer process
		ipcMain.handle(ipcChannels.GET_APP_NAME, () => app.getName());
		ipcMain.handle(ipcChannels.GET_APP_MENU, () =>
			serializeMenu(Menu.getApplicationMenu()),
		);
		ipcMain.handle(ipcChannels.GET_APP_PATHS, () => {
			return rendererPaths;
		});
		ipcMain.handle(ipcChannels.GET_MESSAGES, getAppMessages);
<<<<<<< HEAD

		// These do not send data back to the renderer process
		// Trigger an app menu item by its id
		ipcMain.on(
=======
		ipcMain.handle(ipcChannels.GET_SETTINGS, getSettings);
		ipcMain.handle(
>>>>>>> upstream/main
			ipcChannels.SET_SETTINGS,
			(_event, settings: Partial<SettingsType>) => {
				setSettings(settings);
			},
		);

<<<<<<< HEAD
=======
		ipcMain.handle(ipcChannels.GET_KEYBINDS, getKeybinds);
		ipcMain.handle(
			ipcChannels.SET_KEYBIND,
			(_event, keybind: keyof CustomAcceleratorsType, accelerator: string) => {
				kb.setKeybind(keybind, accelerator);
			},
		);

		// These do not send data back to the renderer process
		// Trigger an app menu item by its id
>>>>>>> upstream/main
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

		// Open a URL in the default browser
		ipcMain.on(ipcChannels.OPEN_FILE, (_event: any, file: string) => {
			// todo
		});

		ipcMain.on(ipcChannels.OPEN_SETTINGS, () => {
			openSettingsWindow();
		});

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
			const window = BrowserWindow.fromId(event.sender.id);
			if (!window) {
				return;
			}

			centerWindow({ window, animated: true });
		});

		// OPEN_FILE,
		// UPDATE_APP,
		// SET_CROSSHAIR,
	},
};
