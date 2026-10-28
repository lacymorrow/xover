// MacOS only
import { app } from 'electron';
import { is } from './util';

// Sets the badge on the dock icon
const setBadge = (text: string) => {
	if (!is.macos) return;
	app.dock?.setBadge(String(text));
};

// Hides the app from the dock and CMD+Tab, necessary for staying on top macOS fullscreen windows
const setVisible = (visible: boolean) => {
	if (is.macos) {
		if (visible) {
			app.dock?.show();
		} else {
			app.dock?.hide();
		}
	}
};

// The dock is always hidden on macOS, by decision rather than by necessity
// (LAC-5725). The UIElement transform is what lets the crosshair float over a
// fullscreen Space, but `create-window.ts` already does that before the window
// exists, and restoring the icon afterwards does not cost the float. So this is
// one fewer setting, not a fix. Reach the app through the tray icon or the
// global hotkeys.
//
// Note this is not what v3 does: v3 shows the icon while the crosshair is
// unlocked and hides it once locked (`crossover.js` `dock.setVisible(!lock)`).
const initialize = () => {
	if (is.macos) {
		setVisible(false);
	}
};

export default {
	initialize,
	setBadge,
	setVisible,
};
