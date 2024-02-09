import { cn } from '@/lib/utils';
import { Controls } from '@/renderer/components/app/Controls';
import { Crosshair } from '@/renderer/components/app/Crosshair';
import { useActionStateContext } from '@/renderer/context/action-state-context';
import { useGlobalContext } from '@/renderer/context/global-context';
import '@/renderer/styles/crosshair.scss';

import { useEffect } from 'react';

export default function CrosshairApp() {
	const { settings } = useGlobalContext();
	const { tilt } = useActionStateContext();

	useEffect(() => {
		console.log('RENDER');
		// Add/remove class to lock/unlock app
		document.documentElement.classList[settings.isLocked ? 'add' : 'remove'](
			'is-locked',
		);

		// Properties to apply to renderer every sync
		const properties = {
			'--app-bg-color': settings.backgroundColor,
			'--app-foreground-color': settings.foregroundColor,
			'--crosshair-opacity': settings.crosshairOpacity / 100,
			'--crosshair-scale': settings.crosshairSize / 100,
			// '--reticle-opacity': settings.reticleOpacity / 100,
			// '--reticle-size': settings.reticleSize,
			// '--reticle-fill-color': settings.reticleColor,
			// '--svg-fill-color': settings.fillColor,
			// '--svg-stroke-color': settings.strokeColor,
			// '--svg-stroke-width': settings.strokeWidth,
		};

		// Apply properties to root
		Object.entries(properties).forEach(([key, value]) => {
			document.documentElement.style.setProperty(key, value);
		});
	}, [settings]);

	useEffect(() => {
		// Tilt
		document.documentElement.style.setProperty('--tilt-angle', `${tilt}deg`);

		// 	'--crosshair-width': `${options.crosshair.size}px`,
		// 	'--crosshair-height': `${options.crosshair.size}px`,
		// 	'--crosshair-opacity': (options.crosshair.opacity || 100) / 100,
		// 	'--reticle-fill-color': options.crosshair.color,
		// 	'--reticle-scale': options.crosshair.reticleScale,
		// 	'--svg-fill-color': 'unset',
		// 	'--svg-stroke-color': 'unset',
		// 	'--svg-stroke-width': 'unset',
	}, [tilt]);

	return (
		<div className={cn('w-full h-full relative', !settings.isLocked && 'drag')}>
			<div
				id="background"
				className="absolute -z-10 top-0 left-0 bottom-0 right-0"
			/>

			<Crosshair />

			<Controls />
		</div>
	);
}
