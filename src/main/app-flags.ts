import { app } from 'electron';
import Logger from 'electron-log';
import { $init } from '../config/strings';
import { is } from './util';

const initialize = () => {
	Logger.status($init.appFlags);

	// Prevent multiple instances of the app
	if (is.prod && !app.requestSingleInstanceLock()) {
		app.quit();
	}
};

export default { initialize };
