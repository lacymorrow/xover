import { app } from 'electron';
import fs from 'fs';
import path from 'path';

/**
 * When electron-builder's portable target launches the exe it sets
 * PORTABLE_EXECUTABLE_DIR to the directory holding the .exe. Redirect userData,
 * logs and crash dumps into a `data/` folder next to it so a portable copy keeps
 * its settings in that folder instead of %APPDATA%\CrossOver.
 *
 * Ported from CrossOver v3 (#521 / #379). No effect on installer builds.
 * See https://www.electron.build/configuration/nsis#portable
 */
export const initPortablePaths = (): boolean => {
	const portableDir = process.env.PORTABLE_EXECUTABLE_DIR;
	if (!portableDir) {
		return false;
	}

	const dataDir = path.join(portableDir, 'data');
	const logsDir = path.join(dataDir, 'logs');
	const crashDir = path.join(dataDir, 'crashDumps');

	try {
		fs.mkdirSync(logsDir, { recursive: true });
		fs.mkdirSync(crashDir, { recursive: true });
		app.setPath('userData', dataDir);
		app.setPath('logs', logsDir);
		app.setPath('crashDumps', crashDir);
	} catch (error) {
		// Read-only media, or a folder we can't write to: fall back to the
		// default %APPDATA% paths rather than refusing to launch.
		// Logger isn't configured this early, so console is the only channel.
		// eslint-disable-next-line no-console
		console.error('[portable] could not use portable paths:', error);
		return false;
	}

	return true;
};

/**
 * Resolved at import time on purpose. electron-store and electron-log read
 * app.getPath('userData') when their modules load, so the redirect has to happen
 * before any of them are imported. main.ts imports this module first for that
 * reason — keep it there.
 */
export const isPortable = initPortablePaths();
