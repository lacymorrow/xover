/**
 * The preset model. Pure: no electron, no store. The main-process glue in
 * presets.ts feeds it the live windows and the displays.
 */
import {
	MAX_PRESETS,
	PresetAppType,
	PresetSummaryType,
	PresetType,
	PresetWindowType,
} from '../config/presets';
import { CrosshairWindowStateType } from '../config/settings';

export interface DisplayInfo {
	id: number;
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Who may do what. Pro adds creating presets and auto profiles. It takes
 * nothing away: applying, cycling, renaming and deleting are never gated, so a
 * v3 user keeps everything they had (LAC-7622, 2026-11-16).
 */
export const presetPermissions = (isPremium: boolean) => ({
	apply: true,
	cycle: true,
	rename: true,
	delete: true,
	/** Clearing an app assignment removes behavior, so it is free. */
	clearApp: true,
	create: isPremium,
	setApp: isPremium,
	/** The watcher only runs for Pro. Saved assignments are kept either way. */
	autoSwitch: isPremium,
});

export type PresetActionResult =
	| { ok: true }
	| { ok: false; reason: 'pro' | 'full' | 'missing' | 'empty' };

export const nextDefaultName = (presets: PresetType[]) => {
	const taken = new Set(presets.map((p) => p.name));
	let index = presets.length + 1;
	while (taken.has(`Preset ${index}`)) index += 1;
	return `Preset ${index}`;
};

const cleanName = (name: unknown) =>
	typeof name === 'string' ? name.trim().slice(0, 60) : '';

/** Keeps names unique so the list and the cycle notification are unambiguous. */
export const uniqueName = (
	presets: PresetType[],
	wanted: string,
	ignoreId?: string,
) => {
	const base = cleanName(wanted);
	if (!base) return nextDefaultName(presets);
	const taken = new Set(
		presets.filter((p) => p.id !== ignoreId).map((p) => p.name),
	);
	if (!taken.has(base)) return base;
	let n = 2;
	while (taken.has(`${base} ${n}`)) n += 1;
	return `${base} ${n}`;
};

export const toSummary = (preset: PresetType): PresetSummaryType => ({
	id: preset.id,
	name: preset.name,
	imported: !!preset.imported,
	windowCount: preset.windows.length,
	app: preset.app,
	lastUsedAt: preset.lastUsedAt ?? 0,
});

/** Position fields are saved per window with the display they were on. */
export const capturePresetWindow = (
	state: Partial<CrosshairWindowStateType>,
	bounds: { x: number; y: number; width: number; height: number } | undefined,
	display: DisplayInfo | undefined,
): PresetWindowType => {
	const next: PresetWindowType = { state: { ...state } };
	if (bounds) {
		next.state.x = bounds.x;
		next.state.y = bounds.y;
	}
	if (display) {
		next.display = { id: display.id, x: display.x, y: display.y };
	}
	return next;
};

/**
 * Where a saved window goes now. If its display is still plugged in, keep the
 * same offset on it (the display may have moved in the arrangement). If not,
 * return the saved position and let the caller clamp it onto a visible screen.
 * Undefined means "keep where the window is" (v3 presets have no position).
 */
export const resolvePosition = (
	saved: PresetWindowType,
	displays: DisplayInfo[],
): { x: number; y: number } | undefined => {
	const { x, y } = saved.state;
	if (typeof x !== 'number' || typeof y !== 'number') return undefined;

	const target = saved.display
		? displays.find((d) => d.id === saved.display!.id)
		: undefined;
	if (saved.display && target) {
		return {
			x: target.x + (x - saved.display.x),
			y: target.y + (y - saved.display.y),
		};
	}
	return { x, y };
};

export interface ApplyPlan {
	/** Open windows that take on a saved window, in order. */
	reuse: { windowId: string; saved: PresetWindowType }[];
	/** Saved windows with no open window to take them: create these. */
	create: PresetWindowType[];
	/** Open windows the preset does not have: close these. */
	close: string[];
}

/**
 * Applying a preset recreates or closes windows to match. Open windows are
 * reused in order so the common case (same count) never flickers.
 */
export const planApply = (
	openWindowIds: string[],
	saved: PresetWindowType[],
): ApplyPlan => ({
	reuse: openWindowIds
		.slice(0, saved.length)
		.map((windowId, i) => ({ windowId, saved: saved[i] })),
	create: saved.slice(openWindowIds.length),
	close: openWindowIds.slice(saved.length),
});

export const findPreset = (presets: PresetType[], id: string) =>
	presets.find((p) => p.id === id);

export const addPreset = (
	presets: PresetType[],
	preset: PresetType,
): { presets: PresetType[]; result: PresetActionResult } => {
	if (presets.length >= MAX_PRESETS) {
		return { presets, result: { ok: false, reason: 'full' } };
	}
	if (preset.windows.length === 0) {
		return { presets, result: { ok: false, reason: 'empty' } };
	}
	return { presets: [...presets, preset], result: { ok: true } };
};

export const renamePreset = (presets: PresetType[], id: string, name: string) =>
	presets.map((p) =>
		p.id === id ? { ...p, name: uniqueName(presets, name, id) } : p,
	);

/** Next preset after `activeId` in list order, wrapping. Undefined when empty. */
export const nextPreset = (presets: PresetType[], activeId: string) => {
	if (presets.length === 0) return undefined;
	const current = presets.findIndex((p) => p.id === activeId);
	return presets[(current + 1) % presets.length];
};

export const sameApp = (
	a: PresetAppType | undefined,
	b: Pick<PresetAppType, 'id'>,
) => {
	if (!a) return false;
	const norm = (s: string) =>
		s
			.trim()
			.toLowerCase()
			.replace(/\.exe$/, '');
	return norm(a.id) === norm(b.id);
};

/** Other presets that name the same app, for the "last used wins" note. */
export const sharingApp = (presets: PresetType[], preset: PresetType) =>
	preset.app
		? presets.filter((p) => p.id !== preset.id && sameApp(p.app, preset.app!))
		: [];
