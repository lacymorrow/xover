import { Separator } from '@/components/ui/separator';
import { CrosshairWindowStateType } from '@/config/settings';
import { InputColor } from '@/renderer/components/input/InputColor';
import { InputComboboxForm } from '@/renderer/components/input/InputComboboxForm';
import { InputSlider } from '@/renderer/components/input/InputSlider';
import { PremiumBadge } from '@/renderer/components/ui/PremiumBadge';
import { PremiumGate } from '@/renderer/components/ui/PremiumGate';
import { reticleItems } from '@/renderer/config/reticles';
import { useGlobalContext } from '@/renderer/context/global-context';
import { useCallback, useMemo } from 'react';
import { CrosshairGallery } from './CrosshairGallery';

export function SettingsSecondaryCrosshair() {
	const { windowState } = useGlobalContext();

	const isSvgSelected = useMemo(() => {
		return windowState.crosshairSecondary?.toLowerCase().endsWith('.svg') ?? false;
	}, [windowState.crosshairSecondary]);

	const handleChangeSetting = useCallback(
		(setting: Partial<CrosshairWindowStateType>) => {
			window.electron.setWindowState(setting);
		},
		[],
	);

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Secondary Crosshair <PremiumBadge /></h3>
				<p className="text-sm text-muted-foreground">
					Configure the crosshair displayed when the secondary action is active.
				</p>
			</div>
			<Separator />
			<PremiumGate>
			<CrosshairGallery stateKey="crosshairSecondary" />
			<InputSlider
				value={windowState.crosshairSizeSecondary}
				onChange={(value) => {
					handleChangeSetting({ crosshairSizeSecondary: value });
				}}
				label="Crosshair Size"
				details="Adjust the size of the secondary crosshair."
				min={0}
				max={100}
			/>
			<InputSlider
				value={windowState.crosshairOpacitySecondary}
				onChange={(value) => {
					handleChangeSetting({ crosshairOpacitySecondary: value });
				}}
				label="Crosshair Opacity"
				details="Adjust the opacity of the secondary crosshair."
				min={0}
				max={100}
			/>
			<InputSlider
				value={windowState.crosshairRotationSecondary}
				onChange={(value) => {
					handleChangeSetting({ crosshairRotationSecondary: value });
				}}
				label="Crosshair Rotation"
				details="Adjust the rotation of the secondary crosshair."
				min={-180}
				max={180}
			/>
			{isSvgSelected && (
				<>
					<Separator />
					<h4 className="text-md font-medium">SVG Customization</h4>
					<p className="text-sm text-muted-foreground">
						SVG fill/stroke colors are shared with the primary crosshair.
					</p>
				</>
			)}
			<Separator />
			<div>
				<h3 className="text-lg font-medium">Reticle</h3>
				<p className="text-sm text-muted-foreground">
					Configure the reticle displayed with the secondary crosshair.
				</p>
			</div>
			<Separator />
			<InputComboboxForm
				value={windowState.reticleSecondary}
				onChange={(value) => {
					handleChangeSetting({ reticleSecondary: value });
				}}
				label="Reticle Style"
				details="Select the secondary reticle style."
				items={reticleItems}
				className="w-[250px] h-60 h"
			/>
			<InputSlider
				value={windowState.reticleSizeSecondary}
				onChange={(value) => {
					handleChangeSetting({ reticleSizeSecondary: value });
				}}
				label="Reticle Size"
				details="Adjust the size of the secondary reticle."
				min={0}
				max={100}
			/>
			<InputSlider
				value={windowState.reticleRotationSecondary}
				onChange={(value) => {
					handleChangeSetting({ reticleRotationSecondary: value });
				}}
				label="Reticle Rotation"
				details="Adjust the rotation of the secondary reticle."
				min={-180}
				max={180}
			/>
			<InputColor
				value={windowState.reticleColorSecondary}
				label="Reticle Color"
				details="The color of the secondary reticle."
				onChange={(value) => {
					handleChangeSetting({ reticleColorSecondary: value });
				}}
			/>
			</PremiumGate>
		</div>
	);
}
