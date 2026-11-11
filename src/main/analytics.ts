import { initialize as aptabase, trackEvent } from '@aptabase/electron/main';
import Logger from 'electron-log';
import { $init } from '../config/strings';
import { getSetting } from './store-actions';

/**
 * Aptabase telemetry (LAC-7620). Five events and nothing else: app_open,
 * feature_used(name), purchase_started, purchase_completed, error(class).
 * No content, no license keys, no identifiers. One switch
 * (settings.allowAnalytics, default on) is read before every event, so
 * turning it off stops events at once.
 */

/** Aptabase Cloud US app key for CrossOver. Ships in the binary; not a secret. */
const APP_KEY = 'A-US-3480695765';

let initialized = false;

const enabled = () => getSetting('allowAnalytics') !== false;

/** Starts the SDK once, and only while the switch is on. */
const ensureInitialized = () => {
	if (initialized || !enabled()) {
		return initialized;
	}

	Logger.status($init.analytics);
	aptabase(APP_KEY);
	initialized = true;
	return true;
};

const send = (event: string, props?: Record<string, string>) => {
	try {
		if (!enabled() || !ensureInitialized()) {
			return;
		}
		trackEvent(event, props);
	} catch {
		// Telemetry must never change what the app does.
	}
};

const initialize = () => {
	ensureInitialized();
};

export default {
	initialize,
	appOpen: () => send('app_open'),
	feature: (name: string) => send('feature_used', { name }),
	purchaseStarted: () => send('purchase_started'),
	purchaseCompleted: () => send('purchase_completed'),
	/** Pass a class name such as "TypeError", never a message or stack. */
	error: (errorClass: string) => send('error', { class: errorClass }),
};
