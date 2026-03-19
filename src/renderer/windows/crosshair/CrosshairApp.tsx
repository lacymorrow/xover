import { IMAGE_EXTENSIONS } from '@/config/config';
import { cn } from '@/lib/utils';
import { Crosshair } from '@/renderer/components/app/Crosshair';
import { useActionStateContext } from '@/renderer/context/action-state-context';
import { useGlobalContext } from '@/renderer/context/global-context';
import '@/renderer/styles/crosshair.scss';

import { useCallback, useEffect, useState } from 'react';

export default function CrosshairApp() {
	const { settings, windowState } = useGlobalContext();
	const { tilt, hidden, adsActive, secondary } = useActionStateContext();
	const [isDragActive, setIsDragActive] = useState(false);

	// Drag-and-drop custom crosshair onto overlay window
	useEffect(() => {
		let dragCounter = 0;

		const handleDragEnter = (e: DragEvent) => {
			e.preventDefault();
			dragCounter++;
			setIsDragActive(true);
		};

		const handleDragOver = (e: DragEvent) => {
			e.preventDefault();
		};

		const handleDragLeave = (e: DragEvent) => {
			e.preventDefault();
			dragCounter--;
			if (dragCounter === 0) {
				setIsDragActive(false);
			}
		};

		const handleDrop = (e: DragEvent) => {
			e.preventDefault();
			dragCounter = 0;
			setIsDragActive(false);

			const file = e.dataTransfer?.files[0];
			if (!file) return;

			const ext = '.' + file.name.split('.').pop()?.toLowerCase();
			if (!IMAGE_EXTENSIONS.includes(ext)) return;

			const filePath = window.electron.getPathForFile(file);
			if (filePath) {
				window.electron.openFile(filePath);
			}
		};

		const handleDragEnd = (e: DragEvent) => {
			e.preventDefault();
			dragCounter = 0;
			setIsDragActive(false);
		};

		document.addEventListener('dragenter', handleDragEnter);
		document.addEventListener('dragover', handleDragOver);
		document.addEventListener('dragleave', handleDragLeave);
		document.addEventListener('drop', handleDrop, true);
		document.addEventListener('dragend', handleDragEnd);

		return () => {
			document.removeEventListener('dragenter', handleDragEnter);
			document.removeEventListener('dragover', handleDragOver);
			document.removeEventListener('dragleave', handleDragLeave);
			document.removeEventListener('drop', handleDrop, true);
			document.removeEventListener('dragend', handleDragEnd);
		};
	}, []);

	useEffect(() => {
		// Add/remove class to lock/unlock app
		document.documentElement.classList[settings.isLocked ? 'add' : 'remove'](
			'is-locked',
		);

		// Determine effective opacity and scale based on action state
		const baseOpacity = secondary
			? windowState.crosshairOpacitySecondary
			: windowState.crosshairOpacity;
		const effectiveOpacity = hidden ? 0 : baseOpacity / 100;

		const baseScale = secondary
			? windowState.crosshairSizeSecondary
			: windowState.crosshairSize;
		const effectiveScale = adsActive
			? settings.adsResizeSize / 100
			: baseScale / 100;

		const rotation = secondary
			? windowState.crosshairRotationSecondary
			: windowState.crosshairRotation;

		const reticleScale = secondary
			? windowState.reticleSizeSecondary
			: windowState.reticleSize;
		const reticleColor = secondary
			? windowState.reticleColorSecondary
			: windowState.reticleColor;
		const reticleRotation = secondary
			? windowState.reticleRotationSecondary
			: windowState.reticleRotation;

		// Properties to apply to renderer every sync
		const properties = {
			'--app-bg-color': windowState.backgroundColor,
			'--app-foreground-color': windowState.foregroundColor,
			'--app-opacity': !windowState.backgroundColor ? 0.8 : 1, // Background is transparent even if it's not set
			'--crosshair-opacity': effectiveOpacity,
			'--crosshair-scale': effectiveScale,
			'--crosshair-rotation': `${rotation}deg`,
			'--reticle-scale': reticleScale / 100,
			'--reticle-color': reticleColor,
			'--reticle-rotation': `${reticleRotation}deg`,

			// Secondary alt vars for SCSS .secondary rules
			'--crosshair-opacity-alt': windowState.crosshairOpacitySecondary / 100,
			'--crosshair-scale-alt': windowState.crosshairSizeSecondary / 100,
			'--crosshair-rotation-alt': `${windowState.crosshairRotationSecondary}deg`,
			'--reticle-scale-alt': windowState.reticleSizeSecondary / 100,
			'--reticle-color-alt': windowState.reticleColorSecondary,
			'--reticle-rotation-alt': `${windowState.reticleRotationSecondary}deg`,

			'--svg-fill-color': windowState.fillColor,
			'--svg-stroke-color': windowState.strokeColor,
			'--svg-stroke-width': String(windowState.strokeWidth),
			'--transition-duration': `${settings.transitionDuration}ms`,
		};

		// Apply properties to root
		Object.entries(properties).forEach(([key, value]) => {
			document.documentElement.style.setProperty(key, String(value));
		});
	}, [settings, windowState, hidden, adsActive, secondary]);

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

			{/* Drop indicator overlay */}
			{isDragActive && (
				<div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
					<div className="absolute inset-1 rounded-lg border-2 border-dashed border-white/60 bg-black/30" />
				</div>
			)}
		</div>
	);
}
