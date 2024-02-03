import { Menu, app, ipcMain, shell } from 'electron';
import { ipcChannels } from '../config/ipc-channels';
import { SettingsType } from '../config/settings';
import { serializeMenu, triggerMenuItemById } from './menu';
import { rendererPaths } from './paths';
import { idle } from './startup';
import { getAppMessages, getSettings, setSettings } from './store-actions';
import { openSettingsWindow } from './utils/openSettingsWindow';

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
		ipcMain.handle(ipcChannels.GET_SETTINGS, getSettings);
		ipcMain.handle(ipcChannels.GET_MESSAGES, getAppMessages);

		// These do not send data back to the renderer process
		// Trigger an app menu item by its id
		ipcMain.on(
			ipcChannels.SET_SETTINGS,
			(_event, settings: Partial<SettingsType>) => {
				setSettings(settings);
			},
		);

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

		// OPEN_FILE,
		// QUIT_APP,
		// RESET_APP,
		// UPDATE_APP,
		// CENTER_WINDOW,
		// SET_CROSSHAIR,
	},
};
