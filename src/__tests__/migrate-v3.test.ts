/**
 * @jest-environment node
 */
import path from 'path';
import { mapV3Preferences, toV4KeyBind } from '../main/migrate-v3';

const crosshairsDir = path.join('/app', 'assets', 'crosshairs');
const bundled = path.join(crosshairsDir, 'Actual', 'leupold-dot.png');
const custom = path.join('/home', 'me', 'my-crosshair.png');

const ctx = {
	crosshairsDir,
	fileExists: (p: string) => [bundled, custom].includes(p),
};

// v3 defaults (src/main/preferences.js getDefaults) as electron-preferences writes them
const v3Defaults = () => ({
	crosshair: {
		crosshair: '../static/crosshairs/Actual/leupold-dot.png',
		color: '#442ac6',
		size: 80,
		opacity: 80,
		positionX: null,
		positionY: null,
		reticle: 'dot',
		reticleScale: 100,
		fillColor: 'unset',
		strokeColor: 'unset',
		circleThickness: 2,
	},
	actions: {
		followMouse: [],
		resizeOnADS: 'off',
		ADSSize: 50,
		hideOnMouse: '-1',
		showOnMouseInvert: [],
		tiltEnable: [],
		tiltToggle: [],
		tiltAngle: 25,
		hideOnKey: '',
		tiltLeft: '',
		tiltRight: '',
	},
	app: {
		theme: 'system',
		appBgColor: 'unset',
		appHighlightColor: 'unset',
		alerts: ['alerts'],
		notify: ['notify'],
		updates: ['updates'],
		sounds: ['sounds'],
		gpu: ['gpu'],
		hideFromScreenCapture: [],
		startUnlocked: ['startUnlocked'],
		boot: [],
		appSize: 'normal',
	},
	keybinds: {
		reset: 'Control+Shift+Alt+R',
		lock: 'Control+Shift+Alt+X',
		center: 'Control+Shift+Alt+C',
		hide: 'Control+Shift+Alt+H',
		duplicate: 'Control+Shift+Alt+D',
		changeDisplay: 'Control+Shift+Alt+M',
		moveUp: 'Control+Shift+Alt+Up',
		moveDown: 'Control+Shift+Alt+Down',
		moveLeft: 'Control+Shift+Alt+Left',
		moveRight: 'Control+Shift+Alt+Right',
		nextWindow: 'Control+Shift+Alt+O',
		about: 'Control+Shift+Alt+A',
		quit: 'Control+Shift+Alt+Q',
		hideReticle: 'Control+Shift+Alt+S',
	},
	hidden: { frame: false, locked: true, tilted: false },
});

describe('mapV3Preferences', () => {
	it('maps v3 defaults to the equivalent v4 values', () => {
		const r = mapV3Preferences(v3Defaults(), ctx)!;
		expect(r.windowState).toEqual({
			crosshair: bundled,
			crosshairSize: 80,
			crosshairOpacity: 80,
			reticleColor: '#442ac6',
			reticle: 'dot',
			reticleSize: 50,
		});
		expect(r.settings).toMatchObject({
			followMouseEnabled: false,
			adsResizeEnabled: false,
			hideOnMouseEnabled: false,
			hideOnKeyEnabled: false,
			hideOnKeyBind: '',
			tiltActionEnabled: false,
			theme: 'system',
			appSizeMode: 'normal',
			allowNotifications: true,
			allowAutoUpdate: true,
			allowSounds: true,
			hardwareAcceleration: true,
			startOnLogin: false,
			startLocked: false,
		});
		expect(r.keybinds).toMatchObject({
			lock: 'Control+Shift+Alt+X',
			duplicateWindow: 'Control+Shift+Alt+D',
			focusNextWindow: 'Control+Shift+Alt+O',
			moveRight: 'Control+Shift+Alt+Right',
			// v4 gained the Toggle Reticle action in LAC-5182, so this one carries
			// over now instead of being dropped
			hideReticle: 'Control+Shift+Alt+S',
		});
		expect(r.skipped).toEqual(
			expect.arrayContaining([
				expect.stringContaining('keybinds.about'),
				expect.stringContaining('app.alerts'),
				expect.stringContaining('crosshair.circleThickness'),
			]),
		);
		// These gained v4 homes in LAC-5182, so they must no longer be skipped
		expect(r.skipped.join(' ')).not.toContain('keybinds.hideReticle');
		expect(r.skipped.join(' ')).not.toContain('app.hideFromScreenCapture');
		expect(r.skipped.join(' ')).not.toContain('actions.showOnMouseInvert');
	});

	it('maps a customized setup', () => {
		const prefs = v3Defaults();
		Object.assign(prefs.crosshair, {
			crosshair: custom,
			size: 100,
			opacity: 44,
			positionX: 326,
			positionY: 475,
			reticle: 'off',
			reticleScale: 274,
			svgCustomization: ['svgCustomization'],
			fillColor: '#ff0000',
			strokeColor: '#00ff00',
			strokeWidth: 20,
		});
		Object.assign(prefs.actions, {
			followMouse: ['followMouse'],
			resizeOnADS: 'toggle',
			ADSSize: 30,
			hideOnMouse: '3',
			hideOnMouseToggle: ['hideOnMouseToggle'],
			hideOnKey: 'Shift',
			tiltEnable: ['tiltEnable'],
			tiltToggle: ['tiltToggle'],
			tiltAngle: 68,
			tiltLeft: 'Q',
			tiltRight: 'W',
		});
		Object.assign(prefs.app, {
			theme: 'dark',
			appBgColor: '#112233',
			appHighlightColor: '#ffffff',
			appSize: 'resize',
			notify: [],
			updates: [],
			sounds: [],
			gpu: [],
			boot: ['boot'],
			startUnlocked: [],
		});

		const r = mapV3Preferences(prefs, ctx)!;
		expect(r.customImages).toEqual([custom]);
		expect(r.windowState).toMatchObject({
			crosshair: custom,
			crosshairSize: 100,
			crosshairOpacity: 44,
			x: 326,
			y: 475,
			reticle: 'none',
			reticleSize: 100,
			fillColor: '#ff0000',
			strokeColor: '#00ff00',
			strokeWidth: 10,
			backgroundColor: '#112233',
			foregroundColor: '#ffffff',
		});
		expect(r.settings).toMatchObject({
			followMouseEnabled: true,
			adsResizeEnabled: true,
			adsResizeBehavior: 'toggle',
			adsResizeButton: 2,
			adsResizeSize: 30,
			hideOnMouseEnabled: true,
			hideOnMouseButton: 3,
			hideOnMouseBehavior: 'toggle',
			hideOnKeyEnabled: true,
			hideOnKeyBind: 'keyboard:Shift',
			tiltActionEnabled: true,
			tiltBehavior: 'toggle',
			tiltAngle: 68,
			tiltLeftBind: 'keyboard:Q',
			tiltRightBind: 'keyboard:W',
			theme: 'dark',
			appSizeMode: 'resizable',
			allowNotifications: false,
			allowAutoUpdate: false,
			allowSounds: false,
			hardwareAcceleration: false,
			startOnLogin: true,
			startLocked: true,
		});
	});

	it('never grants Pro features (rotation, secondary crosshair)', () => {
		const r = mapV3Preferences(v3Defaults(), ctx)!;
		const keys = Object.keys(r.windowState).join(',');
		expect(keys).not.toMatch(/Rotation|Secondary/);
		expect(Object.keys(r.settings).join(',')).not.toMatch(/secondary/i);
	});

	it('maps a bundled path from a v3 checkout to the v4 bundled file', () => {
		const prefs = v3Defaults();
		prefs.crosshair.crosshair =
			'/Users/x/repo/crossover/src/static/crosshairs/Actual/leupold-dot.png';
		expect(mapV3Preferences(prefs, ctx)!.windowState.crosshair).toBe(bundled);
	});

	it('leaves the v4 default when the image has no equivalent', () => {
		const prefs = v3Defaults();
		prefs.crosshair.crosshair = '../static/crosshairs/Gone/nope.png';
		const r = mapV3Preferences(prefs, ctx)!;
		expect(r.windowState).not.toHaveProperty('crosshair');
		expect(r.customImages).toEqual([]);

		prefs.crosshair.crosshair = '/missing/custom.png';
		expect(mapV3Preferences(prefs, ctx)!.windowState).not.toHaveProperty(
			'crosshair',
		);
	});

	it('ignores SVG colors unless SVG customization was on, and "unset" colors', () => {
		const prefs = v3Defaults();
		Object.assign(prefs.crosshair, { fillColor: '#ff0000' });
		expect(mapV3Preferences(prefs, ctx)!.windowState).not.toHaveProperty(
			'fillColor',
		);
		expect(mapV3Preferences(prefs, ctx)!.windowState).not.toHaveProperty(
			'backgroundColor',
		);
	});

	it.each([null, undefined, 'x', 42, [], {}, { crosshair: 'nope' }])(
		'returns null for malformed input %p',
		(input) => {
			expect(mapV3Preferences(input, ctx)).toBeNull();
		},
	);

	it('does not throw on garbage values', () => {
		const r = mapV3Preferences(
			{
				crosshair: { size: 'abc', opacity: {}, reticle: 5, positionX: 1e9 },
				actions: {
					followMouse: 'yes',
					hideOnMouse: 99,
					tiltLeft: 'Ctrl+Shift+Q',
				},
				app: { theme: 'neon', appSize: 7, boot: 'boot' },
				keybinds: { lock: 5, quit: '' },
			},
			ctx,
		)!;
		expect(r.settings).toEqual({});
		expect(r.windowState).toEqual({});
		expect(r.keybinds).toEqual({});
	});
});

describe('toV4KeyBind', () => {
	it('converts accelerators to uiohook binds', () => {
		expect(toV4KeyBind('Q')).toBe('keyboard:Q');
		expect(toV4KeyBind('alt')).toBe('keyboard:Alt');
		expect(toV4KeyBind('Option')).toBe('keyboard:Alt');
		expect(toV4KeyBind('Ctrl')).toBe('keyboard:Control');
		expect(toV4KeyBind('')).toBe('');
		expect(toV4KeyBind('Control+Q')).toBeUndefined();
		expect(toV4KeyBind(3)).toBeUndefined();
	});
});
