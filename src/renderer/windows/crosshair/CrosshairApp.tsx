import { cn } from '@/lib/utils';
import { Crosshair } from '@/renderer/components/app/Crosshair';
import { useActionStateContext } from '@/renderer/context/action-state-context';
import { useGlobalContext } from '@/renderer/context/global-context';
import '@/renderer/styles/crosshair.scss';

import { useEffect } from 'react';

export default function CrosshairApp() {
	const { settings, windowState } = useGlobalContext();
	const { tilt } = useActionStateContext();

	useEffect(() => {
		// Add/remove class to lock/unlock app
		document.documentElement.classList[settings.isLocked ? 'add' : 'remove'](
			'is-locked',
		);

		// Properties to apply to renderer every sync
		const properties = {
			'--app-bg-color': windowState.backgroundColor,
			'--app-foreground-color': settings.foregroundColor,
			'--crosshair-opacity': settings.crosshairOpacity / 100,
			'--crosshair-scale': settings.crosshairSize / 100,
			'--crosshair-rotation': `${settings.crosshairRotation}deg`,
			'--reticle-scale': settings.reticleSize / 100,
			'--reticle-color': settings.reticleColor,
			'--reticle-rotation': `${settings.reticleRotation}deg`,

			// '--svg-fill-color': settings.fillColor,
			// '--svg-stroke-color': settings.strokeColor,
			// '--svg-stroke-width': settings.strokeWidth,
			'--transition-duration': `${settings.transitionDuration}ms`,
		};

		// Apply properties to root
		Object.entries(properties).forEach(([key, value]) => {
			document.documentElement.style.setProperty(key, String(value));
		});
	}, [settings, windowState]);

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
			<div id="background" />

			<Crosshair />
		</div>
	);
}
