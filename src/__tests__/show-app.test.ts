/**
 * @jest-environment node
 *
 * Show App, a second launch and the Settings shortcut all have to lift the lock
 * first. A locked app refuses to open Settings, so they did nothing at all and
 * the only way back was the Lock keybind (LAC-5839 item 6).
 */
import { DEFAULT_SETTINGS, SettingsType } from '../config/settings';

const toggleAppLock = jest.fn();
const toggleAppHide = jest.fn();
const setSettings = jest.fn();
const focusNextWindow = jest.fn();
const createCrosshairWindow = jest.fn();

const liveCrosshair = { id: 2, isDestroyed: () => false };
const deadCrosshair = { id: 3, isDestroyed: () => true };
let nextCrosshair: typeof liveCrosshair | undefined;

let settings: SettingsType = { ...DEFAULT_SETTINGS };
let isFocused = false;

const settingsWindow = {
	id: 1,
	isDestroyed: () => false,
	isMinimized: () => false,
	isVisible: () => true,
	isFocused: () => isFocused,
	restore: jest.fn(),
	show: jest.fn(),
	hide: jest.fn(),
	focus: jest.fn(),
};

jest.mock('electron', () => ({
	globalShortcut: { register: jest.fn(), unregister: jest.fn() },
}));

jest.mock('electron-log', () => ({ info: jest.fn(), status: jest.fn() }));

jest.mock('../main/store-actions', () => ({
	getSettings: () => settings,
	setSettings: (...args: unknown[]) => setSettings(...args),
}));

jest.mock('../main/utils/hideApp', () => ({
	toggleAppHide: () => toggleAppHide(),
}));
jest.mock('../main/utils/lockApp', () => ({
	toggleAppLock: () => toggleAppLock(),
}));
jest.mock('../main/utils/window-utils', () => ({
	focusNextWindow: () => focusNextWindow(),
	getNextCrosshairWindow: () => nextCrosshair,
}));

jest.mock('../main/create-window', () => ({
	createCrosshairWindow: () => createCrosshairWindow(),
}));

jest.mock('../main/windows', () => ({
	__esModule: true,
	default: { settingsWindow: null, mainWindow: null, crosshairWindows: {} },
}));

const load = () => {
	// eslint-disable-next-line global-require
	require('../main/windows').default.settingsWindow = settingsWindow;
	// eslint-disable-next-line global-require
	return require('../main/utils/settingsWindow');
};

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
	settings = { ...DEFAULT_SETTINGS };
	isFocused = false;
	nextCrosshair = liveCrosshair;
});

describe('showApp', () => {
	it('unlocks, then shows Settings', () => {
		settings = { ...settings, isLocked: true };

		load().showApp();

		expect(toggleAppLock).toHaveBeenCalled();
		expect(settingsWindow.show).toHaveBeenCalled();
		expect(settingsWindow.focus).toHaveBeenCalled();
		expect(setSettings).toHaveBeenCalledWith({ isSettingsWindowOpen: true });
	});

	it('unhides a hidden app', () => {
		settings = { ...settings, isHidden: true };

		load().showApp();

		expect(toggleAppHide).toHaveBeenCalled();
		expect(settingsWindow.show).toHaveBeenCalled();
	});

	it('leaves the lock alone when the app is not locked', () => {
		load().showApp();

		expect(toggleAppLock).not.toHaveBeenCalled();
		expect(toggleAppHide).not.toHaveBeenCalled();
		expect(settingsWindow.show).toHaveBeenCalled();
	});

	it('does not toggle Settings back off when it is already up', () => {
		settings = { ...settings, isSettingsWindowOpen: true };
		isFocused = true;

		load().showApp();

		expect(settingsWindow.hide).not.toHaveBeenCalled();
		expect(settingsWindow.focus).toHaveBeenCalled();
	});
});

describe('showApp with no usable crosshair window', () => {
	const windowsModule = () =>
		// eslint-disable-next-line global-require
		require('../main/windows').default;

	it('repoints a destroyed mainWindow at a live crosshair (beta.5 tray crash)', async () => {
		const app = load();
		windowsModule().mainWindow = deadCrosshair;
		settings = { ...settings, isLocked: true };

		await app.showApp();

		expect(windowsModule().mainWindow).toBe(liveCrosshair);
		expect(createCrosshairWindow).not.toHaveBeenCalled();
		expect(toggleAppLock).toHaveBeenCalled();
	});

	it('creates a crosshair when every one was closed, then shows Settings', async () => {
		const app = load();
		windowsModule().mainWindow = null;
		nextCrosshair = undefined;

		await app.showApp();

		expect(createCrosshairWindow).toHaveBeenCalledTimes(1);
		expect(settingsWindow.show).toHaveBeenCalled();
	});
});

describe('openSettingsWindow', () => {
	it('shows the app instead of giving up when locked', () => {
		settings = { ...settings, isLocked: true };

		load().openSettingsWindow();

		expect(toggleAppLock).toHaveBeenCalled();
		expect(settingsWindow.show).toHaveBeenCalled();
	});

	it('still toggles closed when it is open and focused', () => {
		settings = { ...settings, isSettingsWindowOpen: true };
		isFocused = true;

		load().openSettingsWindow();

		expect(settingsWindow.hide).toHaveBeenCalled();
		expect(setSettings).toHaveBeenCalledWith({ isSettingsWindowOpen: false });
	});
});
