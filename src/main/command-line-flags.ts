// https://www.electronjs.org/docs/latest/api/command-line-switches
import { app } from 'electron';
import Logger from 'electron-log';
import { getSettings } from './store-actions';

const initialize = () => {
	const { commandLineFlags, hardwareAcceleration } = getSettings();

	console.log('commandLineFlags', commandLineFlags);

	if (!app.requestSingleInstanceLock()) {
		app.quit();
	}

	if (!hardwareAcceleration) {
		app.disableHardwareAcceleration();
	}

	if (commandLineFlags?.length > 0) {
		commandLineFlags.forEach((flag) => {
			Logger.status(`Setting command-line switch: ${flag}`);
			app.commandLine.appendSwitch(flag);
		});
	}
};

export default { initialize };
