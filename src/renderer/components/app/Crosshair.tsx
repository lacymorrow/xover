/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import { ipcChannels } from '@/config/ipc-channels';
import { useGlobalContext } from '@/renderer/context/global-context';
import '@/renderer/styles/crosshair.scss';
import crosshair from '@/static/crosshairs/Actual/leupold-dot.png';
import React from 'react';

export function Crosshair() {
	const { settings } = useGlobalContext();

	const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
		switch (e.detail) {
			case 2:
				// Double click
				// Center app on screen
				window.electron.ipcRenderer.send(ipcChannels.CENTER_WINDOW);
				break;

			default:
				break;
		}
	};

	return (
		<div
			id="crosshair"
			className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 block"
			onClick={handleClick}
		>
			<div id="sight">
				<img
					src={settings.crosshair ? `file://${settings.crosshair}` : crosshair}
					alt=""
				/>
			</div>
			<div id="reticle" />
		</div>
	);
}
