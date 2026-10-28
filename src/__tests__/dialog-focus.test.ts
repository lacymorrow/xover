/**
 * @jest-environment node
 *
 * The reset confirmation opened behind whatever app was in front, from both the
 * tray and Settings > Advanced, so the user saw nothing happen (LAC-5839
 * item 2).
 */
const showMessageBox = jest.fn((..._args: any[]) =>
	Promise.resolve({ response: 1 }),
);
const appFocus = jest.fn((..._args: any[]) => undefined);

let settingsVisible = true;

const settingsWindow = {
	id: 1,
	isDestroyed: () => false,
	isMinimized: () => false,
	isVisible: () => settingsVisible,
	restore: jest.fn(),
	show: jest.fn(),
	focus: jest.fn(),
};

jest.mock('electron', () => ({
	BrowserWindow: {},
	app: {
		getName: () => 'CrossOver',
		getVersion: () => '4.0.0-beta.6',
		focus: (...args: any[]) => appFocus(...args),
		setAboutPanelOptions: jest.fn(),
		showAboutPanel: jest.fn(),
		getGPUFeatureStatus: () => ({ gpu_compositing: 'enabled' }),
	},
	dialog: { showMessageBox: (...args: any[]) => showMessageBox(...args) },
}));

jest.mock('../main/util', () => ({
	is: { macos: true, development: false },
	debugInfo: () => '',
}));

jest.mock('../main/windows', () => ({
	__esModule: true,
	default: { settingsWindow: null, mainWindow: null, crosshairWindows: {} },
}));

const load = () => {
	// eslint-disable-next-line global-require
	require('../main/windows').default.settingsWindow = settingsWindow;
	// eslint-disable-next-line global-require
	return require('../main/dialog').default;
};

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
	settingsVisible = true;
	showMessageBox.mockImplementation(() => Promise.resolve({ response: 1 }));
});

describe('the reset confirmation', () => {
	it('steals focus on macOS and parents itself to the visible settings window', async () => {
		await load().confirmResetSettings();

		expect(appFocus).toHaveBeenCalledWith({ steal: true });
		expect(settingsWindow.show).toHaveBeenCalled();
		expect(settingsWindow.focus).toHaveBeenCalled();
		expect(showMessageBox).toHaveBeenCalledWith(
			settingsWindow,
			expect.objectContaining({ type: 'warning' }),
		);
	});

	// From the tray there is no settings window to attach to, and opening one
	// just to host a dialog would leave it on screen afterwards.
	it('stays app-modal when the settings window is not up', async () => {
		settingsVisible = false;

		await load().confirmResetSettings();

		expect(appFocus).toHaveBeenCalledWith({ steal: true });
		expect(settingsWindow.show).not.toHaveBeenCalled();
		expect(showMessageBox).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'warning' }),
		);
	});

	it('only confirms on the Reset button', async () => {
		showMessageBox.mockImplementation(() => Promise.resolve({ response: 0 }));

		await expect(load().confirmResetSettings()).resolves.toBe(false);
	});
});

describe('the update prompt', () => {
	it('runs the update when Update is picked', async () => {
		const update = jest.fn();
		showMessageBox.mockImplementation(() => Promise.resolve({ response: 0 }));

		await load().openUpdateDialog(update);

		expect(appFocus).toHaveBeenCalledWith({ steal: true });
		expect(update).toHaveBeenCalled();
	});

	it('does nothing when Ignore is picked', async () => {
		const update = jest.fn();
		showMessageBox.mockImplementation(() => Promise.resolve({ response: 1 }));

		await load().openUpdateDialog(update);

		expect(update).not.toHaveBeenCalled();
	});
});
