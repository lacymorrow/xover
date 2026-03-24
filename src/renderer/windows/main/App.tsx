// todo: menubar ellipsis on overflow
import { MainLayout } from '@/renderer/components/layout/MainLayout';
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

	const crosshairRoutes = (
		<Route
			path="/"
			element={
				<MainLayout>
					<SettingsLayout />
				</MainLayout>
			}
		>
			{settingsNavItems.map((item) => (
				<Route
					key={item.title}
					path={item.href}
					element={<>{item.element}</>}
				/>
			))}
			{index && <Route index element={<>{index.element}</>} />}
			{index && <Route path="*" element={<>{index.element}</>} />}
		</Route>
	);

	const router = createHashRouter(createRoutesFromElements(crosshairRoutes));

	return (
		<>
			<RouterProvider router={router} />
		</>
	);
}
