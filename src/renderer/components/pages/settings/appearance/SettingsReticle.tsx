import { Separator } from '@/components/ui/separator';
import { CrosshairWindowStateType } from '@/config/settings';

import { InputColor } from '@/renderer/components/input/InputColor';
import { InputComboboxForm } from '@/renderer/components/input/InputComboboxForm';
import { InputSlider } from '@/renderer/components/input/InputSlider';
import { PremiumBadge } from '@/renderer/components/ui/PremiumBadge';
import { PremiumGate, UpgradeLink } from '@/renderer/components/ui/PremiumGate';
import { reticleItems } from '@/renderer/config/reticles';
import { useGlobalContext } from '@/renderer/context/global-context';

export function SettingsReticle() {
	const { windowState } = useGlobalContext();

	const handleChangeSetting = (setting: Partial<CrosshairWindowStateType>) => {
		window.electron.setWindowState(setting);
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Reticle</h3>
				<p className="text-sm text-muted-foreground">
					Adjust the reticle style, size, rotation, and color.
				</p>
			</div>
			<Separator />
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
			<InputColor
				value={windowState.reticleColor}
				label="Reticle Color"
				details="The color of the reticle in the center of the crosshair."
				onChange={(value) => {
					handleChangeSetting({ reticleColor: value });
				}}
			/>
		</div>
	);
}
