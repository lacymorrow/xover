/**
 * @jest-environment node
 *
 * The Center Crosshair shortcut centered whatever window had focus, which was
 * the settings window whenever it was open (LAC-5839 item 4).
 */
import { DEFAULT_KEYBINDS, DEFAULT_SETTINGS } from '../config/settings';

const crosshairWindow = { id: 2, isDestroyed: () => false };
const settingsWindow = { id: 1, isDestroyed: () => false };

const centerWindow = jest.fn();
const activeCrosshairWindow = jest.fn(() => crosshairWindow);
const activeWindow = jest.fn(() => settingsWindow);

const storeDefaults: Record<string, any> = {
	settings: DEFAULT_SETTINGS,
	keybinds: DEFAULT_KEYBINDS,
};

jest.mock('electron', () => ({
	app: { quit: jest.fn() },
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
		get: (key: string) => storeDefaults[key],
		set: jest.fn(),
		delete: jest.fn(),
	})),
);

jest.mock('../main/utils/window-utils', () => ({
	activeWindow: () => activeWindow(),
	activeCrosshairWindow: () => activeCrosshairWindow(),
	centerWindow: (...args: unknown[]) => centerWindow(...args),
	focusNextWindow: jest.fn(),
	moveToNextDisplay: jest.fn(),
	moveWindow: jest.fn(),
	forEachWindow: jest.fn(),
	forEachCrosshairWindow: jest.fn(),
	syncContentProtection: jest.fn(),
}));

jest.mock('../main/create-window', () => ({
	createNewWindow: jest.fn(),
	createDuplicateWindow: jest.fn(),
}));
jest.mock('../main/notifications', () => ({ notification: jest.fn() }));
jest.mock('../main/reset', () => ({ resetSettings: jest.fn() }));
jest.mock('../main/utils/hideApp', () => ({ toggleAppHide: jest.fn() }));
jest.mock('../main/utils/lockApp', () => ({ toggleAppLock: jest.fn() }));

const actionFn = (action: string) => {
	// eslint-disable-next-line global-require
	const { keyboardShortcuts } = require('../main/keyboard');
	const shortcut = keyboardShortcuts.find((s: any) => s.action === action);
	expect(shortcut).toBeDefined();
	return shortcut.fn;
};

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
});

describe('the center shortcut', () => {
	it('centers the active crosshair window, not the focused one', () => {
		actionFn('center')();

		expect(activeCrosshairWindow).toHaveBeenCalled();
		expect(activeWindow).not.toHaveBeenCalled();
		expect(centerWindow).toHaveBeenCalledWith({
			window: crosshairWindow,
			animated: true,
		});
	});

	it('does nothing when there is no crosshair window', () => {
		activeCrosshairWindow.mockReturnValueOnce(undefined as any);

		actionFn('center')();

		expect(centerWindow).not.toHaveBeenCalled();
	});
});
