import { SettingsJson } from '@/renderer/components/pages/settings/SettingsJson';
import { SettingsAbout } from '@/renderer/components/pages/settings/about/SettingsAbout';
import { SettingsAppearance } from '@/renderer/components/pages/settings/appearance/SettingsAppearance';
import {
	BellIcon,
	BlendingModeIcon,
	Crosshair1Icon,
	GearIcon,
	IdCardIcon,
	ImageIcon,
	KeyboardIcon,
	LightningBoltIcon,
} from '@radix-ui/react-icons';

import { SettingsApplication } from '@/renderer/components/pages/settings/general/SettingsApplication';
import { SettingsKeyboard } from '@/renderer/components/pages/settings/keyboard/SettingsKeyboard';
import { SettingsNotifications } from '@/renderer/components/pages/settings/notifications/SettingsNotifications';
import { SettingsCrosshair } from '../components/pages/settings/appearance/SettingsCrosshair';
import { SettingsActions } from '../components/pages/settings/general/SettingsActions';
import { SettingsAdvanced } from '../components/pages/settings/general/SettingsAdvanced';

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
	},
	{
		title: 'Crosshair',
		href: 'crosshair',
		element: <SettingsCrosshair />,
		icon: Crosshair1Icon,
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
		title: 'Display',
		href: 'display',
		element: <SettingsJson />,
		icon: ImageIcon,
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
		icon: LightningBoltIcon,
	},
	{
		title: 'About',
		href: 'about',
		element: <SettingsAbout />,
		icon: IdCardIcon,
	},
];
