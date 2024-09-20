import { SettingsAbout } from '@/renderer/components/views/settings/about/SettingsAbout';
import { SettingsAppearance } from '@/renderer/components/views/settings/appearance/SettingsAppearance';
import { SettingsApplication } from '@/renderer/components/views/settings/general/SettingsApplication';
import { SettingsKeyboard } from '@/renderer/components/views/settings/keyboard/SettingsKeyboard';
import { SettingsNotifications } from '@/renderer/components/views/settings/notifications/SettingsNotifications';
import {
	BellIcon,
	BlendingModeIcon,
	Component1Icon,
	Crosshair1Icon,
	GearIcon,
	IdCardIcon,
	KeyboardIcon,
	LightningBoltIcon,
} from '@radix-ui/react-icons';

import { SettingsWindow } from '@/renderer/components/views/settings/appearance/SettingsWindow';
import { SettingsActions } from '@/renderer/components/views/settings/general/SettingsActions';
import { SettingsAdvanced } from '@/renderer/components/views/settings/general/SettingsAdvanced';

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
		title: 'General',
		href: 'general',
		element: <SettingsApplication />,
		icon: GearIcon,
		index: true,
	},
	{
		title: 'Crosshair',
		href: 'crosshair',
		element: <SettingsWindow />,
		icon: Crosshair1Icon,
		index: true,
	},
	{
		title: 'Actions',
		href: 'actions',
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
		title: 'About',
		href: 'about',
		element: <SettingsAbout />,
		icon: IdCardIcon,
	},
];
