import { Separator } from '@/components/ui/separator';
import { LicenseStatus, POLAR_CHECKOUT_URL } from '@/config/license';
import { useGlobalContext } from '@/renderer/context/global-context';
import { useCallback, useEffect, useState } from 'react';

function maskLicenseKey(key: string): string {
	if (key.length > 8) {
		return `${key.slice(0, 4)}${'*'.repeat(key.length - 8)}${key.slice(-4)}`;
	}
	return '****';
}

export function SettingsLicense() {
	const { isPremium, refreshLicense } = useGlobalContext();
	const [licenseKey, setLicenseKey] = useState('');
	const [status, setStatus] = useState<{
		type: 'idle' | 'loading' | 'success' | 'error';
		message?: string;
	}>({ type: 'idle' });
	const [maskedKey, setMaskedKey] = useState('');

	// Load masked key on mount if premium
	useEffect(() => {
		if (isPremium) {
			window.electron
				.getLicenseStatus()
				.then((s: LicenseStatus) => {
					if (s?.licenseKey) {
						setMaskedKey(maskLicenseKey(s.licenseKey));
					}
				})
				.catch(console.error);
		}
	}, [isPremium]);

	const handleActivate = useCallback(async () => {
		if (!licenseKey.trim()) return;

		setStatus({ type: 'loading' });
		try {
			const result = await window.electron.activateLicense(licenseKey.trim());
			if (result.success) {
				setStatus({
					type: 'success',
					message: 'License activated successfully!',
				});
				setLicenseKey('');
				const s: LicenseStatus = await window.electron.getLicenseStatus();
				if (s?.licenseKey) {
					setMaskedKey(maskLicenseKey(s.licenseKey));
				}
				await refreshLicense();
			} else {
				setStatus({
					type: 'error',
					message: result.error || 'Activation failed.',
				});
			}
		} catch (error: unknown) {
			setStatus({
				type: 'error',
				message: error instanceof Error ? error.message : 'Activation failed.',
			});
		}
	}, [licenseKey, refreshLicense]);

	const handleDeactivate = useCallback(async () => {
		setStatus({ type: 'loading' });
		try {
			const result = await window.electron.deactivateLicense();
			if (result.success) {
				setStatus({ type: 'success', message: 'License deactivated.' });
				setMaskedKey('');
				await refreshLicense();
			} else {
				setStatus({
					type: 'error',
					message: result.error || 'Deactivation failed.',
				});
			}
		} catch (error: unknown) {
			setStatus({
				type: 'error',
				message:
					error instanceof Error ? error.message : 'Deactivation failed.',
			});
		}
	}, [refreshLicense]);

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">License</h3>
				<p className="text-sm text-muted-foreground">
					Manage your CrossOver license to unlock premium features.
				</p>
			</div>
			<Separator />

			{/* Current Status */}
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<p className="font-medium text-base">Status</p>
					<p className="text-sm text-muted-foreground">
						Your current license status.
					</p>
				</div>
				<span
					className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
						isPremium
							? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
							: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
					}`}
				>
					{isPremium ? 'Premium' : 'Free'}
				</span>
			</div>

			{isPremium ? (
				<>
					{/* Premium state */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<p className="font-medium text-base">License Key</p>
								<p className="text-sm text-muted-foreground font-mono">
									{maskedKey}
								</p>
							</div>
						</div>
						<button
							type="button"
							className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
							onClick={handleDeactivate}
							disabled={status.type === 'loading'}
						>
							{status.type === 'loading'
								? 'Deactivating...'
								: 'Deactivate License'}
						</button>
					</div>
				</>
			) : (
				<>
					{/* Free state - activation form */}
					<div className="space-y-4">
						<div className="space-y-2">
							<h3 className="font-medium text-base">License Key</h3>
							<p className="text-sm text-muted-foreground">
								Enter your license key to activate premium features.
							</p>
							<div className="flex gap-2">
								<input
									id="license-key"
									type="text"
									className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
									placeholder="Enter your license key"
									value={licenseKey}
									onChange={(e) => setLicenseKey(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') handleActivate();
									}}
									disabled={status.type === 'loading'}
								/>
								<button
									type="button"
									className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
									onClick={handleActivate}
									disabled={status.type === 'loading' || !licenseKey.trim()}
								>
									{status.type === 'loading' ? 'Activating...' : 'Activate'}
								</button>
							</div>
						</div>
					</div>

					<Separator />

					<div className="space-y-2">
						<p className="font-medium text-base">Get a License</p>
						<p className="text-sm text-muted-foreground">
							Purchase a premium license to unlock secondary crosshairs,
							profiles, and more.
						</p>
						<button
							type="button"
							className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
							onClick={() => {
								window.electron.openUrl(POLAR_CHECKOUT_URL);
							}}
						>
							Purchase License
						</button>
					</div>
				</>
			)}

			{/* Status messages */}
			{status.type === 'success' && (
				<p className="text-sm text-green-600 dark:text-green-400">
					{status.message}
				</p>
			)}
			{status.type === 'error' && (
				<p className="text-sm text-red-600 dark:text-red-400">
					{status.message}
				</p>
			)}
		</div>
	);
}
