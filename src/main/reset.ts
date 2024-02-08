import { app } from 'electron';
import { SettingsType } from '../config/settings';
import sounds from './sounds';
import {
	getSettings,
	resetStore,
	setActionStateKey,
	setSettings,
} from './store-actions';

export const restartApp = () => {
	app.relaunch(); // ONLY CALL THIS FUNCTION ONCE, or else it will cause multiple instances of the app to run
	app.quit(); // Must be called after app.relaunch() to actually quit the app
};

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
	const resetSettings: Partial<SettingsType> = {
		isHidden: false,
		isSettingsWindowOpen: false,
		currentTilt: 0,
		resetOnAppStart: false,
		hadFirstRun: true,
	};

	// Unlock app if it was locked (unless it's set to start locked)
	if (!startLocked) {
		resetSettings.isLocked = false;
	}

	setSettings(resetSettings);
	setActionStateKey('tilt', 0);
};
