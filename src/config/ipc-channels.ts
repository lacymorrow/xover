// Whitelist channels for IPC
export type Channels = string;

// Main -> Renderer
const APP_UPDATED = 'app-updated';
const APP_NOTIFICATION = 'app-notification'; // to display a notification using the OS notification system

const PRELOAD_SOUNDS = 'preload-sounds';
const PLAY_SOUND = 'play-sound';

const ACTION_STATE = 'action-state';

// Renderer -> Main
const GET_APP_INFO = 'get-app-info';
const GET_APP_MENU = 'get-app-menu';
const GET_APP_PATHS = 'get-app-paths';
const GET_MESSAGES = 'get-messages';
const GET_KEYBINDS = 'get-keybinds';
const GET_SETTINGS = 'get-settings';

const SET_KEYBIND = 'set-keybind';
const SET_SETTINGS = 'set-settings';

const RENDERER_READY = 'renderer-ready';

const TRIGGER_APP_MENU_ITEM_BY_ID = 'trigger-app-menu-item-by-id';
const OPEN_URL = 'open-url';

// CrossOver
const OPEN_FILE = 'open-file';
const QUIT_APP = 'quit-app';
const RESET_APP = 'reset-app';
const UPDATE_APP = 'update-app';
const CLOSE_WINDOW = 'close-window';
const CENTER_WINDOW = 'center-window';
const CENTER_WINDOW_MAIN = 'center-main-window';
const CENTER_WINDOW_SETTINGS = 'center-settings-window';
const FOCUS_WINDOW = 'focus-window';
const FOCUS_WINDOW_MAIN = 'focus-main-window';
const SET_CROSSHAIR = 'set-crosshair';
const OPEN_SETTINGS = 'open-settings';

export const ipcChannels = {
	// main -> renderer
	APP_NOTIFICATION,
	APP_UPDATED,
	PRELOAD_SOUNDS,
	PLAY_SOUND,
	ACTION_STATE,

	// renderer -> main
	RENDERER_READY,
	GET_APP_INFO,
	GET_APP_MENU,
	GET_APP_PATHS,
	GET_MESSAGES,
	GET_KEYBINDS,
	GET_SETTINGS,

	SET_KEYBIND,
	SET_SETTINGS,

	TRIGGER_APP_MENU_ITEM_BY_ID,
	OPEN_URL,

	OPEN_FILE,
	QUIT_APP,
	RESET_APP,
	UPDATE_APP,
	CLOSE_WINDOW,
	CENTER_WINDOW,
	CENTER_WINDOW_MAIN,
	CENTER_WINDOW_SETTINGS,
	FOCUS_WINDOW,
	FOCUS_WINDOW_MAIN,
	SET_CROSSHAIR,
	OPEN_SETTINGS,
};
