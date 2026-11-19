/**
 * @jest-environment node
 *
 * A config.json saved with a UTF-8 BOM (PowerShell 5's `Set-Content -Encoding
 * UTF8` writes one, and so do some editors) made electron-store throw
 * SyntaxError out of its constructor. store.ts constructs the store at module
 * load, before the logger's error handler is installed, so on Windows the app
 * left one CrossOver.exe running with no window and nothing in the log
 * (LAC-8618).
 */
import Logger from 'electron-log';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
	CONFIG_FILE_NAME,
	repairConfigFile,
	repairStoreFileOnDisk,
} from '../main/config-file';

let mockDir = '';

jest.mock('electron', () => ({
	app: {
		getPath: () => mockDir,
		getVersion: () => '4.0.0-test',
		isPackaged: false,
		isReady: () => true,
		on: jest.fn(),
	},
	ipcMain: { on: jest.fn(), handle: jest.fn(), removeHandler: jest.fn() },
}));

jest.mock('electron-log', () => ({
	status: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
}));

const BOM = '﻿';

let configPath: string;

const write = (contents: string) => fs.writeFileSync(configPath, contents);
const read = () => fs.readFileSync(configPath, 'utf8');
const siblings = () => fs.readdirSync(mockDir).sort();

beforeEach(() => {
	mockDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lac8618-'));
	configPath = path.join(mockDir, CONFIG_FILE_NAME);
	jest.clearAllMocks();
});

afterEach(() => {
	fs.rmSync(mockDir, { recursive: true, force: true });
});

describe('repairConfigFile', () => {
	it('strips a UTF-8 BOM and keeps every setting', () => {
		const body = JSON.stringify({ settings: { showDockIcon: false } });
		write(BOM + body);

		const result = repairConfigFile(configPath);

		expect(result.action).toBe('bom-stripped');
		expect(read()).toBe(body);
		expect(JSON.parse(read()).settings.showDockIcon).toBe(false);
		// Repair in place: no quarantine copy for a file we could recover, and no
		// leftover temp file from the rewrite.
		expect(siblings()).toEqual([CONFIG_FILE_NAME]);
	});

	it('leaves a clean config untouched', () => {
		const body = `${JSON.stringify({ settings: { theme: 'dark' } })}\n`;
		write(body);

		expect(repairConfigFile(configPath).action).toBe('none');
		expect(read()).toBe(body);
		expect(siblings()).toEqual([CONFIG_FILE_NAME]);
	});

	it('does nothing when there is no config yet', () => {
		expect(repairConfigFile(configPath).action).toBe('none');
		expect(fs.existsSync(configPath)).toBe(false);
		expect(siblings()).toEqual([]);
	});

	it.each([
		['a truncated write', '{"settings":'],
		['an empty file', ''],
		['whitespace only', '\n\n'],
		['a BOM plus junk', `${BOM}not json`],
		// Valid JSON, but electron-store validates an object at the root and
		// throws from the constructor for these too.
		['an array at the root', '[1,2]'],
		['a bare string', '"hi"'],
		['null', 'null'],
	])('quarantines %s and starts from defaults', (_label, contents) => {
		write(contents);

		const result = repairConfigFile(configPath);

		expect(result.action).toBe('quarantined');
		expect(result.backupPath).toBeDefined();
		// The broken file is kept, byte for byte, so it can still be inspected.
		expect(fs.readFileSync(result.backupPath as string, 'utf8')).toBe(contents);
		// Gone from the path electron-store reads, so it falls back to defaults.
		expect(fs.existsSync(configPath)).toBe(false);
	});

	it('reports a failure instead of throwing when the path is unusable', () => {
		// A directory where config.json should be: every fs call below fails.
		fs.mkdirSync(configPath);

		const result = repairConfigFile(configPath);

		expect(result.action).toBe('failed');
		expect(result.reason).toBeTruthy();
	});
});

describe('repairStoreFileOnDisk', () => {
	it('logs what it did to a BOM', () => {
		write(`${BOM}{"settings":{}}`);

		expect(repairStoreFileOnDisk().action).toBe('bom-stripped');
		expect(Logger.warn).toHaveBeenCalledWith(
			expect.stringContaining('UTF-8 BOM'),
		);
	});

	it('logs where it put an unparseable config', () => {
		write('{"settings":');

		const result = repairStoreFileOnDisk();

		expect(result.action).toBe('quarantined');
		expect(Logger.warn).toHaveBeenCalledWith(
			expect.stringContaining(result.backupPath as string),
		);
	});

	it('says nothing about a healthy config', () => {
		write('{"settings":{}}');

		expect(repairStoreFileOnDisk().action).toBe('none');
		expect(Logger.warn).not.toHaveBeenCalled();
		expect(Logger.error).not.toHaveBeenCalled();
	});
});

describe('the store reading a repaired config', () => {
	// The regression proof: the real parse and schema validation, on the real
	// file. electron-store is a subclass of conf that only works out `cwd` and
	// `projectVersion` from `app`, so conf with those two passed in reads the
	// file through exactly the code store.ts hits at startup. Going through
	// electron-store here would not: it resolves `electron` from the root
	// node_modules while this test file resolves it from src/node_modules, so
	// the mock above would not reach it.
	const loadStore = () => {
		jest.resetModules();
		// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
		const Conf = require('conf');
		return new Conf({
			cwd: mockDir,
			configName: 'config',
			projectVersion: '4.0.0-test',
			schema: { settings: { type: 'object', default: { showDockIcon: true } } },
		});
	};

	afterEach(() => {
		jest.resetModules();
	});

	it('throws on a BOM before the repair (the LAC-8618 hang)', () => {
		write(`${BOM}${JSON.stringify({ settings: { showDockIcon: false } })}`);

		expect(() => loadStore()).toThrow(SyntaxError);
	});

	it('loads, and keeps the user settings, after the repair', () => {
		write(`${BOM}${JSON.stringify({ settings: { showDockIcon: false } })}`);

		expect(repairConfigFile(configPath).action).toBe('bom-stripped');

		expect(loadStore().get('settings').showDockIcon).toBe(false);
	});

	it('loads with defaults after an unparseable config is quarantined', () => {
		write('{"settings":');

		expect(repairConfigFile(configPath).action).toBe('quarantined');

		expect(loadStore().get('settings').showDockIcon).toBe(true);
	});
});
