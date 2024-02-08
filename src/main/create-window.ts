/* eslint-disable no-param-reassign */
import {
	BrowserWindow,
	BrowserWindowConstructorOptions,
	IpcMainEvent,
	app,
	shell,
} from 'electron';
import Logger from 'electron-log/main';
import path from 'path';
import {
	APP_ASPECT_RATIO,
	APP_FRAME,
	APP_HEIGHT,
	APP_WIDTH,
} from '../config/config';
import { setupContextMenu } from './context-menu';
import MenuBuilder from './menu';
import { __resources } from './paths';
import { getSettings, setSettings } from './store-actions';
import { is, resolveHtmlPath } from './util';
import { savePosition } from './utils/savePosition';
import windows from './windows';

const getAssetPath = (...paths: string[]): string => {
	return path.join(__resources, ...paths);
};

const createWindow = (opts?: BrowserWindowConstructorOptions) => {
	const options: BrowserWindowConstructorOptions = {
		title: app.name,
		tabbingIdentifier: app.name,
		frame: APP_FRAME,
		show: false,

		// closable: false,
		// fullscreen: true,
		fullscreenable: false,
		// simpleFullscreen: true, // Pre-lion fullscreen support (stays in same space)

		// backgroundColor: '#00000000', // transparent hexadecimal or anything with transparency,
		// vibrancy: 'under-window', // appearance-based, titlebar, selection, menu, popover, sidebar, header, sheet, window, hud, fullscreen-ui, tooltip, content, under-window, or under-page.
		useContentSize: false, // The width and height would be used as web page's size, which means the actual window's size will include window frame's size and be slightly larger. Default is false.

		// Conditionally enable features based on the platform
		// https://www.electronjs.org/docs/api/browser-window#new-browserwindowoptions
		// ...(is.windows ? { type: 'toolbar' } : {}),

		// Don't set icon on Windows so the exe's ico will be used as window and
		// taskbar's icon. See https://github.com/atom/atom/issues/4811 for more.
		...(is.linux ? { icon: getAssetPath('icon.png') } : {}),
		...opts,
	};

	options.webPreferences = {
		sandbox: false, // todo: enable
		webSecurity: !is.development, // Required for loading sounds, comment out if not using sounds
		// Prevent throttling when the window is in the background:
		// backgroundThrottling: false,
		// Disable the `auxclick` feature so that `click` events are triggered in
		// response to a middle-click.
		// (Ref: https://github.com/atom/atom/pull/12696#issuecomment-290496960)
		disableBlinkFeatures: 'Auxclick',
		preload: app.isPackaged
			? path.join(__dirname, 'preload.js')
			: path.join(__dirname, '../../.erb/dll/preload.js'),
	};

	const browserWindow = new BrowserWindow(options);

	browserWindow.on('unresponsive', (event: IpcMainEvent) => {
		Logger.error(`Window unresponsive: ${event.sender}`);
	});

	browserWindow.webContents.on('did-fail-load', (event: any) => {
		Logger.error(`Window failed load: ${event?.sender}`);
	});

	browserWindow.webContents.on('did-finish-load', () => {
		Logger.info('Window finished load');
	});

	// Clean
	browserWindow.on('closed', () => {
		Logger.status('Window closed');
	});

	browserWindow.on('moved', () => {
		savePosition(browserWindow);
	});

	// Open urls in the user's browser
	if (browserWindow.webContents.setWindowOpenHandler) {
		browserWindow.webContents.setWindowOpenHandler((data) => {
			shell.openExternal(data.url);
			return { action: 'deny' };
		});
	}

	// Create application menu
	const menuBuilder = new MenuBuilder(browserWindow);
	menuBuilder.buildMenu();

	// Context menu
	setupContextMenu(browserWindow);

	return browserWindow;
};

export const createCrosshairWindow = async (
	opts?: BrowserWindowConstructorOptions,
) => {
	const { showTaskbarIcon } = getSettings();
	const options: BrowserWindowConstructorOptions = {
		acceptFirstMouse: true, // macOS: Whether clicking an inactive window will also click through to the web contents. Default is false
		alwaysOnTop: true,
		frame: false,
		hasShadow: false,
		maximizable: false,
		minimizable: false,
		resizable: false,

		closable: true,
		movable: true,

		show: false,
		skipTaskbar: !showTaskbarIcon, // Whether to show the window in taskbar. Default is false.
		titleBarStyle: 'customButtonsOnHover', // 'default', 'hidden', 'hiddenInset', 'customButtonsOnHover
		// titleBarOverlay: true, // https://developer.mozilla.org/en-US/docs/Web/API/Window_Controls_Overlay_API
		// trafficLightPosition: { x: 10, y: 9 },

		transparent: true, // Makes the window transparent. Default is false. On Windows, does not work unless the window is frameless.
		backgroundColor: '#00000000', // transparent hexadecimal or anything with transparency,
		// vibrancy: 'under-window', // appearance-based, titlebar, selection, menu, popover, sidebar, header, sheet, window, hud, fullscreen-ui, tooltip, content, under-window, or under-page.

		width: APP_WIDTH,
		minWidth: APP_WIDTH,
		height: APP_HEIGHT,
		minHeight: APP_HEIGHT,
		...opts,
	};

	if (is.windows) {
		options.type = 'toolbar';
	}

	const window = createWindow(options);

	window.setAspectRatio(APP_ASPECT_RATIO);
	window.setFullScreenable(false);

	// todo: Maybe dont stay on top when unlocked
	// VisibleOnFullscreen removed in https://github.com/electron/electron/pull/21706
	window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

	// Values include normal, floating, torn-off-menu, modal-panel, main-menu, status, pop-up-menu, screen-saver
	window.setAlwaysOnTop(true, 'screen-saver', 1);

	window.on('ready-to-show', () => {
		window.show();
	});

	window.on('will-resize', () => {});

	// Load the window
	window.loadURL(resolveHtmlPath('crosshair.html'));

	windows.crosshairWindows.push(window);

	return window;
};

export const createMainWindow = async () => {
	const { quitOnWindowClose } = getSettings();
	const options: BrowserWindowConstructorOptions = {};

	const window = await createCrosshairWindow(options);

	window.on('closed', () => {
		// Quit if main window closes
		if (!is.macos || quitOnWindowClose) {
			app.quit();
		}
	});

	windows.mainWindow = window;
};

export const createChildWindow = async () => {
	const window = createWindow({ frame: true });

	window.on('ready-to-show', () => {
		window.show();
		windows.mainWindow?.focus();
	});

	// Load the window
	window.loadURL(resolveHtmlPath('child.html'));

	return window;
};

export const createSettingsWindow = async () => {
	const options: BrowserWindowConstructorOptions = {
		alwaysOnTop: true,
		titleBarStyle: 'default',
	};

	const window = createWindow(options);
	window.setAlwaysOnTop(true, 'screen-saver', 1);

	// Keep settings window loaded in memory, so it can be re-opened quickly using show()/hide()
	window.on('closed', () => {
		windows.settingsWindow = createWindow(options);
		setSettings({ isSettingsWindowOpen: false });
	});

	// // Hide window when clicked away
	// window.on('blur', () => {
	// 	window.hide();
	// 	setSettings({ isSettingsWindowOpen: false });
	// });

	// Load the window
	window.loadURL(resolveHtmlPath('index.html'));

	windows.settingsWindow = window;
};

export const createNewWindow = async () => {
	const window = await createCrosshairWindow();

	return window;
};
