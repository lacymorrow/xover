import { CustomAcceleratorsType } from '@/types/keyboard';
import Store from 'electron-store';
import {
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

export default store;
