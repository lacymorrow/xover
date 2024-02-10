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
};

export const $messages = {
	// Timing messages
	ready: 'App Ready',
	started: 'Started',
	idle: 'Idle',
	mainIdle: 'Main process is now idle',

	// App messages

	resetSettings: 'Reset Settings',
	reset_store: 'Reset App',
	synchronize: 'Synchronizing state...',
	auto_update: 'Checking for updates...',
	update_available: 'Update Available',
	update_available_body: 'Click to download',

	// Network messages
	online: 'Connected',
	offline: 'Disconnected - Cannot fetch metadata',

	init: {
		app: 'Initializing...',
		logger: 'Initializing logger...',
		analytics: 'Initializing analytics...',
		errorHandling: 'Initializing error handling...',
		refreshSettings: 'Refreshing settings...',
		debugging: 'Initializing debugging...',
		commandLineFlags: 'Initializing command line flags...',
		appListeners: 'Registering app listeners...',
	},
};
