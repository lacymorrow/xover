import { createHash } from 'crypto';
import { net } from 'electron';
import Logger from 'electron-log';
import os from 'os';
import {
	DEFAULT_LICENSE_STATUS,
	LICENSE_CACHE_DURATION,
	LicenseStatus,
	POLAR_API_URL,
	POLAR_ORGANIZATION_ID,
} from '../config/license';
import store from './store';

interface PolarValidateResponse {
	status: string;
	message?: string;
}

interface PolarActivateResponse {
	id?: string;
	message?: string;
}

function getDeviceId(): string {
	const raw = `${os.hostname()}${os.platform()}${os.arch()}${os.cpus()[0]?.model ?? ''}`;
	return createHash('sha256').update(raw).digest('hex');
}

async function polarFetch<T = Record<string, unknown>>(
	endpoint: string,
	body: Record<string, unknown>,
): Promise<T> {
	const url = `${POLAR_API_URL}/${endpoint}`;
	const response = await net.fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	return response.json() as Promise<T>;
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return String(error);
}

export async function activateLicense(
	key: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const deviceId = getDeviceId();
		const validateBody = {
			key,
			organization_id: POLAR_ORGANIZATION_ID,
			activation_meta: { device_id: deviceId },
		};

		const validateResult = await polarFetch<PolarValidateResponse>('validate', validateBody);

		if (validateResult.status !== 'granted') {
			return {
				success: false,
				error: validateResult.message || 'License key is not valid.',
			};
		}

		// Activate the key to get an activation ID
		const activateResult = await polarFetch<PolarActivateResponse>('activate', validateBody);

		if (!activateResult.id) {
			return {
				success: false,
				error: activateResult.message || 'Failed to activate license.',
			};
		}

		const licenseStatus: LicenseStatus = {
			isPremium: true,
			licenseKey: key,
			activationId: activateResult.id,
			lastValidated: Date.now(),
		};

		store.set('license', licenseStatus);
		Logger.info('License activated successfully');

		return { success: true };
	} catch (error: unknown) {
		Logger.error('License activation failed:', error);
		return {
			success: false,
			error: getErrorMessage(error) || 'Failed to activate license.',
		};
	}
}

export async function deactivateLicense(): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		const license = store.get('license');

		if (!license.licenseKey || !license.activationId) {
			store.set('license', DEFAULT_LICENSE_STATUS);
			return { success: true };
		}

		await polarFetch('deactivate', {
			key: license.licenseKey,
			organization_id: POLAR_ORGANIZATION_ID,
			activation_id: license.activationId,
		});

		store.set('license', DEFAULT_LICENSE_STATUS);
		Logger.info('License deactivated successfully');

		return { success: true };
	} catch (error: unknown) {
		Logger.error('License deactivation failed:', error);
		// Clear local state even if remote deactivation fails
		store.set('license', DEFAULT_LICENSE_STATUS);
		return {
			success: false,
			error: getErrorMessage(error) || 'Failed to deactivate license.',
		};
	}
}

export async function checkLicense(): Promise<LicenseStatus> {
	const license = store.get('license');

	if (!license.licenseKey) {
		return DEFAULT_LICENSE_STATUS;
	}

	// Use cached result if still fresh
	const elapsed = Date.now() - license.lastValidated;
	if (elapsed < LICENSE_CACHE_DURATION) {
		return license;
	}

	try {
		const deviceId = getDeviceId();
		const validateResult = await polarFetch<PolarValidateResponse>('validate', {
			key: license.licenseKey,
			organization_id: POLAR_ORGANIZATION_ID,
			activation_meta: { device_id: deviceId },
		});

		if (validateResult.status === 'granted') {
			const updated: LicenseStatus = {
				...license,
				isPremium: true,
				lastValidated: Date.now(),
			};
			store.set('license', updated);
			return updated;
		}

		// License no longer valid
		Logger.warn('License validation failed, revoking premium status');
		store.set('license', DEFAULT_LICENSE_STATUS);
		return DEFAULT_LICENSE_STATUS;
	} catch (error: unknown) {
		Logger.error('License check failed:', error);
		// On network error, keep current status but don't update timestamp
		return license;
	}
}

export function getLicenseStatus(): LicenseStatus {
	return store.get('license');
}

export function isPremium(): boolean {
	return store.get('license').isPremium;
}
