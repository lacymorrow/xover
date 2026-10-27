import { app, screen } from 'electron';
import Logger from 'electron-log';
import { SettingsType } from '../config/settings';
import { isResetRequested } from './command-line-flags';
import sounds from './sounds';
import {
	getSettings,
	resetStore,
	resetStoreSettings,
	setActionStateKey,
	setSettings,
} from './store-actions';
import { scanImages } from './utils/getImages';
import { centerWindow, forEachCrosshairWindow } from './utils/window-utils';

export const resetApp = () => {
	// Sonic announcement
	sounds.play('RESET');
	resetStore();
};

export const refreshSettingsOnAppStart = () => {
	const { appVersion, hadFirstRun, resetOnAppStart, startLocked } =
		getSettings();

	// `crossover --reset` wipes the store on launch, for when stored settings are
	// what's keeping the app from starting.
	if (isResetRequested()) {
		Logger.status('Command-line reset requested');
		resetApp();
	} else if (resetOnAppStart) {
		resetApp();
	}

	if (!hadFirstRun) {
		// This is the first run of the app!
		// ... do something special
	}

	const currentAppVersion = app.getVersion();
	if (appVersion !== currentAppVersion) {
		// The app has been updated!
		// ... do something special like migrations
	}

	// Reset settings to default on app start
	const freshSettings: Partial<SettingsType> = {
		appVersion: currentAppVersion,
		hadFirstRun: true,

		isHidden: false,
		// Transient, like isHidden. The Toggle Reticle keybind is a mid-match
		// action; persisting it would relaunch into a missing reticle with no
		// setting anywhere to explain why. v3 persisted this and had no UI for it.
		isReticleHidden: false,
		isSettingsWindowOpen: false,
		currentTilt: 0,
		resetOnAppStart: false,
	};

	// Unlock app if it was locked (unless it's set to start locked)
	if (!startLocked) {
		freshSettings.isLocked = false;
	}

	setSettings(freshSettings);
	setActionStateKey('tilt', 0);
};

export const restartApp = () => {
	app.relaunch(); // ONLY CALL THIS FUNCTION ONCE, or else it will cause multiple instances of the app to run
	app.quit(); // Must be called after app.relaunch() to actually quit the app
};

/**
 * Put every crosshair window back in the middle of the display it is currently
 * on. Reset means back to defaults, and the default position is centered: a
 * reset that restored every setting but left the crosshair parked in a corner
 * read as a reset that had not run (LAC-5839).
 *
 * The window's own display, not the cursor's, which is what centerWindow()
 * falls back to.
 */
const centerCrosshairWindows = () => {
	forEachCrosshairWindow((window) => {
		centerWindow({
			window,
			display: screen.getDisplayNearestPoint(window.getBounds()),
			animated: true,
		});
	});
};

export const resetSettings = () => {
	// Sonic announcement
	sounds.play('RESET');

	// Rescan images
	scanImages();

	resetStoreSettings();
	refreshSettingsOnAppStart();
	centerCrosshairWindows();
};
