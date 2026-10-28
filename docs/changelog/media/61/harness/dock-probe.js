// LAC-5973 item 1. Does a macOS window float over another app's fullscreen
// Space only when the process was a UIElement at the moment it was created,
// and does transforming back to a regular app afterwards cost it that?
//
// Runs on graphite against xover's Electron 40. Windows are identified by
// CGWindowID (via getMediaSourceId) because kCGWindowName is withheld without
// Screen Recording permission.
const { app, BrowserWindow } = require('electron')
const fs = require('fs')

const arg = (name, fallback) => {
	const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
	return hit ? hit.slice(name.length + 3) : fallback
}

const mode = arg('mode', 'baseline')
const out = arg('out', '/tmp/lac5973/ids.json')
const delayMs = Number(arg('delay', '12000'))
const lifeMs = Number(arg('life', '45000'))

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let slot = 0

// The crosshair's own options, as close as matters: transparent, frameless,
// screen-saver level, visible on all workspaces including fullscreen.
const make = (label) => {
	slot += 1
	const win = new BrowserWindow({
		width: 200,
		height: 200,
		x: 80 + slot * 220,
		y: 120,
		show: false,
		frame: false,
		transparent: true,
		backgroundColor: '#00000000',
		hasShadow: false,
		alwaysOnTop: true,
		fullscreenable: false,
		focusable: false,
		skipTaskbar: true,
		resizable: false,
		webPreferences: { sandbox: false },
	})
	win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
	win.setAlwaysOnTop(true, 'screen-saver', 1)
	win.loadURL(
		`data:text/html,<body style="margin:0;background:rgba(255,0,0,.6);color:#fff;font:14px system-ui">${label}`,
	)
	win.showInactive()
	const id = Number(win.getMediaSourceId().split(':')[1])
	return {
		label,
		id,
		dockVisible: app.dock.isVisible(),
		isVisible: win.isVisible(),
	}
}

app.whenReady().then(async () => {
	await wait(delayMs)

	const windows = []

	if (mode === 'baseline') {
		// Regular app at creation, then UIElement at creation. One run, so both
		// windows are read against the same fullscreen Space.
		app.dock.show()
		await wait(1500)
		windows.push(make('regular-at-create'))

		app.dock.hide()
		await wait(1500)
		windows.push(make('uielement-at-create'))
	} else if (mode === 'restore') {
		// UIElement at creation, then back to a regular app. This is the only
		// question the fix hinges on: can v4 keep its dock icon default?
		app.dock.hide()
		await wait(1500)
		windows.push(make('uielement-then-restored'))

		await wait(1500)
		app.dock.show()
	} else if (mode === 'restore-fast') {
		// The real code path: hide, create, restore, with nothing in between.
		// TransformProcessType is synchronous, but AppKit coalescing would make
		// the slow version above a false positive, so this is the one that counts.
		app.dock.hide()
		windows.push(make('hidden-create-restored-same-tick'))
		app.dock.show()
	} else {
		throw new Error(`unknown mode ${mode}`)
	}

	await wait(2000)
	fs.writeFileSync(
		out,
		JSON.stringify({ mode, pid: process.pid, windows }, null, '\t'),
	)

	await wait(lifeMs)
	app.exit(0)
})
