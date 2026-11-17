import { PremiumBadge } from '@/renderer/components/ui/PremiumBadge';
import { useGlobalContext } from '@/renderer/context/global-context';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * A small Pro badge and a link to the License pane, and nothing else: no
 * popup, no trial, no nag (Lacy, 2026-11-16). Put it where a locked action
 * would have been.
 */
export function ProLink({ label = 'Unlock with Pro' }: { label?: string }) {
	return (
		<span className="inline-flex items-center gap-2 text-sm">
			<PremiumBadge />
			<Link
				to="/license"
				draggable={false}
				className="font-medium text-muted-foreground hover:text-foreground hover:underline"
			>
				{label}
			</Link>
		</span>
	);
}

/**
 * Renders `children` for a licensed user and `locked` for everyone else. The
 * main process enforces the same rule (src/main/presets.ts), so this is only
 * what the person sees.
 */
export function PremiumGate({
	children,
	locked = <ProLink />,
}: {
	children: ReactNode;
	locked?: ReactNode;
}) {
	const { isPremium } = useGlobalContext();

	return <>{isPremium ? children : locked}</>;
}
