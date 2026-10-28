/**
 * @jest-environment node
 *
 * LAC-5868 reorganized the settings window into four panes plus Advanced.
 * The one rule was: reorganize, remove nothing, same store keys.
 *
 * These tests pin that rule to source. Moving a control between panes is
 * free; dropping one, or quietly adding a setting with no way to change it,
 * fails here. They read the pane sources rather than rendering, because the
 * question is "is this control wired to this key somewhere in the settings
 * UI", not "where on screen is it today".
 */
import fs from 'fs';
import path from 'path';
import {
	DEFAULT_CROSSHAIR_WINDOW_STATE,
	DEFAULT_KEYBINDS,
	DEFAULT_SETTINGS,
} from '../config/settings';

const SETTINGS_UI_ROOT = path.join(
	__dirname,
	'..',
	'renderer',
	'components',
	'pages',
	'settings',
);

const readSourceTree = (dir: string): string =>
	fs
		.readdirSync(dir, { withFileTypes: true })
		.map((entry) => {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) return readSourceTree(full);
			return entry.name.endsWith('.tsx') ? fs.readFileSync(full, 'utf8') : '';
		})
		.join('\n');

const settingsUiSource = readSourceTree(SETTINGS_UI_ROOT);

// nav.tsx is read rather than imported: importing it pulls in every pane and
// all of React, and this suite only needs the list of destinations.
const navSource = fs.readFileSync(
	path.join(__dirname, '..', 'renderer', 'config', 'nav.tsx'),
	'utf8',
);
const navItems = [
	...navSource
		.slice(navSource.indexOf('export const settingsNavItems'))
		.matchAll(/\{\s*title: '([^']+)',\s*href: '([^']+)',([\s\S]*?)\n\t\},/g),
].map(([, title, href, body]) => ({
	title,
	href,
	index: body.includes('index: true'),
}));

/** `crosshair` must not be satisfied by `crosshairSize`. */
const mentionsKey = (source: string, key: string) =>
	new RegExp(`\\b${key}\\b`).test(source);

// Settings that exist in the store but deliberately have no control: app
// bookkeeping, live action state, and one-shot migration/accessibility flags.
const SETTINGS_WITHOUT_A_CONTROL = [
	'appVersion',
	'secondaryBehavior',
	'isLocked',
	'currentTilt',
	'isHidden',
	'isReticleHidden',
	'isSettingsWindowOpen',
	'resetOnAppStart',
	'hadFirstRun',
	'accessibilitySkipped',
	'needsAccessibilityCheck',
];

// Window state the app manages for you: the saved geometry and whether the
// frame can be dragged, both set by the size mode rather than by hand.
const WINDOW_STATE_WITHOUT_A_CONTROL = ['width', 'height', 'resizable'];

// Bound in DEFAULT_KEYBINDS but never registered or shown; see the inventory
// in LAC-5868. Listed so it is a decision, not an oversight.
const KEYBINDS_WITHOUT_A_CONTROL = ['closeAll'];

describe('settings window exposes every control it has keys for', () => {
	const settingKeys = Object.keys(DEFAULT_SETTINGS).filter(
		(key) => !SETTINGS_WITHOUT_A_CONTROL.includes(key),
	);
	const windowStateKeys = Object.keys(DEFAULT_CROSSHAIR_WINDOW_STATE).filter(
		(key) => !WINDOW_STATE_WITHOUT_A_CONTROL.includes(key),
	);
	const keybindKeys = Object.keys(DEFAULT_KEYBINDS).filter(
		(key) => !KEYBINDS_WITHOUT_A_CONTROL.includes(key),
	);

	it.each(settingKeys)('settings.%s has a control', (key) => {
		expect(mentionsKey(settingsUiSource, key)).toBe(true);
	});

	it.each(windowStateKeys)('window state %s has a control', (key) => {
		expect(mentionsKey(settingsUiSource, key)).toBe(true);
	});

	it.each(keybindKeys)('keybind %s has a control', (key) => {
		expect(mentionsKey(settingsUiSource, key)).toBe(true);
	});

	// The counts are the second half of "remove nothing": without them a
	// future change could delete a control and its key together and still
	// pass every test above.
	it('accounts for all 37 settings, 22 window-state keys and 14 keybinds', () => {
		expect(settingKeys).toHaveLength(37);
		expect(windowStateKeys).toHaveLength(22);
		expect(keybindKeys).toHaveLength(14);
	});
});

describe('settings nav', () => {
	it('is the four panes plus Advanced, with License and About reachable', () => {
		expect(navItems.map((item) => item.title)).toEqual([
			'Crosshair',
			'In game',
			'Shortcuts',
			'App',
			'Advanced',
			'License',
			'About',
		]);
	});

	it('opens on the Crosshair pane', () => {
		expect(navItems.filter((item) => item.index)).toHaveLength(1);
		expect(navItems.find((item) => item.index)?.href).toBe('crosshair');
	});
});
