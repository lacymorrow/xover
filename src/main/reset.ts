import { SettingsType } from '../config/settings';
import sound from './sounds';
import { getSetting, resetStore, setSettings } from './store-actions';
import { is } from './util';

export const resetApp = () => {
	// Sonic announcement
	sound.play('RESET');
	resetStore();
};

export const refreshSettingsOnAppStart = () => {
	if (is.debug || getSetting('resetOnAppStart')) {
		resetApp();
		return;
	}

	const resetSettings: Partial<SettingsType> = {
		currentlyHidden: false,
		currentTilt: 0,
		resetOnAppStart: false,
	};

	if (!getSetting('startLocked')) {
		resetSettings.locked = false;
	}
	setSettings(resetSettings);
};
