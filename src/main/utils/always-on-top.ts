import { BrowserWindow, screen } from 'electron';
import Logger from 'electron-log';
import { is } from '../util';
import { crosshairWindows } from './window-utils';

/**
 * Keep the crosshair on top on Windows, where asking once is not enough.
 *
 * `create-window.ts` asks at creation: `setAlwaysOnTop(true, 'screen-saver', 1)`.
 * On macOS that sets an NSWindow level, which sticks. On Windows it is one
 * `SetWindowPos(HWND_TOPMOST)` call, and the topmost band is itself z-ordered
 * by who asserted last. Every app that asserts topmost after us -- a game's own
 * overlay, a launcher, an anti-cheat splash, the shell redrawing after a
 * resolution or DPI change -- lands above the crosshair and stays there,
 * because v4 never asked again (LAC-7272).
 *
 * That matches the "crosshair disappears in fullscreen games" reports better
 * than exclusive fullscreen does: on otto the LAC-5181 probe stayed visible in
 * all five games tested, including the Vulkan title behind GH #416, and that
 * probe re-applied HWND_TOPMOST once a second. It was mislabelled "what v4 does
 * today", which is what sent that pass chasing UIAccess instead. This module is
 * what the probe was actually doing.
 */

/**
 * How often the crosshair re-asserts topmost.
 *
 * One second is the cadence the LAC-5181 probe held every game with, and one
 * `SetWindowPos` per second costs nothing. Faster buys nothing either: whatever
 * steals the top of the band holds it for at most a tick.
 */
export const REASSERT_INTERVAL_MS = 1000;

let timer: ReturnType<typeof setInterval> | null = null;

/** Put every visible crosshair back at the top of the topmost band. */
export const reassertAlwaysOnTop = () => {
	// Hold off while anything of ours has focus. Settings asks for screen-saver
	// level 2 so a crosshair can never cover it, and since Windows ignores the
	// level and keeps one flat band, re-asserting here would bury Settings
	// behind the crosshair the user is trying to configure. Nothing of ours
	// focused is also the case this guard exists for: the user is in the game.
	const focused = BrowserWindow.getFocusedWindow();

	if (focused && !focused.isDestroyed()) {
		return;
	}

	crosshairWindows().forEach((window) => {
		if (!window.isVisible()) {
			return;
		}

		window.setAlwaysOnTop(true, 'screen-saver', 1);
	});
};

/**
 * Start re-asserting. Safe to call more than once.
 *
 * Windows only: macOS keeps the window level it was given (and its fullscreen
 * behaviour is a different mechanism entirely, fixed in GH #546 by creating the
 * window as a UIElement), and no Linux compositor has been measured here.
 */
export const startAlwaysOnTopGuard = () => {
	if (!is.windows || timer) {
		return;
	}

	timer = setInterval(reassertAlwaysOnTop, REASSERT_INTERVAL_MS);

	// A resolution, scaling or monitor change re-stacks the topmost band, so
	// re-assert on the event rather than making the user wait out a tick.
	// Listed one by one because `screen.on` is typed per event name.
	screen.on('display-metrics-changed', reassertAlwaysOnTop);
	screen.on('display-added', reassertAlwaysOnTop);
	screen.on('display-removed', reassertAlwaysOnTop);

	Logger.status('Always-on-top guard started');
};

/** Stop re-asserting. Safe to call more than once. */
export const stopAlwaysOnTopGuard = () => {
	if (!timer) {
		return;
	}

	clearInterval(timer);
	timer = null;

	screen.removeListener('display-metrics-changed', reassertAlwaysOnTop);
	screen.removeListener('display-added', reassertAlwaysOnTop);
	screen.removeListener('display-removed', reassertAlwaysOnTop);
};
