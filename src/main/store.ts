import Store from 'electron-store';
import {
	ActionStateType,
	CrosshairWindowStateType,
	DEFAULT_ACTION_STATE,
	DEFAULT_KEYBINDS,
	DEFAULT_SETTINGS,
	DEFAULT_WINDOW_STATE,
	SettingsType,
	WindowStateType
} from '../config/settings';
import { CustomAcceleratorsType } from '../types/keyboard';

export type AppMessageType = string;

export type AppMessageLogType = AppMessageType[];

export interface StoreType {
	settings: SettingsType;
	appMessageLog: AppMessageLogType; // Public-facing console.log()
	keybinds: CustomAcceleratorsType; // Custom keybinds/accelerators/global shortcuts
	images: string[];
	windows: {
		settings: WindowStateType;
		[key: string]: Partial<CrosshairWindowStateType>;
	};
	activeWindow: string;
	actionState: ActionStateType;
}

export type WindowNamesType = 'settings' | 'crosshairs';

const schema: Store.Schema<StoreType> = {
	keybinds: {
		type: 'object',
		properties: {
			lock: {
				type: 'string',
			},
			quit: {
				type: 'string',
			},
			reset: {
				type: 'string',
			},
			hide: {
				type: 'string',
			},
			center: {
				type: 'string',
			},
			newWindow: {
				type: 'string',
			},
			duplicateWindow: {
				type: 'string',
			},
			changeDisplay: {
				type: 'string',
			},
			focusNextWindow: {
				type: 'string',
			},
			moveUp: {
				type: 'string',
			},
			moveDown: {
				type: 'string',
			},
			moveLeft: {
				type: 'string',
			},
			moveRight: {
				type: 'string',
			},
		},
		default: DEFAULT_KEYBINDS,
	},
	activeWindow: {
		type: 'string',
		default: '',
	},
	actionState: {
		type: 'object',
		default: DEFAULT_ACTION_STATE,
		properties: {
			currentTilt: {
				type: 'number',
			},
		},
	},
	windows: {
		type: 'object',
		properties: {
			settings: {
				type: 'object',
			},
		},
		default: DEFAULT_WINDOW_STATE,
	},
	images: {
		type: 'array',
		default: [],
	},
	appMessageLog: {
		type: 'array',
		default: [],
	},
	settings: {
		type: 'object',
		properties: {
			appVersion: {
				type: 'string',
			},
			allowAnalytics: {
				type: 'boolean',
			},
			allowAutoUpdate: {
				type: 'boolean',
			},
			allowDisableKeyboardShortcuts: {
				type: 'boolean',
			},
			allowSounds: {
				type: 'boolean',
			},
			allowNotifications: {
				type: 'boolean',
			},
			notificationType: {
				type: 'string',
				enum: ['system', 'app', 'all'],
			},
			showDockIcon: {
				type: 'boolean',
			},
			showTaskbarIcon: {
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

			commandLineFlags: {
				type: 'array',
				default: [],
			},
			hardwareAcceleration: {
				type: 'boolean',
			},

			isLocked: {
				type: 'boolean',
			},
			isHidden: {
				type: 'boolean',
			},
			isSettingsWindowOpen: {
				type: 'boolean',
			},
			currentTilt: {
				type: 'number',
			},
			resetOnAppStart: {
				type: 'boolean',
			},
			hadFirstRun: {
				type: 'boolean',
			},

			// iohook
			followMouseEnabled: {
				type: 'boolean',
			},
			secondaryActionEnabled: {
				type: 'boolean',
			},
			secondaryBind: {
				type: 'string',
			},
			secondaryBehavior: {
				type: 'string',
				enum: ['toggle', 'hold'],
			},
			hideOnMouseEnabled: {
				type: 'boolean',
			},
			hideOnMouseButton: {
				type: 'number',
			},
			hideOnMouseBehavior: {
				type: 'string',
				enum: ['toggle', 'hold'],
			},
			hideOnKeyEnabled: {
				type: 'boolean',
			},
			hideOnKeyBind: {
				type: 'string',
			},
			adsResizeEnabled: {
				type: 'boolean',
			},
			adsResizeButton: {
				type: 'number',
			},
			adsResizeBehavior: {
				type: 'string',
				enum: ['toggle', 'hold'],
			},
			adsResizeSize: {
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
			tiltLeftBind: {
				type: 'string',
			},
			tiltRightBind: {
				type: 'string',
			},
			transitionDuration: {
				type: 'number',
			},
		},
		default: DEFAULT_SETTINGS,
	},
};

const store = new Store<StoreType>({ schema });

export default store;
