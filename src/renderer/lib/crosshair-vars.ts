import { CrosshairWindowStateType, SettingsType } from '@/config/settings';

export interface CrosshairVarsInput {
	settings: SettingsType;
	windowState: CrosshairWindowStateType;
	isPremium: boolean;
	/** Auto-Hide (ADS) is hiding the overlay right now */
	hidden: boolean;
	adsActive: boolean;
	secondary: boolean;
}

/**
 * The CSS custom properties the crosshair window renders from.
 *
 * Pure, so the rules that are easy to get wrong can be pinned in a test:
 * which values the secondary crosshair swaps in, that rotation is ignored
 * without a license, and that Auto-Hide hides everything.
 *
 * `--overlay-opacity` is what Auto-Hide drives, and it is applied to the
 * wrapper around both the crosshair image and the reticle. Hiding used to run
 * through `--crosshair-opacity`, which only covers the image: the reticle is a
 * sibling element, so it stayed on screen at full opacity, and the
 * `.secondary #crosshair` rule overrode the hide outright while the secondary
 * crosshair was active (LAC-5839).
 */
export const getCrosshairVars = ({
	settings,
	windowState,
	isPremium,
	hidden,
	adsActive,
	secondary,
}: CrosshairVarsInput): Record<string, string | number> => {
	const baseOpacity = secondary
		? windowState.crosshairOpacitySecondary
		: windowState.crosshairOpacity;

	const baseScale = secondary
		? windowState.crosshairSizeSecondary
		: windowState.crosshairSize;
	const effectiveScale = adsActive
		? settings.adsResizeSize / 100
		: baseScale / 100;

	// Rotation is a Pro feature; ignore stored values without a license
	const pro = (degrees: number) => (isPremium ? degrees : 0);
	const crosshairRotationSecondary = pro(
		windowState.crosshairRotationSecondary,
	);
	const reticleRotationSecondary = pro(windowState.reticleRotationSecondary);
	const rotation = secondary
		? crosshairRotationSecondary
		: pro(windowState.crosshairRotation);

	const reticleScale = secondary
		? windowState.reticleSizeSecondary
		: windowState.reticleSize;
	const reticleColor = secondary
		? windowState.reticleColorSecondary
		: windowState.reticleColor;
	const reticleRotation = secondary
		? reticleRotationSecondary
		: pro(windowState.reticleRotation);

	return {
		'--app-bg-color': windowState.backgroundColor,
		'--app-foreground-color': windowState.foregroundColor,
		// Background is transparent even if it's not set
		'--app-opacity': !windowState.backgroundColor ? 0.8 : 1,

		// Auto-Hide: the crosshair image AND the reticle
		'--overlay-opacity': hidden ? 0 : 1,

		'--crosshair-opacity': baseOpacity / 100,
		'--crosshair-scale': effectiveScale,
		'--crosshair-rotation': `${rotation}deg`,
		'--reticle-scale': reticleScale / 100,
		'--reticle-color': reticleColor,
		'--reticle-rotation': `${reticleRotation}deg`,

		// Secondary alt vars for SCSS .secondary rules
		'--crosshair-opacity-alt': windowState.crosshairOpacitySecondary / 100,
		'--crosshair-scale-alt': windowState.crosshairSizeSecondary / 100,
		'--crosshair-rotation-alt': `${crosshairRotationSecondary}deg`,
		'--reticle-scale-alt': windowState.reticleSizeSecondary / 100,
		'--reticle-color-alt': windowState.reticleColorSecondary,
		'--reticle-rotation-alt': `${reticleRotationSecondary}deg`,

		'--svg-fill-color': windowState.fillColor,
		'--svg-stroke-color': windowState.strokeColor,
		'--svg-stroke-width': String(windowState.strokeWidth),
		'--transition-duration': `${settings.transitionDuration}ms`,
	};
};
