/* eslint global-require: off, no-console: off, promise/always-return: off */

// todo: app registration
// sounds for actions
// logging
// translations
// protocol
// analytics
// Scroll reset when changing settings page
// improve keybind input
// Large crosshair chooser
// Add a way to reset settings like slider values to default
// Secondary crosshair - 61
// SVG support
// Image overlay - 112
// Tray/Dock menus
// Reset app button in settings should restart app
// Restart app doesn't work - Unable to parse /Users/lacy/repo/xover/package.json process.send is not a function
// First Run
// Migrations
// Notify of new version
// Ask for accessiblity permissions MAC
// Less Renderer sync
// use same dock icon
// dock icon remains after quitting
// position settings
// resizeable window crosshair doesn't stay centered

/*
Done:
- Disable all keyboard shortcuts - 299
- Multiple crosshair windows - save window state
/*

Todo:
- Push data instead of pulling from renderer s
- Inputs should reset to default value when the settings are reset
- Allow disabling of the inputs
- Debounce Slider
- sass
- Homepage
- Documentation
*/

import { app } from 'electron';
import Logger from 'electron-log/main';
import { $errors, $init } from '../config/strings';

import ipc from './ipc';
import { ready, startup } from './startup';

// Initialize the timer
console.time(app.name);
console.timeLog(app.name, $init.app);

// Register ipcMain listeners
ipc.initialize();

// SETUP APP (runs after startup())
app
	.whenReady()
	.then(ready) // <-- this is where the app is initialized
	.catch((error: Error) => {
		Logger.error($errors.prefix, error);
	});

// LAUNCH THE APP
startup();

// See the idle() function in src/main/startup.ts
// it's called in the ipcMain.on(ipcChannels.RENDERER_READY) listener
// when the renderer process is ready
