// Prints the on-screen window list as JSON. kCGWindowName is withheld without
// Screen Recording permission, so windows are identified by number + owner pid.
// kCGWindowListOptionOnScreenOnly is 1 and kCGNullWindowID is 0: the named
// constants are not in CoreGraphics' BridgeSupport. The return value arrives as
// an opaque CFArrayRef that answers no messages until it is cast.
ObjC.import('CoreGraphics')
ObjC.import('Foundation')

function run() {
	const list = ObjC.castRefToObject($.CGWindowListCopyWindowInfo(1, 0))

	const rows = []
	const count = Number(list.count)
	for (let i = 0; i < count; i += 1) {
		const window = list.objectAtIndex(i)
		const read = (key) => {
			const value = window.objectForKey($(key))
			return value && Number(value.length) !== undefined ? ObjC.unwrap(value) : null
		}
		rows.push({
			id: Number(read('kCGWindowNumber')),
			pid: Number(read('kCGWindowOwnerPID')),
			owner: read('kCGWindowOwnerName'),
			layer: Number(read('kCGWindowLayer')),
			alpha: Number(read('kCGWindowAlpha')),
		})
	}

	return JSON.stringify(rows)
}
