/**
 * @jest-environment node
 *
 * Reset and input-hook restarts both replace a pile of settings at once. These
 * pin the two ways that used to leave the app disagreeing with its own
 * settings screen (LAC-5187 review of #56).
 */
import {
	DEFAULT_ACTION_STATE,
	DEFAULT_KEYBINDS,
	DEFAULT_SETTINGS,
	SettingsType,
} from '../config/settings';

const registerKeyboardShortcuts = jest.fn();
const rebuildApplicationMenu = jest.fn();
const refreshMenu = jest.fn();
const syncContentProtection = jest.fn();
const resyncIOHook = jest.fn(() => Promise.resolve());
const startIOHook = jest.fn(() => Promise.resolve());

let isReady = true;
let storeData: Record<string, any> = {};

const storeDefaults: Record<string, any> = {
	settings: DEFAULT_SETTINGS,
	keybinds: DEFAULT_KEYBINDS,
	actionState: DEFAULT_ACTION_STATE,
	appMessageLog: [],
	windows: { settings: {} },
};

jest.mock('electron', () => ({
	app: {
		isReady: () => isReady,
		getVersion: () => '4.0.0',
		dock: { show: jest.fn(), hide: jest.fn() },
		setLoginItemSettings: jest.fn(),
	},
	screen: { getPrimaryDisplay: () => ({ bounds: { width: 0, height: 0 } }) },
}));

jest.mock('electron-log', () => ({
	status: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
}));

// electron-store resolves the real Electron binary when it loads, which a unit
// test has no business launching. This stand-in keeps the schema default
// behaviour that the reset path depends on: a deleted key reads back as its
// default, which is exactly why the settings screen looked right while the app
// behaved as though nothing had been reset.
jest.mock('electron-store', () =>
	jest.fn().mockImplementation(() => ({
		get: (key: string) =>
			key in storeData ? storeData[key] : storeDefaults[key],
		set: (key: string, value: unknown) => {
			storeData[key] = value;
		},
		delete: (key: string) => {
			delete storeData[key];
		},
		clear: () => {
			storeData = {};
		},
	})),
);

jest.mock('../main/utils/window-utils', () => ({
	forEachWindow: jest.fn(),
	syncContentProtection: (...args: unknown[]) => syncContentProtection(...args),
}));

jest.mock('../main/keyboard', () => ({
	__esModule: true,
	default: { registerKeyboardShortcuts },
}));

jest.mock('../main/menu', () => ({ rebuildApplicationMenu }));

jest.mock('../main/tray', () => ({
	__esModule: true,
	default: { refreshMenu },
}));

jest.mock('../main/iohook', () => ({ resyncIOHook, startIOHook }));

const settingsWith = (over: Partial<SettingsType>) => ({
	...DEFAULT_SETTINGS,
	...over,
});

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
	isReady = true;
	storeData = { windows: { settings: {} } };
});

describe('reset re-derives the state that lives outside the store', () => {
	// The bug: resetStoreSettings() deleted the settings and stopped there, so
	// the switch read false while only Lock and Reset were still registered, and
	// the capture toggle read off while every window stayed content-protected.
	it('re-registers shortcuts, rebuilds the menus and drops content protection', () => {
		storeData.settings = settingsWith({
			allowDisableKeyboardShortcuts: true,
			hideFromScreenCapture: true,
		});

		// eslint-disable-next-line global-require
		require('../main/store-actions').resetStoreSettings();

		expect(registerKeyboardShortcuts).toHaveBeenCalled();
		expect(rebuildApplicationMenu).toHaveBeenCalled();
		expect(refreshMenu).toHaveBeenCalled();
		expect(syncContentProtection).toHaveBeenCalledWith(false);
		expect(resyncIOHook).toHaveBeenCalled();
	});

	it('does the same on a full store reset', () => {
		storeData.settings = settingsWith({
			allowDisableKeyboardShortcuts: true,
			hideFromScreenCapture: true,
		});

		// eslint-disable-next-line global-require
		require('../main/store-actions').resetStore();

		expect(registerKeyboardShortcuts).toHaveBeenCalled();
		expect(syncContentProtection).toHaveBeenCalledWith(false);
	});

	// `crossover --reset` resets during startup, before the ready event. Nothing
	// is derived yet at that point and globalShortcut is not usable, so this must
	// stay a no-op: the synchronous version of this call is what crashed 3.4.x.
	it('stays out of the way before the app is ready', () => {
		isReady = false;
		storeData.settings = settingsWith({ hideFromScreenCapture: true });

		// eslint-disable-next-line global-require
		require('../main/store-actions').resetStore();

		expect(registerKeyboardShortcuts).not.toHaveBeenCalled();
		expect(rebuildApplicationMenu).not.toHaveBeenCalled();
		expect(syncContentProtection).not.toHaveBeenCalled();
	});
});
