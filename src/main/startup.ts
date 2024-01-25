import { app } from 'electron';
import Logger from 'electron-log/main';
import { DIRECTORY_SCAN_DEPTH } from '../config/config';
import { $messages } from '../config/strings';
import appListeners from './app-listeners';
import { AutoUpdate } from './auto-update';
import { createMainWindow } from './create-window';
import debugging from './debugging';
import errorHandling from './error-handling';
import kb from './keyboard';
import { getImages } from './lib/images';
import logger from './logger';
import { setupDockMenu } from './menu';
import { __crosshairs } from './paths';
import protocol from './protocol';
import { refreshSettingsOnAppStart } from './reset';
import sounds from './sounds';
import { clearCrosshairs, setCrosshairs } from './store';
import tray from './tray';
import { debugInfo, is } from './util';
import windows from './windows';

export const startup = () => {
	// Initialize logger
	logger.initialize();

	// Initialize the error handler
	errorHandling.initialize();

	refreshSettingsOnAppStart();

	// Enable electron debug and source map support
	debugging.initialize();

	// Register app listeners, e.g. `app.on()`
	appListeners.register();
};

export const ready = async () => {
	console.timeLog(app.name, $messages.ready);

	// Log Node/Electron versions
	Logger.info(debugInfo());

	if (is.debug) {
		await debugging.installExtensions();
	}

	// Add remaining app listeners
	appListeners.ready();

	// Setup keyboard shortcuts
	kb.initialize();

	// Create the main browser window.
	windows.mainWindow = await createMainWindow();

	// Setup Dock Menu
	setupDockMenu();

	// Setup Tray
	tray.initialize();

	// Register custom protocol like `app://`
	protocol.initialize();

	// Auto updates
	// eslint-disable-next-line no-new
	new AutoUpdate();

	// Idle
	Logger.status($messages.mainIdle);
};

export const idle = async () => {
	// ... do something with your app

	sounds.play('STARTUP');

	clearCrosshairs();
	getImages(__crosshairs, DIRECTORY_SCAN_DEPTH)
		.then((images) => {
			setCrosshairs(images);
		})
		.catch((error) => {
			Logger.error(error);
		});

	// windows.childWindow = await createSettingsWindow();

	Logger.status($messages.idle);
};
