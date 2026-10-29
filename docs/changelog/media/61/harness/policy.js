// Activation policy of a pid: 0 regular (in the Dock), 1 accessory (UIElement),
// 2 prohibited. Proves whether the probe process really transformed back, so
// "restored the dock and still floats" cannot be a tautology.
ObjC.import('AppKit')

function run(argv) {
	const running = $.NSRunningApplication.runningApplicationWithProcessIdentifier(
		Number.parseInt(argv[0], 10),
	)
	if (!running || running.js === null) {
		return JSON.stringify({ pid: argv[0], policy: null })
	}
	return JSON.stringify({ pid: Number(argv[0]), policy: Number(running.activationPolicy) })
}
