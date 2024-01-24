import { cn } from '@/lib/utils';
import { useGlobalContext } from '@/renderer/context/global-context';
import '@/renderer/styles/crosshair.scss';
import { useEffect } from 'react';

import crosshair from '@/static/crosshairs/Actual/leupold-dot.png';

export default function CrosshairApp() {
	const { settings, appPaths } = useGlobalContext();

	useEffect(() => {
		document.documentElement.style.setProperty(
			'--app-bg-color',
			settings.backgroundColor,
		);
	}, [settings, appPaths]);

	return (
		<div className={cn('w-full h-full', !settings.locked && 'drag')}>
			<img
				src={settings.crosshair ? `file://${settings.crosshair}` : crosshair}
				alt=""
			/>
		</div>
	);
}
