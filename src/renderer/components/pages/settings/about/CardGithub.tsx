import { CircleIcon, StarIcon } from '@radix-ui/react-icons';

import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { useCallback } from 'react';

import { $settings } from '@/config/strings';
import { useGlobalContext } from '@/renderer/context/global-context';

export function CardGithub() {
	const { app } = useGlobalContext();

	const handleClickStar = useCallback(() => {
		window?.electron?.openUrl($settings.app.githubUrl);
	}, []);

	return (
		<Card>
			<CardHeader className="grid grid-cols-[1fr_110px] items-start gap-4 space-y-0">
				<div className="space-y-1">
					<CardTitle>CrossOver</CardTitle>
					<CardDescription>
						A crosshair overlay for any screen. Source, releases and bug reports
						live on GitHub.
					</CardDescription>
				</div>
				<Button variant="secondary" onClick={handleClickStar}>
					<StarIcon className="mr-2 h-4 w-4" />
					Star
				</Button>
			</CardHeader>
			<CardContent>
				{/* Facts the app actually knows. The template hardcoded a star count
					and a "last updated" date, both wrong the day they were written. */}
				<div className="flex space-x-4 text-sm text-muted-foreground">
					<div className="flex items-center">
						<CircleIcon className="mr-1 h-3 w-3 fill-sky-400 text-sky-400" />
						TypeScript
					</div>
					<div>{$settings.app.repo}</div>
					{app.version && <div>v{app.version}</div>}
				</div>
			</CardContent>
		</Card>
	);
}
