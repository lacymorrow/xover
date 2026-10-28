import { IMAGE_EXTENSIONS } from '@/config/config';
import { cn } from '@/lib/utils';
import { Crosshair } from '@/renderer/components/app/Crosshair';
import { useActionStateContext } from '@/renderer/context/action-state-context';
import { useGlobalContext } from '@/renderer/context/global-context';
import { getCrosshairVars } from '@/renderer/lib/crosshair-vars';
import '@/renderer/styles/crosshair.scss';

import { useEffect, useState } from 'react';

export default function CrosshairApp() {
	const { settings, windowState, isPremium } = useGlobalContext();
	const { tilt, hidden, adsActive, secondary } = useActionStateContext();
	const [isDragActive, setIsDragActive] = useState(false);

	// Drag-and-drop custom crosshair onto overlay window
	useEffect(() => {
		let dragCounter = 0;

		const handleDragEnter = (e: DragEvent) => {
			e.preventDefault();
			dragCounter += 1;
			setIsDragActive(true);
		};

		const handleDragOver = (e: DragEvent) => {
			e.preventDefault();
		};

		const handleDragLeave = (e: DragEvent) => {
			e.preventDefault();
			dragCounter -= 1;
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

			const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
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

		const properties = getCrosshairVars({
			settings,
			windowState,
			isPremium,
			hidden,
			adsActive,
			secondary,
		});

		// Apply properties to root
		Object.entries(properties).forEach(([key, value]) => {
			document.documentElement.style.setProperty(key, String(value));
		});
	}, [settings, windowState, isPremium, hidden, adsActive, secondary]);

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
