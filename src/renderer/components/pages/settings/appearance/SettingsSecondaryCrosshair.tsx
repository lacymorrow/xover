import { Separator } from '@/components/ui/separator';
import { POLAR_CHECKOUT_URL } from '@/config/license';
import { CrosshairWindowStateType, SettingsType } from '@/config/settings';
import { InputColor } from '@/renderer/components/input/InputColor';
import { InputComboboxForm } from '@/renderer/components/input/InputComboboxForm';
import { InputMouseKeyboardBind } from '@/renderer/components/input/InputMouseKeyboardBind';
import { InputSlider } from '@/renderer/components/input/InputSlider';
import { InputSwitch } from '@/renderer/components/input/InputSwitch';
import { PremiumBadge } from '@/renderer/components/ui/PremiumBadge';
import { PremiumGate } from '@/renderer/components/ui/PremiumGate';
import { reticleItems } from '@/renderer/config/reticles';
import { useGlobalContext } from '@/renderer/context/global-context';
import { useCallback, useMemo } from 'react';
import { CrosshairGallery } from './CrosshairGallery';

/**
 * The second crosshair, as one row at the bottom of the Crosshair pane
 * (LAC-5868). It used to be a Primary/Secondary tab pair up top, with the
 * on/off switch and its bind stranded on another pane; now the switch, the
 * bind and the appearance live together and only unfold once it is on.
 */
export function SettingsSecondaryCrosshair() {
	const { settings, windowState } = useGlobalContext();

	const isSvgSelected = useMemo(() => {
		return (
			windowState.crosshairSecondary?.toLowerCase().endsWith('.svg') ?? false
		);
	}, [windowState.crosshairSecondary]);

	const handleChangeWindowState = useCallback(
		(setting: Partial<CrosshairWindowStateType>) => {
			window.electron.setWindowState(setting);
		},
		[],
	);

	const handleChangeSetting = useCallback((setting: Partial<SettingsType>) => {
		window.electron.setSettings(setting);
	}, []);

	return (
		<PremiumGate
			fallback={
				<InputSwitch
					value={false}
					onChange={() => {
						window.electron.openUrl(POLAR_CHECKOUT_URL);
					}}
					label={
						<>
							Secondary Crosshair <PremiumBadge />
						</>
					}
					description="Switch to a second crosshair when the bind is active."
					details="Included with CrossOver Pro."
				/>
			}
		>
			<div className="space-y-6">
				<InputSwitch
					value={settings.secondaryActionEnabled}
					onChange={() => {
						handleChangeSetting({
							secondaryActionEnabled: !settings.secondaryActionEnabled,
						});
					}}
					label={
						<>
							Secondary Crosshair <PremiumBadge />
						</>
					}
					description="Switch to a second crosshair when the bind is active."
				/>

				{settings.secondaryActionEnabled && (
					<>
						<InputMouseKeyboardBind
							value={settings.secondaryBind}
							onChange={(value) => {
								handleChangeSetting({ secondaryBind: value });
							}}
							label="Secondary Bind"
						/>
						<CrosshairGallery stateKey="crosshairSecondary" />
						<InputSlider
							value={windowState.crosshairSizeSecondary}
							onChange={(value) => {
								handleChangeWindowState({ crosshairSizeSecondary: value });
							}}
							label="Crosshair Size"
							details="Adjust the size of the secondary crosshair."
							min={0}
							max={100}
						/>
						<InputSlider
							value={windowState.crosshairOpacitySecondary}
							onChange={(value) => {
								handleChangeWindowState({ crosshairOpacitySecondary: value });
							}}
							label="Crosshair Opacity"
							details="Adjust the opacity of the secondary crosshair."
							min={0}
							max={100}
						/>
						<InputSlider
							value={windowState.crosshairRotationSecondary}
							onChange={(value) => {
								handleChangeWindowState({ crosshairRotationSecondary: value });
							}}
							label="Crosshair Rotation"
							details="Adjust the rotation of the secondary crosshair."
							min={-180}
							max={180}
						/>
						{isSvgSelected && (
							<p className="text-sm text-muted-foreground">
								SVG fill/stroke colors are shared with the primary crosshair.
							</p>
						)}
						<Separator />
						<div>
							<h4 className="text-md font-medium">Secondary reticle</h4>
							<p className="text-sm text-muted-foreground">
								Configure the reticle displayed with the secondary crosshair.
							</p>
						</div>
						<InputComboboxForm
							value={windowState.reticleSecondary}
							onChange={(value) => {
								handleChangeWindowState({ reticleSecondary: value });
							}}
							label="Reticle Style"
							details="Select the secondary reticle style."
							items={reticleItems}
							className="w-[250px] h-60 h"
						/>
						<InputSlider
							value={windowState.reticleSizeSecondary}
							onChange={(value) => {
								handleChangeWindowState({ reticleSizeSecondary: value });
							}}
							label="Reticle Size"
							details="Adjust the size of the secondary reticle."
							min={0}
							max={100}
						/>
						<InputSlider
							value={windowState.reticleRotationSecondary}
							onChange={(value) => {
								handleChangeWindowState({ reticleRotationSecondary: value });
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
								handleChangeWindowState({ reticleColorSecondary: value });
							}}
						/>
					</>
				)}
			</div>
		</PremiumGate>
	);
}
