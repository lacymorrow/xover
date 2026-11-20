/**
 * Fails the build if the main bundle loads a Windows-only native module at
 * startup. The bundle is UMD, so webpack lifts every bare `require('x')` of an
 * external into the wrapper on line 1 and runs it on every platform. koffi
 * must load on Windows only: the Linux package ships no koffi binary.
 */
const fs = require('fs');
const path = require('path');

const LAZY = ['koffi'];
const bundle = path.join(__dirname, '../../release/app/dist/main/main.js');
const source = fs.readFileSync(bundle, 'utf8');
// The wrapper ends where its AMD branch starts; everything before runs at load.
const wrapper = source.slice(0, source.indexOf('define.amd'));
const eager = LAZY.filter((name) => wrapper.includes(`"${name}"`));

if (eager.length) {
	console.error(
		`main.js requires ${eager.join(', ')} at load. Load it through __non_webpack_require__ inside the function that needs it.`,
	);
	process.exit(1);
}
