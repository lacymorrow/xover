import { POLAR_CHECKOUT_URL } from '@/config/license';
import { PremiumBadge } from '@/renderer/components/ui/PremiumBadge';
import { useGlobalContext } from '@/renderer/context/global-context';
import React from 'react';

interface PremiumGateProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

export function PremiumGate({ children, fallback }: PremiumGateProps) {
	const { isPremium } = useGlobalContext();

	if (isPremium) {
		return <>{children}</>;
	}

	if (fallback) {
		return <>{fallback}</>;
	}

	return (
		<div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
			<div className="space-y-2">
				<h3 className="text-lg font-medium">CrossOver Pro <PremiumBadge /></h3>
				<p className="text-sm text-muted-foreground">
					This feature is included with CrossOver Pro.
				</p>
			</div>
			<button
				type="button"
				className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				onClick={() => {
					window.electron.openUrl(POLAR_CHECKOUT_URL);
				}}
			>
				Get CrossOver Pro
			</button>
		</div>
	);
}

export function UpgradeLink() {
	return (
		<button
			type="button"
			className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
			onClick={() => {
				window.electron.openUrl(POLAR_CHECKOUT_URL);
			}}
		>
			Get CrossOver Pro
		</button>
	);
}
