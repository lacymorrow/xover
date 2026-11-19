/**
 * @jest-environment node
 *
 * store.ts is the only caller of the config repair, and it is the wiring that
 * ships: it repairs the file on disk and then hands electron-store a
 * `clearInvalidConfig` flag. config-file-repair.test.ts proves the repair
 * itself; this proves store.ts uses it (LAC-8624 items 2 and 4).
 *
 * `clearInvalidConfig` makes conf throw away a config.json it cannot parse and
 * overwrite it on the first set(), keeping no copy, so it may only be on when
 * the file on disk is already known-good.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { CONFIG_FILE_NAME } from '../main/config-file';

let mockDir = '';
/** Options every `new Store()` from store.ts was constructed with, in order. */
const mockStoreOptions: Record<string, unknown>[] = [];
/** Error the next `new Store()` throws, cleared once it has thrown. */
let mockStoreThrows: Error | undefined;

jest.mock('electron', () => ({
	app: {
		getPath: () => mockDir,
		getVersion: () => '4.0.0-test',
		isPackaged: false,
		isReady: () => true,
		on: jest.fn(),
	},
	ipcMain: { on: jest.fn(), handle: jest.fn(), removeHandler: jest.fn() },
	screen: { getPrimaryDisplay: () => ({ bounds: { width: 0, height: 0 } }) },
}));

jest.mock('electron-log', () => ({
	status: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
}));

jest.mock('electron-store', () =>
	jest.fn().mockImplementation((options: Record<string, unknown>) => {
		mockStoreOptions.push(options);

		if (mockStoreThrows) {
			const error = mockStoreThrows;
			mockStoreThrows = undefined;
			throw error;
		}

		return { get: jest.fn(), set: jest.fn(), has: jest.fn(() => false) };
	}),
);

const BOM = '﻿';

let configPath: string;

const write = (contents: string) => fs.writeFileSync(configPath, contents);
const read = () => fs.readFileSync(configPath, 'utf8');

/** Import store.ts the way the main process does: once, at module load. */
const loadStoreModule = () => {
	jest.resetModules();
	// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
	return require('../main/store').default;
};

/**
 * The real conf, reading the real file, with the two options electron-store
 * works out from `app`. The electron mock above does not reach electron-store
 * itself, so this is how the shipped parse gets exercised.
 */
const readThroughConf = () => {
	// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
	const Conf = require('conf');

	return new Conf({
		cwd: mockDir,
		configName: 'config',
		projectVersion: '4.0.0-test',
		schema: { settings: { type: 'object', default: { showDockIcon: true } } },
	});
};

/**
 * The electron-log mock store.ts is holding. loadStoreModule() resets the module
 * registry, so the mock made before that reset is a different object.
 */
const currentLogger = () =>
	// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
	require('electron-log') as { error: jest.Mock; warn: jest.Mock };

const clearInvalidConfigFlags = () =>
	mockStoreOptions.map((options) => options.clearInvalidConfig);

beforeEach(() => {
	mockDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lac8624-'));
	configPath = path.join(mockDir, CONFIG_FILE_NAME);
	mockStoreOptions.length = 0;
	mockStoreThrows = undefined;
	jest.clearAllMocks();
});

afterEach(() => {
	jest.resetModules();
	fs.rmSync(mockDir, { recursive: true, force: true });
});

describe('store.ts wiring', () => {
	it('repairs a BOM before electron-store reads it, and keeps the settings', () => {
		const body = JSON.stringify({ settings: { showDockIcon: false } });
		write(BOM + body);

		expect(loadStoreModule()).toBeDefined();

		// The repair ran against the path electron-store is pointed at, not a
		// path the test chose.
		expect(read()).toBe(body);
		expect(readThroughConf().get('settings').showDockIcon).toBe(false);
		expect(mockStoreOptions).toHaveLength(1);
		expect(mockStoreOptions[0].schema).toBeDefined();
	});

	it('clears an invalid config only when the file on disk is known-good', () => {
		write(`${BOM}{"settings":{}}`);
		loadStoreModule();
		expect(clearInvalidConfigFlags()).toEqual([true]);

		mockStoreOptions.length = 0;
		write('{"settings":{}}');
		loadStoreModule();
		expect(clearInvalidConfigFlags()).toEqual([true]);
	});

	it('leaves the flag off once the bad file has been quarantined', () => {
		write('{"settings":');

		loadStoreModule();

		// Nothing left at the path for conf to choke on, so the flag would only
		// be covering for a future failure we have not seen.
		expect(fs.existsSync(configPath)).toBe(false);
		expect(clearInvalidConfigFlags()).toEqual([false]);
	});

	it('leaves the flag off when the repair could not run', () => {
		// A directory where config.json should be: the repair cannot read it, so
		// the file it would have moved aside may still be the user's only copy.
		fs.mkdirSync(configPath);

		loadStoreModule();

		expect(clearInvalidConfigFlags()).toEqual([false]);
	});

	it('starts anyway, loudly, when electron-store cannot parse the file', () => {
		// The pairing this guards: the repair could not move an unparseable file
		// aside, so conf throws a SyntaxError that the flag is no longer swallowing.
		// A directory is the portable way to make the repair fail on all three CI
		// runners; the throw itself is injected because conf is mocked here.
		fs.mkdirSync(configPath);
		mockStoreThrows = new SyntaxError('Unexpected end of JSON input');

		expect(loadStoreModule()).toBeDefined();

		// Second attempt is the only one allowed to discard the file, and it runs
		// after the failure has been written down.
		expect(clearInvalidConfigFlags()).toEqual([false, true]);
		// The repair's own failure line also names config.json, so match the
		// sentence store.ts writes.
		expect(currentLogger().error).toHaveBeenCalledWith(
			expect.stringContaining(
				`electron-store could not parse ${CONFIG_FILE_NAME}`,
			),
		);
	});

	it('does not swallow a failure that is not a parse error', () => {
		// EACCES, EISDIR and friends: conf throws these whatever the flag says,
		// and retrying cannot help, so store.ts must not pretend to recover.
		write('{"settings":{}}');
		const unreadable = new Error('EACCES: permission denied');
		(unreadable as { code?: string }).code = 'EACCES';
		mockStoreThrows = unreadable;

		expect(() => loadStoreModule()).toThrow('EACCES');
		expect(clearInvalidConfigFlags()).toEqual([true]);
	});
});
