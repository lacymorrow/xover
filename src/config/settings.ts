import { CustomAcceleratorsType } from '@/types/keyboard';
import { APP_HEIGHT, APP_WIDTH } from './config';

export type ThemeType = 'system' | 'light' | 'dark';
export type IOHookBehaviorType = 'toggle' | 'hold';
export type IOHookInputType = 'mouse' | 'keyboard';

export type NotificationType = 'system' | 'app' | 'all';

export interface SettingsType {
	appVersion?: string;
	allowAnalytics: boolean;
	allowSounds: boolean;
	allowAutoUpdate: boolean;
	allowDisableKeyboardShortcuts: boolean;
	allowNotifications: boolean;
	notifcationType: NotificationType;

	showDockIcon: boolean; // macOS only
	showTaskbarIcon: boolean; // windows only
	showTrayIcon: boolean;
	quitOnWindowClose: boolean;

	theme: ThemeType;

	startLocked: boolean;
	startOnLogin: boolean;

	commandLineFlags: string[];
	hardwareAcceleration: boolean;

	backgroundColor: string;
	foregroundColor: string;

	// iohook
	followMouse: boolean;

	tiltActionEnabled: boolean;
	tiltAngle: number;
	tiltBehavior: IOHookBehaviorType; // toggle/hold
	tiltLeftBind: string;
	tiltRightBind: string;

	transitionDuration: number; // ms

	isLocked: boolean;

	// temporary
	currentTilt: number;
	isHidden: boolean;
	isSettingsWindowOpen: boolean;
	resetOnAppStart: boolean; // for debugging, reset via cli
	hadFirstRun: boolean;

	// vibrancy: 'none' | 'sidebar' | 'full';

	crosshair: string;
	crosshairRotation: number;
	crosshairSize: number;
	crosshairOpacity: number;

	reticle: string;
	reticleRotation: number;
	reticleSize: number;
	reticleColor: string;
}

// These are the default settings, imported by the store
export const DEFAULT_SETTINGS: SettingsType = {
	appVersion: '',
	allowAnalytics: true,
	allowAutoUpdate: true,
	allowDisableKeyboardShortcuts: false,
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

	commandLineFlags: [],
	hardwareAcceleration: true,

	backgroundColor: '#b80f9cB0',
	foregroundColor: '#ffffff',

	crosshair: '',
	crosshairOpacity: 100,
	crosshairSize: 100,
	crosshairRotation: 0,

	reticle: 'cross',
	reticleSize: 100,
	reticleRotation: 0,
	reticleColor: '#ffffff',

	// iohook
	followMouse: true,

	tiltActionEnabled: false,
	tiltAngle: 15,
	tiltBehavior: 'hold', // toggle/hold
	tiltLeftBind: '',
	tiltRightBind: '',

	transitionDuration: 100, // ms

	isLocked: false,

	// temporary
	currentTilt: 0,
	isHidden: false,
	isSettingsWindowOpen: false,
	resetOnAppStart: false, // for debugging, reset via cli
	hadFirstRun: false,

	// experimentalFeatures
};

// These are specific to the settings window
export type WindowStateType = {
	x?: number;
	y?: number;
	width?: number;
	height?: number;
};

export interface CrosshairWindowStateType extends WindowStateType {
	// isMaximized: boolean;

	backgroundColor: string;
	foregroundColor: string;

	crosshair: string;
	crosshairRotation: number;
	crosshairSize: number;
	crosshairOpacity: number;

	reticle: string;
	reticleRotation: number;
	reticleSize: number;
	reticleColor: string;

	// svg
	fillColor: string;
	strokeColor: string;
	strokeWidth: number;

	altActionEnabled: boolean;
	altCrosshair: string;
	altBehavior: IOHookBehaviorType; // toggle/hold
	altSize: number;
	altOpacity: number;
	altInput: IOHookInputType; // mouse/keyboard
	altTrigger: number;
}

export const DEFAULT_CROSSHAIR_WINDOW_STATE: CrosshairWindowStateType = {
	width: APP_WIDTH,
	height: APP_HEIGHT,

	backgroundColor: '#b80f9cB0',
	foregroundColor: '#ffffff',

	crosshair: '',
	crosshairRotation: 0,
	crosshairSize: 80,
	crosshairOpacity: 80,

	reticle: 'dot',
	reticleRotation: 0,
	reticleSize: 50,
	reticleColor: '#ffffff',

	// svg
	fillColor: '#ffffff',
	strokeColor: '#000000',
	strokeWidth: 1,

	altActionEnabled: false,
	altCrosshair: '',
	altBehavior: 'hold', // toggle/hold
	altSize: 100,
	altOpacity: 100,
	altInput: 'mouse', // mouse/keyboard
	altTrigger: 0,
};

export const DEFAULT_WINDOW_STATE = {
	settings: {},
};

export type ActionStateType = {
	tilt: number;
};

export const DEFAULT_ACTION_STATE: ActionStateType = {
	tilt: 0,
};

// see src/main/keyboard.ts
// a shortcut must have an action, keybind, and fn
const accelerator = 'Control+Shift+Alt';

export const DEFAULT_KEYBINDS: CustomAcceleratorsType = {
	quit: `${accelerator}+Q`,
	reset: `${accelerator}+R`,
	lock: `${accelerator}+X`,
	hide: `${accelerator}+H`,
	center: `${accelerator}+C`,
	newWindow: `${accelerator}+D`,
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
