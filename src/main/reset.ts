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

export const resetApp = () => {
	// Sonic announcement
	sounds.play('RESET');
	resetStore();
};

export const refreshSettingsOnAppStart = () => {
	const { resetOnAppStart, startLocked } = getSettings();
	if (resetOnAppStart) {
		resetApp();
		return;
	}

	// Reset settings to default on app start
	const freshSettings: Partial<SettingsType> = {
		isHidden: false,
		isSettingsWindowOpen: false,
		currentTilt: 0,
		resetOnAppStart: false,
		hadFirstRun: true,
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

export const resetSettings = () => {
	// Sonic announcement
	sounds.play('RESET');
	resetStoreSettings();
	refreshSettingsOnAppStart();
};
