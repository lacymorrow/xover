import { execSync } from 'child_process';
import fs from 'fs';
import { dependencies } from '../../release/app/package.json';
import webpackPaths from '../configs/webpack.paths';

if (
	Object.keys(dependencies || {}).length > 0 &&
	fs.existsSync(webpackPaths.appNodeModulesPath)
) {
	const electronRebuildCmd =
		'../../node_modules/.bin/electron-rebuild --force --types prod,dev,optional --module-dir .';
	// Fall back to @electron/rebuild if electron-rebuild binary doesn't exist
	const altCmd =
		'npx --no @electron/rebuild --force --types prod,dev,optional --module-dir .';
	const baseCmd = fs.existsSync(
		process.platform === 'win32'
			? '../../node_modules/.bin/electron-rebuild.cmd'
			: '../../node_modules/.bin/electron-rebuild',
	)
		? electronRebuildCmd
		: altCmd;
	const cmd =
		process.platform === 'win32' ? baseCmd.replace(/\//g, '\\') : baseCmd;
	execSync(cmd, {
		cwd: webpackPaths.appPath,
		stdio: 'inherit',
	});
}
