// Check if the renderer and main bundles are built
import path from 'path';
import chalk from 'chalk';
import fs from 'fs';
import webpackPaths from '../configs/webpack.paths';

const mainPath = path.join(webpackPaths.distMainPath, 'main.js');

// The renderer config emits one bundle per entry as `[name].renderer.js`
// (app, child, crosshair). Checking a bare `renderer.js` looked for a file the
// build never writes, so this gate failed even on a fully built tree and took
// `npm test` with it.
const rendererPath = path.join(
	webpackPaths.distRendererPath,
	'app.renderer.js',
);

if (!fs.existsSync(mainPath)) {
	throw new Error(
		chalk.whiteBright.bgRed.bold(
			'The main process is not built yet. Build it by running "npm run build:main"',
		),
	);
}

if (!fs.existsSync(rendererPath)) {
	throw new Error(
		chalk.whiteBright.bgRed.bold(
			'The renderer process is not built yet. Build it by running "npm run build:renderer"',
		),
	);
}
