// Toggles Safari's front window into or out of a native fullscreen Space via
// the accessibility attribute, the same window-server mechanism a fullscreen
// game uses. argv[0] is 'on' or 'off'.
function run(argv) {
	const want = argv[0] === 'on'
	const safari = Application('Safari')
	safari.includeStandardAdditions = true
	safari.activate()
	delay(1.5)
	if (safari.windows.length === 0) {
		safari.Document().make()
		delay(1.5)
	}
	const se = Application('System Events')
	const win = se.applicationProcesses.byName('Safari').windows[0]
	if (win.attributes.byName('AXFullScreen').value() === want) {
		return `already ${argv[0]}`
	}
	win.attributes.byName('AXFullScreen').value = want
	delay(3)
	return `AXFullScreen=${win.attributes.byName('AXFullScreen').value()}`
}
