import { SettingsType } from '../config/settings';
import sound from './sounds';
import { getSettings, resetStore, setSettings } from './store-actions';
import { is } from './util';

export const resetApp = () => {
	// Sonic announcement
	sound.play('RESET');
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
