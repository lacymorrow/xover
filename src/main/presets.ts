/**
 * Presets (Pro to create) and auto profiles (Pro). Port of v3 presets
 * (crossover #569, `src/main/presets.js`), widened from "crosshair settings" to
 * "the whole setup": every crosshair window, its own crosshair state, position
 * and display. That is the layouts feature, folded in (Lacy, 2026-11-16,
 * LAC-7622). The model and the rules live in preset-model.ts and
 * auto-profile.ts; this file is the Electron side.
 *
 * Pro gates creating presets and auto profiles only. Apply, cycle, rename and
 * delete are never gated, so a v3 user's imported presets keep working.
 */
import { app, screen } from 'electron';
import Logger from 'electron-log';
import {
	DEFAULT_PRESETS_STATE,
	PresetAppType,
	PresetType,
	PresetsStateType,
	PresetsViewType,
} from '../config/presets';
import { ipcChannels } from '../config/ipc-channels';
import { DEFAULT_CROSSHAIR_WINDOW_STATE } from '../config/settings';
import { getUUID } from '../utils/getUUID';
import {
	bindWatcherToStore,
	createAutoProfile,
	createWatcherLifecycle,
	isSelfApp,
} from './auto-profile';
import { createCrosshairWindow } from './create-window';
import {
	foregroundSupported,
	listRunningApps,
	watchForeground,
} from './foreground';
import { isPremium } from './license';
import { notification } from './notifications';
import {
	DisplayInfo,
	PresetActionResult,
	addPreset,
	capturePresetWindow,
	findPreset,
	nextPreset,
	planApply,
	presetPermissions,
	renamePreset,
	resolvePosition,
	toSummary,
	uniqueName,
} from './preset-model';
import store from './store';
import {
	getWindowState,
	setActiveWindow,
	setSettings,
	setWindowState,
} from './store-actions';
import { forEachWindow, safeSetBounds } from './utils/window-utils';
import windows from './windows';

const read = (): PresetsStateType =>
	store.get('presets') ?? DEFAULT_PRESETS_STATE;

const notifyWindows = () =>
	forEachWindow((win) => {
		if (!win.isDestroyed()) win.webContents.send(ipcChannels.APP_UPDATED);
	});

const write = (next: PresetsStateType) => {
	store.set('presets', next);
	// Tell every window, so the Presets pane redraws.
	notifyWindows();
	// eslint-disable-next-line no-use-before-define
	syncAutoProfileWatcher();
};

const displays = (): DisplayInfo[] =>
	screen.getAllDisplays().map((d) => ({ id: d.id, ...d.bounds }));

export const getPresetsView = (): PresetsViewType => {
	const { items, activeId } = read();
	return {
		presets: items.map(toSummary),
		activeId,
		isPremium: isPremium(),
		autoProfilesSupported: foregroundSupported(),
	};
};

/* ---------- save ---------- */

export const savePreset = (name?: string): PresetActionResult => {
	if (!presetPermissions(isPremium()).create)
		return { ok: false, reason: 'pro' };

	const state = read();
	const savedWindows = Object.entries(windows.crosshairWindows)
		.filter(([, win]) => win && !win.isDestroyed())
		.map(([id, win]) => {
			const bounds = win!.getBounds();
			const {
				width: _w,
				height: _h,
				...rest
			} = getWindowState(id) ?? DEFAULT_CROSSHAIR_WINDOW_STATE;
			const d = screen.getDisplayMatching(bounds);
			return capturePresetWindow(rest, bounds, { id: d.id, ...d.bounds });
		});

	const preset: PresetType = {
		id: getUUID(),
		name: uniqueName(state.items, name ?? ''),
		windows: savedWindows,
		createdAt: Date.now(),
		lastUsedAt: Date.now(),
	};
	const { presets, result } = addPreset(state.items, preset);
	if (!result.ok) return result;

	// eslint-disable-next-line no-use-before-define
	autoProfile.onManualApply();
	write({ items: presets, activeId: preset.id });
	return { ok: true };
};

/* ---------- apply ---------- */

let queue: Promise<unknown> = Promise.resolve();

const applyNow = async (preset: PresetType) => {
	const open = Object.entries(windows.crosshairWindows)
		.filter(([, win]) => win && !win.isDestroyed())
		.map(([id]) => id);
	const plan = planApply(open, preset.windows);
	const screens = displays();

	const stateFor = (saved: (typeof preset.windows)[number]) => {
		const pos = resolvePosition(saved, screens);
		return {
			state: {
				...DEFAULT_CROSSHAIR_WINDOW_STATE,
				...saved.state,
				...pos,
			},
			pos,
		};
	};

	// Create before closing, so the app never has zero windows and quits.
	// eslint-disable-next-line no-restricted-syntax
	for (const saved of plan.create) {
		const id = getUUID();
		setWindowState(id, stateFor(saved).state);
		// eslint-disable-next-line no-await-in-loop
		await createCrosshairWindow({}, id);
	}

	plan.reuse.forEach(({ windowId, saved }) => {
		const { state, pos } = stateFor(saved);
		// Keep the window's own size: a preset moves and restyles, never resizes.
		const { width: _w, height: _h, ...rest } = state;
		setWindowState(windowId, rest);
		const win = windows.crosshairWindows[windowId];
		if (pos && win && !win.isDestroyed()) {
			safeSetBounds(win, { ...win.getBounds(), x: pos.x, y: pos.y });
		}
	});

	plan.close.forEach((id) => {
		const win = windows.crosshairWindows[id];
		if (win && !win.isDestroyed()) win.close();
	});

	if (plan.reuse[0]) setActiveWindow(plan.reuse[0].windowId);
	if (preset.settings) setSettings(preset.settings);
};

export const applyPreset = (
	id: string,
	source: 'manual' | 'cycle' | 'auto' = 'manual',
): Promise<boolean> => {
	const preset = findPreset(read().items, id);
	if (!preset) return Promise.resolve(false);
	// eslint-disable-next-line no-use-before-define
	if (source !== 'auto') autoProfile.onManualApply();

	const run = queue.then(async () => {
		Logger.info(`Apply preset (${source}): ${preset.name}`);
		await applyNow(preset);
		const state = read();
		store.set('presets', {
			activeId: id,
			items: state.items.map((p) =>
				p.id === id ? { ...p, lastUsedAt: Date.now() } : p,
			),
		});
		// A cycle happens mid-game with no UI up. Say what you landed on.
		if (source !== 'auto')
			notification({ title: preset.name, body: 'Preset applied' });
		notifyWindows();
		return true;
	});
	queue = run.catch((error) => Logger.error('Apply preset failed', error));
	return run.catch(() => false);
};

export const cyclePreset = () => {
	const { items, activeId } = read();
	const next = nextPreset(items, activeId);
	if (!next) {
		notification({
			title: 'No presets yet',
			body: 'Save one from the Presets pane to switch between setups.',
		});
		return Promise.resolve(false);
	}
	return applyPreset(next.id, 'cycle');
};

/* ---------- rename, delete, app ---------- */

export const renameSavedPreset = (
	id: string,
	name: string,
): PresetActionResult => {
	const state = read();
	if (!findPreset(state.items, id)) return { ok: false, reason: 'missing' };
	write({ ...state, items: renamePreset(state.items, id, name) });
	return { ok: true };
};

export const deletePreset = (id: string): PresetActionResult => {
	const state = read();
	if (!findPreset(state.items, id)) return { ok: false, reason: 'missing' };
	// eslint-disable-next-line no-use-before-define
	autoProfile.onManualApply();
	write({
		items: state.items.filter((p) => p.id !== id),
		// Clear instead of promoting a neighbor that was never applied.
		activeId: state.activeId === id ? '' : state.activeId,
	});
	return { ok: true };
};

export const setPresetApp = (
	id: string,
	appRef: PresetAppType | null,
): PresetActionResult => {
	const state = read();
	if (!findPreset(state.items, id)) return { ok: false, reason: 'missing' };
	const can = presetPermissions(isPremium());
	if (appRef ? !can.setApp : !can.clearApp) return { ok: false, reason: 'pro' };

	write({
		...state,
		items: state.items.map((p) => {
			if (p.id !== id) return p;
			const { app: _old, ...rest } = p;
			return appRef ? { ...rest, app: appRef } : rest;
		}),
	});
	return { ok: true };
};

export const getRunningApps = () => listRunningApps();

/* ---------- auto profiles ---------- */

const autoProfile = createAutoProfile({
	getPresets: () => read().items,
	getActiveId: () => read().activeId,
	apply: (id) => {
		applyPreset(id, 'auto');
	},
	isSelf: (a) =>
		isSelfApp(a, { pid: process.pid, ids: [app.getName(), 'CrossOver'] }),
});

const lifecycle = createWatcherLifecycle({
	getPresets: () => read().items,
	isPremium,
	supported: foregroundSupported,
	start: () => watchForeground((a) => autoProfile.onForeground(a)),
	log: (message) => Logger.info(message),
});

/**
 * Start or stop the foreground watcher to match what is true now. Idempotent.
 * Also bound to the store (initAutoProfiles), so a license or preset change
 * from any path re-runs it.
 */
export const syncAutoProfileWatcher = () => lifecycle.sync();

/** Once at startup: subscribe to license and preset writes, then settle. */
export const initAutoProfiles = () =>
	bindWatcherToStore(store, syncAutoProfileWatcher);

export const stopAutoProfileWatcher = () => lifecycle.stop();
