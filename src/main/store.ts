import { CustomAcceleratorsType } from '@/types/keyboard';
import Store from 'electron-store';
import {
	ActionStateType,
	DEFAULT_ACTION_STATE,
	DEFAULT_KEYBINDS,
	DEFAULT_SETTINGS,
	SettingsType,
} from '../config/settings';

export type AppMessageType = string;

export type AppMessageLogType = AppMessageType[];

export interface StoreType {
	settings: SettingsType;
	appMessageLog: AppMessageLogType; // Public-facing console.log()
	keybinds: CustomAcceleratorsType; // Custom keybinds/accelerators/global shortcuts
	images: string[];
	windows: any[];
	actionState: ActionStateType;
}

const schema: Store.Schema<StoreType> = {
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
		type: 'array',
		default: [],
		items: {
			type: 'object',
		},
	},
	images: {
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
			allowAnalytics: {
				type: 'boolean',
			},
			allowAutoUpdate: {
				type: 'boolean',
			},
			allowSounds: {
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

			backgroundColor: {
				type: 'string',
			},
			foregroundColor: {
				type: 'string',
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
			crosshairRotation: {
				type: 'number',
			},
			reticle: {
				type: 'string',
			},
			reticleSize: {
				type: 'number',
			},
			reticleRotation: {
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
			transitionDuration: {
				type: 'number',
			},
		},
		default: DEFAULT_SETTINGS,
	},
};

const store = new Store<StoreType>({ schema });

export default store;
