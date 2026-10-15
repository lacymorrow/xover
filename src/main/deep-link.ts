// Deep links: crossover://activate?key=XOVER-...
// The checkout success page opens this after a Pro purchase so the app
// activates itself. macOS delivers links via `open-url`; Windows and Linux
// launch a second instance with the link in argv.

import { app } from 'electron';
import Logger from 'electron-log';
import { PROTOCOL } from '../config/config';
import {
	activateLicense,
	getLicenseStatus,
	notifyLicenseChanged,
} from './license';
import notifications from './notifications';
import { getSetting } from './store-actions';
import { openSettingsWindow } from './utils/settingsWindow';
import windows from './windows';

const KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/;

let isReady = false;
let pendingUrl: string | null = null;

export const findDeepLink = (argv: string[]) =>
	argv.find((arg) => arg.startsWith(`${PROTOCOL}://`)) ?? null;

export const parseDeepLink = (url: string) => {
	try {
		const parsed = new URL(url);
		if (parsed.protocol !== `${PROTOCOL}:`) return null;
		if (parsed.hostname !== 'activate') return null;
		const key = parsed.searchParams.get('key')?.trim() ?? '';
		return KEY_PATTERN.test(key) ? { action: 'activate' as const, key } : null;
	} catch {
		return null;
	}
};

const showSettings = () => {
	// openSettingsWindow toggles, so only call it when the window is hidden
	if (!getSetting('isSettingsWindowOpen')) {
		openSettingsWindow();
	} else {
		windows.settingsWindow?.show();
		windows.settingsWindow?.focus();
	}
};

const run = async (url: string) => {
	const link = parseDeepLink(url);
	if (!link) {
		Logger.warn('Ignoring unrecognized deep link');
		return;
	}

	const current = getLicenseStatus();
	if (current.isPremium) {
		// Never let a link replace a working license
		showSettings();
		notifications.renderer({ title: 'CrossOver Pro is already active' });
		return;
	}

	const result = await activateLicense(link.key);
	notifyLicenseChanged();
	showSettings();

	if (result.success) {
		notifications.renderer({
			title: 'CrossOver Pro is active',
			body: 'Thanks for supporting CrossOver.',
		});
	} else {
		notifications.renderer({
			title: "Couldn't activate CrossOver Pro",
			body: `${result.error ?? 'Activation failed.'} You can paste your key in Settings > License.`,
		});
	}
};

export const handleDeepLink = (url: string | null) => {
	if (!url) return;
	if (!isReady) {
		pendingUrl = url;
		return;
	}
	run(url).catch((error) => Logger.error('Deep link failed:', error));
};

// Call before app is ready: `open-url` can fire during launch on macOS
export const registerDeepLinks = () => {
	// In dev this would point the OS at the bare Electron binary
	if (app.isPackaged && !app.isDefaultProtocolClient(PROTOCOL)) {
		app.setAsDefaultProtocolClient(PROTOCOL);
	}

	app.on('open-url', (event, url) => {
		event.preventDefault();
		handleDeepLink(url);
	});

	handleDeepLink(findDeepLink(process.argv));
};

// Call once the settings window exists
export const deepLinksReady = () => {
	isReady = true;
	const url = pendingUrl;
	pendingUrl = null;
	handleDeepLink(url);
};
