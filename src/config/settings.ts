import { CustomAcceleratorsType } from '@/types/keyboard';

export type ThemeType = 'system' | 'light' | 'dark';
export type IOHookBehaviorType = 'toggle' | 'hold';
export type IOHookInputType = 'mouse' | 'keyboard';

export type NotificationType = 'system' | 'app' | 'all';

export interface SettingsType {
	allowAnalytics: boolean;
	allowSounds: boolean;
	allowAutoUpdate: boolean;
	allowNotifications: boolean;
	notifcationType: NotificationType;
	showDockIcon: boolean; // macOS only
	showTaskbarIcon: boolean; // windows only
	showTrayIcon: boolean;
	quitOnWindowClose: boolean;

	theme: ThemeType;

	startLocked: boolean;
	startOnLogin: boolean;

	hardwareAcceleration: boolean;
	flagDisableGpu: boolean;
	flagDisableSoftwareRasterizer: boolean;
	flagInProcessGpu: boolean;

	backgroundColor: string;
	accentColor: string;

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

	isLocked: boolean;

	// temporary
	isHidden: boolean;
	isSettingsWindowOpen: boolean;
	currentTilt: number;
	resetOnAppStart: boolean; // for debugging, reset via cli
	hadFirstRun: boolean;

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
	allowAnalytics: true,
	allowAutoUpdate: true,
	allowSounds: true,
	allowNotifications: true,
	notifcationType: 'all',
	showDockIcon: true,
	showTaskbarIcon: true,
	showTrayIcon: true,
	quitOnWindowClose: false,

	theme: 'system',

	startLocked: false,
	startOnLogin: false,

	hardwareAcceleration: true,

	flagDisableGpu: false,
	flagDisableSoftwareRasterizer: false,
	flagInProcessGpu: false,

	backgroundColor: '#b80f9c',
	accentColor: '#A0CA98',

	crosshair: '',
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

	altCrosshair: '',
	altBehavior: 'hold', // toggle/hold
	altSize: 100,
	altOpacity: 100,
	altActionEnabled: false,
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

	isLocked: false,

	// temporary
	isSettingsWindowOpen: false,
	isHidden: false,
	currentTilt: 0,
	resetOnAppStart: false, // for debugging, reset via cli
	hadFirstRun: false,
};

// see src/main/keyboard-shortcuts.ts
// a shortcut must have an action, keybind, and fn
const accelerator = 'Control+Shift+Alt';

export const DEFAULT_KEYBINDS: CustomAcceleratorsType = {
	quit: `${accelerator}+Q`,
	reset: `${accelerator}+R`,
	lock: `${accelerator}+X`,
	hide: `${accelerator}+H`,
	center: `${accelerator}+C`,
	newWindow: `${accelerator}+N`,
	changeDisplay: `${accelerator}+M`,
	focusNextWindow: `${accelerator}+F`,
	moveUp: `${accelerator}+Up`,
	moveDown: `${accelerator}+Down`,
	moveLeft: `${accelerator}+Left`,
	moveRight: `${accelerator}+Right`,
	// profile1: `${accelerator}+1`,
	// profile2: `${accelerator}+2`,
	// profile3: `${accelerator}+3`,
};
