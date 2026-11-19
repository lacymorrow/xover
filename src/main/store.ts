import Logger from 'electron-log';
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
import {
	CONFIG_FILE_NAME,
	preserveUnreadableConfig,
	repairStoreFileOnDisk,
	resolveConfigFilePath,
} from './config-file';

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
const repair = repairStoreFileOnDisk();

// `clearInvalidConfig` lets conf discard a config.json it cannot parse and
// overwrite it on the first set(), keeping no copy of what the user had, so it
// is only safe once the file is known-good: the repair above either found
// nothing wrong ('none') or fixed it in place ('bom-stripped'). On 'quarantined'
// the bad file is already saved aside and gone from this path, and on 'failed'
// it may still be sitting there as the user's only copy (LAC-8624 item 2).
const configIsKnownGood =
	repair.action === 'none' || repair.action === 'bom-stripped';

const openStore = (clearInvalidConfig: boolean) =>
	new Store<StoreType>({ schema, clearInvalidConfig });

// The one failure conf will swallow if asked to, and the only one a retry can
// get past. Same check conf makes internally.
const isParseError = (error: unknown): boolean =>
	error instanceof Error && error.name === 'SyntaxError';

const openStoreWithRecovery = (): Store<StoreType> => {
	try {
		return openStore(configIsKnownGood);
	} catch (error) {
		// Throwing out of this module is the windowless process of LAC-8618, so a
		// parse error has to end in a working store. Keep a copy of the file
		// before the retry, because the retry is what lets conf overwrite it.
		if (!isParseError(error)) {
			throw error;
		}

		const backupPath = preserveUnreadableConfig(resolveConfigFilePath());

		Logger.error(
			`[config] electron-store could not parse ${CONFIG_FILE_NAME}: ${
				(error as Error).message
			}. ${
				backupPath ? `Kept a copy at ${backupPath}.` : 'Could not keep a copy.'
			} Starting from defaults.`,
		);

		return openStore(true);
	}
};

const store = openStoreWithRecovery();

export default store;
