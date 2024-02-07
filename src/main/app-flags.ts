// https://www.electronjs.org/docs/latest/api/command-line-switches
import { app } from 'electron';
import { getSettings } from './store-actions';

const initialize = () => {
	const { hardwareAcceleration } = getSettings();

	if (!app.requestSingleInstanceLock()) {
		app.quit();
	}

	if (!hardwareAcceleration) {
		app.disableHardwareAcceleration();
	}

	// todo

	// if (flagDisableGpu) {
	// 	app.commandLine.appendSwitch('disable-gpu');
	// }

	// if (flagDisableSoftwareRasterizer) {
	// 	app.commandLine.appendSwitch('disable-software-rasterizer');
	// }

	// if (flagDisableSoftwareRasterizer) {
	// 	app.commandLine.appendSwitch('enable-transparent-visuals');
	// }

	// if (flagInProcessGpu) {
	// 	app.commandLine.appendSwitch('in-process-gpu');
	// }

	// 		--force_high_performance_gpu
	// Force using discrete GPU when there are multiple GPUs available.

	// --force_low_power_gpu
	// Force using integrated GPU when there are multiple GPUs available.
};

export default { initialize };
