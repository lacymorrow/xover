/**
 * @jest-environment node
 *
 * The porting rule, from knowledge/portfolio.md and knowledge/properties.md:
 * anything free in v3 stays free in v4 and is never Pro-gated.
 *
 * 4.0.0-beta.8 shipped with two v3-free features behind the paywall, which
 * would have made the release note's "everything that was free in v3 is still
 * free" false in the same release that said it (LAC-7671). These tests pin the
 * rule at both levels it can be broken: the declaration in `config/license.ts`
 * and the live gates at the call sites, which are what actually enforce it.
 *
 * Each row carries its v3 evidence, so adding a gate back means arguing with a
 * measurement instead of with the rule.
 */
import fs from 'fs';
import path from 'path';
import { PREMIUM_FEATURES } from '../config/license';
import {
	DEFAULT_CROSSHAIR_WINDOW_STATE,
	DEFAULT_SETTINGS,
} from '../config/settings';
import { getCrosshairVars } from '../renderer/lib/crosshair-vars';

/** v3 = lacymorrow/crossover @ tag v3.4.9, read 2026-11-11. */
const V3_FREE_FEATURES = [
	{
		flag: 'secondaryCrosshair',
		v3: 'duplicate crosshair: preferences.js:74 `duplicate: Control+Shift+Alt+D`',
		owns: [
			'src/renderer/components/pages/settings/appearance/SettingsSecondaryCrosshair.tsx',
			'src/main/iohook.ts',
		],
	},
	{
		flag: 'rotation',
		v3: 'tilt with an angle slider: preferences.js:42-48 and the "Tilt Angle" label at :401',
		owns: [
			'src/renderer/components/pages/settings/appearance/SettingsCrosshair.tsx',
			'src/renderer/lib/crosshair-vars.ts',
		],
	},
] as const;

/**
 * A flag may only stay `true` for a feature v3 never had. `profiles` is a
 * placeholder with no implementation anywhere in `src/`, and v3.4.8 ships
 * presets free (crossover `src/main/presets.js`, hotkey preferences.js:84), so
 * it has to go false when profiles is actually built. Tracked on LAC-7713.
 */
const ALLOWED_PREMIUM_FLAGS = ['profiles'];

const repoRoot = path.join(__dirname, '..', '..');
const source = (relative: string) =>
	fs.readFileSync(path.join(repoRoot, relative), 'utf8');

describe.each(V3_FREE_FEATURES)(
	'$flag is free in v3 ($v3)',
	({ flag, owns }) => {
		it('is not declared premium', () => {
			expect(PREMIUM_FEATURES[flag as keyof typeof PREMIUM_FEATURES]).toBe(
				false,
			);
		});

		// The declaration has no call sites: `isPremium` and `<PremiumGate>` are
		// what gate a feature, so flipping the flag alone would change nothing.
		it.each(owns)('%s carries no license gate', (file) => {
			const text = source(file);

			expect(text).not.toMatch(/PremiumGate/);
			expect(text).not.toMatch(/isPremium/);
			expect(text).not.toMatch(/POLAR_CHECKOUT_URL/);
		});
	},
);

describe('PREMIUM_FEATURES', () => {
	it('declares a flag only for a feature v3 never had', () => {
		const gated = Object.entries(PREMIUM_FEATURES)
			.filter(([, isGated]) => isGated)
			.map(([name]) => name);

		expect(gated.sort()).toEqual([...ALLOWED_PREMIUM_FLAGS].sort());
	});
});

describe('rotation renders without a license', () => {
	it('uses the stored angles, primary and secondary', () => {
		const vars = getCrosshairVars({
			settings: DEFAULT_SETTINGS,
			windowState: {
				...DEFAULT_CROSSHAIR_WINDOW_STATE,
				crosshairRotation: 45,
				reticleRotation: -90,
				crosshairRotationSecondary: 30,
				reticleRotationSecondary: 15,
			},
			hidden: false,
			adsActive: false,
			secondary: false,
		});

		expect(vars['--crosshair-rotation']).toBe('45deg');
		expect(vars['--reticle-rotation']).toBe('-90deg');
		expect(vars['--crosshair-rotation-alt']).toBe('30deg');
		expect(vars['--reticle-rotation-alt']).toBe('15deg');
	});
});
