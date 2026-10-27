/**
 * @jest-environment node
 *
 * A keybind added in a later version is missing from every store written by an
 * earlier one, and setKeybind used to validate the action against the keys the
 * store already had. Binding Toggle Reticle looked like it worked and was gone
 * as soon as the pane re-read state (LAC-5839 item 1).
 */
import { DEFAULT_KEYBINDS, DEFAULT_SETTINGS } from '../config/settings';

let storeData: Record<string, any> = {};

const storeDefaults: Record<string, any> = {
	settings: DEFAULT_SETTINGS,
	keybinds: DEFAULT_KEYBINDS,
	windows: { settings: {} },
	appMessageLog: [],
};

jest.mock('electron', () => ({
	app: { isReady: () => true, getVersion: () => '4.0.0', quit: jest.fn() },
	screen: { getPrimaryDisplay: () => ({ bounds: { width: 0, height: 0 } }) },
	globalShortcut: {
		register: jest.fn(() => true),
		registerAll: jest.fn(),
		isRegistered: jest.fn(() => false),
		unregister: jest.fn(),
		unregisterAll: jest.fn(),
	},
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

jest.mock('../main/utils/window-utils', () => ({
	forEachWindow: jest.fn(),
	forEachCrosshairWindow: jest.fn(),
	syncContentProtection: jest.fn(),
	activeCrosshairWindow: jest.fn(),
	centerWindow: jest.fn(),
	focusNextWindow: jest.fn(),
	moveToNextDisplay: jest.fn(),
	moveWindow: jest.fn(),
}));

jest.mock('../main/create-window', () => ({
	createNewWindow: jest.fn(),
	createDuplicateWindow: jest.fn(),
}));
jest.mock('../main/notifications', () => ({ notification: jest.fn() }));
jest.mock('../main/reset', () => ({ resetSettings: jest.fn() }));
jest.mock('../main/utils/hideApp', () => ({ toggleAppHide: jest.fn() }));
jest.mock('../main/utils/lockApp', () => ({ toggleAppLock: jest.fn() }));
jest.mock('../main/menu', () => ({ rebuildApplicationMenu: jest.fn() }));
jest.mock('../main/tray', () => ({
	__esModule: true,
	default: { refreshMenu: jest.fn() },
}));
jest.mock('../main/iohook', () => ({
	resyncIOHook: jest.fn(() => Promise.resolve()),
	startIOHook: jest.fn(() => Promise.resolve()),
}));

// A store written by 4.0.0-beta.4: every keybind that shipped back then, and
// nothing that shipped after it.
const beta4Keybinds = () => {
	const keybinds: Record<string, string> = { ...DEFAULT_KEYBINDS } as any;
	delete keybinds.hideReticle;
	return keybinds;
};

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
	storeData = { windows: { settings: {} } };
});

describe('keybinds missing from an older store', () => {
	it('backfills the defaults and persists them', () => {
		storeData.keybinds = beta4Keybinds();

		// eslint-disable-next-line global-require
		const { getKeybinds } = require('../main/store-actions');

		expect(getKeybinds().hideReticle).toBe(DEFAULT_KEYBINDS.hideReticle);
		expect(storeData.keybinds.hideReticle).toBe(DEFAULT_KEYBINDS.hideReticle);
	});

	it('keeps the user’s own binds, including ones they cleared', () => {
		storeData.keybinds = { ...beta4Keybinds(), center: 'F8', quit: '' };

		// eslint-disable-next-line global-require
		const { getKeybinds } = require('../main/store-actions');
		const keybinds = getKeybinds();

		expect(keybinds.center).toBe('F8');
		expect(keybinds.quit).toBe('');
	});

	it('does not rewrite a store that already has every action', () => {
		storeData.keybinds = { ...DEFAULT_KEYBINDS };
		const before = storeData.keybinds;

		// eslint-disable-next-line global-require
		require('../main/store-actions').getKeybinds();

		expect(storeData.keybinds).toBe(before);
	});
});

describe('setKeybind', () => {
	// The bug: `if (!(keybind in keybinds)) return` against the stored object.
	it('persists an action the store has never heard of', () => {
		storeData.keybinds = beta4Keybinds();

		// eslint-disable-next-line global-require
		const kb = require('../main/keyboard').default;
		kb.setKeybind('hideReticle', 'Control+Alt+Shift+S');

		expect(storeData.keybinds.hideReticle).toBe('Control+Alt+Shift+S');
	});

	it('clears an allowUnbind action', () => {
		storeData.keybinds = { ...DEFAULT_KEYBINDS };

		// eslint-disable-next-line global-require
		const kb = require('../main/keyboard').default;
		kb.setKeybind('hideReticle', '');

		expect(storeData.keybinds.hideReticle).toBe('');
	});

	it('refuses to clear a keybind that may not be unbound', () => {
		storeData.keybinds = { ...DEFAULT_KEYBINDS };

		// eslint-disable-next-line global-require
		const kb = require('../main/keyboard').default;
		kb.setKeybind('moveUp', '');

		expect(storeData.keybinds.moveUp).toBe(DEFAULT_KEYBINDS.moveUp);
	});

	it('ignores an action that is not a keybind at all', () => {
		storeData.keybinds = { ...DEFAULT_KEYBINDS };

		// eslint-disable-next-line global-require
		const kb = require('../main/keyboard').default;
		kb.setKeybind('notAnAction' as any, 'F9');

		expect(storeData.keybinds.notAnAction).toBeUndefined();
	});
});
