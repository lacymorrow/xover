import { CustomAcceleratorsType } from '@/types/keyboard';
import { APP_HEIGHT, APP_WIDTH } from './config';

export type ThemeType = 'system' | 'light' | 'dark';
export type UiohookBehaviorType = 'toggle' | 'hold';
export type UiohookInputType = 'mouse' | 'keyboard';

export type NotificationType = 'system' | 'app' | 'all';

export interface SettingsType {
	appVersion?: string;
	accentColor: string;
	allowAnalytics: boolean;
	allowSounds: boolean;
	allowAutoUpdate: boolean;
	allowDisableKeyboardShortcuts: boolean;
	allowNotifications: boolean;
	notificationType: NotificationType;
	showDockIcon: boolean; // macOS only
	showTaskbarIcon: boolean; // windows only
	showTrayIcon: boolean;
	quitOnWindowClose: boolean;

	theme: ThemeType;

	startLocked: boolean;
	startOnLogin: boolean;

	commandLineFlags: string[];
	hardwareAcceleration: boolean;

	// uiohook-napi
	followMouseEnabled: boolean;

	secondaryActionEnabled: boolean;
	secondaryBind: string;
	secondaryBehavior: UiohookBehaviorType; // toggle/hold

	tiltActionEnabled: boolean;
	tiltAngle: number;
	tiltBehavior: UiohookBehaviorType; // toggle/hold
	tiltLeftBind: string;
	tiltRightBind: string;

  // Hide on inputs
  hideOnMouseBind: string; // e.g., 'mouse:2'
  hideOnMouseBehavior: UiohookBehaviorType; // toggle/hold
  hideOnKeyBind: string; // e.g., 'keyboard:ALT'

  // ADS resize
  adsResizeEnabled: boolean;
  adsResizeBind: string; // e.g., 'mouse:2'
  adsResizeBehavior: UiohookBehaviorType; // toggle/hold
  adsResizeSize: number; // 1-100

	transitionDuration: number; // ms

	isLocked: boolean;

	// temporary
	currentTilt: number;
	isHidden: boolean;
	isSettingsWindowOpen: boolean;
	resetOnAppStart: boolean; // for debugging, reset via cli
	hadFirstRun: boolean;

	// vibrancy: 'none' | 'sidebar' | 'full';
}

// These are the default settings, imported by the store
export const DEFAULT_SETTINGS: SettingsType = {
	appVersion: '',
	accentColor: '#b453ff',
	allowAnalytics: true,
	allowAutoUpdate: true,
	allowDisableKeyboardShortcuts: false,
	allowSounds: true,
	allowNotifications: true,
	notificationType: 'all',
	showDockIcon: true,
	showTaskbarIcon: true,
	showTrayIcon: true,
	quitOnWindowClose: false,

	theme: 'system',

	startLocked: false,
	startOnLogin: false,

	commandLineFlags: [],
	hardwareAcceleration: true,

	// uiohook-napi
	followMouseEnabled: false,

	secondaryActionEnabled: false,
	secondaryBind: '',
	secondaryBehavior: 'hold', // toggle/hold

	tiltActionEnabled: false,
	tiltAngle: 15,
	tiltBehavior: 'hold', // toggle/hold
	tiltLeftBind: '',
	tiltRightBind: '',

  hideOnMouseBind: '',
  hideOnMouseBehavior: 'hold',
  hideOnKeyBind: '',

  adsResizeEnabled: false,
  adsResizeBind: '',
  adsResizeBehavior: 'hold',
  adsResizeSize: 50,

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
	resizable: boolean;

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

	crosshairSecondary: string;
	crosshairRotationSecondary: number;
	crosshairSizeSecondary: number;
	crosshairOpacitySecondary: number;

	reticleSecondary: string;
	reticleRotationSecondary: number;
	reticleSizeSecondary: number;
	reticleColorSecondary: string;
}

export const DEFAULT_CROSSHAIR_WINDOW_STATE: CrosshairWindowStateType = {
	width: APP_WIDTH,
	height: APP_HEIGHT,

	resizable: false,

	backgroundColor: '',
	foregroundColor: '',

	crosshair: '',
	crosshairRotation: 0,
	crosshairSize: 80,
	crosshairOpacity: 80,

	reticle: 'dot',
	reticleRotation: 0,
	reticleSize: 50,
	reticleColor: '',

	// svg
	fillColor: '#ffffff',
	strokeColor: '#000000',
	strokeWidth: 1,

	crosshairSecondary: '',
	crosshairRotationSecondary: 0,
	crosshairSizeSecondary: 80,
	crosshairOpacitySecondary: 80,

	reticleSecondary: 'dot',
	reticleRotationSecondary: 0,
	reticleSizeSecondary: 30,
	reticleColorSecondary: '',
};

export const DEFAULT_WINDOW_STATE = {
	settings: {},
};

export type ActionStateType = {
	tilt: number;
	secondary: boolean;
};

export const DEFAULT_ACTION_STATE: ActionStateType = {
	tilt: 0,
	secondary: false,
};

// see src/main/keyboard.ts
// a shortcut must have an action, keybind, and fn
const accelerator = 'Control+Shift+Alt';

export const DEFAULT_KEYBINDS: CustomAcceleratorsType = {
	lock: `${accelerator}+X`,
	quit: `${accelerator}+Q`,
	reset: `${accelerator}+R`,
	hide: `${accelerator}+H`,
	center: `${accelerator}+C`,
	newWindow: `${accelerator}+N`,
	duplicateWindow: `${accelerator}+D`,
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
