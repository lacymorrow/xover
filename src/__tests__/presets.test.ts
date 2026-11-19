/**
 * @jest-environment node
 *
 * Presets, LAC-5974. The model, v3 import, the gate and the foreground
 * matcher. Lacy 2026-11-19: presets are Pro for everyone; v3 drops presets in 3.4.10.
 * Do not restore a free carve-out for imported presets.
 */
import { MAX_PRESETS, PresetType } from '../config/presets';
import {
	bindWatcherToStore,
	createAutoProfile,
	createWatcherLifecycle,
	isSelfApp,
	pickAutoPreset,
	shouldWatch,
} from '../main/auto-profile';
import {
	linuxAutoSupported,
	parseLsappinfoInfo,
	parseLsappinfoList,
	parseXpropActive,
	parseXpropWindow,
} from '../main/foreground';
import { appFromExePath } from '../main/win-foreground';
import { mapV3Preferences } from '../main/migrate-v3';
import {
	addPreset,
	nextPreset,
	planApply,
	presetPermissions,
	renamePreset,
	resolvePosition,
	sharingApp,
	uniqueName,
} from '../main/preset-model';

jest.mock('electron-log', () => ({
	warn: jest.fn(),
	info: jest.fn(),
	error: jest.fn(),
}));

const preset = (id: string, extra: Partial<PresetType> = {}): PresetType => ({
	id,
	name: id,
	windows: [{ state: {} }],
	createdAt: 1,
	...extra,
});

describe('gate', () => {
	// Lacy 2026-11-19: presets are Pro for everyone; v3 drops presets in 3.4.10.
	// Do not restore a carve-out for presets imported from v3.
	it('free can only delete', () => {
		expect(presetPermissions(false)).toEqual({
			apply: false,
			cycle: false,
			rename: false,
			delete: true,
			clearApp: false,
			create: false,
			setApp: false,
			autoSwitch: false,
		});
	});
	it('Pro can do everything', () => {
		expect(Object.values(presetPermissions(true)).every(Boolean)).toBe(true);
	});
});

describe('model', () => {
	it('names are unique and defaulted', () => {
		const list = [preset('a', { name: 'Main' })];
		expect(uniqueName(list, 'Main')).toBe('Main 2');
		expect(uniqueName(list, '  ')).toBe('Preset 2');
		expect(renamePreset(list, 'a', 'Main')[0].name).toBe('Main');
	});
	it('cycles in order and wraps; unknown active starts at the first', () => {
		const list = [preset('a'), preset('b')];
		expect(nextPreset(list, 'a')?.id).toBe('b');
		expect(nextPreset(list, 'b')?.id).toBe('a');
		expect(nextPreset(list, '')?.id).toBe('a');
		expect(nextPreset([], '')).toBeUndefined();
	});
	it('caps presets and refuses an empty setup', () => {
		const full = Array.from({ length: MAX_PRESETS }, (_, i) => preset(`p${i}`));
		expect(addPreset(full, preset('x')).result).toEqual({
			ok: false,
			reason: 'full',
		});
		expect(addPreset([], { ...preset('x'), windows: [] }).result).toEqual({
			ok: false,
			reason: 'empty',
		});
	});
	it('plans window reuse, creation and closing', () => {
		const s = (n: number) => Array.from({ length: n }, () => ({ state: {} }));
		expect(planApply(['w1'], s(3))).toMatchObject({
			create: [{}, {}],
			close: [],
		});
		const shrink = planApply(['w1', 'w2', 'w3'], s(1));
		expect(shrink.reuse).toHaveLength(1);
		expect(shrink.close).toEqual(['w2', 'w3']);
	});
	it('keeps the offset on a moved display, falls back when it is gone', () => {
		const saved = {
			state: { x: 150, y: 60 },
			display: { id: 2, x: 100, y: 0 },
		};
		expect(
			resolvePosition(saved, [{ id: 2, x: 1000, y: 0, width: 1, height: 1 }]),
		).toEqual({ x: 1050, y: 60 });
		expect(resolvePosition(saved, [])).toEqual({ x: 150, y: 60 });
		expect(resolvePosition({ state: {} }, [])).toBeUndefined();
	});
});

describe('v3 import keeps presets for Pro', () => {
	const ctx = { crosshairsDir: '/c', fileExists: () => false };
	const v3 = {
		crosshair: { size: 40 },
		presets: { active: 'Ranked' },
		keybinds: { cyclePreset: 'Control+Shift+Alt+K' },
		hidden: {
			presets: [
				{
					name: 'Ranked',
					settings: {
						crosshair: {
							size: 70,
							positionX: 5,
							positionY: 9,
							reticle: 'cross',
						},
						actions: { tiltAngle: 30 },
					},
				},
				{ name: 'Ranked', settings: { crosshair: { size: 10 } } },
				'junk',
			],
		},
	};
	const result = mapV3Preferences(v3, ctx)!;

	it('imports presets flagged imported, one window each, without position', () => {
		expect(result.presets).toHaveLength(2);
		expect(result.presets.every((p) => p.imported)).toBe(true);
		expect(result.presets[0].windows[0].state).toMatchObject({
			crosshairSize: 70,
			reticle: 'cross',
		});
		expect(result.presets[0].windows[0].state.x).toBeUndefined();
		expect(result.presets[0].settings).toMatchObject({ tiltAngle: 30 });
		expect(new Set(result.presets.map((p) => p.name)).size).toBe(2);
		expect(result.activePresetName).toBe('Ranked');
	});
	it('imports the cycle keybind', () => {
		expect(result.keybinds.cyclePreset).toBe('Control+Shift+Alt+K');
	});
	it('imported presets get no free carve-out', () => {
		// Lacy 2026-11-19: presets are Pro for everyone; v3 drops presets in 3.4.10.
		const can = presetPermissions(false);
		expect(result.presets.every((p) => p.imported)).toBe(true);
		expect([can.apply, can.cycle, can.rename, can.delete]).toEqual([
			false,
			false,
			false,
			true,
		]);
		expect(nextPreset(result.presets, result.presets[0].id)).toBe(
			result.presets[1],
		);
	});
	it('no presets in v3 means an empty list', () => {
		expect(mapV3Preferences({ crosshair: {} }, ctx)!.presets).toEqual([]);
	});
});

describe('foreground matcher', () => {
	const game = { id: 'com.valve.game', name: 'Game' };
	const list = [
		preset('main', { lastUsedAt: 5 }),
		preset('ranked', { app: game, lastUsedAt: 10 }),
		preset('casual', { app: game, lastUsedAt: 20 }),
	];

	it('last used wins when two presets name one app; ties go to the first', () => {
		expect(pickAutoPreset(list, game)?.id).toBe('casual');
		const tie = [preset('a', { app: game }), preset('b', { app: game })];
		expect(pickAutoPreset(tie, game)?.id).toBe('a');
		expect(sharingApp(list, list[1]).map((p) => p.id)).toEqual(['casual']);
	});
	it('matches process names case-insensitively and ignoring .exe', () => {
		const p = [preset('a', { app: { id: 'valorant', name: 'VALORANT' } })];
		expect(pickAutoPreset(p, { id: 'Valorant.exe' })?.id).toBe('a');
		expect(pickAutoPreset(p, { id: 'chrome' })).toBeUndefined();
	});

	const make = (presets: PresetType[], active: string) => {
		let current = active;
		const applied: string[] = [];
		const ctl = createAutoProfile({
			getPresets: () => presets,
			getActiveId: () => current,
			apply: (id) => {
				applied.push(id);
				current = id;
			},
			isSelf: (a) => a.id === 'crossover',
		});
		return { ctl, applied };
	};

	it('applies on foreground and returns to the previous preset after', () => {
		const { ctl, applied } = make(list.slice(0, 2), 'main');
		ctl.onForeground(game);
		ctl.onForeground({ id: 'chrome', name: 'Chrome' });
		expect(applied).toEqual(['ranked', 'main']);
	});
	it('app to app keeps the original return target', () => {
		const other = { id: 'other', name: 'Other' };
		const ps = [
			preset('main'),
			preset('g', { app: game }),
			preset('o', { app: other }),
		];
		const { ctl, applied } = make(ps, 'main');
		ctl.onForeground(game);
		ctl.onForeground(other);
		ctl.onForeground({ id: 'x', name: 'x' });
		expect(applied).toEqual(['g', 'o', 'main']);
	});
	it('ignores CrossOver itself, so opening Settings does not leave the game', () => {
		const { ctl, applied } = make(list.slice(0, 2), 'main');
		ctl.onForeground(game);
		ctl.onForeground({ id: 'crossover', name: 'CrossOver' });
		expect(applied).toEqual(['ranked']);
		expect(isSelfApp({ id: 'x', name: 'x', pid: 7 }, { pid: 7, ids: [] })).toBe(
			true,
		);
	});
	it('a manual choice stands: leaving the app returns nothing', () => {
		const { ctl, applied } = make(list.slice(0, 2), 'main');
		ctl.onForeground(game);
		ctl.onManualApply();
		ctl.onForeground({ id: 'chrome', name: 'Chrome' });
		expect(applied).toEqual(['ranked']);
	});
	it('does not return to a deleted preset', () => {
		const ps = [preset('main'), preset('g', { app: game })];
		const { ctl, applied } = make(ps, 'main');
		ctl.onForeground(game);
		ps.splice(0, 1);
		ctl.onForeground({ id: 'chrome', name: 'Chrome' });
		expect(applied).toEqual(['g']);
	});
	it('watches only for Pro, with an app set, on a supported platform', () => {
		const withApp = [preset('a', { app: game })];
		expect(shouldWatch(withApp, true, true)).toBe(true);
		expect(shouldWatch(withApp, false, true)).toBe(false);
		expect(shouldWatch(withApp, true, false)).toBe(false);
		expect(shouldWatch([preset('a')], true, true)).toBe(false);
		expect(shouldWatch([], true, true)).toBe(false);
	});
});

describe('foreground parsers', () => {
	it('macOS info and list, no window titles involved', () => {
		expect(
			parseLsappinfoInfo(
				'"CFBundleIdentifier"="com.tinyspeck.slackmacgap"\n"LSDisplayName"="Slack"\n"pid"=89217',
			),
		).toEqual({ id: 'com.tinyspeck.slackmacgap', name: 'Slack', pid: 89217 });
		const out = ` 1) "loginwindow" ASN:0x0-0x3003: \n    bundleID="com.apple.loginwindow"\n    pid = 413 type="UIElement" flavor=3\n 2) "Safari" ASN:0x0-0x4004: \n    bundleID="com.apple.Safari"\n    pid = 500 type="Foreground" flavor=3\n`;
		expect(parseLsappinfoList(out)).toEqual([
			{ id: 'com.apple.Safari', name: 'Safari', pid: 500 },
		]);
	});
	it('Windows exe path becomes the app, no window title involved', () => {
		expect(
			appFromExePath('C:\\Games\\Riot\\VALORANT-Win64-Shipping.EXE', 1234),
		).toEqual({
			id: 'valorant-win64-shipping',
			name: 'VALORANT-Win64-Shipping',
			pid: 1234,
		});
		expect(appFromExePath('', 1)).toBeNull();
	});
	it('X11', () => {
		expect(
			parseXpropActive('_NET_ACTIVE_WINDOW(WINDOW): window id # 0x3c00007'),
		).toBe('0x3c00007');
		expect(parseXpropActive('window id # 0x0')).toBeNull();
		expect(
			parseXpropWindow(
				'_NET_WM_PID(CARDINAL) = 4242\nWM_CLASS(STRING) = "navigator", "firefox"',
			),
		).toEqual({ pid: 4242, wmClass: 'firefox' });
		expect(linuxAutoSupported({ DISPLAY: ':0' })).toBe(true);
		expect(
			linuxAutoSupported({ DISPLAY: ':0', XDG_SESSION_TYPE: 'wayland' }),
		).toBe(false);
		expect(linuxAutoSupported({})).toBe(false);
	});
});

describe('watcher lifecycle', () => {
	const game = { id: 'game', name: 'Game' };

	const setup = (initial: { premium: boolean; presets: PresetType[] }) => {
		const state = { ...initial, supported: true };
		const stop = jest.fn();
		const start = jest.fn(() => ({ stop }));
		const life = createWatcherLifecycle({
			getPresets: () => state.presets,
			isPremium: () => state.premium,
			supported: () => state.supported,
			start,
		});
		// A store that lets the test fire the same events electron-store would.
		const handlers: Record<string, () => void> = {};
		bindWatcherToStore(
			{
				onDidChange: (key: string, cb: () => void) => {
					handlers[key] = cb;
				},
			},
			life.sync,
		);
		return { state, start, stop, life, handlers };
	};

	it('settles at startup: off with no app, on with one', () => {
		expect(
			setup({ premium: true, presets: [preset('a')] }).start,
		).not.toHaveBeenCalled();
		expect(
			setup({ premium: true, presets: [preset('a', { app: game })] }).start,
		).toHaveBeenCalledTimes(1);
	});

	it('license activate starts it, deactivate and expiry stop it', () => {
		const t = setup({ premium: false, presets: [preset('a', { app: game })] });
		expect(t.life.isWatching()).toBe(false);

		t.state.premium = true; // activate
		t.handlers.license();
		expect(t.life.isWatching()).toBe(true);

		t.state.premium = false; // deactivate, or checkLicense revoking on expiry
		t.handlers.license();
		expect(t.life.isWatching()).toBe(false);
		expect(t.stop).toHaveBeenCalledTimes(1);
	});

	it('every preset or app change re-evaluates, and starts only once', () => {
		const t = setup({ premium: true, presets: [preset('a')] });
		t.state.presets = [preset('a', { app: game })]; // app set
		t.handlers.presets();
		t.handlers.presets(); // idempotent
		expect(t.start).toHaveBeenCalledTimes(1);

		t.state.presets = [preset('a')]; // app cleared: stop watching
		t.handlers.presets();
		expect(t.life.isWatching()).toBe(false);

		t.state.presets = [preset('a', { app: game })];
		t.handlers.presets();
		t.state.presets = []; // preset deleted
		t.handlers.presets();
		expect(t.life.isWatching()).toBe(false);
	});

	it('does not start where unsupported, or when the Windows reader failed to load', () => {
		const t = setup({ premium: true, presets: [] });
		t.state.supported = false;
		t.state.presets = [preset('a', { app: game })];
		t.handlers.presets();
		expect(t.start).not.toHaveBeenCalled();
	});
});
