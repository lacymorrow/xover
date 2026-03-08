import { cn } from '@/lib/utils';
import { Crosshair } from '@/renderer/components/app/Crosshair';
import { useActionStateContext } from '@/renderer/context/action-state-context';
import { useGlobalContext } from '@/renderer/context/global-context';
import '@/renderer/styles/crosshair.scss';

import { useEffect } from 'react';

export default function CrosshairApp() {
	const { settings, windowState } = useGlobalContext();
	const { tilt, hidden, adsActive } = useActionStateContext();

	useEffect(() => {
		// Add/remove class to lock/unlock app
		document.documentElement.classList[settings.isLocked ? 'add' : 'remove'](
			'is-locked',
		);

		// Determine effective opacity and scale based on action state
		const effectiveOpacity = hidden ? 0 : windowState.crosshairOpacity / 100;
		const effectiveScale = adsActive
			? settings.adsResizeSize / 100
			: windowState.crosshairSize / 100;

		// Properties to apply to renderer every sync
		const properties = {
			'--app-bg-color': windowState.backgroundColor,
			'--app-foreground-color': windowState.foregroundColor,
			'--app-opacity': !windowState.backgroundColor ? 0.8 : 1, // Background is transparent even if it's not set
			'--crosshair-opacity': effectiveOpacity,
			'--crosshair-scale': effectiveScale,
			'--crosshair-rotation': `${windowState.crosshairRotation}deg`,
			'--reticle-scale': windowState.reticleSize / 100,
			'--reticle-color': windowState.reticleColor,
			'--reticle-rotation': `${windowState.reticleRotation}deg`,

			// '--svg-fill-color': windowState.fillColor,
			// '--svg-stroke-color': windowState.strokeColor,
			// '--svg-stroke-width': windowState.strokeWidth,
			'--transition-duration': `${settings.transitionDuration}ms`,
		};

		// Apply properties to root
		Object.entries(properties).forEach(([key, value]) => {
			document.documentElement.style.setProperty(key, String(value));
		});
	}, [settings, windowState, hidden, adsActive]);

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
