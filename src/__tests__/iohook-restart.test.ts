/**
 * @jest-environment node
 *
 * The input hook restarts in place whenever a bind changes while the app is
 * locked. These pin the state it has to leave behind (LAC-5187 review of #56).
 */
import { DEFAULT_SETTINGS, SettingsType } from '../config/settings';

const setActionStateKey = jest.fn();
const stop = jest.fn();
const start = jest.fn();
const removeAllListeners = jest.fn();

let settings: SettingsType = { ...DEFAULT_SETTINGS };
let actionState: Record<string, any> = {};

jest.mock('uiohook-napi', () => ({
	uIOhook: {
		on: jest.fn(),
		start: () => start(),
		stop: () => stop(),
		removeAllListeners: () => removeAllListeners(),
	},
}));

jest.mock('electron-log', () => ({
	status: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
}));

jest.mock('../main/license', () => ({ isPremium: () => true }));

jest.mock('../main/windows', () => ({
	__esModule: true,
	default: {
		mainWindow: {
			isDestroyed: () => false,
			getBounds: () => ({ x: 0, y: 0, width: 10, height: 10 }),
			setBounds: jest.fn(),
		},
	},
}));

jest.mock('../main/store-actions', () => ({
	getSettings: () => settings,
	getActionState: () => actionState,
	setActionStateKey: (key: string, value: unknown) => {
		actionState[key] = value;
		setActionStateKey(key, value);
	},
}));

const stateSetTo = (key: string, value: unknown) =>
	setActionStateKey.mock.calls.some(
		([callKey, callValue]) => callKey === key && callValue === value,
	);

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
	settings = { ...DEFAULT_SETTINGS, isLocked: true };
	actionState = { secondary: false, hidden: false, adsActive: false, tilt: 0 };
});

describe('input hook restart', () => {
	// The bug: with invert on, the hook seeds `hidden: true`. Turning Auto-Hide
	// off while locked restarted the hook, which took the `needsHook` early
	// return and left `hidden: true` behind. The crosshair stayed invisible
	// until the next unlock, with no setting on screen that explained it.
	it('clears seeded hidden state when the last hook setting goes off', async () => {
		settings = {
			...settings,
			hideOnMouseEnabled: true,
			hideOnMouseBehavior: 'hold',
			hideOnMouseInvert: true,
		};

		// eslint-disable-next-line global-require
		const iohook = require('../main/iohook');

		await iohook.startIOHook();
		expect(stateSetTo('hidden', true)).toBe(true);
		expect(start).toHaveBeenCalled();

		setActionStateKey.mockClear();
		settings = { ...settings, hideOnMouseEnabled: false };

		await iohook.startIOHook();

		expect(stop).toHaveBeenCalled();
		expect(removeAllListeners).toHaveBeenCalled();
		expect(stateSetTo('hidden', false)).toBe(true);
		expect(actionState.hidden).toBe(false);
	});

	// Same hole from the other side: a hold bind down across a restart loses its
	// keyup, so every action state the old listeners owned has to be released.
	it('releases every action state the old listeners owned', async () => {
		settings = {
			...settings,
			hideOnMouseEnabled: true,
			adsResizeEnabled: true,
			tiltActionEnabled: true,
			tiltLeftBind: 'keyboard:Q',
		};

		// eslint-disable-next-line global-require
		const iohook = require('../main/iohook');

		await iohook.startIOHook();

		// Mid-hold when the restart lands
		actionState = { secondary: true, hidden: true, adsActive: true, tilt: 15 };
		setActionStateKey.mockClear();

		await iohook.startIOHook();

		expect(actionState).toEqual({
			secondary: false,
			hidden: false,
			adsActive: false,
			tilt: 0,
		});
	});

	it('still clears state when the hook is stopped outright', async () => {
		settings = { ...settings, hideOnMouseEnabled: true };

		// eslint-disable-next-line global-require
		const iohook = require('../main/iohook');

		await iohook.startIOHook();
		actionState = { secondary: true, hidden: true, adsActive: true, tilt: 15 };

		await iohook.stopIOHook();

		expect(actionState).toEqual({
			secondary: false,
			hidden: false,
			adsActive: false,
			tilt: 0,
		});
	});
});

// A reset replaces every setting at once, so it cannot say what the hook should
// now be doing. resyncIOHook reads that off the store instead.
describe('resyncIOHook', () => {
	it('restarts the hook when the app is locked', async () => {
		settings = { ...settings, isLocked: true, hideOnMouseEnabled: true };

		// eslint-disable-next-line global-require
		const iohook = require('../main/iohook');
		await iohook.resyncIOHook();

		expect(start).toHaveBeenCalled();
	});

	it('stops a running hook when the app is not locked', async () => {
		settings = { ...settings, isLocked: true, hideOnMouseEnabled: true };

		// eslint-disable-next-line global-require
		const iohook = require('../main/iohook');
		await iohook.startIOHook();

		settings = { ...settings, isLocked: false };
		actionState = { secondary: true, hidden: true, adsActive: true, tilt: 15 };

		await iohook.resyncIOHook();

		expect(stop).toHaveBeenCalled();
		expect(actionState.hidden).toBe(false);
	});

	// uIOhook.stop() on a hook that was never started is not something to hand
	// to the native module just to clear four booleans.
	it('clears state without touching a hook that never started', async () => {
		settings = { ...settings, isLocked: false };
		actionState = { secondary: true, hidden: true, adsActive: true, tilt: 15 };

		// eslint-disable-next-line global-require
		const iohook = require('../main/iohook');
		await iohook.resyncIOHook();

		expect(stop).not.toHaveBeenCalled();
		expect(actionState.hidden).toBe(false);
	});
});
