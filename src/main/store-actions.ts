import { app } from 'electron';
import Logger from 'electron-log';
import { APP_MESSAGES_MAX } from '../config/config';
import { ipcChannels } from '../config/ipc-channels';
import {
	ActionStateType,
	CrosshairWindowStateType,
	SettingsType,
	WindowStateType,
} from '../config/settings';
import { $messages } from '../config/strings';
import store, { AppMessageType } from './store';
import tray from './tray';
import { forEachWindow } from './utils/window-utils';
import windows from './windows';

const synchronizeApp = (changedSettings?: Partial<SettingsType>) => {
	// Sync with main
	if (changedSettings) {
		const keys = Object.keys(changedSettings);

		if (keys.includes('showDockIcon')) {
			app.dock[changedSettings.showDockIcon ? 'show' : 'hide']();
		}

		if (keys.includes('showTrayIcon')) {
			if (changedSettings.showTrayIcon) {
				tray.initialize();
			} else {
				tray.destroy();
			}
		}

		if (keys.includes('startOnLogin')) {
			app.setLoginItemSettings({
				openAtLogin: changedSettings.startOnLogin,
			});
		}
	}

	// Sync with renderer
	forEachWindow((win) => {
		win.webContents.send(ipcChannels.APP_UPDATED);
	});
};

export const resetStoreSettings = () => {
	Logger.status($messages.resetStore);
	// todo: reset windowState
	store.delete('settings');
	store.delete('keybinds');
	store.delete('actionState');

	store.set('windows', {
		settings: {},
	});

	synchronizeApp();
};

export const resetStore = () => {
	Logger.status($messages.resetStore);
	store.clear();

	synchronizeApp();
};

export const getKeybinds = () => {
	return store.get('keybinds');
};

export const getSetting = (setting: keyof SettingsType) => {
	const settings = store.get('settings');
	if (settings[setting] !== undefined) {
		return settings[setting];
	}
};

export const getSettings = () => {
	return store.get('settings');
};

export const setSettings = (settings: Partial<SettingsType>) => {
	store.set('settings', {
		...getSettings(),
		...settings,
	});

	// Sync with renderer
	synchronizeApp(settings);
};

export const addAppMessage = (message: AppMessageType) => {
	let appMessageLog = store.get('appMessageLog');
	if (appMessageLog.length > APP_MESSAGES_MAX) {
		appMessageLog = appMessageLog.slice(0, Math.ceil(APP_MESSAGES_MAX / 2));
	}
	appMessageLog.push(message);
	store.set('appMessageLog', appMessageLog);

	// Sync with renderer
	synchronizeApp();
};

export const getAppMessages = () => {
	return store.get('appMessageLog');
};

export const getCrosshairImages = () => {
	return store.get('images');
};

export const setCrosshairImages = (images: string[]) => {
	store.set('images', images);
};

export const getActiveWindow = () => {
	return store.get('activeWindow');
};

export const setActiveWindow = (w: string) => {
	store.set('activeWindow', w);
	synchronizeApp();
};

export const getWindowState = (w: string) => {
	const state = store.get(`windows`);
	if (typeof state === 'object' && w in state) {
		return state[w];
	}
};

export const setWindowState = (w: string, state: Partial<WindowStateType>) => {
	store.set(`windows.${w}`, { ...getWindowState(w), ...state });
	synchronizeApp();
};

export const deleteWindowState = (w: string) => {
	const state = store.get(`windows`);
	delete state[w];
	store.set(`windows`, state);
};

export const getWindowStates = () => {
	return store.get('windows');
};

export const getActiveWindowState = () => {
	return getWindowState(getActiveWindow());
};

export const setActiveWindowState = (
	state: Partial<CrosshairWindowStateType>,
) => {
	setWindowState(getActiveWindow(), state);
};

export const getActionState = () => {
	return store.get('actionState');
};

export const setActionStateKey = (key: keyof ActionStateType, state: any) => {
	// Danger, no type checking - use with caution
	store.set(`actionState.${key}`, state);
	windows?.mainWindow?.webContents.send(ipcChannels.ACTION_STATE, key, state);
};

export default store;
