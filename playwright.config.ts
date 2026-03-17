import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	retries: process.env.CI ? 2 : 0,

	testDir: 'test',
	outputDir: 'test/results',

	timeout: 30_000,

	workers: 1,

	expect: {
		toMatchSnapshot: { threshold: 0.1 },
	},

	projects: [
		{
			name: 'electron',
			metadata: {
				platform: process.platform,
				headful: true,
				browserName: 'electron',
				channel: undefined,
				mode: 'default',
				video: false,
			},
		},
	],

	use: {
		browserName: 'chromium',
		headless: false,
		ignoreHTTPSErrors: true,
		screenshot: 'on',
		trace: 'on',
		video: 'on-first-retry',
		viewport: { width: 1280, height: 720 },
	},
};

export default config;
