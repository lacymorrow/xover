import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
	className?: string;
}

export function PremiumBadge({ className }: PremiumBadgeProps) {
	return (
		<span
			className={cn(
				'inline-flex items-center rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400',
				className,
			)}
		>
			Pro
		</span>
	);
}
