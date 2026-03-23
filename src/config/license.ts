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

export const POLAR_ORGANIZATION_ID =
	process.env.POLAR_ORGANIZATION_ID ?? 'ff87e6a0-f1d9-4b1a-aca8-8d211c7cf4bf';

export const POLAR_PRODUCT_ID =
	process.env.POLAR_PRODUCT_ID ?? '584b6ea6-d3e3-471b-ab67-9bdcd85afffa';

export const PREMIUM_FEATURES = {
	secondaryCrosshair: true,
	profiles: true, // placeholder for future use
};

// URL where users can purchase a license
// Create a Checkout Link in Polar dashboard (Products → Checkout Links → New Link)
// and paste the URL here. Falls back to the Polar storefront.
export const POLAR_CHECKOUT_URL =
	process.env.POLAR_CHECKOUT_URL ?? 'https://polar.sh';

// Cache validation for 24 hours
export const LICENSE_CACHE_DURATION = 24 * 60 * 60 * 1000;
