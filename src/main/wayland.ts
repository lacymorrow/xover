import { app } from 'electron';
import Logger from 'electron-log';
import process from 'process';
import { DEFAULT_SETTINGS } from '../config/settings';
import { getSetting } from './store-actions';

/*
	Global hotkeys need an X11 input grab.

	`globalShortcut` and `uiohook-napi` both ask an X server to grab a key
	combination. A native Wayland compositor has no equivalent and refuses by
	design, so `globalShortcut.register()` reports success and the shortcut then
	never fires. That is why GH #456 read as "shortcuts are set but they do
	nothing" instead of a registration error, and why the conflict notice in
	`keyboard.ts` never fired on this path.

	XWayland does honor the grabs. The reporter on #456 confirmed that launching
	with `--ozone-platform=x11` makes every shortcut work on KDE Plasma Wayland.

	We cannot make that choice with a switch from here: Chromium picks its
	windowing backend and locks its feature list before this code runs
	(electron/electron#54594). A new process can, so `relaunchOnX11()` restarts
	CrossOver with the backend on its command line from the start, and
	`detect()` explains the session to anyone the relaunch deliberately skips.

	Ported from v3 #571 (the notice) and #577 (the relaunch). v3 ships Electron
	14, where the relaunch can never fire; v4 is Electron 40, so this is live
	code for our own Linux builds. See `relaunchOnX11()` for every guard and for
	the one risk that could not be measured without Linux hardware.
*/

const OZONE_SWITCH = 'ozone-platform';
const FEATURES_SWITCH = 'enable-features';
const OZONE_FEATURE = 'UseOzonePlatform';
const HINT_ENV = 'ELECTRON_OZONE_PLATFORM_HINT';

// Set on the process we relaunch, so a switch that does not take effect leaves
// us with one wasted start instead of a relaunch loop.
const RELAUNCHED_ENV = 'CROSSOVER_RELAUNCHED_X11';

// Ozone became the Linux default during the Electron 2x line; before that there
// is no Ozone at all unless UseOzonePlatform is on the command line, and the one
// backend is legacy X11 (XWayland in a Wayland session).
//
// The version is read live rather than taken from package.json on purpose. The
// users on #456 run distro repackages against system Electron, which is how a v3
// build whose own Electron is 14 ended up reporting Electron 38.4. v4's source
// can land on an Electron either side of this line the same way, so the gate is
// live code, not decoration.
const OZONE_DEFAULT_ELECTRON = 21;

// ELECTRON_OZONE_PLATFORM_HINT landed in Electron 27 (electron/electron#39792).
// Older builds ignore it, so reading it there would name a backend we are not on.
const HINT_ELECTRON = 27;

// From Electron 38 the default is `auto`, which takes Wayland in a Wayland
// session. Before that the default was x11 (electron/electron#48002). v4 is 40,
// so our own Linux builds land on the Wayland backend by default.
const AUTO_DEFAULT_ELECTRON = 38;

// What the user reads when no shortcut can fire. Short: this is a notification body.
const REASON_NATIVE_WAYLAND =
	"Wayland won't let CrossOver grab hotkeys. Relaunch with --ozone-platform=x11 or use an X11 session.";
const REASON_NO_X_SERVER =
	'Global hotkeys need an X server. Install XWayland or log in to an X11 session.';

export interface WaylandState {
	/** A Wayland login session. */
	wayland: boolean;
	/** The windowing backend Chromium is using, or null off Linux. */
	backend: string | null;
	/** Can we ask an X server for a key grab? */
	usingX11: boolean;
	/** Null unless no shortcut can fire; otherwise a sentence the user can act on. */
	shortcutsBlockedReason: string | null;
}

const state: WaylandState = {
	wayland: false,
	backend: null,
	usingX11: false,
	shortcutsBlockedReason: null,
};

const electronMajor = () =>
	Number.parseInt(process.versions.electron ?? '', 10) || 0;

const isWaylandSession = () =>
	process.platform === 'linux' &&
	(process.env.XDG_SESSION_TYPE === 'wayland' ||
		Boolean(process.env.WAYLAND_DISPLAY));

// DISPLAY is only set when an X server (XWayland, in a Wayland session) is reachable.
const hasXServer = () => Boolean(process.env.DISPLAY);

// Reads the command line Chromium itself parsed, so these answers are about the
// backend we are on rather than one we hoped to set.
const switchValue = (name: string) =>
	app.commandLine.hasSwitch(name) ? app.commandLine.getSwitchValue(name) : '';

const ozoneAvailable = () =>
	electronMajor() >= OZONE_DEFAULT_ELECTRON ||
	switchValue(FEATURES_SWITCH).includes(OZONE_FEATURE);

const requestedPlatform = () => {
	const chosen = switchValue(OZONE_SWITCH);
	if (chosen) {
		return chosen;
	}

	if (electronMajor() >= HINT_ELECTRON && process.env[HINT_ENV]) {
		return process.env[HINT_ENV] as string;
	}

	return electronMajor() >= AUTO_DEFAULT_ELECTRON ? 'auto' : 'x11';
};

const activeBackend = () => {
	// Without Ozone there is one backend: legacy X11.
	if (!ozoneAvailable()) {
		return 'x11';
	}

	const requested = requestedPlatform();
	if (requested !== 'auto') {
		return requested;
	}

	return isWaylandSession() ? 'wayland' : 'x11';
};

/**
 * Work out whether global hotkeys can fire in this session.
 * Safe to call more than once; every field is recomputed.
 */
const detect = (): WaylandState => {
	state.wayland = isWaylandSession();
	state.backend = process.platform === 'linux' ? activeBackend() : null;
	state.usingX11 = state.backend === 'x11' && hasXServer();

	// Drive the verdict off the outcome, not off what we asked for: a session is
	// blocked whenever it is Wayland and no X server is in the path.
	if (state.wayland && !state.usingX11) {
		state.shortcutsBlockedReason =
			state.backend === 'x11' ? REASON_NO_X_SERVER : REASON_NATIVE_WAYLAND;
	} else {
		state.shortcutsBlockedReason = null;
	}

	if (!state.wayland) {
		return state;
	}

	if (state.shortcutsBlockedReason) {
		Logger.warn(
			`Wayland session on the ${state.backend} backend: the compositor will not let CrossOver grab a global hotkey, so no shortcut can fire. ${state.shortcutsBlockedReason}`,
		);
	} else {
		Logger.info(
			'Wayland session running through XWayland: global shortcuts can grab keys',
		);
	}

	return state;
};

// electron-store's `default` applies only when `settings` is absent altogether,
// so a store written by an earlier build has no `relaunchOnX11` key and reads
// back undefined. Absent has to mean the default here: an upgraded user must not
// silently keep the dead-hotkey bug because their config predates the setting.
const relaunchAllowed = () =>
	Boolean(getSetting('relaunchOnX11') ?? DEFAULT_SETTINGS.relaunchOnX11);

// We have had our one attempt once either of these is true: the env var we set
// on the relaunched process, or an `--ozone-platform=x11` already sitting in
// argv. The second covers launchers that hand Chromium a stripped command line,
// the same reason `--reset` is read off argv in command-line-flags.ts. Without
// it, a switch that never arrives would relaunch forever.
const alreadyRelaunched = () =>
	Boolean(process.env[RELAUNCHED_ENV]) ||
	process.argv.slice(1).includes(`--${OZONE_SWITCH}=x11`);

// The command line to come back with: our own arguments, minus the backend
// switches we are replacing, plus Ozone/X11. UseOzonePlatform is merged into any
// existing --enable-features rather than appended as a second copy, since
// Chromium keeps only the last copy of a switch, so appending would silently
// drop the user's features.
const x11Args = () => {
	const features = switchValue(FEATURES_SWITCH).split(',').filter(Boolean);
	if (!features.includes(OZONE_FEATURE)) {
		features.push(OZONE_FEATURE);
	}

	const forwarded = process.argv
		.slice(1)
		.filter(
			(argument) =>
				!argument.startsWith(`--${OZONE_SWITCH}`) &&
				!argument.startsWith(`--${FEATURES_SWITCH}`),
		);

	return [
		...forwarded,
		`--${FEATURES_SWITCH}=${features.join(',')}`,
		`--${OZONE_SWITCH}=x11`,
	];
};

/**
 * Restart on the Ozone/X11 backend when we are on a native Wayland backend that
 * can never grab a hotkey.
 *
 * Must run before any window exists: it replaces this process. Returns true when
 * the relaunch is under way, so the caller can stop starting up.
 */
const relaunchOnX11 = () => {
	// The only backend that cannot grab a key. Read live rather than off state,
	// so this does not depend on detect() having run first.
	if (process.platform !== 'linux' || activeBackend() !== 'wayland') {
		return false;
	}

	// Ozone/X11 was experimental back when Ozone was not yet the Linux default,
	// and that era is the surface GH #450's black-overlay reports live on. From
	// the line where Ozone is the default, x11 is simply the other supported
	// backend.
	if (electronMajor() < OZONE_DEFAULT_ELECTRON) {
		return false;
	}

	// `--ozone-platform=wayland` is a choice, not an accident: someone asked for
	// this backend, possibly for the transparency in #450. Leave them on it and
	// let the notice explain what it costs.
	if (switchValue(OZONE_SWITCH) === 'wayland') {
		return false;
	}

	// x11 with no X server has no windows at all, which is worse than no hotkeys.
	if (!hasXServer()) {
		return false;
	}

	if (alreadyRelaunched()) {
		Logger.warn(
			'Already relaunched for Ozone/X11 and still on the Wayland backend: staying here so this cannot loop',
		);

		return false;
	}

	// The escape hatch that v3 did not need. v3 is Electron 14, so its users
	// could never reach this code; v4's own Linux builds do, and nobody in the
	// fleet has Linux hardware to confirm the overlay is still transparent after
	// the backend switch. Defaults on, because a dead hotkey is the reported bug
	// and the switch is the only fix that reaches a distro repackage. Anyone it
	// does break turns this off and keeps a working overlay without a hotkey.
	if (!relaunchAllowed()) {
		Logger.info(
			'Native Wayland backend cannot grab global hotkeys, but the Ozone/X11 relaunch is turned off in settings: staying on Wayland',
		);

		return false;
	}

	const args = x11Args();

	Logger.info(
		`Native Wayland backend cannot grab global hotkeys. Relaunching on Ozone/X11: ${args.join(' ')}`,
	);

	// Inherited by the relaunched process. This is what stops a second attempt.
	process.env[RELAUNCHED_ENV] = '1';

	app.relaunch({ args });
	app.exit(0);

	return true;
};

// Why global hotkeys cannot work here, or null when nothing is blocking them.
const shortcutsBlockedReason = () => state.shortcutsBlockedReason;

const debugInfo = () => {
	if (!state.wayland) {
		return `Session: ${process.platform}${
			state.backend ? ` (${state.backend} backend)` : ''
		}`;
	}

	return `Session: wayland (${state.backend} backend, hotkeys ${
		state.usingX11 ? 'via XWayland' : 'cannot be grabbed here'
	})`;
};

export default {
	debugInfo,
	detect,
	relaunchOnX11,
	shortcutsBlockedReason,
};
