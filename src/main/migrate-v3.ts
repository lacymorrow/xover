/**
 * CrossOver v3 -> v4 settings mapping.
 *
 * Pure: no electron, no store, no fs. Everything environmental is injected
 * through `V3ImportContext` so this can be unit tested.
 * See src/main/import-v3.ts for the runner that reads preferences.json and
 * writes the result to the store.
 */
import path from 'path';
import { IMAGE_EXTENSIONS } from '../config/config';
import { uiohookKeycodes } from '../config/keys';
import {
	AppSizeModeType,
	CrosshairWindowStateType,
	SettingsType,
	ThemeType,
} from '../config/settings';
import { CustomAcceleratorsType } from '../types/keyboard';

export interface V3ImportContext {
	/** Absolute path of the v4 bundled crosshairs directory */
	crosshairsDir: string;
	fileExists: (filePath: string) => boolean;
}

export interface V3ImportResult {
	settings: Partial<SettingsType>;
	keybinds: Partial<CustomAcceleratorsType>;
	windowState: Partial<CrosshairWindowStateType>;
	/** Absolute paths of user-supplied crosshair images that still exist */
	customImages: string[];
	imported: string[];
	skipped: string[];
}

type Dict = Record<string, unknown>;

const isDict = (value: unknown): value is Dict =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const toNumber = (value: unknown): number | undefined => {
	const n = typeof value === 'string' && value.trim() ? Number(value) : value;
	return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
};

const clamp = (n: number, min: number, max: number) =>
	Math.min(max, Math.max(min, n));

// v3 checkboxes are arrays of checked values, e.g. ['followMouse']
const checkbox = (value: unknown, name: string): boolean | undefined =>
	Array.isArray(value) ? value.includes(name) : undefined;

// v3 uses the string 'unset' for colors the user never picked
const toColor = (value: unknown): string | undefined =>
	typeof value === 'string' &&
	/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)
		? value
		: undefined;

const V3_RETICLES: Record<string, string> = {
	dot: 'dot',
	cross: 'cross',
	circle: 'circle',
	off: 'none',
};

const V3_APP_SIZES: Record<string, AppSizeModeType> = {
	normal: 'normal',
	resize: 'resizable',
	fullscreen: 'fullscreen',
};

// v3 keybind -> v4 keybind
const V3_KEYBINDS: Record<string, keyof CustomAcceleratorsType> = {
	lock: 'lock',
	quit: 'quit',
	reset: 'reset',
	hide: 'hide',
	hideReticle: 'hideReticle',
	center: 'center',
	duplicate: 'duplicateWindow',
	changeDisplay: 'changeDisplay',
	nextWindow: 'focusNextWindow',
	moveUp: 'moveUp',
	moveDown: 'moveDown',
	moveLeft: 'moveLeft',
	moveRight: 'moveRight',
};

const V3_KEY_ALIASES: Record<string, string> = {
	ctrl: 'Control',
	cmd: 'Command',
	meta: 'Command',
	super: 'Command',
	option: 'Alt',
	escape: 'Esc',
};

/**
 * v3 stored a single-key Electron accelerator (e.g. "Q", "Alt").
 * v4 stores "keyboard:<uiohook key name>". Empty string = unbound.
 * Returns undefined when the value can't be represented in v4.
 */
export const toV4KeyBind = (accelerator: unknown): string | undefined => {
	if (typeof accelerator !== 'string') return undefined;
	const key = accelerator.trim();
	if (!key) return '';
	const wanted = (V3_KEY_ALIASES[key.toLowerCase()] ?? key).toLowerCase();
	const name = Object.keys(uiohookKeycodes).find(
		(k) => k.toLowerCase() === wanted,
	);
	return name === undefined ? undefined : `keyboard:${name}`;
};

const isImagePath = (p: string) =>
	IMAGE_EXTENSIONS.includes(path.extname(p).toLowerCase());

/**
 * v3 stored either a bundled path ("../static/crosshairs/Actual/x.png", or an
 * absolute path into a v3 checkout/install) or a custom absolute path.
 */
export const mapCrosshairImage = (
	value: unknown,
	ctx: V3ImportContext,
): { image: string; custom: boolean } | undefined => {
	if (typeof value !== 'string' || !value || !isImagePath(value)) {
		return undefined;
	}

	const match = value.replace(/\\/g, '/').match(/(?:^|\/)crosshairs\/(.+)$/i);
	if (match) {
		const bundled = path.join(ctx.crosshairsDir, ...match[1].split('/'));
		if (ctx.fileExists(bundled)) {
			return { image: bundled, custom: false };
		}
	}

	if (path.isAbsolute(value) && ctx.fileExists(value)) {
		return { image: value, custom: true };
	}

	return undefined;
};

export const mapV3Preferences = (
	prefs: unknown,
	ctx: V3ImportContext,
): V3ImportResult | null => {
	if (!isDict(prefs)) return null;

	const { crosshair, actions, app, keybinds } = prefs;
	if (![crosshair, actions, app, keybinds].some(isDict)) return null;

	const settings: Partial<SettingsType> = {};
	const kb: Partial<CustomAcceleratorsType> = {};
	const win: Partial<CrosshairWindowStateType> = {};
	const customImages: string[] = [];
	const imported: string[] = [];
	const skipped: string[] = [];

	const done = (from: string, to: string) => imported.push(`${from} -> ${to}`);
	const skip = (from: string, why: string) => skipped.push(`${from} (${why})`);

	// ---- crosshair.* ----
	if (isDict(crosshair)) {
		if (crosshair.crosshair !== undefined) {
			const mapped = mapCrosshairImage(crosshair.crosshair, ctx);
			if (mapped) {
				win.crosshair = mapped.image;
				if (mapped.custom) customImages.push(mapped.image);
				done('crosshair.crosshair', 'windows[id].crosshair');
			} else {
				skip(
					'crosshair.crosshair',
					'no equivalent image found, v4 default kept',
				);
			}
		}

		const size = toNumber(crosshair.size);
		if (size !== undefined) {
			win.crosshairSize = clamp(Math.round(size), 0, 100);
			done('crosshair.size', 'windows[id].crosshairSize');
		}

		const opacity = toNumber(crosshair.opacity);
		if (opacity !== undefined) {
			win.crosshairOpacity = clamp(Math.round(opacity), 0, 100);
			done('crosshair.opacity', 'windows[id].crosshairOpacity');
		}

		const color = toColor(crosshair.color);
		if (color) {
			win.reticleColor = color;
			done('crosshair.color', 'windows[id].reticleColor');
		}

		if (
			typeof crosshair.reticle === 'string' &&
			crosshair.reticle in V3_RETICLES
		) {
			win.reticle = V3_RETICLES[crosshair.reticle];
			done('crosshair.reticle', 'windows[id].reticle');
		}

		// v3 scale is 1-500 (% of crosshair, default 100); v4 size is 0-100 (default 50)
		const reticleScale = toNumber(crosshair.reticleScale);
		if (reticleScale !== undefined) {
			win.reticleSize = clamp(Math.round(reticleScale / 2), 0, 100);
			done(
				'crosshair.reticleScale',
				'windows[id].reticleSize (halved, clamped 0-100)',
			);
		}

		// SVG options only applied in v3 when "Enable SVG Customization" was checked
		if (checkbox(crosshair.svgCustomization, 'svgCustomization')) {
			const fill = toColor(crosshair.fillColor);
			if (fill) {
				win.fillColor = fill;
				done('crosshair.fillColor', 'windows[id].fillColor');
			}
			const stroke = toColor(crosshair.strokeColor);
			if (stroke) {
				win.strokeColor = stroke;
				done('crosshair.strokeColor', 'windows[id].strokeColor');
			}
			const strokeWidth = toNumber(crosshair.strokeWidth);
			if (strokeWidth !== undefined) {
				win.strokeWidth = clamp(Math.round(strokeWidth), 0, 10);
				done('crosshair.strokeWidth', 'windows[id].strokeWidth (clamped 0-10)');
			}
		} else if (crosshair.svgCustomization !== undefined) {
			skip(
				'crosshair.fillColor/strokeColor/strokeWidth',
				'SVG customization was off in v3',
			);
		}

		// v4 applies stored window positions as-is, so only a sanity range here
		const x = toNumber(crosshair.positionX);
		const y = toNumber(crosshair.positionY);
		if (
			x !== undefined &&
			y !== undefined &&
			Math.abs(x) < 20000 &&
			Math.abs(y) < 20000
		) {
			win.x = Math.round(x);
			win.y = Math.round(y);
			done('crosshair.positionX/Y', 'windows[id].x/y');
		}

		if (crosshair.circleThickness !== undefined) {
			skip('crosshair.circleThickness', 'no v4 equivalent');
		}
	}

	// ---- actions.* ----
	if (isDict(actions)) {
		const follow = checkbox(actions.followMouse, 'followMouse');
		if (follow !== undefined) {
			settings.followMouseEnabled = follow;
			done('actions.followMouse', 'followMouseEnabled');
		}

		if (
			actions.resizeOnADS === 'off' ||
			actions.resizeOnADS === 'toggle' ||
			actions.resizeOnADS === 'hold'
		) {
			settings.adsResizeEnabled = actions.resizeOnADS !== 'off';
			if (actions.resizeOnADS !== 'off') {
				settings.adsResizeBehavior = actions.resizeOnADS;
			}
			settings.adsResizeButton = 2; // v3 ADS was hardwired to the right mouse button
			done(
				'actions.resizeOnADS',
				'adsResizeEnabled/adsResizeBehavior/adsResizeButton=2',
			);
		}
		const adsSize = toNumber(actions.ADSSize);
		if (adsSize !== undefined) {
			settings.adsResizeSize = clamp(Math.round(adsSize), 1, 100);
			done('actions.ADSSize', 'adsResizeSize');
		}

		if (typeof actions.hideOnMouse === 'string') {
			const button = Number(actions.hideOnMouse);
			if (Number.isInteger(button) && button >= 1 && button <= 5) {
				settings.hideOnMouseEnabled = true;
				settings.hideOnMouseButton = button;
				const toggle = checkbox(actions.hideOnMouseToggle, 'hideOnMouseToggle');
				settings.hideOnMouseBehavior = toggle ? 'toggle' : 'hold';
				done(
					'actions.hideOnMouse/hideOnMouseToggle',
					'hideOnMouseEnabled/hideOnMouseButton/hideOnMouseBehavior',
				);
			} else if (button === -1) {
				settings.hideOnMouseEnabled = false;
				done('actions.hideOnMouse', 'hideOnMouseEnabled=false');
			}
		}

		const showOnMouseInvert = checkbox(
			actions.showOnMouseInvert,
			'showOnMouseInvert',
		);
		if (showOnMouseInvert !== undefined) {
			settings.hideOnMouseInvert = showOnMouseInvert;
			done('actions.showOnMouseInvert', 'hideOnMouseInvert');
		}

		const hideKey = toV4KeyBind(actions.hideOnKey);
		if (hideKey !== undefined) {
			settings.hideOnKeyEnabled = hideKey !== '';
			settings.hideOnKeyBind = hideKey;
			done('actions.hideOnKey', 'hideOnKeyEnabled/hideOnKeyBind');
		} else if (actions.hideOnKey) {
			skip('actions.hideOnKey', 'key not supported in v4');
		}

		const tiltEnable = checkbox(actions.tiltEnable, 'tiltEnable');
		if (tiltEnable !== undefined) {
			settings.tiltActionEnabled = tiltEnable;
			done('actions.tiltEnable', 'tiltActionEnabled');
		}
		const tiltToggle = checkbox(actions.tiltToggle, 'tiltToggle');
		if (tiltToggle !== undefined) {
			settings.tiltBehavior = tiltToggle ? 'toggle' : 'hold';
			done('actions.tiltToggle', 'tiltBehavior');
		}
		const tiltAngle = toNumber(actions.tiltAngle);
		if (tiltAngle !== undefined) {
			settings.tiltAngle = clamp(Math.round(tiltAngle), 1, 90);
			done('actions.tiltAngle', 'tiltAngle');
		}
		(
			[
				['tiltLeft', 'tiltLeftBind'],
				['tiltRight', 'tiltRightBind'],
			] as const
		).forEach(([from, to]) => {
			const bind = toV4KeyBind(actions[from]);
			if (bind !== undefined) {
				settings[to] = bind;
				done(`actions.${from}`, to);
			} else if (actions[from]) {
				skip(`actions.${from}`, 'key not supported in v4');
			}
		});
	}

	// ---- app.* ----
	if (isDict(app)) {
		if (
			app.theme === 'light' ||
			app.theme === 'dark' ||
			app.theme === 'system'
		) {
			settings.theme = app.theme as ThemeType;
			done('app.theme', 'theme');
		}

		const bg = toColor(app.appBgColor);
		if (bg) {
			win.backgroundColor = bg;
			done('app.appBgColor', 'windows[id].backgroundColor');
		}
		const highlight = toColor(app.appHighlightColor);
		if (highlight) {
			win.foregroundColor = highlight;
			done('app.appHighlightColor', 'windows[id].foregroundColor');
		}

		if (typeof app.appSize === 'string' && app.appSize in V3_APP_SIZES) {
			settings.appSizeMode = V3_APP_SIZES[app.appSize];
			done('app.appSize', 'appSizeMode');
		}

		(
			[
				['notify', 'allowNotifications'],
				['updates', 'allowAutoUpdate'],
				['sounds', 'allowSounds'],
				['gpu', 'hardwareAcceleration'],
				['boot', 'startOnLogin'],
				['hideFromScreenCapture', 'hideFromScreenCapture'],
			] as const
		).forEach(([from, to]) => {
			const checked = checkbox(app[from], from);
			if (checked !== undefined) {
				settings[to] = checked;
				done(`app.${from}`, to);
			}
		});

		const startUnlocked = checkbox(app.startUnlocked, 'startUnlocked');
		if (startUnlocked !== undefined) {
			settings.startLocked = !startUnlocked;
			done('app.startUnlocked', 'startLocked (inverted)');
		}

		['alerts', 'gpuprocess'].forEach((key) => {
			if (app[key] !== undefined) skip(`app.${key}`, 'no v4 equivalent');
		});
	}

	// ---- keybinds.* ----
	if (isDict(keybinds)) {
		Object.entries(keybinds).forEach(([from, value]) => {
			const to = V3_KEYBINDS[from];
			if (!to) {
				skip(`keybinds.${from}`, 'no v4 equivalent');
			} else if (
				typeof value === 'string' &&
				value.trim() &&
				value.length < 80
			) {
				kb[to] = value.trim();
				done(`keybinds.${from}`, `keybinds.${to}`);
			} else {
				skip(`keybinds.${from}`, 'unbound or invalid, v4 default kept');
			}
		});
	}

	return {
		settings,
		keybinds: kb,
		windowState: win,
		customImages,
		imported,
		skipped,
	};
};
