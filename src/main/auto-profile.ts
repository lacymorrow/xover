/**
 * Auto profiles (Pro): "Switch to this preset when <app> is in front".
 *
 * `createAutoProfile` is the decision, pure and unit tested. `syncAutoProfileWatcher`
 * below is the glue that runs the foreground watcher, and only while it has
 * work: a licensed user, a supported platform and at least one preset naming
 * an app.
 */
import { PresetType } from '../config/presets';
import { presetPermissions, sameApp } from './preset-model';
import { ForegroundApp, normalizeAppId } from './foreground';

/**
 * Two presets can name the same app. The one applied most recently wins, by
 * `lastUsedAt` (any apply counts: manual, cycle or auto). A preset never
 * applied counts as 0, and a tie goes to the earlier one in the list. This is
 * the documented rule, and the UI repeats it where it applies.
 */
export const pickAutoPreset = (
	presets: PresetType[],
	app: Pick<ForegroundApp, 'id'>,
): PresetType | undefined =>
	presets
		.filter((p) => p.app && sameApp(p.app, app))
		.reduce<
			PresetType | undefined
		>((best, p) => (!best || (p.lastUsedAt ?? 0) > (best.lastUsedAt ?? 0) ? p : best), undefined);

/** Is `app` CrossOver itself? Opening Settings must not read as leaving the game. */
export const isSelfApp = (
	app: ForegroundApp,
	self: { pid: number; ids: string[] },
) =>
	(app.pid !== undefined && app.pid === self.pid) ||
	self.ids.some((id) => normalizeAppId(id) === normalizeAppId(app.id));

export interface AutoProfileDeps {
	getPresets: () => PresetType[];
	getActiveId: () => string;
	/** Apply without telling the controller it was a manual choice. */
	apply: (id: string) => void;
	isSelf: (app: ForegroundApp) => boolean;
}

export const createAutoProfile = (deps: AutoProfileDeps) => {
	/** The preset that was active before the first matched app came forward. */
	let returnTo: string | null = null;
	/** The preset the watcher applied and is still holding. */
	let held: string | null = null;

	const reset = () => {
		returnTo = null;
		held = null;
	};

	return {
		onForeground(app: ForegroundApp) {
			// CrossOver in front is not a change: ignore, hold what we have.
			if (deps.isSelf(app)) return;

			const presets = deps.getPresets();
			const match = pickAutoPreset(presets, app);

			if (match) {
				if (held === null) returnTo = deps.getActiveId() || null;
				held = match.id;
				if (match.id !== deps.getActiveId()) deps.apply(match.id);
				return;
			}

			if (held !== null) {
				const target = returnTo;
				reset();
				if (
					target &&
					target !== deps.getActiveId() &&
					presets.some((p) => p.id === target)
				) {
					deps.apply(target);
				}
			}
		},

		/** The user picked or cycled a preset: their choice stands, nothing to return to. */
		onManualApply: reset,

		state: () => ({ returnTo, held }),
	};
};

/** The watcher should run when this is true, and not otherwise. */
export const shouldWatch = (
	presets: PresetType[],
	isPremium: boolean,
	supported: boolean,
) =>
	supported &&
	presetPermissions(isPremium).autoSwitch &&
	presets.some((p) => !!p.app);
