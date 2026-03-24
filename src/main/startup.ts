import { app } from 'electron';
import Logger from 'electron-log/main';
import { $init } from '../config/strings';
import analytics from './analytics';
import appListeners from './app-listeners';
import commandLineFlags from './command-line-flags';
import {
	createOrReloadCrosshairWindows,
	createSettingsWindow,
} from './create-window';
import debugging from './debugging';
import errorHandling from './error-handling';
import kb from './keyboard';
import logger from './logger';
import { setupDockMenu } from './menu';
import protocol from './protocol';
import { refreshSettingsOnAppStart } from './reset';
import sounds from './sounds';
import tray from './tray';
import { debugInfo, is } from './util';
import { AutoUpdate } from './auto-update';
import accessibility from './accessibility';
import { scanImages } from './utils/getImages';
import devAlerts from './alert';

export const startup = () => {
	console.timeLog(app.name, $init.startup);

	try {
		// Initialize logger
		logger.initialize();

		// Initialize analytics
		analytics.initialize();
		analytics.track('app_started');

		// Initialize the error handler
		errorHandling.initialize();

    refreshSettingsOnAppStart();

		// Enable electron debug and source map support
		debugging.initialize();

		// App CLI flags
		commandLineFlags.initialize();

    protocol.register();

    // macOS accessibility permissions (non-blocking)
    accessibility.initializeAccessibilityCheck();

		// Register app listeners, e.g. `app.on()`
		appListeners.register();

		Logger.status($init.started);
		console.timeLog(app.name, $init.started);
	} catch (error) {
		Logger.error('Startup initialization failed', error);
		// TODO: Notify the user or attempt a graceful shutdown
		app.quit();
	}
};

export const ready = async () => {
	Logger.status($init.ready);
	console.timeLog(app.name, $init.ready);

	// Log Node/Electron versions
	Logger.info(debugInfo());

	if (is.debug) {
		await debugging.installExtensions();
	}

	// Register custom protocol like `app://`
	protocol.initialize();

	// Add remaining app listeners
	appListeners.ready();

	// Setup keyboard shortcuts
	kb.registerKeyboardShortcuts();

	createOrReloadCrosshairWindows();

	// Setup Dock Menu
	setupDockMenu();

	// Setup Tray
	tray.initialize();

  // Auto updates
  // eslint-disable-next-line no-new
  new AutoUpdate();

	// Idle
	Logger.status($init.mainIdle);
	console.timeLog(app.name, $init.mainIdle);
};

export const idle = async () => {
	await createSettingsWindow();
	sounds.play('STARTUP');

	// ... do something with your app

	Logger.status($init.idle);
	console.timeLog(app.name, $init.idle);
	await scanImages();
  devAlerts.initDeveloperAlerts();
};

process.on('uncaughtException', (error) => {
	Logger.error('Uncaught exception:', error);
	// Optionally, you can show an error dialog to the user here
});

process.on('unhandledRejection', (reason, promise) => {
	Logger.error('Unhandled rejection at:', promise, 'reason:', reason);
	// Optionally, you can show an error dialog to the user here
});
