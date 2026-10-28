/**
 * @jest-environment node
 *
 * The v3 actions fixes, ported to v4 (LAC-5972):
 *
 * - v3 #542: Follow Mouse froze while a mouse button was held.
 * - v3 #573: the keyboard hide bind was hold-only, even though the settings
 *   panel already offered a toggle, and had no "until the next ADS click" mode.
 * - v3 #563 / #559: hide, ADS resize and tilt reached only the main crosshair.
 */
import { uiohookKeycodes } from '../config/keys';
import { DEFAULT_SETTINGS, SettingsType } from '../config/settings';

// Module scope, so the listener registry survives the jest.resetModules() that
// gives each test a fresh copy of the hook.
const on = jest.fn();
const setBounds = jest.fn();

let settings: SettingsType = { ...DEFAULT_SETTINGS };
let actionState: Record<string, any> = {};

jest.mock('uiohook-napi', () => ({
	uIOhook: {
		on: (event: string, listener: unknown) => on(event, listener),
		start: jest.fn(),
		stop: jest.fn(),
		removeAllListeners: jest.fn(),
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
			getBounds: () => ({ x: 0, y: 0, width: 20, height: 20 }),
			setBounds: (...args: unknown[]) => setBounds(...args),
		},
	},
}));

jest.mock('../main/store-actions', () => ({
	getSettings: () => settings,
	getActionState: () => actionState,
	setActionStateKey: (key: string, value: unknown) => {
		actionState[key] = value;
	},
}));

/** Replay an event into every listener the hook registered for it. */
const emit = (event: string, payload: Record<string, unknown>) => {
	on.mock.calls
		.filter(([registered]) => registered === event)
		.forEach(([, listener]) => listener(payload));
};

const startWith = async (over: Partial<SettingsType>) => {
	settings = { ...DEFAULT_SETTINGS, isLocked: true, ...over };

	// eslint-disable-next-line global-require
	const iohook = require('../main/iohook');
	await iohook.startIOHook();

	return iohook;
};

const ALT = uiohookKeycodes.Alt;
const RIGHT_MOUSE_BUTTON = 2;

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
	settings = { ...DEFAULT_SETTINGS, isLocked: true };
	actionState = { secondary: false, hidden: false, adsActive: false, tilt: 0 };
});

// v3 #542 / #541. uiohook-napi maps libuiohook event types 4-9 and 11 to named
// events and has no case for EVENT_MOUSE_DRAGGED (10), so 'mousemove' goes
// silent the moment a button is held.
describe('follow mouse while a button is held (v3 #542)', () => {
	it('moves the crosshair on a plain mousemove', async () => {
		await startWith({ followMouseEnabled: true });

		emit('mousemove', { x: 100, y: 200 });

		expect(setBounds).toHaveBeenCalledWith({ x: 90, y: 190 });
	});

	it('moves the crosshair on a drag, which never reaches mousemove', async () => {
		await startWith({ followMouseEnabled: true });

		emit('input', { type: 10, x: 300, y: 400 });

		expect(setBounds).toHaveBeenCalledWith({ x: 290, y: 390 });
	});

	it('ignores every other raw input event', async () => {
		await startWith({ followMouseEnabled: true });

		emit('input', { type: 4, keycode: ALT });
		emit('input', { type: 11, x: 1, y: 1 });

		expect(setBounds).not.toHaveBeenCalled();
	});
});

// v3 #573 / #340. The panel has offered "Press to toggle" since v4 shipped, but
// registerHideOnKey never read the setting: a keyboard bind was always hold.
describe('keyboard hide bind behaviors (v3 #573)', () => {
	const keyBind = { hideOnKeyEnabled: true, hideOnKeyBind: 'keyboard:Alt' };

	it('holds by default: down hides, up shows', async () => {
		await startWith({ ...keyBind, hideOnMouseBehavior: 'hold' });

		emit('keydown', { keycode: ALT });
		expect(actionState.hidden).toBe(true);

		emit('keyup', { keycode: ALT });
		expect(actionState.hidden).toBe(false);
	});

	it('toggles on press and stays hidden through the release', async () => {
		await startWith({ ...keyBind, hideOnMouseBehavior: 'toggle' });

		emit('keydown', { keycode: ALT });
		emit('keyup', { keycode: ALT });
		expect(actionState.hidden).toBe(true);

		emit('keydown', { keycode: ALT });
		emit('keyup', { keycode: ALT });
		expect(actionState.hidden).toBe(false);
	});

	// The OS repeats keydown for as long as a key is held. Without a latch a
	// toggle flips once per repeat and lands wherever the repeat count left it.
	it('toggles once per press, not once per auto-repeat', async () => {
		await startWith({ ...keyBind, hideOnMouseBehavior: 'toggle' });

		emit('keydown', { keycode: ALT });
		emit('keydown', { keycode: ALT });
		emit('keydown', { keycode: ALT });

		expect(actionState.hidden).toBe(true);
	});

	// ...and the release has to re-arm it, or the bind works exactly once.
	it('re-arms on release so the next press still fires', async () => {
		await startWith({ ...keyBind, hideOnMouseBehavior: 'toggle' });

		emit('keydown', { keycode: ALT });
		emit('keyup', { keycode: ALT });
		emit('keydown', { keycode: ALT });

		expect(actionState.hidden).toBe(false);
	});

	it('ignores other keys', async () => {
		await startWith({ ...keyBind, hideOnMouseBehavior: 'toggle' });

		emit('keydown', { keycode: uiohookKeycodes.B });

		expect(actionState.hidden).toBe(false);
	});

	describe('press mode: hide until the next ADS click', () => {
		it('hides on the key and shows again on the ADS button', async () => {
			await startWith({
				...keyBind,
				hideOnMouseBehavior: 'press',
				hideOnMouseButton: RIGHT_MOUSE_BUTTON,
			});

			emit('keydown', { keycode: ALT });
			emit('keyup', { keycode: ALT });
			expect(actionState.hidden).toBe(true);

			emit('mousedown', { button: RIGHT_MOUSE_BUTTON });
			expect(actionState.hidden).toBe(false);
		});

		it('watches the bound ADS button, not just the right one', async () => {
			await startWith({
				...keyBind,
				hideOnMouseBehavior: 'press',
				hideOnMouseButton: 3,
			});

			emit('keydown', { keycode: ALT });
			emit('mousedown', { button: RIGHT_MOUSE_BUTTON });
			expect(actionState.hidden).toBe(true);

			emit('mousedown', { button: 3 });
			expect(actionState.hidden).toBe(false);
		});

		it('leaves a visible crosshair alone when the ADS button is clicked', async () => {
			await startWith({
				...keyBind,
				hideOnMouseBehavior: 'press',
				hideOnMouseButton: RIGHT_MOUSE_BUTTON,
			});

			emit('mousedown', { button: RIGHT_MOUSE_BUTTON });

			expect(actionState.hidden).toBe(false);
		});
	});

	// Invert makes the bind reveal the crosshair instead of hiding it.
	it('reveals instead of hides when inverted', async () => {
		await startWith({
			...keyBind,
			hideOnMouseBehavior: 'hold',
			hideOnMouseInvert: true,
		});

		expect(actionState.hidden).toBe(true);

		emit('keydown', { keycode: ALT });
		expect(actionState.hidden).toBe(false);

		emit('keyup', { keycode: ALT });
		expect(actionState.hidden).toBe(true);
	});

	// A mouse hide bind has no "until the next ADS click" option in the panel,
	// and a stored one must not leave the bind doing nothing.
	it('falls back to hold for a mouse bind set to press', async () => {
		await startWith({
			hideOnMouseEnabled: true,
			hideOnMouseButton: 1,
			hideOnMouseBehavior: 'press',
		});

		emit('mousedown', { button: 1 });
		expect(actionState.hidden).toBe(true);

		emit('mouseup', { button: 1 });
		expect(actionState.hidden).toBe(false);
	});
});
