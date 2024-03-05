/* eslint-disable promise/always-return */
import { app, shell } from 'electron';
import Logger from 'electron-log/main';
import EXIT_CODES from '../config/exit-codes';
import { $appListeners, $errors, $init } from '../config/strings';
import { createCrosshairWindow } from './create-window';
import keyboard from './keyboard';
import { windowClosed } from './utils/window-closed';
import { getNextCrosshairWindow } from './utils/window-utils';
import windows from './windows';

const register = () => {
	Logger.status($init.appListeners);

	/**
	 * Add app event listeners...
	 */

	app.on('will-quit', () => {
		Logger.status($appListeners.willQuit);
		// Unregister all shortcuts.
		// todo: iohook
		// iohook.unregisterAll();
		keyboard.unregisterAll();
	});

	// Sending a `SIGINT` (e.g: Ctrl-C) to an Electron app that registers
	// a `beforeunload` window event handler results in a disconnected white
	// browser window in GNU/Linux and macOS.
	// The `before-quit` Electron event is triggered in `SIGINT`, so we can
	// make use of it to ensure the browser window is completely destroyed.
	// See https://github.com/electron/electron/issues/5273
	app.on('before-quit', () => {
		Logger.status($appListeners.beforeQuit);

		// TODO: BUG - Dock persists after app quits on macOS
		app.dock.hide();

		app.releaseSingleInstanceLock();
		process.exit(EXIT_CODES.SUCCESS);
	});

	app.on('window-all-closed', () => {
		Logger.status($appListeners.allWindowsClosed);
		windowClosed();
	});

	// Security measures
	app.on('web-contents-created', (_event, webContents) => {
		// Security #13: Prevent navigation
		// https://www.electronjs.org/docs/latest/tutorial/security#13-disable-or-limit-navigation
		webContents.on('will-navigate', (event, navigationUrl) => {
			event.preventDefault();

			Logger.warn($errors.blockedNavigation, navigationUrl);
			shell.openExternal(navigationUrl);
		});
	});
};

const ready = () => {
	app.on('activate', async () => {
		Logger.status($appListeners.activate);

		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		const openWindow = getNextCrosshairWindow();

		if (!openWindow) {
			await createCrosshairWindow();
		}
	});

	app.on('second-instance', () => {
		Logger.warn($appListeners.secondInstance);
		// Someone tried to run a second instance, we should focus our window.
		if (windows.settingsWindow) {
			// If the window is minimized, we should restore it and focus it.
			if (windows.settingsWindow.isMinimized())
				windows.settingsWindow.restore();
			windows.settingsWindow.focus();
		}
	});
};

export default { register, ready };
