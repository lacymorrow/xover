import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
	className?: string;
}

export function PremiumBadge({ className }: PremiumBadgeProps) {
	return (
		<span
			className={cn(
				'inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-500',
				className,
			)}
		>
			Premium
		</span>
	);
}
