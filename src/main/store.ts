import { CustomAcceleratorsType } from '@/types/keyboard';
import { app } from 'electron';
import Logger from 'electron-log/main';
import Store from 'electron-store';
import { APP_MESSAGES_MAX } from '../config/config';
import { ipcChannels } from '../config/ipc-channels';
import {
	DEFAULT_KEYBINDS,
	DEFAULT_SETTINGS,
	SettingsType,
} from '../config/settings';
import { $messages } from '../config/strings';
import tray from './tray';
import { forEachWindow } from './windows';

export type AppMessageType = string;

export type AppMessageLogType = AppMessageType[];

export interface StoreType {
	settings: SettingsType;
	appMessageLog: AppMessageLogType; // Public-facing console.log()
	keybinds: CustomAcceleratorsType; // Custom keybinds/accelerators/global shortcuts
	crosshairs: string[];
}

const schema: Store.Schema<StoreType> = {
	crosshairs: {
		type: 'array',
		default: [],
	},
	appMessageLog: {
		type: 'array',
		default: [],
	},
	keybinds: {
		type: 'object',
		properties: {
			quit: {
				type: 'string',
			},
			reset: {
				type: 'string',
			},
		},
		default: DEFAULT_KEYBINDS,
	},
	settings: {
		type: 'object',
		properties: {
			allowSounds: {
				type: 'boolean',
			},
			autoUpdate: {
				type: 'boolean',
			},
			allowNotifications: {
				type: 'boolean',
			},
			notifcationType: {
				type: 'string',
				enum: ['system', 'app', 'all'],
			},
			showDockIcon: {
				type: 'boolean',
			},
			showTrayIcon: {
				type: 'boolean',
			},
			startOnLogin: {
				type: 'boolean',
			},
			startLocked: {
				type: 'boolean',
			},
			quitOnWindowClose: {
				type: 'boolean',
			},
			theme: {
				type: 'string',
				enum: ['system', 'light', 'dark'],
			},
			hardwareAcceleration: {
				type: 'boolean',
			},
			browserGPU: {
				type: 'boolean',
			},
			backgroundColor: {
				type: 'string',
			},
			accentColor: {
				type: 'string',
			},
			locked: {
				type: 'boolean',
			},
			crosshair: {
				type: 'string',
			},
			crosshairSize: {
				type: 'number',
			},
			crosshairOpacity: {
				type: 'number',
			},
			reticleSize: {
				type: 'number',
			},
			reticleOpacity: {
				type: 'number',
			},
			reticleColor: {
				type: 'string',
			},
			fillColor: {
				type: 'string',
			},
			strokeColor: {
				type: 'string',
			},
			strokeWidth: {
				type: 'number',
			},
			followMouse: {
				type: 'boolean',
			},
			altActionEnabled: {
				type: 'boolean',
			},
			altCrosshair: {
				type: 'string',
			},
			altBehavior: {
				type: 'string',
				enum: ['toggle', 'hold'],
			},
			altSize: {
				type: 'number',
			},
			altOpacity: {
				type: 'number',
			},
			altInput: {
				type: 'string',
				enum: ['mouse', 'keyboard'],
			},
			altTrigger: {
				type: 'number',
			},
			hideActionEnabled: {
				type: 'boolean',
			},
			hideBehavior: {
				type: 'string',
				enum: ['toggle', 'hold'],
			},
			hideInput: {
				type: 'string',
				enum: ['mouse', 'keyboard'],
			},
			hideTrigger: {
				type: 'number',
			},
			tiltActionEnabled: {
				type: 'boolean',
			},
			tiltAngle: {
				type: 'number',
			},
			tiltBehavior: {
				type: 'string',
				enum: ['toggle', 'hold'],
			},
			currentlyHidden: {
				type: 'boolean',
			},
			currentTilt: {
				type: 'number',
			},
			resetOnAppStart: {
				type: 'boolean',
			},
		},
		default: DEFAULT_SETTINGS,
	},
};

const store = new Store<StoreType>({ schema });

const synchronizeMain = (settings: Partial<SettingsType>) => {
	const keys = Object.keys(settings);

	if (keys.includes('locked')) {
		// forEachWindow((win) => {
		// 	win.webContents.send(ipcChannels.APP_LOCKED, settings.locked);
		// });
	}

	if (keys.includes('showDockIcon')) {
		app.dock[settings.showDockIcon ? 'show' : 'hide']();
	}

	if (keys.includes('showTrayIcon')) {
		if (settings.showTrayIcon) {
			tray.initialize();
		} else {
			tray.destroy();
		}
	}

	if (keys.includes('startOnLogin')) {
		app.setLoginItemSettings({
			openAtLogin: settings.startOnLogin,
		});
	}
};

const synchronizeApp = () => {
	forEachWindow((win) => {
		win.webContents.send(ipcChannels.APP_UPDATED);
	});
};

export const resetStore = () => {
	Logger.status($messages.reset_store);
	store.clear();

	synchronizeApp();
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

	// Sync with main: side effects
	synchronizeMain(settings);

	// Sync with renderer
	synchronizeApp();
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

export const getCrosshairs = () => {
	return store.get('crosshairs');
};

export const setCrosshairs = (crosshairs: string[]) => {
	store.set('crosshairs', crosshairs);
};

export const clearCrosshairs = () => {
	store.reset('crosshairs');
};

export default store;
