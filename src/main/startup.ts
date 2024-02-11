import { app } from 'electron';
import Logger from 'electron-log/main';
import { DIRECTORY_SCAN_DEPTH } from '../config/config';
import { $init } from '../config/strings';
import appListeners from './app-listeners';
import { AutoUpdate } from './auto-update';
import {
	createOrReloadCrosshairWindows,
	createSettingsWindow,
} from './create-window';
import debugging from './debugging';
import kb from './keyboard';
import logger from './logger';
import { setupDockMenu } from './menu';
import { __crosshairs } from './paths';
import protocol from './protocol';
import { refreshSettingsOnAppStart } from './reset';
import sounds from './sounds';
import { getCrosshairImages, setCrosshairImages } from './store-actions';
import tray from './tray';
import { debugInfo, is } from './util';
import { getImages } from './utils/getImages';

export const startup = () => {
	console.timeLog(app.name, $init.startup);

	// Initialize logger
	logger.initialize();

	// Initialize analytics
	// analytics.initialize();
	// analytics.track('app_started');

	// Initialize the error handler
	// errorHandling.initialize();

	refreshSettingsOnAppStart();

	// Enable electron debug and source map support
	// debugging.initialize();

	// App CLI flags
	// commandLineFlags.initialize();

	// Register app listeners, e.g. `app.on()`
	appListeners.register();

	Logger.status($init.started);
	console.timeLog(app.name, $init.started);
};

export const ready = async () => {
	Logger.status($init.ready);
	console.timeLog(app.name, $init.ready);

	// Log Node/Electron versions
	Logger.info(debugInfo());

	if (is.debug) {
		await debugging.installExtensions();
	}

	// Add remaining app listeners
	appListeners.ready();

	// Setup keyboard shortcuts
	kb.registerKeyboardShortcuts();

	createOrReloadCrosshairWindows();

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
	Logger.status($init.mainIdle);
	console.timeLog(app.name, $init.mainIdle);
};

export const idle = async () => {
	console.log('idle', getCrosshairImages().length);
	// Load crosshair images
	setCrosshairImages([]);
	getImages(__crosshairs, DIRECTORY_SCAN_DEPTH)
		.then((images) => {
			setCrosshairImages(images);
		})
		.catch((error) => {
			Logger.error(error);
		});

	await createSettingsWindow();

	sounds.play('STARTUP');

	// ... do something with your app

	Logger.status($init.idle);
	console.timeLog(app.name, $init.idle);
};
