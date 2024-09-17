import { app } from 'electron';
import { SettingsType } from '../config/settings';
import sounds from './sounds';
import {
	getSettings,
	resetStore,
	resetStoreSettings,
	setActionStateKey,
	setSettings,
} from './store-actions';
import { scanImages } from './utils/getImages';
import windows from './windows';

export const resetApp = () => {
	// Sonic announcement
	sounds.play('RESET');
	resetStore();
};

export const refreshSettingsOnAppStart = () => {
	const { appVersion, hadFirstRun, resetOnAppStart, startLocked } =
		getSettings();

	if (resetOnAppStart) {
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

	windows.crosshairWindows = {};
};

export const restartApp = () => {
	app.relaunch(); // ONLY CALL THIS FUNCTION ONCE, or else it will cause multiple instances of the app to run
	app.quit(); // Must be called after app.relaunch() to actually quit the app
};

export const resetSettings = () => {
	// Sonic announcement
	sounds.play('RESET');

	// Rescan images
	scanImages();

	resetStoreSettings();
	refreshSettingsOnAppStart();
};
