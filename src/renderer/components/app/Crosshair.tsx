/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import { ipcChannels } from '@/config/ipc-channels';
import { useGlobalContext } from '@/renderer/context/global-context';
import '@/renderer/styles/crosshair.scss';
import crosshair from '@/static/crosshairs/Actual/leupold-dot.png';
import React from 'react';
import { QuitButton } from './QuitButton';
import { ResetButton } from './ResetButton';
import { SettingsButton } from './SettingsButton';

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
			className="w-full h-full grid grid-cols-[1fr_auto_1fr]"
			onClick={handleClick}
		>
			<div className="controls">
				<QuitButton />
				<SettingsButton />
			</div>

			<div id="crosshair">
				<div id="sight">
					<img
						src={
							settings.crosshair ? `file://${settings.crosshair}` : crosshair
						}
						alt=""
					/>
				</div>
				<div id="reticle" />
			</div>

			<div className="controls">
				<ResetButton />
				<SettingsButton />
			</div>
		</div>
	);
}
