import { Button } from '@/components/ui/button';
import { SettingsType } from '@/config/settings';
import { InputSwitch } from '@/renderer/components/input/InputSwitch';
import { CardNotifications } from '@/renderer/components/pages/settings/notifications/CardNotifications';
import { useGlobalContext } from '@/renderer/context/global-context';

export function SettingsNotifications() {
	const { settings } = useGlobalContext();

	const handleChangeSetting = (setting: Partial<SettingsType>) => {
		window.electron.setSettings(setting);
	};
	return (
		<div className="space-y-6">
			<div>
				<h4 className="font-medium text-base">Notifications</h4>
				<p className="text-sm text-muted-foreground">
					Configure your notification preferences.
				</p>
			</div>
			<InputSwitch
				value={settings.allowSounds}
				onChange={() => {
					handleChangeSetting({ allowSounds: !settings.allowSounds });
				}}
				label="Play Sounds"
				description="Play sounds for notifications and alerts."
				content={
					<Button
						onClick={() => {
							window.electron.playSound('NOTIFICATION');
						}}
					>
						Play a test sound
					</Button>
				}
				card
			/>

			<InputSwitch
				value={settings.allowNotifications}
				onChange={() => {
					handleChangeSetting({
						allowNotifications: !settings.allowNotifications,
					});
				}}
				label="Allow Notifications"
				description="Show pop-up text notifications."
				content={
					<Button
						onClick={() => {
							window.electron.notify({
								title: 'Test Notification',
								body: 'This is a test notification',
							});
						}}
					>
						Send a test notification
					</Button>
				}
				card
			/>

			<CardNotifications />
		</div>
	);
}
