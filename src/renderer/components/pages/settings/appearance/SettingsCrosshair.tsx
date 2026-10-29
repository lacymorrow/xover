import { Separator } from '@/components/ui/separator';
import { CrosshairWindowStateType } from '@/config/settings';
import { InputColor } from '@/renderer/components/input/InputColor';
import { InputComboboxForm } from '@/renderer/components/input/InputComboboxForm';
import { InputSlider } from '@/renderer/components/input/InputSlider';
import { MoreSettings } from '@/renderer/components/ui/MoreSettings';
import { PremiumBadge } from '@/renderer/components/ui/PremiumBadge';
import { PremiumGate, UpgradeLink } from '@/renderer/components/ui/PremiumGate';
import { reticleItems } from '@/renderer/config/reticles';
import { useGlobalContext } from '@/renderer/context/global-context';
import { useCallback, useMemo } from 'react';
import { CrosshairGallery, CrosshairUploadButton } from './CrosshairGallery';
import { SettingsSecondaryCrosshair } from './SettingsSecondaryCrosshair';

/**
 * The Crosshair pane (LAC-5868).
 *
 * Above the fold: the five things someone opens this pane to change. Under
 * "More": rotation, the SVG colours, the reticle's size and rotation, and the
 * custom upload. Nothing was dropped, and every control writes the same
 * window-state key it always did.
 */
export function SettingsCrosshair() {
	const { windowState } = useGlobalContext();

	const isSvgSelected = useMemo(() => {
		return windowState.crosshair?.toLowerCase().endsWith('.svg') ?? false;
	}, [windowState.crosshair]);

	const handleChangeSetting = useCallback(
		(setting: Partial<CrosshairWindowStateType>) => {
			window.electron.setWindowState(setting);
		},
		[],
	);

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Edit Crosshair Window</h3>
				<p className="text-sm text-muted-foreground">
					Adjust the crosshair settings for the active window.
				</p>
			</div>
			<Separator />

			<CrosshairGallery showUpload={false} />

			<InputSlider
				value={windowState.crosshairSize}
				onChange={(value) => {
					handleChangeSetting({ crosshairSize: value });
				}}
				label="Crosshair Size"
				details="Adjust the size of the crosshair."
				min={0}
				max={100}
			/>
			<InputSlider
				value={windowState.crosshairOpacity}
				onChange={(value) => {
					handleChangeSetting({ crosshairOpacity: value });
				}}
				label="Crosshair Opacity"
				details="Adjust the opacity of the crosshair."
				min={0}
				max={100}
			/>
			<InputColor
				value={windowState.reticleColor}
				label="Reticle Color"
				details="The color of the reticle in the center of the crosshair."
				onChange={(value) => {
					handleChangeSetting({ reticleColor: value });
				}}
			/>
			<InputComboboxForm
				value={windowState.reticle}
				onChange={(value) => {
					handleChangeSetting({ reticle: value });
				}}
				label="Reticle Style"
				details="Select the reticle shape."
				items={reticleItems}
				className="w-[250px] h-60 h"
			/>

			<MoreSettings>
				<CrosshairUploadButton />
				<PremiumGate
					fallback={
						<InputSlider
							value={0}
							label={
								<>
									Crosshair Rotation <PremiumBadge />
								</>
							}
							details="Rotate the crosshair to any angle. Included with CrossOver Pro."
							content={<UpgradeLink />}
							min={-180}
							max={180}
							disabled
						/>
					}
				>
					<InputSlider
						value={windowState.crosshairRotation}
						onChange={(value) => {
							handleChangeSetting({ crosshairRotation: value });
						}}
						label="Crosshair Rotation"
						details="Adjust the rotation of the crosshair."
						min={-180}
						max={180}
					/>
				</PremiumGate>
				{isSvgSelected && (
					<>
						<Separator />
						<h4 className="text-md font-medium">SVG Customization</h4>
						<InputColor
							value={windowState.fillColor}
							label="Fill Color"
							details="The fill color applied to the SVG crosshair."
							onChange={(value) => {
								handleChangeSetting({ fillColor: value });
							}}
						/>
						<InputColor
							value={windowState.strokeColor}
							label="Stroke Color"
							details="The stroke (outline) color applied to the SVG crosshair."
							onChange={(value) => {
								handleChangeSetting({ strokeColor: value });
							}}
						/>
						<InputSlider
							value={windowState.strokeWidth}
							onChange={(value) => {
								handleChangeSetting({ strokeWidth: value });
							}}
							label="Stroke Width"
							details="Adjust the stroke width of the SVG crosshair."
							min={0}
							max={10}
						/>
					</>
				)}
				<Separator />
				<InputSlider
					value={windowState.reticleSize}
					onChange={(value) => {
						handleChangeSetting({ reticleSize: value });
					}}
					label="Reticle Size"
					details="Adjust the size of the reticle in the center of the crosshair."
					min={0}
					max={100}
				/>
				<PremiumGate
					fallback={
						<InputSlider
							value={0}
							label={
								<>
									Reticle Rotation <PremiumBadge />
								</>
							}
							details="Rotate the reticle to any angle. Included with CrossOver Pro."
							content={<UpgradeLink />}
							min={-180}
							max={180}
							disabled
						/>
					}
				>
					<InputSlider
						value={windowState.reticleRotation}
						onChange={(value) => {
							handleChangeSetting({ reticleRotation: value });
						}}
						label="Reticle Rotation"
						details="Adjust the rotation of the reticle in the center of the crosshair."
						min={-180}
						max={180}
					/>
				</PremiumGate>
			</MoreSettings>

			<Separator />
			<SettingsSecondaryCrosshair />
		</div>
	);
}
