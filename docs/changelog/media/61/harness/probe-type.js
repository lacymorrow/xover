ObjC.import('CoreGraphics')
ObjC.import('Foundation')
function run() {
	const raw = $.CGWindowListCopyWindowInfo(1, 0)
	const out = {}
	try {
		const arr = ObjC.castRefToObject(raw)
		out.count = arr.count
		out.cls = ObjC.unwrap(arr.className)
	} catch (e) { out.err = String(e) }
	return JSON.stringify(out)
}
