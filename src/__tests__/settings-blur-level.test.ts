/**
 * @jest-environment node
 *
 * LAC-7148: what the blur handler on Settings is allowed to do, and what has to
 * put it back.
 *
 * Settings asks for `screen-saver` level 2 on focus, one above the crosshairs at
 * level 1, and drops to a normal window on blur so it does not float over other
 * apps (board review on xover#67). Measured on graphite, real focus loss via
 * Finder, from `CGWindowListCopyWindowInfo`:
 *
 *   focused   -> Settings layer 1002 over crosshair 1001
 *   blurred   -> Settings layer 0, crosshair 1001 draws over it
 *
 * The blurred row is a deliberate trade-off: the whole always-on-top band sits
 * above normal windows, so there is no level above the crosshairs but below the
 * game. It is only acceptable because two things hold, and this test is here so
 * they keep holding.
 *
 *   1. `settingsCloseOnBlur` defaults off, so a blurred Settings stays on screen
 *      rather than vanishing -- the user can see what to click.
 *   2. The focus handler re-asserts level 2, so clicking Settings undoes the
 *      drop. Delete that handler and the occlusion becomes permanent.
 */
import { DEFAULT_SETTINGS, SettingsType } from '../config/settings';

type Handler = (...args: unknown[]) => void;

const handlers: Record<string, Handler[]> = {};

let settings: SettingsType = { ...DEFAULT_SETTINGS };

const hide = jest.fn();
const setAlwaysOnTop = jest.fn();

const windowStub = () => ({
	setVisibleOnAllWorkspaces: jest.fn(),
	setAspectRatio: jest.fn(),
	setIgnoreMouseEvents: jest.fn(),
	setAlwaysOnTop,
	setContentProtection: jest.fn(),
	getBounds: jest.fn(() => ({ x: 0, y: 0, width: 720, height: 560 })),
	setBounds: jest.fn(),
	loadURL: jest.fn(),
	show: jest.fn(),
	hide,
	isDestroyed: jest.fn(() => false),
	on: jest.fn((event: string, handler: Handler) => {
		handlers[event] = handlers[event] ?? [];
		handlers[event].push(handler);
	}),
	removeListener: jest.fn(),
	webContents: {
		on: jest.fn(),
		setWindowOpenHandler: jest.fn(),
		send: jest.fn(),
	},
});

jest.mock('electron', () => ({
	app: { name: 'CrossOver', isPackaged: false },
	BrowserWindow: jest.fn(() => windowStub()),
	screen: {
		getPrimaryDisplay: () => ({ bounds: { width: 1920, height: 1080 } }),
	},
	shell: { openExternal: jest.fn() },
}));

jest.mock('electron-log', () => ({
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
	status: jest.fn(),
}));

jest.mock('../main/dock', () => ({
	__esModule: true,
	default: {
		setVisible: jest.fn(),
		initialize: jest.fn(),
		setBadge: jest.fn(),
	},
}));

jest.mock('../main/menu', () => ({
	__esModule: true,
	default: jest.fn().mockImplementation(() => ({ buildMenu: jest.fn() })),
}));

jest.mock('../main/context-menu', () => ({ setupContextMenu: jest.fn() }));
jest.mock('../main/crash-report', () => ({ wireRenderProcessGone: jest.fn() }));
jest.mock('../main/paths', () => ({ __resources: '/assets' }));
jest.mock('../main/utils/savePosition', () => ({ savePosition: jest.fn() }));
jest.mock('../main/utils/window-closed', () => ({ windowClosed: jest.fn() }));
jest.mock('../main/utils/window-utils', () => ({
	applyContentProtection: jest.fn(),
	getNextCrosshairWindow: jest.fn(() => null),
	placeSettingsWindow: jest.fn(),
	safeSetBounds: jest.fn(),
}));

jest.mock('../main/store-actions', () => ({
	getSetting: (key: keyof SettingsType) => settings[key],
	getSettings: () => settings,
	setSettings: jest.fn(),
	getWindowState: jest.fn(() => ({})),
	getWindowStates: jest.fn(() => ({})),
	setWindowState: jest.fn(),
	deleteWindowState: jest.fn(),
	getActiveWindowState: jest.fn(() => ({})),
	setActiveWindow: jest.fn(),
}));

beforeEach(() => {
	Object.keys(handlers).forEach((event) => delete handlers[event]);
	settings = { ...DEFAULT_SETTINGS };
	jest.clearAllMocks();
});

const openSettings = async () => {
	// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
	const { createSettingsWindow } = require('../main/create-window');
	await createSettingsWindow();
};

/** Fire every handler registered for an event, as Electron would. */
const emit = (event: string) => {
	(handlers[event] ?? []).forEach((handler) => handler());
};

// Only the always-on-top calls, in order, as [enabled, level, relativeLevel].
const levelCalls = () => setAlwaysOnTop.mock.calls;

it('leaves a blurred Settings on screen by default', async () => {
	// Premise of the whole trade-off. If this default ever flips, the occlusion
	// stops mattering -- and so does the reasoning in the blur handler.
	expect(DEFAULT_SETTINGS.settingsCloseOnBlur).toBe(false);

	await openSettings();
	emit('blur');

	expect(hide).not.toHaveBeenCalled();
});

it('drops a blurred Settings out of the always-on-top band', async () => {
	await openSettings();
	setAlwaysOnTop.mockClear();
	emit('blur');

	expect(levelCalls()).toEqual([[false]]);
});

it('puts Settings back above the crosshairs when it regains focus', async () => {
	// The recovery the blur comment promises: one click on Settings is enough.
	// Without this, a crosshair that ends up over Settings stays there.
	await openSettings();
	emit('blur');
	setAlwaysOnTop.mockClear();
	emit('focus');

	expect(levelCalls()).toEqual([[true, 'screen-saver', 2]]);
});

it('still hides Settings on blur when the user asked it to', async () => {
	settings = { ...DEFAULT_SETTINGS, settingsCloseOnBlur: true };

	await openSettings();
	emit('blur');

	expect(hide).toHaveBeenCalled();
});
