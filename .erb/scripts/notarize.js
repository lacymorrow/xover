const { notarize } = require('@electron/notarize');
const { build } = require('../../package.json');

exports.default = async function notarizeMacos(context) {
	const { electronPlatformName, appOutDir } = context;
	if (electronPlatformName !== 'darwin') {
		return;
	}

	if (process.env.CI !== 'true') {
		console.warn('Skipping notarizing step. Packaging is not running in CI');
		return;
	}

	const { APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID } = process.env;
	if (!APPLE_ID || !APPLE_APP_SPECIFIC_PASSWORD || !APPLE_TEAM_ID) {
		console.warn(
			'Skipping notarizing step. APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD and APPLE_TEAM_ID env variables must be set',
		);
		return;
	}

	const appName = context.packager.appInfo.productFilename;

	await notarize({
		appBundleId: build.appId,
		appPath: `${appOutDir}/${appName}.app`,
		appleId: APPLE_ID,
		appleIdPassword: APPLE_APP_SPECIFIC_PASSWORD,
		teamId: APPLE_TEAM_ID, // required by notarytool
	});
};
