/**
 * Repair of the electron-store file on disk, before electron-store reads it.
 *
 * electron-store parses config.json inside its constructor and throws when the
 * file isn't valid JSON or isn't an object at the root. store.ts constructs the
 * store at module load, which is long before logger.catchErrors() is installed,
 * so on Windows the throw left one CrossOver.exe running with no window and
 * nothing in the log file (LAC-8618).
 *
 * The common cause is a UTF-8 BOM: PowerShell 5's `Set-Content -Encoding UTF8`
 * writes one, and so do several Windows editors, so a user who hand-edits
 * %APPDATA%\CrossOver\config.json gets a file that looks right and won't load.
 * A BOM is the one kind of damage we can undo without losing settings, so it is
 * stripped in place; anything else unparseable is moved aside and the app starts
 * from defaults.
 *
 * fs only, no electron, apart from resolveConfigFilePath().
 */
import { app } from 'electron';
import Logger from 'electron-log';
import fs from 'fs';
import path from 'path';

/** electron-store's default `name` is 'config' */
export const CONFIG_FILE_NAME = 'config.json';

const BOM = '﻿';

export type ConfigRepairAction =
	/** Nothing to do: no file yet, or it parses as-is */
	| 'none'
	/** Leading BOM removed, settings kept */
	| 'bom-stripped'
	/** Unusable file moved aside, app starts from defaults */
	| 'quarantined'
	/** We could not read or rewrite the file; startup continues regardless */
	| 'failed';

export interface ConfigRepairResult {
	action: ConfigRepairAction;
	/** Where the unusable file was moved, when action is 'quarantined' */
	backupPath?: string;
	/** Why the repair could not run, when action is 'failed' */
	reason?: string;
}

const isPlainObject = (value: unknown): boolean =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const errorMessage = (error: unknown): string =>
	error instanceof Error ? error.message : String(error);

let sequence = 0;

// Colons are not legal in Windows filenames, so no toISOString() as-is. The pid
// and counter are what keep two repairs in the same millisecond apart: renameSync
// overwrites its destination, so a repeated name silently destroys the copy the
// previous one kept (LAC-8624 item 3).
const stamp = (): string => {
	sequence += 1;

	return `${new Date().toISOString().replace(/[:.]/g, '-')}-${
		process.pid
	}-${sequence}`;
};

// Belt and braces for the one case the pid and counter cannot cover: a name left
// by an earlier run of a recycled pid, after a clock that went backwards.
const freePath = (candidate: string): string => {
	let result = candidate;

	for (let attempt = 1; attempt < 100 && fs.existsSync(result); attempt += 1) {
		result = `${candidate}-${attempt}`;
	}

	return result;
};

const backupPathFor = (filePath: string): string =>
	freePath(`${filePath}.corrupt-${stamp()}`);

const quarantine = (filePath: string): ConfigRepairResult => {
	const backupPath = backupPathFor(filePath);

	try {
		fs.renameSync(filePath, backupPath);
	} catch (error) {
		return {
			action: 'failed',
			reason: `could not move ${filePath} aside: ${errorMessage(error)}`,
		};
	}

	return { action: 'quarantined', backupPath };
};

const rewriteWithoutBom = (
	filePath: string,
	body: string,
): ConfigRepairResult => {
	// Write a sibling and rename over the original: a crash mid-write then
	// leaves the file it already had rather than a truncated one, which is the
	// same damage this module exists to recover from.
	const tempPath = `${filePath}.repair-${stamp()}`;

	try {
		fs.writeFileSync(tempPath, body, 'utf8');
		fs.renameSync(tempPath, filePath);
	} catch (error) {
		try {
			fs.rmSync(tempPath, { force: true });
		} catch {
			// Best effort: a leftover temp file is harmless, the store ignores it.
		}

		return {
			action: 'failed',
			reason: `could not rewrite ${filePath}: ${errorMessage(error)}`,
		};
	}

	return { action: 'bom-stripped' };
};

/**
 * Make `filePath` safe for electron-store to parse. Never throws: a repair we
 * can't perform must not be a second way to fail startup.
 */
export const repairConfigFile = (filePath: string): ConfigRepairResult => {
	let raw: string;

	try {
		raw = fs.readFileSync(filePath, 'utf8');
	} catch (error) {
		if ((error as { code?: string })?.code === 'ENOENT') {
			// First run. electron-store writes the defaults itself.
			return { action: 'none' };
		}

		return {
			action: 'failed',
			reason: `could not read ${filePath}: ${errorMessage(error)}`,
		};
	}

	const hasBom = raw.startsWith(BOM);
	const body = hasBom ? raw.slice(BOM.length) : raw;

	let parsed: unknown;

	try {
		parsed = JSON.parse(body);
	} catch {
		// Truncated write, a half-saved file, or a UTF-16 config read back as
		// UTF-8. Nothing to salvage.
		return quarantine(filePath);
	}

	// Valid JSON is not enough: electron-store validates an object at the root
	// and throws for an array, a string or null.
	if (!isPlainObject(parsed)) {
		return quarantine(filePath);
	}

	return hasBom ? rewriteWithoutBom(filePath, body) : { action: 'none' };
};

/**
 * Keep a copy of a config file that electron-store refused to parse and that
 * repairConfigFile() could not move aside, so the next thing to write the file
 * is not the only record of what was in it. Copies instead of renaming: the
 * rename is the call that already failed. Never throws, and returns undefined
 * when no copy could be made.
 */
export const preserveUnreadableConfig = (
	filePath: string,
): string | undefined => {
	const backupPath = backupPathFor(filePath);

	try {
		fs.copyFileSync(filePath, backupPath);
	} catch {
		return undefined;
	}

	return backupPath;
};

export const resolveConfigFilePath = (): string =>
	path.join(app.getPath('userData'), CONFIG_FILE_NAME);

/**
 * Called from store.ts immediately before `new Store()`. Logs what it did, so
 * the next report of a config that won't load has a line to point at.
 */
export const repairStoreFileOnDisk = (): ConfigRepairResult => {
	let result: ConfigRepairResult;

	try {
		result = repairConfigFile(resolveConfigFilePath());
	} catch (error) {
		result = { action: 'failed', reason: errorMessage(error) };
	}

	switch (result.action) {
		case 'bom-stripped':
			Logger.warn(
				'[config] config.json had a UTF-8 BOM. Removed it, settings kept.',
			);
			break;
		case 'quarantined':
			Logger.warn(
				`[config] config.json could not be parsed. Moved it to ${result.backupPath} and starting from defaults.`,
			);
			break;
		case 'failed':
			Logger.error(`[config] could not check config.json: ${result.reason}`);
			break;
		default:
			break;
	}

	return result;
};
