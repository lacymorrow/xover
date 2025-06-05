/* eslint-disable global-require */
import Logger from 'electron-log/main';
import { $init } from '../config/strings';
import { is } from './util';

const initialize = () => {
	// Enable source map support in production
	if (is.prod) {
		const sourceMapSupport = require('source-map-support');
		sourceMapSupport.install();
	}

	// Enable debug utilities in development
	if (is.debug) {
		require('electron-debug')({
			showDevTools: true,
			devToolsMode: 'undocked',
		});
	}

	Logger.status($init.debugging);
};

// Add debugging extensions like `react-devtools` and `redux-devtools`
const installExtensions = async () => {
	try {
		const installer = require('electron-devtools-installer');
		const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
		const extensions = ['REACT_DEVELOPER_TOOLS'];

		Logger.info('Installing development extensions...');
		await installer.default(
			extensions.map((name) => installer[name]),
			forceDownload,
		);
		Logger.info('Development extensions installed successfully');
	} catch (error) {
		// Handle CRX format errors and other extension installation issues gracefully
		const errorMessage = error instanceof Error ? error.message : String(error);
		if (errorMessage?.includes('Invalid header: Does not start with Cr24')) {
			Logger.warn(
				'Chrome extension format issue - this is non-critical and app will continue normally',
			);
		} else {
			Logger.warn('Failed to install development extensions:', errorMessage);
		}
	}
};

export default {
	initialize,
	installExtensions,
};
