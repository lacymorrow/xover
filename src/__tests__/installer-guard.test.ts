/**
 * @jest-environment node
 *
 * v3 installs read the same latest.yml as v4. v3.3.x and older ignore
 * minimumSystemVersion, and nothing in the yml can tell 32-bit Windows 10
 * apart, so the NSIS installer itself must refuse those systems before it
 * uninstalls v3. See assets/installer.nsh.
 */
import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '..', '..');
const pkg = JSON.parse(
	fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
);
const guard = fs.readFileSync(
	path.join(root, 'assets', 'installer.nsh'),
	'utf8',
);

describe('Windows installer guard', () => {
	it('is wired into the NSIS build', () => {
		expect(pkg.build.nsis.include).toBe('assets/installer.nsh');
	});

	it('runs in preInit, before electron-builder checks 64-bit or uninstalls v3', () => {
		expect(guard).toMatch(/!macro preInit/);
	});

	it('refuses pre-Windows 10, 32-bit Windows, and ARM before Windows 11', () => {
		expect(guard).toMatch(/\$\{IfNot\} \$\{AtLeastWin10\}/);
		expect(guard).toMatch(/\$\{ElseIfNot\} \$\{RunningX64\}/);
		expect(guard).toMatch(/\$\{IsNativeARM64\}[\s\S]*AtLeastBuild\} 22000/);
	});

	it('stays quiet when electron-updater runs it silently', () => {
		expect(guard).toMatch(/\$\{IfNot\} \$\{Silent\}[\s\S]*MessageBox/);
	});

	it('only ships x64 Windows builds (uiohook-napi 1.5.4 has no win32-ia32 prebuild)', () => {
		const archs = pkg.build.win.target.flatMap(
			(t: { arch: string[] }) => t.arch,
		);
		expect(new Set(archs)).toEqual(new Set(['x64']));
	});
});
