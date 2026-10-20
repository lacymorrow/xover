import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { InputKeyboardShortcut } from '@/renderer/components/input/InputKeyboardShortcut';
import { InputSwitch } from '@/renderer/components/input/InputSwitch';
import { useGlobalContext } from '@/renderer/context/global-context';
import { CustomAcceleratorsType } from '@/types/keyboard';

export function SettingsKeyboard() {
	const { keybinds, settings } = useGlobalContext();
	const allDisabled = settings.allowDisableKeyboardShortcuts;

	const handleChangeKeybind = (
		key: keyof CustomAcceleratorsType,
		value: string,
	) => {
		window.electron.setKeybind(key, value);
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Keyboard Shortcuts</h3>
				<p className="text-sm text-muted-foreground">
					Customize keyboard shortcuts to control the application. Press
					&quot;Backspace&quot; or &quot;Delete&quot; to clear the current
					shortcut.
				</p>
			</div>
			<Separator />
			{/* Master switch. It sits at the top because it governs everything
			    below it, and the list dims so its effect is visible. */}
			<InputSwitch
				value={allDisabled}
				onChange={(value) => {
					window.electron.setSettings({
						allowDisableKeyboardShortcuts: value,
					});
				}}
				label="Disable all keybinds"
				description="Turn off every shortcut below, including Settings."
				details="Lock and Reset keep working, so you can always unlock the crosshair or start over."
				card
			/>
			<div
				className={cn(
					'space-y-6 transition-opacity',
					allDisabled && 'opacity-50',
				)}
			>
				<InputKeyboardShortcut
					value={keybinds.lock}
					label="Lock Crosshair in Place"
					description="Lock/Unlock the crosshair in place and hide the UI."
					onChange={(value) => {
						handleChangeKeybind('lock', value);
					}}
				/>
				<InputKeyboardShortcut
					value={keybinds.center}
					label="Center Crosshair"
					description="Center the active window on the screen."
					onChange={(value) => {
						handleChangeKeybind('center', value);
					}}
				/>
				<InputKeyboardShortcut
					value={keybinds.newWindow}
					label="New Crosshair Window"
					description="Create a new crosshair window."
					onChange={(value) => {
						handleChangeKeybind('newWindow', value);
					}}
				/>
				<InputKeyboardShortcut
					value={keybinds.duplicateWindow}
					label="Duplicate Crosshair Window"
					description="Create a new crosshair window with the current window settings."
					onChange={(value) => {
						handleChangeKeybind('duplicateWindow', value);
					}}
				/>
				<InputKeyboardShortcut
					value={keybinds.focusNextWindow}
					label="Focus Next Window"
					description="Move focus to the next window."
					onChange={(value) => {
						handleChangeKeybind('focusNextWindow', value);
					}}
				/>
				<InputKeyboardShortcut
					value={keybinds.moveUp}
					label="Move Up"
					description="Move the active window up by a single pixel."
					onChange={(value) => {
						handleChangeKeybind('moveUp', value);
					}}
				/>
				<InputKeyboardShortcut
					value={keybinds.moveDown}
					label="Move Down"
					description="Move the active window down by a single pixel."
					onChange={(value) => {
						handleChangeKeybind('moveDown', value);
					}}
				/>
				<InputKeyboardShortcut
					value={keybinds.moveLeft}
					label="Move Left"
					description="Move the active window left by a single pixel."
					onChange={(value) => {
						handleChangeKeybind('moveLeft', value);
					}}
				/>
				<InputKeyboardShortcut
					value={keybinds.moveRight}
					label="Move Right"
					description="Move the active window right by a single pixel."
					onChange={(value) => {
						handleChangeKeybind('moveRight', value);
					}}
				/>
				<InputKeyboardShortcut
					value={keybinds.changeDisplay}
					label="Move Window to Next Display"
					description="Move the active window to the next connected display."
					onChange={(value) => {
						handleChangeKeybind('changeDisplay', value);
					}}
				/>
				<Separator />
				<InputKeyboardShortcut
					value={keybinds.hide}
					label="Hide Application"
					description="Show/Hide all application windows."
					onChange={(value) => {
						handleChangeKeybind('hide', value);
					}}
				/>
				<InputKeyboardShortcut
					value={keybinds.hideReticle}
					label="Toggle Reticle"
					description="Show/Hide the centre reticle, leaving the crosshair image in place."
					onChange={(value) => {
						handleChangeKeybind('hideReticle', value);
					}}
				/>
				<InputKeyboardShortcut
					value={keybinds.quit}
					label="Quit Application"
					description="Close the application."
					onChange={(value) => {
						handleChangeKeybind('quit', value);
					}}
				/>
				<InputKeyboardShortcut
					value={keybinds.reset}
					label="Reset Application"
					description="Clear all settings and restore the app to its default state."
					details="WARNING: This will delete your settings"
					onChange={(value) => {
						handleChangeKeybind('reset', value);
					}}
				/>
			</div>
		</div>
	);
}
