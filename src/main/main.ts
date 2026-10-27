/* eslint global-require: off, no-console: off, promise/always-return: off */

// todo: app registration
// sounds for actions
// logging
// translations
// protocol
// analytics
// Scroll reset when changing settings page
// improve keybind input
// Large crosshair chooser
// Add a way to reset settings like slider values to default
// Secondary crosshair - 61
// SVG support
// Image overlay - 112
// Tray/Dock menus
// Reset app button in settings should restart app
// Restart app doesn't work - Unable to parse /Users/lacy/repo/xover/package.json process.send is not a function
// First Run
// Migrations
// Notify of new version
// Ask for accessiblity permissions MAC
// Less Renderer sync
// use same dock icon
// dock icon remains after quitting
// position settings
// resizeable window crosshair doesn't stay centered

/*
Done:
- Disable all keyboard shortcuts - 299
- Multiple crosshair windows - save window state
/*

Todo:
- Allow disabling of the inputs
- Debounce Slider/color picker input
- sass
- Homepage
- Documentation
*/

// MUST stay the first import. Portable builds redirect userData from here, and
// electron-store / electron-log resolve that path when their modules load.
// eslint-disable-next-line import/order
import { isPortable } from './portable';

import { app } from 'electron';
import Logger from 'electron-log';
import { $errors, $init } from '../config/strings';

import { findDeepLink, handleDeepLink, registerDeepLinks } from './deep-link';
import ipc from './ipc';
import { ready, startup } from './startup';

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
	app.quit();
} else {
	// Must be registered before ready: macOS sends launch links via open-url
	registerDeepLinks();

	app.on('second-instance', (_event, argv) => {
		// Windows and Linux deliver crossover:// links in the new instance's argv
		handleDeepLink(findDeepLink(argv));

		// Showing the app is handled by the listener in app-listeners.ts, which
		// also unlocks and unhides it (LAC-5839).
	});
}

const launch = () => {
	// Initialize the timer
	console.time(app.name);
	console.timeLog(app.name, $init.app);

	if (isPortable) {
		Logger.info(`Portable mode: userData is ${app.getPath('userData')}`);
	}

	// Register ipcMain listeners
	ipc.initialize();

	// SETUP APP (runs after startup())
	app
		.whenReady()
		.then(ready) // <-- this is where the app is initialized
		.catch((error: Error) => {
			Logger.error($errors.prefix, error);
		});

	// LAUNCH THE APP
	startup();
};

// A second copy hands off to the first and exits without starting up
if (gotTheLock) {
	launch();
}

// See the idle() function in src/main/startup.ts
// it's called in the ipcMain.on(ipcChannels.RENDERER_READY) listener
// when the renderer process is ready
