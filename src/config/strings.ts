
export const $actions = {
	centerWindow: 'Centering window',
	moveToNextDisplay: 'Moving window to next display',
};

export const $appListeners = {
	allWindowsClosed: 'All windows closed',
	activate: 'App activated',
	willQuit: 'App will quit',
	beforeQuit: 'Before quit',
	secondInstance: 'Second instance detected',
};

export const $autoUpdate = {
	autoUpdate: 'Checking for updates...',
	updateAvailable: 'Update Available',
	updateAvailableBody: 'Click to download',
};

export const $dialog = {
	error: {
		title: 'An error occurred',
		ignore: 'Ignore',
		report: 'Report',
		quit: 'Quit',
	},
};

export const $errors = {
	prefix: 'Main> ',
	blockedNavigation: 'Blocked navigation to: ',
	github: 'Failed to fetch GitHub data',
	invalidChannel: 'Invalid IPC channel',
	invalidDirection: 'Invalid direction',
	noActiveWindow: 'No active window',
};

export const $messages = {
	resetStore: 'Reset App',
	resetStoreSettings: 'Reset App Settings',

	// Network messages
	online: 'Connected',
	offline: 'Disconnected - No internet connection',
};

export const $init = {
	// Timing messages
	app: 'Initializing...',
	startup: 'Starting...',
	started: 'Started',
	ready: 'App Ready',
	logger: 'Initializing logger...',
	analytics: 'Initializing analytics...',
	errorHandling: 'Initializing error handling...',
	debugging: 'Initializing debugging...',
	commandLineFlags: 'Initializing command line flags...',
	refreshSettings: 'Refreshing settings...',
	resetApp: 'Resetting app...',
	appFlags: 'Registering app flags...',
	appListeners: 'Registering app listeners...',
	mainIdle: 'Main process is now idle',
	idle: 'Idle',
};

export const $iohook = {
	enabled: 'iohook enabled',
	disabled: 'iohook disabled',
};

export const $settings = {
	title: 'Settings',
	description: 'Manage your account settings and application preferences',
	reloadToApply: 'Changes will not take effect until the app is restarted.',
	app: {
		githubUrl: 'https://github.com/lacymorrow/electron-hotplate',
		repo: 'lacymorrow/electron-hotplate',
		description: 'A boilerplate for Electron applications',
	},
	appearance: {
		themeLabel: 'Theme',
		themeDescription: 'Select the theme for the application',
		light: 'Light',
		dark: 'Dark',
		system: 'System',
	},
	theme: {
		themeLabel: 'Theme',
		themeDescription: 'Select the theme for the application',
		light: 'Light',
		dark: 'Dark',
		system: 'System',
		action: 'Change Theme',
	},
};
