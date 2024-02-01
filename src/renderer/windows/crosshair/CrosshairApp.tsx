import { cn } from '@/lib/utils';
import { useGlobalContext } from '@/renderer/context/global-context';
import '@/renderer/styles/crosshair.scss';
import { useEffect } from 'react';

import { Controls } from '@/renderer/components/app/Controls';
import crosshair from '@/static/crosshairs/Actual/leupold-dot.png';

export default function CrosshairApp() {
	const { settings, appPaths } = useGlobalContext();

	useEffect(() => {
		// Add/remove class to lock/unlock app
		document.documentElement.classList[settings.isLocked ? 'add' : 'remove'](
			'is-locked',
		);
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
		<div className={cn('w-full h-full relative', !settings.isLocked && 'drag')}>
			<div
				id="background"
				className="absolute -z-10 top-0 left-0 bottom-0 right-0"
			/>
			<div
				id="crosshair"
				className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
			>
				<div id="sight">
					<img
						src={
							settings.crosshair ? `file://${settings.crosshair}` : crosshair
						}
						alt=""
					/>
				</div>
				<div id="reticle" />
			</div>
			<Controls />
		</div>
	);
}
