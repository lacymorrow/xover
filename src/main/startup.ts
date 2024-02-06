import { app } from 'electron';
import Logger from 'electron-log/main';
import { DIRECTORY_SCAN_DEPTH } from '../config/config';
import { $messages } from '../config/strings';
import appListeners from './app-listeners';
import { AutoUpdate } from './auto-update';
import { createMainWindow, createSettingsWindow } from './create-window';
import debugging from './debugging';
import errorHandling from './error-handling';
import kb from './keyboard';
import logger from './logger';
import { setupDockMenu } from './menu';
import { __crosshairs } from './paths';
import protocol from './protocol';
import { refreshSettingsOnAppStart } from './reset';
import sounds from './sounds';
import { setCrosshairImages } from './store-actions';
import tray from './tray';
import { debugInfo, is } from './util';
import { getImages } from './utils/getImages';

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
	kb.registerKeyboardShortcuts();

	// Create the main browser window.
	await createMainWindow();

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

	getImages(__crosshairs, DIRECTORY_SCAN_DEPTH)
		.then((images) => {
			setCrosshairImages(images);
		})
		.catch((error) => {
			Logger.error(error);
		});

	await createSettingsWindow();

	Logger.status($messages.idle);
};
