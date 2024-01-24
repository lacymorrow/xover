import { cn } from '@/lib/utils';
import { useGlobalContext } from '@/renderer/context/global-context';
import '@/renderer/styles/crosshair.scss';
import { useEffect } from 'react';

import crosshair from '@/static/crosshairs/Actual/leupold-dot.png';

export default function CrosshairApp() {
	const { settings, appPaths } = useGlobalContext();

	useEffect(() => {
		// Properties to apply to renderer every sync
		// const properties = {
		// 	'--crosshair-width': `${options.crosshair.size}px`,
		// 	'--crosshair-height': `${options.crosshair.size}px`,
		// 	'--crosshair-opacity': (options.crosshair.opacity || 100) / 100,
		// 	'--reticle-fill-color': options.crosshair.color,
		// 	'--reticle-scale': options.crosshair.reticleScale,
		// 	'--tilt-angle': options.actions.tiltAngle,
		// 	'--app-bg-color': 'unset',
		// 	'--app-highlight-color': 'unset',
		// 	'--svg-fill-color': 'unset',
		// 	'--svg-stroke-color': 'unset',
		// 	'--svg-stroke-width': 'unset',
		// };

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
