export type ThemeType = 'system' | 'light' | 'dark';
export type IOHookBehaviorType = 'toggle' | 'hold';
export type IOHookInputType = 'mouse' | 'keyboard';

export interface SettingsType {
	allowSounds: boolean;
	autoUpdate: boolean;
	allowNotifications: boolean;
	notifcationType: 'default' | 'system' | 'all';
	showDockIcon: boolean; // macOS only
	showTrayIcon: boolean;
	quitOnWindowClose: boolean;

	theme: ThemeType;

	startLocked: boolean;
	startOnLogin: boolean;
	hardwareAcceleration: boolean;
	browserGPU: boolean;

	backgroundColor: string;
	accentColor: string;

	locked: boolean;

	crosshair: string;
	crosshairSize: number;
	crosshairOpacity: number;

	reticleSize: number;
	reticleOpacity: number;
	reticleColor: string;

	// svg
	fillColor: string;
	strokeColor: string;
	strokeWidth: number;

	// iohook
	followMouse: boolean;

	altActionEnabled: boolean;
	altCrosshair: string;
	altBehavior: IOHookBehaviorType; // toggle/hold
	altSize: number;
	altOpacity: number;
	altInput: IOHookInputType; // mouse/keyboard
	altTrigger: number;

	hideActionEnabled: boolean;
	hideBehavior: IOHookBehaviorType; // toggle/hold
	hideInput: IOHookInputType; // mouse/keyboard
	hideTrigger: number;

	tiltActionEnabled: boolean;
	tiltAngle: number;
	tiltBehavior: IOHookBehaviorType; // toggle/hold
	tiltInput: IOHookInputType; // mouse/keyboard
	tiltTrigger: number;

	// keybinds
	keyLock: string;
	keyHide: string;
	keyCenter: string;
	keyNew: string;
	keyFocus: string;
	keyChangeDisplay: string;
	keyUp: string;
	keyDown: string;
	keyLeft: string;
	keyRight: string;
	keyReset: string;
	keyProfile1: string;
	keyProfile2: string;
	keyProfile3: string;

	// temporary
	currentlyHidden: boolean;
	currentTilt: number;
	resetOnAppStart: boolean; // for debugging, reset via cli

	// vibrancy: 'none' | 'sidebar' | 'full';
	// lastWindowState: {
	// 	x: number;
	// 	y: number;
	// 	width: number;
	// 	height: number;
	// 	isMaximized: boolean;
	// };
}

// These are the default settings, imported by the store
export const DEFAULT_SETTINGS: SettingsType = {
	autoUpdate: true,
	allowSounds: true,
	allowNotifications: true,
	notifcationType: 'all',
	showDockIcon: true,
	showTrayIcon: true,
	quitOnWindowClose: true,

	theme: 'system',

	startLocked: false,
	startOnLogin: false,
	hardwareAcceleration: true,
	browserGPU: false,

	backgroundColor: '#b80f9c',
	accentColor: '',

	locked: false,

	crosshair:
		'/Users/lacymorrow/repo/xover/src/static/crosshairs/Chevron/Cyan.png',
	crosshairSize: 100,
	crosshairOpacity: 100,

	reticleSize: 100,
	reticleOpacity: 100,
	reticleColor: '#ffffff',

	// svg
	fillColor: '#ffffff',
	strokeColor: '#000000',
	strokeWidth: 1,

	// iohook
	followMouse: false,

	altActionEnabled: false,
	altCrosshair: '',
	altBehavior: 'hold', // toggle/hold
	altSize: 100,
	altOpacity: 100,
	altTrigger: 1,
	altInput: 'mouse',

	hideActionEnabled: false,
	hideBehavior: 'hold', // toggle/hold
	hideTrigger: 1,
	hideInput: 'mouse',

	tiltActionEnabled: false,
	tiltAngle: 15,
	tiltBehavior: 'hold', // toggle/hold
	tiltTrigger: 1,
	tiltInput: 'mouse',

	// keybinds
	keyLock: '',
	keyHide: '',
	keyCenter: '',
	keyNew: '',
	keyFocus: '',
	keyChangeDisplay: '',
	keyUp: '',
	keyDown: '',
	keyLeft: '',
	keyRight: '',
	keyReset: '',
	keyProfile1: '',
	keyProfile2: '',
	keyProfile3: '',

	// reset: 'Control+Shift+Alt+R',
	// lock: 'Control+Shift+Alt+X',
	// center: 'Control+Shift+Alt+C',
	// hide: 'Control+Shift+Alt+H',
	// duplicate: 'Control+Shift+Alt+D',
	// changeDisplay: 'Control+Shift+Alt+M',
	// moveUp: 'Control+Shift+Alt+Up',
	// moveDown: 'Control+Shift+Alt+Down',
	// moveLeft: 'Control+Shift+Alt+Left',
	// moveRight: 'Control+Shift+Alt+Right',
	// nextWindow: 'Control+Shift+Alt+O',
	// about: 'Control+Shift+Alt+A',
	// quit: 'Control+Shift+Alt+Q',

	// temporary
	currentlyHidden: false,
	currentTilt: 0,
	resetOnAppStart: false, // for debugging, reset via cli
};
