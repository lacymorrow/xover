import Store from 'electron-store';
import { DEFAULT_LICENSE_STATUS, LicenseStatus } from '../config/license';
import { DEFAULT_PRESETS_STATE, PresetsStateType } from '../config/presets';
import {
	ActionStateType,
	CrosshairWindowStateType,
	DEFAULT_ACTION_STATE,
	DEFAULT_KEYBINDS,
	DEFAULT_SETTINGS,
	DEFAULT_WINDOW_STATE,
	SettingsType,
	WindowStateType,
} from '../config/settings';
import { CustomAcceleratorsType } from '../types/keyboard';
import { repairStoreFileOnDisk } from './config-file';

export interface MigrationsType {
	v3Imported?: boolean;
	v3ImportedAt?: number;
}

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
	license: LicenseStatus;
	presets: PresetsStateType; // saved setups; see src/main/presets.ts
	migrations: MigrationsType; // survives settings resets, so imports never re-run
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
			hideReticle: {
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
			cyclePreset: {
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
	migrations: {
		type: 'object',
		properties: {
			v3Imported: { type: 'boolean' },
			v3ImportedAt: { type: 'number' },
		},
		default: {},
	},
	presets: {
		type: 'object',
		properties: {
			items: { type: 'array' },
			activeId: { type: 'string' },
		},
		default: DEFAULT_PRESETS_STATE,
	},
	license: {
		type: 'object',
		properties: {
			isPremium: { type: 'boolean' },
			licenseKey: { type: 'string' },
			activationId: { type: 'string' },
			lastValidated: { type: 'number' },
		},
		default: DEFAULT_LICENSE_STATUS,
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
			hideFromScreenCapture: {
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
			relaunchOnX11: {
				type: 'boolean',
			},

			isLocked: {
				type: 'boolean',
			},
			isHidden: {
				type: 'boolean',
			},
			isReticleHidden: {
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
			hideOnMouseInvert: {
				type: 'boolean',
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

// electron-store reads and validates config.json inside its constructor, and
// this module is evaluated at import time, before the logger's error handler
// exists. A file it can't parse used to throw here and leave a running process
// with no window and no log line (LAC-8618), so repair the file first.
repairStoreFileOnDisk();

const store = new Store<StoreType>({
	schema,
	// Last resort if the repair above could not run: start from defaults rather
	// than throw out of this module. Only applies to a JSON parse error.
	clearInvalidConfig: true,
});

export default store;
