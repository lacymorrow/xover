// DATA SHOULD ONLY FLOW DOWNWARDS
// We pass data from the main process to the renderer process using IPC
// We also use IPC to update data

// todo: add os here

import { ipcChannels } from '@/config/ipc-channels';
import React, { useContext, useEffect, useMemo } from 'react';

import { ActionStateType } from '@/config/settings';

export const ActionStateContext = React.createContext<ActionStateType>({
	secondary: false,
	hidden: false,
	adsActive: false,
	tilt: 0,
});

export function ActionStateContextProvider({
	children,
}: {
	children?: React.ReactNode;
}) {
	const [secondary, setSecondary] = React.useState<boolean>(false);
	const [hidden, setHidden] = React.useState<boolean>(false);
	const [adsActive, setAdsActive] = React.useState<boolean>(false);
	const [tilt, setTilt] = React.useState<number>(0);

	useEffect(() => {
		// Listen for messages from the main process
		window.electron.ipcRenderer.on(
			ipcChannels.ACTION_STATE,
			async (key, value) => {
				if (key === 'secondary') {
					setSecondary(value as boolean);
					if (value) {
						window.document.documentElement.classList.add('secondary');
					} else {
						window.document.documentElement.classList.remove('secondary');
					}
				}

				if (key === 'hidden') {
					setHidden(value as boolean);
				}

				if (key === 'adsActive') {
					setAdsActive(value as boolean);
				}

				// Update the state based on the key and value received
				if (key === 'tilt') {
					setTilt(value as number);
				}
			},
		);

		// Setup
		window.document.documentElement.classList.remove('secondary');

		return () => {
			// Clean up listeners when the component unmounts
			window.electron.ipcRenderer.removeAllListeners(ipcChannels.ACTION_STATE);
		};
	}, []);

	const value = useMemo(() => {
		return {
			secondary,
			hidden,
			adsActive,
			tilt,
		};
	}, [secondary, hidden, adsActive, tilt]);

	return (
		<ActionStateContext.Provider value={value}>
			{children}
		</ActionStateContext.Provider>
	);
}

export const useActionStateContext = () => {
	const context = useContext(ActionStateContext);

	if (context === undefined)
		throw new Error(
			'useActionStateContext must be used within a ActionStateContext',
		);

	return context;
};
