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

// TODO: Replace with your actual Polar organization ID
export const POLAR_ORGANIZATION_ID =
	process.env.POLAR_ORGANIZATION_ID || 'YOUR_ORG_ID';

export const PREMIUM_FEATURES = {
	secondaryCrosshair: true,
	profiles: true, // placeholder for future use
};

// Cache validation for 24 hours
export const LICENSE_CACHE_DURATION = 24 * 60 * 60 * 1000;
