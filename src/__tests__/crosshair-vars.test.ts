/**
 * @jest-environment node
 *
 * Auto-Hide (ADS) hid the crosshair image and left the reticle on screen,
 * because the reticle is a sibling element and the hide ran through
 * `--crosshair-opacity` (LAC-5839 item 7).
 */
import {
	DEFAULT_CROSSHAIR_WINDOW_STATE,
	DEFAULT_SETTINGS,
} from '../config/settings';
import { getCrosshairVars } from '../renderer/lib/crosshair-vars';

const vars = (over: Partial<Parameters<typeof getCrosshairVars>[0]> = {}) =>
	getCrosshairVars({
		settings: DEFAULT_SETTINGS,
		windowState: DEFAULT_CROSSHAIR_WINDOW_STATE,
		isPremium: false,
		hidden: false,
		adsActive: false,
		secondary: false,
		...over,
	});

describe('auto-hide', () => {
	it('hides the whole overlay, reticle included', () => {
		expect(vars({ hidden: true })['--overlay-opacity']).toBe(0);
	});

	it('leaves the overlay visible otherwise', () => {
		expect(vars()['--overlay-opacity']).toBe(1);
	});

	// The crosshair keeps its own opacity: hiding through it was what let the
	// reticle survive, and what `.secondary #crosshair` overrode.
	it('does not reach for the crosshair opacity to do it', () => {
		const hiddenVars = vars({ hidden: true });

		expect(hiddenVars['--crosshair-opacity']).toBe(
			DEFAULT_CROSSHAIR_WINDOW_STATE.crosshairOpacity / 100,
		);
	});

	it('still hides while the secondary crosshair is active', () => {
		expect(vars({ hidden: true, secondary: true })['--overlay-opacity']).toBe(
			0,
		);
	});
});

describe('the rest of the properties', () => {
	it('swaps in the secondary values', () => {
		const secondaryVars = vars({ secondary: true });

		expect(secondaryVars['--crosshair-opacity']).toBe(
			DEFAULT_CROSSHAIR_WINDOW_STATE.crosshairOpacitySecondary / 100,
		);
		expect(secondaryVars['--reticle-scale']).toBe(
			DEFAULT_CROSSHAIR_WINDOW_STATE.reticleSizeSecondary / 100,
		);
	});

	it('scales to the ADS size while ADS resize is active', () => {
		expect(vars({ adsActive: true })['--crosshair-scale']).toBe(
			DEFAULT_SETTINGS.adsResizeSize / 100,
		);
	});

	it('ignores stored rotation without a license', () => {
		const rotated = {
			...DEFAULT_CROSSHAIR_WINDOW_STATE,
			crosshairRotation: 45,
			reticleRotation: 45,
		};

		expect(vars({ windowState: rotated })['--crosshair-rotation']).toBe('0deg');
		expect(
			vars({ windowState: rotated, isPremium: true })['--crosshair-rotation'],
		).toBe('45deg');
	});
});
