import { app } from 'electron';
import { is } from './util';

const initialize = () => {
	// Prevent multiple instances of the app
	if (is.prod && !app.requestSingleInstanceLock()) {
		app.quit();
	}
};

export default { initialize };
