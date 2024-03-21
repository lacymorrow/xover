// todo: menubar ellipsis on overflow
import { MainLayout } from '@/renderer/components/layout/MainLayout';
import { Home } from '@/renderer/components/pages/Home';
import {
	Route,
	RouterProvider,
	createHashRouter,
	createRoutesFromElements,
} from 'react-router-dom';

import SettingsLayout from '@/renderer/components/layout/SettingsLayout';
import { settingsNavItems } from '@/renderer/config/nav';
import '@/renderer/styles/globals.scss';

export default function App() {
	// Set default/catch-all route (we use the same for both)
	const index =
		settingsNavItems.find((item) => item.index) || settingsNavItems[0];

	const routes = (
		<Route path="/" element={<MainLayout />}>
			<Route path="settings" element={<SettingsLayout />}>
				{settingsNavItems.map((item) => {
					/* Dynamically add routes for settings */
					return (
						<Route
							key={item.title}
							path={item.href}
							element={<>{item.element}</>}
						/>
					);
				})}

				{index && (
					<>
						<Route index path="*" element={<>{index.element}</>} />
					</>
				)}
			</Route>

			<Route index element={<Home />} />
			<Route path="*" element={<Home />} />
		</Route>
	);

	const crosshairRoutes = (
		<Route
			path="/"
			element={
				<MainLayout>
					<SettingsLayout />
				</MainLayout>
			}
		>
			{settingsNavItems.map((item) => {
				/* Dynamically add routes for settings */
				return (
					<Route
						key={item.title}
						path={item.href}
						element={<>{item.element}</>}
					/>
				);
			})}

			{index && (
				<>
					<Route index path="*" element={<>{index.element}</>} />
				</>
			)}
		</Route>
	);

	const router = createHashRouter(createRoutesFromElements(crosshairRoutes));

	return (
		<>
			<RouterProvider router={router} />
		</>
	);
}
