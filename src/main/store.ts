import Logger from 'electron-log/main';
import Store from 'electron-store';
import { APP_MESSAGES_MAX } from '../config/config';
import { ipcChannels } from '../config/ipc-channels';
import { DEFAULT_SETTINGS, SettingsType } from '../config/settings';
import { $messages } from '../config/strings';
import { forEachWindow } from './windows';

export type AppMessageType = string;

export type AppMessageLogType = AppMessageType[];

export interface StoreType {
	settings: SettingsType;

	appMessageLog: AppMessageLogType;
}

const schema: Store.Schema<StoreType> = {
	appMessageLog: {
		type: 'array',
		default: [],
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
				enum: ['system', 'default', 'all'],
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
			alt: {
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
			hide: {
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
			tilt: {
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

export default store;
