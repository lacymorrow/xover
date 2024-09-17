import { app } from 'electron';
import Logger from 'electron-log';
import { getSetting } from '../store-actions';
import { is } from '../util';
import { getNextCrosshairWindow } from './window-utils';

export const windowClosed = () => {
	// If there are still crosshair windows open, we don't want to quit the app
	if (getNextCrosshairWindow()) {
		return;
	}

	// Respect the OSX convention of having the application in memory even
	// after all windows have been closed
	if (!is.macos || getSetting('quitOnWindowClose')) {
		Logger.status('App is quitting');
		app.quit();
	}
};
