import { SettingsAbout } from '@/renderer/components/pages/settings/about/SettingsAbout';
import { SettingsAppearance } from '@/renderer/components/pages/settings/appearance/SettingsAppearance';
import {
	BellIcon,
	BlendingModeIcon,
	Component1Icon,
	Crosshair1Icon,
	GearIcon,
	IdCardIcon,
	KeyboardIcon,
	LightningBoltIcon,
	LockClosedIcon,
} from '@radix-ui/react-icons';

import { SettingsApplication } from '@/renderer/components/pages/settings/general/SettingsApplication';
import { SettingsKeyboard } from '@/renderer/components/pages/settings/keyboard/SettingsKeyboard';
import { SettingsNotifications } from '@/renderer/components/pages/settings/notifications/SettingsNotifications';
import { SettingsWindow } from '../components/pages/settings/appearance/SettingsWindow';
import { SettingsActions } from '../components/pages/settings/general/SettingsActions';
import { SettingsAdvanced } from '../components/pages/settings/general/SettingsAdvanced';
import { SettingsLicense } from '../components/pages/settings/license/SettingsLicense';

export const nav = {
	home: {
		title: 'Home',
		href: '/',
	},
	settings: {
		title: 'Settings',
		href: '/settings',
	},
};

export const settingsNavItems = [
	{
		title: 'Crosshair',
		href: 'crosshair',
		element: <SettingsWindow />,
		icon: Crosshair1Icon,
		index: true,
	},
	{
		title: 'Bindings',
		href: 'bindings',
		element: <SettingsActions />,
		icon: LightningBoltIcon,
	},
	{
		title: 'Appearance',
		href: 'appearance',
		element: <SettingsAppearance />,
		icon: BlendingModeIcon,
	},
	{
		title: 'App',
		href: 'app',
		element: <SettingsApplication />,
		icon: GearIcon,
	},
	{
		title: 'Notifications',
		href: 'notifications',
		element: <SettingsNotifications />,
		icon: BellIcon,
	},
	{
		title: 'Keyboard',
		href: 'keyboard',
		element: <SettingsKeyboard />,
		icon: KeyboardIcon,
	},
	{
		title: 'Advanced',
		href: 'advanced',
		element: <SettingsAdvanced />,
		icon: Component1Icon,
	},
	{
		title: 'License',
		href: 'license',
		element: <SettingsLicense />,
		icon: LockClosedIcon,
	},
	{
		title: 'About',
		href: 'about',
		element: <SettingsAbout />,
		icon: IdCardIcon,
	},
];
