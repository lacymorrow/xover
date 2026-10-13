/**
 * First-run import of CrossOver v3 settings.
 *
 * v3 stored settings (electron-preferences) in `<userData>/preferences.json`.
 * v4 uses electron-store, whose file is `<userData>/config.json`, so the two
 * never collide. We only ever read preferences.json: users may go back to v3.
 */
import { app } from 'electron';
import Logger from 'electron-log';
import fs from 'fs';
import path from 'path';
import { DEFAULT_CROSSHAIR_WINDOW_STATE } from '../config/settings';
import { getUUID } from '../utils/getUUID';
import { mapV3Preferences } from './migrate-v3';
import { __crosshairs } from './paths';
import store from './store';

const V3_FILE = 'preferences.json';
const MAX_FILE_BYTES = 1024 * 1024;

const findV3File = () => {
	// Both apps are named "CrossOver" so userData is shared; the appData
	// fallback covers dev runs where the app name is lowercase "crossover".
	const dirs = [
		app.getPath('userData'),
		path.join(app.getPath('appData'), 'CrossOver'),
	];
	return dirs
		.map((dir) => path.join(dir, V3_FILE))
		.find((file) => fs.existsSync(file));
};

/** Returns true if settings were imported. Never throws. */
export const importV3Settings = (): boolean => {
	try {
		if (
			store.get('settings').hadFirstRun ||
			store.get('migrations')?.v3Imported
		) {
			return false;
		}

		const file = findV3File();
		if (!file) return false;

		if (fs.statSync(file).size > MAX_FILE_BYTES) {
			Logger.warn(`v3 import: ${file} is too large, skipping`);
			return false;
		}

		let prefs: unknown;
		try {
			prefs = JSON.parse(fs.readFileSync(file, 'utf8'));
		} catch (error) {
			Logger.warn(`v3 import: ${file} is not valid JSON, skipping`, error);
			return false;
		}

		const result = mapV3Preferences(prefs, {
			crosshairsDir: __crosshairs,
			fileExists: (p) => fs.existsSync(p),
		});
		if (!result) {
			Logger.warn(`v3 import: ${file} has no recognizable settings, skipping`);
			return false;
		}

		// Settings
		store.set('settings', { ...store.get('settings'), ...result.settings });

		// Keybinds
		store.set('keybinds', { ...store.get('keybinds'), ...result.keybinds });

		// Crosshair window: v3 had a single window, so create one v4 window for it
		const id = getUUID();
		store.set(`windows.${id}`, {
			...DEFAULT_CROSSHAIR_WINDOW_STATE,
			...result.windowState,
		});
		store.set('activeWindow', id);

		// Custom images the user picked in v3 stay in the gallery
		if (result.customImages.length > 0) {
			store.set('images', [
				...new Set([...store.get('images'), ...result.customImages]),
			]);
		}

		if (result.settings.startOnLogin) {
			app.setLoginItemSettings({ openAtLogin: true });
		}

		store.set('migrations', { v3Imported: true, v3ImportedAt: Date.now() });

		Logger.info(
			`Imported CrossOver v3 settings from ${file}`,
			`\n  imported:\n    ${result.imported.join('\n    ')}`,
			`\n  skipped:\n    ${result.skipped.join('\n    ')}`,
		);
		return true;
	} catch (error) {
		Logger.error('v3 import failed, continuing with defaults', error);
		return false;
	}
};
