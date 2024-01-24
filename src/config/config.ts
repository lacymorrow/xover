// Constants
export const APP_WIDTH = 208;
export const APP_HEIGHT = 130;
export const APP_FRAME = false;

export const APP_ASPECT_RATIO = 16 / 10;
export const APP_BACKGROUND_OPACITY = 0.6;

// App messages are user-facing messages that are displayed in the app; i.e. a public console.log()
export const APP_MESSAGES_MAX = 100;

export const PROTOCOL = 'electron-hotplate'; // Custom app protocol handler for Electron, e.g. `app://`

export const VOLUME = 0.15; // System volume in percent

// // Debounce delay in ms
// export const DEBOUNCE_DELAY = 400;

// // Limit the file types that can be selected using the file input dialog
// export const VALID_FILETYPES = [
// 	'avi',
// 	'flv',
// 	'mp4',
// 	'm4v',
// 	'mov',
// 	'ogg',
// 	'ogv',
// 	'vob',
// 	'wmv',
// 	'mkv',
// ];

export const IMAGE_EXTENSIONS = [
	'.bmp',
	'.gif',
	'.png',
	'.jpg',
	'.jpeg',
	'.svg',
	'.webp',
];

export const DIRECTORY_SCAN_DEPTH = 2; // How many subdirectories to scan for images
