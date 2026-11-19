import { CrosshairWindowStateType, SettingsType } from './settings';

/**
 * A preset is the whole setup: every crosshair window with its own crosshair
 * state, position and display. That is the "layouts" feature, folded in
 * (Lacy, 2026-11-16, LAC-7622), so there is no separate layouts model.
 */

/** The window state a preset owns. Position is optional: v3 presets had none. */
export type PresetWindowState = Partial<CrosshairWindowStateType>;

export interface PresetWindowType {
	state: PresetWindowState;
	/** Display the window was on when saved, so a layout survives a monitor change. */
	display?: { id: number; x: number; y: number };
}

/** An app named by process or bundle name, never by window title. */
export interface PresetAppType {
	/** macOS bundle id, or the lower-case process name on Windows and Linux. */
	id: string;
	/** What the picker shows. */
	name: string;
}

export interface PresetType {
	id: string;
	name: string;
	windows: PresetWindowType[];
	/** App-wide settings a v3 preset also carried (ADS, tilt, follow mouse). Imported only. */
	settings?: Partial<SettingsType>;
	/** Provenance only. Imported presets get no special treatment: Lacy 2026-11-19: presets are Pro for everyone; v3 drops presets in 3.4.10. */
	imported?: boolean;
	/** Auto profile: "Switch to this when <app> is in front". Pro. */
	app?: PresetAppType;
	createdAt: number;
	/** Last time this preset was applied by any path. Breaks ties between presets that name one app. */
	lastUsedAt?: number;
}

export interface PresetsStateType {
	items: PresetType[];
	activeId: string;
}

export const DEFAULT_PRESETS_STATE: PresetsStateType = {
	items: [],
	activeId: '',
};

/** What the renderer gets: no window states, just what the list needs. */
export interface PresetSummaryType {
	id: string;
	name: string;
	windowCount: number;
	app?: PresetAppType;
	lastUsedAt: number;
}

export interface RunningAppType extends PresetAppType {
	pid?: number;
}

export interface PresetsViewType {
	presets: PresetSummaryType[];
	activeId: string;
	isPremium: boolean;
	/** False on Wayland and on Linux without xprop. The picker says so. */
	autoProfilesSupported: boolean;
}

export const MAX_PRESETS = 20;
