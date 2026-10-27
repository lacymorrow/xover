/**
 * @jest-environment node
 *
 * Global shortcuts act on crosshair windows. With Settings focused,
 * `getFocusedWindow()` hands back the settings window, so Center Crosshair
 * centered Settings; with the crosshair locked it is `focusable: false` and
 * nothing of ours is focused, so the move shortcuts did nothing at all
 * (LAC-5839 item 4).
 */
const makeWindow = (id: number) => ({
	id,
	isDestroyed: () => false,
	focus: jest.fn(),
	getBounds: () => ({ x: 0, y: 0, width: 200, height: 130 }),
});

const settingsWindow = makeWindow(1);
const crosshairA = makeWindow(2);
const crosshairB = makeWindow(3);

let focused: any = null;
let allWindows: any[] = [];

jest.mock('electron', () => ({
	BrowserWindow: {
		getFocusedWindow: () => focused,
		getAllWindows: () => allWindows,
	},
	screen: {
		getPrimaryDisplay: () => ({ workArea: { x: 0, y: 0 } }),
		getCursorScreenPoint: () => ({ x: 0, y: 0 }),
		getDisplayNearestPoint: () => ({ workArea: { x: 0, y: 0 } }),
	},
}));

jest.mock('electron-log', () => ({
	status: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
}));

jest.mock('../main/windows', () => ({
	__esModule: true,
	default: {
		mainWindow: null,
		settingsWindow: null,
		crosshairWindows: {},
		childWindow: null,
		tray: null,
	},
}));

const loadUtils = () => {
	// eslint-disable-next-line global-require
	const windows = require('../main/windows').default;
	windows.settingsWindow = settingsWindow;
	windows.mainWindow = crosshairA;
	// eslint-disable-next-line global-require
	return require('../main/utils/window-utils');
};

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
	focused = null;
	allWindows = [settingsWindow, crosshairA, crosshairB];
});

describe('activeCrosshairWindow', () => {
	it('is the focused crosshair window', () => {
		focused = crosshairB;
		expect(loadUtils().activeCrosshairWindow()).toBe(crosshairB);
	});

	it('is never the settings window', () => {
		focused = settingsWindow;
		expect(loadUtils().activeCrosshairWindow()).toBe(crosshairA);
	});

	it('falls back to the main window when nothing of ours is focused', () => {
		focused = null;
		expect(loadUtils().activeCrosshairWindow()).toBe(crosshairA);
	});

	it('falls back to any crosshair window when there is no main window', () => {
		// eslint-disable-next-line global-require
		const windows = require('../main/windows').default;
		const utils = loadUtils();
		windows.mainWindow = null;
		allWindows = [settingsWindow, crosshairB];

		expect(utils.activeCrosshairWindow()).toBe(crosshairB);
	});
});

describe('focusNextWindow', () => {
	it('skips the settings window', () => {
		focused = crosshairB;
		loadUtils().focusNextWindow();

		expect(crosshairA.focus).toHaveBeenCalled();
		expect(settingsWindow.focus).not.toHaveBeenCalled();
	});

	it('focuses a crosshair window when Settings has focus', () => {
		focused = settingsWindow;
		loadUtils().focusNextWindow();

		expect(crosshairA.focus).toHaveBeenCalled();
	});

	it('does nothing when there is no crosshair window', () => {
		allWindows = [settingsWindow];
		focused = settingsWindow;

		expect(() => loadUtils().focusNextWindow()).not.toThrow();
		expect(settingsWindow.focus).not.toHaveBeenCalled();
	});
});
