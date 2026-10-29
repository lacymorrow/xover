import { Separator } from '@/components/ui/separator';
import { POLAR_CHECKOUT_URL } from '@/config/license';
import {
	AppSizeModeType,
	CrosshairWindowStateType,
	SettingsType,
} from '@/config/settings';
import { $settings } from '@/config/strings';
import { InputRadioGroup } from '@/renderer/components/input/InputRadioGroup';
import { InputSwitch } from '@/renderer/components/input/InputSwitch';
import { ThemeForm } from '@/renderer/components/pages/settings/appearance/ThemeForm';
import { PremiumBadge } from '@/renderer/components/ui/PremiumBadge';
import { useGlobalContext } from '@/renderer/context/global-context';
import { Link } from 'react-router-dom';

/**
 * License state as the first thing on the App pane (LAC-5868): whether Pro is
 * on, and one button to do something about it. The License pane still owns
 * entering and deactivating a key.
 */
function LicenseRow() {
	const { isPremium } = useGlobalContext();

	return (
		<div className="flex items-center justify-between gap-4 rounded-lg border p-4">
			<div className="space-y-0.5">
				<p className="font-medium text-base">
					{isPremium ? (
						<>
							CrossOver Pro <PremiumBadge />
						</>
					) : (
						'CrossOver'
					)}
				</p>
				<p className="text-sm text-muted-foreground">
					{isPremium
						? 'Pro is active on this computer.'
						: 'A second crosshair and rotation are included with Pro. Pay once.'}
				</p>
			</div>
			{isPremium ? (
				<Link
					to="license"
					draggable={false}
					className="shrink-0 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
				>
					Manage
				</Link>
			) : (
				<button
					type="button"
					className="inline-flex shrink-0 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
					onClick={() => {
						window.electron.openUrl(POLAR_CHECKOUT_URL);
					}}
				>
					Get Pro
				</button>
			)}
		</div>
	);
}

/**
 * The App pane (LAC-5868): how CrossOver launches, how it shows up in the OS,
 * and how it looks. Theme and both window-size settings moved here from
 * Appearance; quit-on-close, auto-hide settings and analytics moved out to
 * Advanced. Same keys throughout.
 */
export function SettingsApplication() {
	const { app, settings, setSettings, windowState } = useGlobalContext();

	const handleChangeSetting = (setting: Partial<SettingsType>) => {
		window.electron.setSettings(setting);
	};

	const handleChangeWindowState = (
		setting: Partial<CrosshairWindowStateType>,
	) => {
		window.electron.setWindowState(setting);
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">App</h3>
				<p className="text-sm text-muted-foreground">
					Launch behavior, system integration, and appearance.
				</p>
			</div>
			<Separator />
			<LicenseRow />
			<InputSwitch
				value={settings.startOnLogin}
				onChange={() => {
					handleChangeSetting({ startOnLogin: !settings.startOnLogin });
				}}
				label="Start on Login"
				description="Automatically start the app when you log into your computer."
				card
			/>
			<InputSwitch
				value={settings.allowAutoUpdate}
				onChange={() => {
					handleChangeSetting({ allowAutoUpdate: !settings.allowAutoUpdate });
				}}
				label="Automatic updates"
				description="Automatically download and install new updates."
				card
			/>
			<InputSwitch
				value={settings.hideFromScreenCapture}
				onChange={() => {
					handleChangeSetting({
						hideFromScreenCapture: !settings.hideFromScreenCapture,
					});
				}}
				label="Hide from screen recording"
				description="Keep the crosshair out of recordings and screenshots."
				details="It stays visible on your screen, but OBS, Instant Replay and screenshots won't capture it. Needs Windows 10 or later for full effect."
				card
			/>
			<InputSwitch
				value={settings.startLocked}
				onChange={() => {
					handleChangeSetting({ startLocked: !settings.startLocked });
				}}
				label="Resume locked on launch"
				description="Start the app locked if it was locked when last closed."
				card
			/>
			<Separator />
			<ThemeForm />
			<InputRadioGroup
				label="Window Size Mode"
				details="Normal: fixed size. Resizable: drag to resize. Fullscreen: fills the entire screen."
				items={[
					{ value: 'normal', label: 'Normal' },
					{ value: 'resizable', label: 'Resizable' },
					{ value: 'fullscreen', label: 'Fullscreen' },
				]}
				value={settings.appSizeMode}
				onChange={(value) => {
					setSettings({ appSizeMode: value as AppSizeModeType });
				}}
				card
			/>
			<InputRadioGroup
				label="Crosshair Window Size"
				details="Compact: minimal, no controls. Normal: default size with controls. Large: bigger window with controls."
				items={[
					{ value: 'compact', label: 'Compact' },
					{ value: 'normal', label: 'Normal' },
					{ value: 'large', label: 'Large' },
				]}
				value={windowState.sizeMode ?? 'normal'}
				onChange={(value) => {
					handleChangeWindowState({
						sizeMode: value as CrosshairWindowStateType['sizeMode'],
					});
				}}
				card
			/>
			<Separator />
			{(app.isMac || app.isDev) && (
				<InputSwitch
					value={settings.showDockIcon}
					onChange={() => {
						handleChangeSetting({ showDockIcon: !settings.showDockIcon });
					}}
					label="Dock icon"
					description="Show the app icon in the dock. (macOS only)"
					card
				/>
			)}
			{(app.isWindows || app.isDev) && (
				<InputSwitch
					value={settings.showTaskbarIcon}
					onChange={() => {
						handleChangeSetting({ showTaskbarIcon: !settings.showTaskbarIcon });
					}}
					label="Taskbar Icon"
					description={`Show the app icon in the taskbar. ${$settings.reloadToApply} (Windows only)`}
					card
				/>
			)}
			<InputSwitch
				value={settings.showTrayIcon}
				onChange={() => {
					handleChangeSetting({ showTrayIcon: !settings.showTrayIcon });
				}}
				label="Tray icon"
				description="Show the app icon in the system tray."
				card
			/>
		</div>
	);
}
