import { MainLayout } from '@/renderer/windows/main/Layout';
import { Home } from '@/renderer/windows/main/pages/Home';
import { Settings } from '@/renderer/windows/main/pages/Settings';
import { Route, MemoryRouter as Router, Routes } from 'react-router-dom';

export default function App() {
	return (
		<Router>
			<MainLayout>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/settings" element={<Settings />} />
				</Routes>
			</MainLayout>
		</Router>
	);
}
