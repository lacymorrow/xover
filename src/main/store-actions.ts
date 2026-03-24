import { app, screen } from 'electron';
import Logger from 'electron-log';
import path from 'path';
import {
	APP_ASPECT_RATIO,
	APP_HEIGHT,
	APP_MESSAGES_MAX,
	APP_WIDTH,
	SIZE_MODES,
} from '../config/config';
import { ipcChannels } from '../config/ipc-channels';
import {
	ActionStateType,
	CrosshairWindowStateType,
	DEFAULT_CROSSHAIR_WINDOW_STATE,
	SettingsType,
} from '../config/settings';
import { $messages } from '../config/strings';
import store, { AppMessageType } from './store';
import { forEachWindow } from './utils/window-utils';
import windows from './windows';

const synchronizeApp = (changedSettings?: Partial<SettingsType>) => {
	// Sync with main
	if (changedSettings) {
		const keys = Object.keys(changedSettings);

		if (keys.includes('showDockIcon')) {
			if (changedSettings.showDockIcon) {
				app.dock?.show();
			} else {
				app.dock?.hide();
				// macOS hides all windows when dock icon is hidden; re-show them
				setTimeout(() => {
					forEachWindow((win) => {
						if (!win.isDestroyed()) {
							win.showInactive();
						}
					});
				}, 100);
			}
		}

		if (keys.includes('showTrayIcon')) {
			// Lazy require to break circular dependency: store-actions → tray → store-actions
			// eslint-disable-next-line global-require
			const tray = require('./tray').default;
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

		if (keys.includes('appSizeMode')) {
			const mode = changedSettings.appSizeMode!;
			Object.entries(windows.crosshairWindows).forEach(([_id, win]) => {
				if (!win || win.isDestroyed()) return;

				if (mode === 'fullscreen') {
					const display = screen.getPrimaryDisplay();
					const { width, height } = display.bounds;
					win.setResizable(true); // must be resizable to setBounds
					win.setBounds({ x: 0, y: 0, width, height });
					win.setResizable(false);
				} else if (mode === 'resizable') {
					win.setResizable(true);
					win.setMinimumSize(APP_WIDTH, APP_HEIGHT);
					win.setAspectRatio(APP_ASPECT_RATIO);
				} else {
					// normal
					win.setResizable(true); // must be resizable to setBounds
					const [currentX, currentY] = win.getPosition();
					win.setBounds({
						x: currentX,
						y: currentY,
						width: APP_WIDTH,
						height: APP_HEIGHT,
					});
					win.setResizable(false);
					win.setMinimumSize(APP_WIDTH, APP_HEIGHT);
					win.setAspectRatio(APP_ASPECT_RATIO);
				}
			});
		}
	}

	// Sync with renderer — skip destroyed windows
	forEachWindow((win) => {
		if (!win.isDestroyed()) {
			win.webContents.send(ipcChannels.APP_UPDATED);
		}
	});
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
	const messages = store.get('appMessageLog');

	// Reverse the messages so that the most recent is at the top
	const reversed = messages.slice().reverse();
	return reversed;
};

export const getCrosshairImages = () => {
	return store.get('images');
};

export const setCrosshairImages = (images: string[]) => {
	store.set('images', images);

	// Does not Sync!
};

export const addCrosshairImage = (image: string) => {
	// Only store absolute paths
	if (!path.isAbsolute(image)) {
		Logger.warn(`Ignoring non-absolute crosshair path: ${image}`);
		return;
	}
	const images = getCrosshairImages();
	if (!images.includes(image)) {
		images.push(image);
		setCrosshairImages(images);
	}
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

export const setWindowState = (
	w: string,
	state: Partial<CrosshairWindowStateType>,
) => {
	store.set(`windows.${w}`, { ...getWindowState(w), ...state });
	if (state?.resizable !== undefined && windows.crosshairWindows[w]) {
		windows.crosshairWindows[w]?.setResizable(state.resizable);
	}

	// Handle per-window sizeMode change (compact/normal/large)
	if (state?.sizeMode && windows.crosshairWindows[w]) {
		const win = windows.crosshairWindows[w]!;
		const sizeConfig = SIZE_MODES[state.sizeMode] ?? SIZE_MODES.normal;
		win.setResizable(true);
		const [currentX, currentY] = win.getPosition();
		win.setBounds({
			x: currentX,
			y: currentY,
			width: sizeConfig.width,
			height: sizeConfig.height,
		});
		win.setMinimumSize(sizeConfig.width, sizeConfig.height);
		win.setResizable(false);
	}

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

	store.set(`actionState.${key}`, state); // todo: action state doesn't need to be stored
	forEachWindow((win) => {
		if (!win.isDestroyed()) {
			win.webContents.send(ipcChannels.ACTION_STATE, key, state);
		}
	});
};

export const resetStoreSettings = () => {
	Logger.status($messages.resetStoreSettings);

	store.delete('settings');
	store.delete('keybinds');
	store.delete('actionState');
	store.delete('appMessageLog');

	const wins = store.get('windows');
	store.set('windows', { settings: {} });
	Object.keys(wins).forEach((w: string) => {
		if (w !== 'settings') {
			setWindowState(w, DEFAULT_CROSSHAIR_WINDOW_STATE);
		}
	});

	// synchronizeApp(); // No need to sync, this is called during setWindowState
};

export const resetStore = () => {
	Logger.status($messages.resetStore);
	store.clear();

	synchronizeApp();
};

export default store;
