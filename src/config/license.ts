export interface LicenseStatus {
	isPremium: boolean;
	licenseKey: string;
	activationId: string;
	lastValidated: number;
}

export const DEFAULT_LICENSE_STATUS: LicenseStatus = {
	isPremium: false,
	licenseKey: '',
	activationId: '',
	lastValidated: 0,
};

export const POLAR_API_URL =
	'https://api.polar.sh/v1/customer-portal/license-keys';

export const POLAR_ORGANIZATION_ID = 'ff87e6a0-f1d9-4b1a-aca8-8d211c7cf4bf';

export const POLAR_PRODUCT_ID = '584b6ea6-d3e3-471b-ab67-9bdcd85afffa';

/**
 * Pro gates. The porting rule (knowledge/portfolio.md, knowledge/properties.md)
 * is that anything free in v3 stays free in v4, so a flag here is only legal
 * for a feature v3 never had.
 *
 * `secondaryCrosshair` and `rotation` were gated through beta.8 and are free
 * again (LAC-7671): v3.4.9 ships the duplicate crosshair (preferences.js:74)
 * and tilt with an angle slider (preferences.js:42-48), both with no licensing
 * code anywhere in v3.
 *
 * `profiles` is implemented and gated (LAC-5974). Pro = presets + auto
 * profiles, with layouts folded in (LAC-7622). Lacy 2026-11-19: presets are Pro for everyone; v3 drops presets in 3.4.10.
 * Without Pro a user sees their
 * presets and can delete them; apply, cycle, save, rename and auto profiles
 * need Pro, imported presets included (`src/main/preset-model.ts`
 * presetPermissions). Do not restore a carve-out. Fullscreen overlay is later.
 *
 * Nothing reads this object: `isPremium()` and `<PremiumGate>` are what gate a
 * feature. `src/__tests__/v3-free-features.test.ts` pins both.
 */
export const PREMIUM_FEATURES = {
	secondaryCrosshair: false,
	rotation: false, // crosshair + reticle rotation sliders
	profiles: true, // presets + auto profiles; see the comment above
};

// Checkout link created in Polar dashboard (Products > Checkout Links)
export const POLAR_CHECKOUT_URL =
	'https://buy.polar.sh/polar_cl_eiLwCY59yKuXs9KHr1oEQTdQCOwpDbQvjSwl92xwYBl';

// Cache validation for 24 hours
export const LICENSE_CACHE_DURATION = 24 * 60 * 60 * 1000;

// Grace period: keep premium for 7 days even if revalidation fails (offline tolerance)
export const LICENSE_GRACE_PERIOD = 7 * 24 * 60 * 60 * 1000;
