/* eslint-disable no-param-reassign */
import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  app,
  screen,
  shell,
} from 'electron';
import Logger from 'electron-log';
import path from 'path';
import {
  APP_ASPECT_RATIO,
  APP_FRAME,
  APP_HEIGHT,
  APP_WIDTH,
  SIZE_MODES,
} from '../config/config';
import { DEFAULT_CROSSHAIR_WINDOW_STATE } from '../config/settings';
import { getUUID } from '../utils/getUUID';
import { isObjectEmpty } from '../utils/isObjectEmpty';
import { setupContextMenu } from './context-menu';
import { wireRenderProcessGone } from './crash-report';
import dock from './dock';
import MenuBuilder from './menu';
import { __resources } from './paths';
import {
  deleteWindowState,
  getActiveWindowState,
  getSetting,
  getSettings,
  getWindowState,
  getWindowStates,
  setActiveWindow,
  setSettings,
  setWindowState,
} from './store-actions';
import { is, resolveHtmlPath } from './util';
import { savePosition } from './utils/savePosition';
import { windowClosed } from './utils/window-closed';
import { getNextCrosshairWindow, safeSetBounds } from './utils/window-utils';
import windows from './windows';

const getAssetPath = (...paths: string[]): string => {
  return path.join(__resources, ...paths);
};

const createWindow = (id: string, opts?: BrowserWindowConstructorOptions) => {
  const options: BrowserWindowConstructorOptions = {
    title: app.name,
    tabbingIdentifier: app.name,
    frame: APP_FRAME,
    show: false,
    minWidth: 300,
    minHeight: 300,

    // closable: false,
    // fullscreen: true,
    fullscreenable: false,
    // simpleFullscreen: true, // Pre-lion fullscreen support (stays in same space)

    // backgroundColor: '#00000000', // transparent hexadecimal or anything with transparency,
    // vibrancy: 'under-window', // appearance-based, titlebar, selection, menu, popover, sidebar, header, sheet, window, hud, fullscreen-ui, tooltip, content, under-window, or under-page.
    useContentSize: false, // The width and height would be used as web page's size, which means the actual window's size will include window frame's size and be slightly larger. Default is false.

    // Conditionally enable features based on the platform
    // https://www.electronjs.org/docs/api/browser-window#new-browserwindowoptions
    ...(is.windows ? { type: 'toolbar' } : {}),

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
    contextIsolation: true,
    nodeIntegration: false,
  };

  const browserWindow = new BrowserWindow(options);

  // todo: Maybe dont stay on top when unlocked
  // VisibleOnFullscreen removed in https://github.com/electron/electron/pull/21706
  browserWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  browserWindow.on('unresponsive', () => {
    Logger.error('Window unresponsive');
  });

  browserWindow.webContents.on('did-fail-load', (event: any) => {
    Logger.error(`Window failed load: ${event?.sender}`);
  });

  browserWindow.webContents.on('did-finish-load', () => {
    Logger.info('Window finished load');
  });

  // Store listener references so they can be cleaned up on close
  const onMoved = () => savePosition(browserWindow, id);
  const onResize = () => savePosition(browserWindow, id);
  browserWindow.on('moved', onMoved);
  browserWindow.on('resize', onResize);

  // Window closing — clean up state and listeners
  browserWindow.on('close', () => {
    Logger.status('Window is closing', id);

    // Remove event listeners to prevent leaks
    browserWindow.removeListener('moved', onMoved);
    browserWindow.removeListener('resize', onResize);

    // Remove window state
    deleteWindowState(id);

    // Basically we always want to have a main window, so we find the next window and set it as main
    if (windows.mainWindow === windows.crosshairWindows[id]) {
      windows.mainWindow = null;
      const nextWindow = getNextCrosshairWindow();
      if (!nextWindow) {
        windows.settingsWindow?.hide();
      } else {
        windows.mainWindow = nextWindow;
      }
    }
    delete windows.crosshairWindows[id];
  });

  dock.initialize();

  // Open urls in the user's browser
  if (browserWindow.webContents.setWindowOpenHandler) {
    browserWindow.webContents.setWindowOpenHandler((data) => {
      shell.openExternal(data.url);
      return { action: 'deny' };
    });
  }

  // Wire crash dialog for renderer process crashes
  wireRenderProcessGone(browserWindow);

  // Create application menu
  const menuBuilder = new MenuBuilder(browserWindow);
  menuBuilder.buildMenu();

  return browserWindow;
};

export const createCrosshairWindow = async (
  opts?: BrowserWindowConstructorOptions,
  id: string = getUUID(),
) => {
  Logger.status('Creating crosshair window', id);
  const state = id ? getWindowState(id) : null;

  // Resume previous window state
  if (isObjectEmpty(state)) {
    // New window state
    setWindowState(id, DEFAULT_CROSSHAIR_WINDOW_STATE);
  }

  const { isLocked, showTaskbarIcon, appSizeMode } = getSettings();

  // Per-window size mode (compact/normal/large)
  const windowSizeMode = state?.sizeMode ?? 'normal';
  const sizeConfig = SIZE_MODES[windowSizeMode] ?? SIZE_MODES.normal;

  // Compute size-mode-specific options
  let sizeModeOpts: Partial<BrowserWindowConstructorOptions> = {};
  if (appSizeMode === 'fullscreen') {
    const display = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = display.bounds;
    sizeModeOpts = {
      x: 0,
      y: 0,
      width: screenWidth,
      height: screenHeight,
      resizable: false,
    };
  } else if (appSizeMode === 'resizable') {
    sizeModeOpts = {
      width: state?.width ?? sizeConfig.width,
      height: state?.height ?? sizeConfig.height,
      minWidth: sizeConfig.width,
      minHeight: sizeConfig.height,
      resizable: true,
      ...(state?.x != null ? { x: state.x } : {}),
      ...(state?.y != null ? { y: state.y } : {}),
    };
  } else {
    // normal: fixed size using per-window sizeMode dimensions
    sizeModeOpts = {
      width: sizeConfig.width,
      height: sizeConfig.height,
      minWidth: sizeConfig.width,
      minHeight: sizeConfig.height,
      resizable: false,
      ...(state?.x != null ? { x: state.x } : {}),
      ...(state?.y != null ? { y: state.y } : {}),
    };
  }

  const options: BrowserWindowConstructorOptions = {
    acceptFirstMouse: true,
    alwaysOnTop: true,
    frame: false,
    hasShadow: false,
    maximizable: false,
    minimizable: false,
    closable: true,
    fullscreenable: false,
    focusable: !isLocked,
    movable: !isLocked,

    show: false,
    skipTaskbar: !showTaskbarIcon,
    titleBarStyle: 'default',

    transparent: true,
    backgroundColor: '#00000000',

    minWidth: sizeConfig.width,
    minHeight: sizeConfig.height,

    // Conditionally enable features based on the platform
    ...(is.windows ? { type: 'toolbar' } : {}),

    ...sizeModeOpts,
    ...opts,
  };

  const window = createWindow(id, options);
  window.setAspectRatio(APP_ASPECT_RATIO);
  window.setIgnoreMouseEvents(isLocked);

  // Values include normal, floating, torn-off-menu, modal-panel, main-menu, status, pop-up-menu, screen-saver
  window.setAlwaysOnTop(true, 'screen-saver', 1);

  window.on('ready-to-show', () => {
    // Validate the window is on a visible display before showing
    if (state?.x != null && state?.y != null) {
      safeSetBounds(window, window.getBounds());
    }
    window.show();
  });

  window.on('focus', () => {
    Logger.status('Window focused', id);

    // Track the active window to show correct settings
    setActiveWindow(id);
  });

  window.on('close', () => {
    windowClosed();
  });

  // Context menu disabled in production
  // See: https://www.electronjs.org/docs/latest/tutorial/window-customization
  if (is.debug) {
    setupContextMenu(window);
  }

  // Load the window
  window.loadURL(`${resolveHtmlPath(`crosshair.html`)}?id=${id}`);

  windows.crosshairWindows[id] = window;

  if (!windows.mainWindow || windows.mainWindow.isDestroyed()) {
    windows.mainWindow = window;
  }

  return window;
};

export const createMainWindow = async () => {
  const options: BrowserWindowConstructorOptions = {};

  const window = await createCrosshairWindow(options);

  windows.mainWindow = window;
};

export const createNewWindow = async () => {
  const window = await createCrosshairWindow();

  return window;
};

export const createDuplicateWindow = async () => {
  const id = getUUID();
  const state = getActiveWindowState();

  // copy state to a new window
  if (state) {
    delete state.x;
    delete state.y;

    if (state) setWindowState(id, state);
  }
  const window = await createCrosshairWindow({}, id);

  return window;
};

export const createSettingsWindow = async () => {
  const state = getWindowState('settings');

  const options: BrowserWindowConstructorOptions = {
    title: `Settings - ${app.name}`,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 12, y: 12 },

    ...(state?.x && state?.y ? { x: state.x, y: state.y } : {}),
    ...(state?.width ? { width: state.width } : {}),
    ...(state?.height ? { height: state.height } : {}),
  };
  windows.settingsWindow = null;

  const window = createWindow('settings', options);

  // Set window position the same as the main window, so they can overlap
  // window.setAlwaysOnTop(true, 'screen-saver', 1);

  // Keep settings window loaded in memory, so it can be re-opened quickly using show()/hide()
  window.on('close', (e) => {
    e.preventDefault();

    // Reset window state
    setSettings({ isSettingsWindowOpen: false });
    windows.settingsWindow?.hide();
  });

  // Show settings if unlocked
  window.on('ready-to-show', () => {
    // Validate saved position is still on a visible display
    if (state?.x != null && state?.y != null) {
      safeSetBounds(window, window.getBounds());
    }

    if (!getSetting('isSettingsWindowOpen') || getSetting('isLocked')) {
      return;
    }

    window.show();
  });

  // Hide window when clicked away (configurable)
  window.on('blur', () => {
    if (getSetting('settingsCloseOnBlur')) {
      window.hide();
      setSettings({ isSettingsWindowOpen: false });
    }
  });

  // Load the window
  window.loadURL(resolveHtmlPath('index.html'));

  // Context menu
  setupContextMenu(window);

  windows.settingsWindow = window;
};

export const createOrReloadCrosshairWindows = async () => {
  // Create the main browser window.
  const { settings: _settings, ...crosshairs } = getWindowStates();

  const keys = Object.keys(crosshairs);
  if (keys.length > 0) {
    Logger.status('Reloading multiple crosshair windows', keys.length);
    keys.forEach((id) => createCrosshairWindow({}, id));
  } else {
    Logger.status('Open new crosshair', keys.length);
    createCrosshairWindow();
  }
};
