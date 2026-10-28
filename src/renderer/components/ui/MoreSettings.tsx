import { cn } from '@/lib/utils';
import { simpleUUID } from '@/utils/getUUID';
import { ChevronDown } from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface MoreSettingsProps {
	/** Toggle label. "More" on a pane, a group name on a sub-section. */
	label?: string;
	defaultOpen?: boolean;
	children: React.ReactNode;
}

/**
 * Progressive disclosure for the settings panes.
 *
 * Every control CrossOver has ever had is still here (LAC-5868 reorganizes,
 * it removes nothing); the ones most people never touch sit one click away so
 * the pane someone opens first is the pane they came for.
 */
export function MoreSettings({
	label = 'More',
	defaultOpen = false,
	children,
}: MoreSettingsProps) {
	const uuid = useMemo(simpleUUID, []);
	const [open, setOpen] = useState(defaultOpen);

	return (
		<div className="space-y-6">
			<button
				type="button"
				aria-expanded={open}
				aria-controls={uuid}
				onClick={() => {
					setOpen((isOpen) => !isOpen);
				}}
				className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
			>
				<ChevronDown
					className={cn(
						'h-4 w-4 transition-transform',
						!open && '-rotate-90',
					)}
				/>
				{label}
			</button>
			{open && (
				<div id={uuid} className="space-y-6">
					{children}
				</div>
			)}
		</div>
	);
}
