// https://www.electronjs.org/docs/latest/api/command-line-switches
import { app } from 'electron';
import Logger from 'electron-log';
import { getSettings } from './store-actions';

/**
 * `crossover --reset` is the escape hatch when stored settings stop the app from
 * launching at all. Some Linux launchers (AppImage, Snap, Flatpak) strip
 * Chromium switches, so hasSwitch() alone misses it — scan argv too.
 *
 * Ported from v3 (6b5a1d2, #450/#486).
 */
export const isResetRequested = (): boolean => {
	// A reset is destructive, so CROSSOVER_RESET=0/false/no/off means off
	// rather than "any value is truthy" (ported from v3 #583).
	const env = process.env.CROSSOVER_RESET;
	if (
		env !== undefined &&
		!['', '0', 'false', 'no', 'off'].includes(env.trim().toLowerCase())
	) {
		return true;
	}

	if (app.commandLine.hasSwitch('reset')) {
		return true;
	}

	return process.argv
		.slice(1)
		.some((arg) => arg === '--reset' || arg === '-reset' || arg === 'reset');
};

const initialize = () => {
	if (!app.requestSingleInstanceLock()) {
		app.quit();
		return;
	}

	// A reset run ignores the stored flags on purpose: one of them can be what
	// crashes the GPU process before the reset gets a chance to finish.
	if (isResetRequested()) {
		Logger.status('Reset mode: forcing safe GPU settings');
		app.commandLine.appendSwitch('disable-gpu');
		app.disableHardwareAcceleration();
		return;
	}

	const { commandLineFlags, hardwareAcceleration } = getSettings();

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
