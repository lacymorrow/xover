import { app } from 'electron';
import { SettingsType } from '../config/settings';
import sounds from './sounds';
import { getSettings, resetStore, setSettings } from './store-actions';
import { is } from './util';

export const restartApp = () => {
	app.relaunch(); // ONLY CALL THIS FUNCTION ONCE, or else it will cause multiple instances of the app to run
	app.quit(); // maybe the application will be closed; maybe not
};

export const resetApp = () => {
	// Sonic announcement
	sounds.play('RESET');
	resetStore();
};

export const refreshSettingsOnAppStart = () => {
	const { resetOnAppStart, startLocked } = getSettings();
	if (is.debug || resetOnAppStart) {
		resetApp();
		return;
	}

	// Reset settings to default on app start
	const resetSettings: Partial<SettingsType> = {
		isHidden: false,
		isSettingsWindowOpen: false,
		currentTilt: 0,
		resetOnAppStart: false,
	};

	// Unlock app if it was locked (unless it's set to start locked)
	if (!startLocked) {
		resetSettings.isLocked = false;
	}

	setSettings(resetSettings);
};
