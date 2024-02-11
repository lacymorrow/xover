/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import { ipcChannels } from '@/config/ipc-channels';
import { useGlobalContext } from '@/renderer/context/global-context';
import '@/renderer/styles/crosshair.scss';
import crosshair from '@/static/crosshairs/Actual/leupold-dot.png';

import { reticles } from '@/renderer/config/reticles';
import React, { useMemo } from 'react';
import { QuitButton } from './QuitButton';
import { ResetButton } from './ResetButton';
import { SettingsButton } from './SettingsButton';

export function Crosshair() {
	const { windowState } = useGlobalContext();

	const Reticle = useMemo(() => {
		return reticles.find((r) => r.value === windowState.reticle)?.Icon;
	}, [windowState.reticle]);

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

			<div id="crosshair-wrapper" className="relative">
				<div id="crosshair">
					<img
						src={
							windowState.crosshair
								? `file://${windowState.crosshair}`
								: crosshair
						}
						alt=""
					/>
				</div>
				<div
					id="reticle-wrapper"
					className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
				>
					{Reticle && <Reticle className="w-10 h-10" id="reticle" />}
				</div>
			</div>

			<div className="controls">
				<ResetButton />
				<SettingsButton />
			</div>
		</div>
	);
}
