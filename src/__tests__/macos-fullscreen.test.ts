/**
 * @jest-environment node
 *
 * Regression for GH #546 / v3 #580: the crosshair did not draw over a macOS
 * fullscreen game.
 *
 * Hiding the dock is a TransformProcessType to UIElement, and macOS only lets a
 * window float over another app's fullscreen Space when the process was already
 * a UIElement at the moment that NSWindow was created. Transforming afterwards
 * does not repair a window that already exists, so a crosshair created first was
 * born on the desktop Space and stayed there. `create-window.ts` called
 * `dock.initialize()` well after `new BrowserWindow(options)`.
 *
 * Measured on graphite, macOS 26.7.1, Electron 40, from `CGWindowListCopyWindowInfo`
 * on-screen state while a native fullscreen Space was active:
 *
 *   created as a regular app   -> on the desktop Space only
 *   created as a UIElement     -> floats over the fullscreen Space
 *   created as a UIElement,
 *   then dock restored         -> still floats (activation policy 0)
 *
 * The third row is why showDockIcon can keep defaulting to true: the order is
 * what matters, not the end state. That is the whole fix, and this test pins it.
 */
import { DEFAULT_SETTINGS, SettingsType } from '../config/settings';

const order: string[] = [];

let settings: SettingsType = { ...DEFAULT_SETTINGS };

const windowStub = () => ({
	setVisibleOnAllWorkspaces: jest.fn(),
	setAspectRatio: jest.fn(),
	setIgnoreMouseEvents: jest.fn(),
	setAlwaysOnTop: jest.fn(),
	setContentProtection: jest.fn(),
	getBounds: jest.fn(() => ({ x: 0, y: 0, width: 208, height: 130 })),
	setBounds: jest.fn(),
	loadURL: jest.fn(),
	show: jest.fn(),
	hide: jest.fn(),
	isDestroyed: jest.fn(() => false),
	on: jest.fn(),
	removeListener: jest.fn(),
	webContents: {
		on: jest.fn(),
		setWindowOpenHandler: jest.fn(),
		send: jest.fn(),
	},
});

jest.mock('electron', () => ({
	app: { name: 'CrossOver', isPackaged: false },
	BrowserWindow: jest.fn(() => {
		order.push('window-created');
		return windowStub();
	}),
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
		setVisible: (visible: boolean) => {
			order.push(`dock:setVisible(${visible})`);
		},
		initialize: () => {
			order.push('dock:initialize');
		},
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
	order.length = 0;
	settings = { ...DEFAULT_SETTINGS };
	jest.clearAllMocks();
});

const createCrosshair = async () => {
	// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
	const { createCrosshairWindow } = require('../main/create-window');
	await createCrosshairWindow({}, 'test-window');
};

// Only the dock transforms and the constructor, in the order they happened.
// Compared as a whole sequence rather than with indexOf: a missing marker is
// indexOf -1, which would sit happily before anything else and pass.
const dockSequence = () =>
	order.filter(
		(event) => event.startsWith('dock:') || event === 'window-created',
	);

const EXPECTED = [
	'dock:setVisible(false)',
	'window-created',
	'dock:initialize',
];

it('hides the dock before the crosshair window exists, then puts it back (#546)', async () => {
	// The hide is the fix. dock.initialize() after it is what keeps showDockIcon
	// honest, which the measurements above show costs nothing.
	await createCrosshair();

	expect(dockSequence()).toEqual(EXPECTED);
});

it('hides the dock first for every window, settings included', async () => {
	// Every window goes through the same createWindow(), so an ordering that only
	// held for crosshairs would rot the first time the call order changed.
	// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
	const { createSettingsWindow } = require('../main/create-window');
	await createSettingsWindow();

	expect(dockSequence()).toEqual(EXPECTED);
});

it('hides the dock once per window, not once per run', async () => {
	// A second crosshair is created by the duplicate-window action long after
	// launch, and it needs the transform just as much as the first one.
	await createCrosshair();
	order.length = 0;
	await createCrosshair();

	expect(dockSequence()).toEqual(EXPECTED);
});
