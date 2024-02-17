/* eslint-disable promise/always-return */
import { BrowserWindow, app, shell } from 'electron';
import Logger from 'electron-log/main';
import EXIT_CODES from '../config/exit-codes';
import { $appListeners, $errors, $init } from '../config/strings';
import { createCrosshairWindow } from './create-window';
import dock from './dock';
import keyboard from './keyboard';
import { getSettings } from './store-actions';
import { is } from './util';
import windows from './windows';

const register = () => {
	Logger.status($init.appListeners);

	/**
	 * Add app event listeners...
	 */

	const { quitOnWindowClose } = getSettings();

	app.on('will-quit', () => {
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
		// Dock persists after app quits on macOS
		dock.setVisible(false);

		app.releaseSingleInstanceLock();
		process.exit(EXIT_CODES.SUCCESS);
	});

	app.on('window-all-closed', () => {
		Logger.status($appListeners.allWindowsClosed);
		// Respect the OSX convention of having the application in memory even
		// after all windows have been closed
		if (!is.macos || quitOnWindowClose) {
			app.quit();
		}
	});

	// Security measures
	app.on('web-contents-created', (_event, webContents) => {
		// Security #13: Prevent navigation
		// https://www.electronjs.org/docs/latest/tutorial/security#13-disable-or-limit-navigation
		webContents.on('will-navigate', (event, navigationUrl) => {
			event.preventDefault();
			shell.openExternal(navigationUrl);
			Logger.warn($errors.blockedNavigation, navigationUrl);
		});
	});
};

const ready = () => {
	app.on('activate', async () => {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		const openWindows = BrowserWindow.getAllWindows().find((window) => {
			if (window !== windows.settingsWindow) {
				// window.show();
				return true;
			}
			return false;
		});

		if (!openWindows) {
			await createCrosshairWindow();
		}
	});

	app.on('second-instance', () => {
		Logger.warn($errors.secondInstance);
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
