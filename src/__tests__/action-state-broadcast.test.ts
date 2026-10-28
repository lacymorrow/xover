/**
 * @jest-environment node
 *
 * v3 #563 and #559 both came down to one thing: hide, ADS resize and tilt
 * wrote the crosshair CSS variables to the main window and nothing else, so
 * duplicate crosshairs ignored them.
 *
 * v4 cannot have that bug by construction: the hook sets a key on the shared
 * action state, and `setActionStateKey` pushes it to every window. These pin
 * that, because it is the whole of the v4 answer to both reports.
 */
import { ipcChannels } from '../config/ipc-channels';
import {
	DEFAULT_ACTION_STATE,
	DEFAULT_KEYBINDS,
	DEFAULT_SETTINGS,
} from '../config/settings';

const sent: Array<{ window: string; channel: string; args: unknown[] }> = [];

let storeData: Record<string, any> = {};

const storeDefaults: Record<string, any> = {
	settings: DEFAULT_SETTINGS,
	keybinds: DEFAULT_KEYBINDS,
	actionState: DEFAULT_ACTION_STATE,
	appMessageLog: [],
	windows: { settings: {} },
};

/** The main crosshair, two duplicates, and the settings window. */
const windowNames = ['main', 'duplicate-1', 'duplicate-2', 'settings'];

const fakeWindow = (name: string, destroyed = false) => ({
	isDestroyed: () => destroyed,
	webContents: {
		send: (channel: string, ...args: unknown[]) =>
			sent.push({ window: name, channel, args }),
	},
});

let openWindows: ReturnType<typeof fakeWindow>[] = [];

jest.mock('electron', () => ({
	app: {
		isReady: () => true,
		getVersion: () => '4.0.0',
		dock: { show: jest.fn(), hide: jest.fn() },
		setLoginItemSettings: jest.fn(),
	},
	screen: { getPrimaryDisplay: () => ({ bounds: { width: 0, height: 0 } }) },
	BrowserWindow: { getAllWindows: () => openWindows },
}));

jest.mock('electron-log', () => ({
	status: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
}));

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

jest.mock('../main/keyboard', () => ({
	__esModule: true,
	default: { registerKeyboardShortcuts: jest.fn() },
}));

jest.mock('../main/menu', () => ({ rebuildApplicationMenu: jest.fn() }));

jest.mock('../main/tray', () => ({
	__esModule: true,
	default: { refreshMenu: jest.fn() },
}));

jest.mock('../main/iohook', () => ({
	resyncIOHook: jest.fn(() => Promise.resolve()),
	startIOHook: jest.fn(() => Promise.resolve()),
}));

const windowsThatGot = (key: string) =>
	sent
		.filter(
			({ channel, args }) =>
				channel === ipcChannels.ACTION_STATE && args[0] === key,
		)
		.map(({ window }) => window);

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
	storeData = { windows: { settings: {} } };
	sent.length = 0;
	openWindows = windowNames.map((name) => fakeWindow(name));
});

describe('action state reaches every crosshair (v3 #563, #559)', () => {
	it.each([
		['hidden', true],
		['adsActive', true],
		['tilt', 15],
	])('broadcasts %s to all of them', (key, value) => {
		// eslint-disable-next-line global-require
		require('../main/store-actions').setActionStateKey(key, value);

		expect(windowsThatGot(key)).toEqual(windowNames);
	});

	it('carries the value, not just the key', () => {
		// eslint-disable-next-line global-require
		require('../main/store-actions').setActionStateKey('tilt', -25);

		const tilts = sent.filter(({ args }) => args[0] === 'tilt');

		expect(tilts).toHaveLength(windowNames.length);
		tilts.forEach(({ args }) => expect(args[1]).toBe(-25));
	});

	it('skips a window that has already gone away', () => {
		openWindows = [fakeWindow('alive'), fakeWindow('dead', true)];

		// eslint-disable-next-line global-require
		require('../main/store-actions').setActionStateKey('hidden', true);

		expect(windowsThatGot('hidden')).toEqual(['alive']);
	});
});
