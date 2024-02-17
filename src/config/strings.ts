export const $settings = {
	title: 'Settings',
	description: 'Manage your account settings and application preferences',
	reloadToApply: 'Changes will not take effect until the app is restarted.',
	app: {
		githubUrl: 'https://github.com/lacymorrow/electron-hotplate',
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

export const $dialog = {
	add: {
		title: 'Add Media',
		buttonLabel: 'Add',
	},
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
	invalidChannel: 'Invalid IPC channel',
	secondInstance: 'Second instance detected',
};

export const $messages = {
	resetStore: 'Reset App',
	resetStoreSettings: 'Reset App Settings',

	// Network messages
	online: 'Connected',
	offline: 'Disconnected - Cannot fetch metadata',
};

export const $autoUpdate = {
	autoUpdate: 'Checking for updates...',
	updateAvailable: 'Update Available',
	updateAvailableBody: 'Click to download',
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
	appFlags: 'Registering app flags...',
	appListeners: 'Registering app listeners...',
	mainIdle: 'Main process is now idle',
	idle: 'Idle',
};

export const $iohook = {
	enabled: 'iohook enabled',
	disabled: 'iohook disabled',
};

export const $appListeners = {
	allWindowsClosed: 'All windows closed',
};
