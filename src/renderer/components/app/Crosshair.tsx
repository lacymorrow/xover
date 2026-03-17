/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import { SIZE_MODES } from '@/config/config';
import { ipcChannels } from '@/config/ipc-channels';
import { CrosshairWindowStateType } from '@/config/settings';
import { useGlobalContext } from '@/renderer/context/global-context';
import '@/renderer/styles/crosshair.scss';
import crosshair from '@/static/crosshairs/Actual/leupold-dot.png';

import { reticles } from '@/renderer/config/reticles';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { QuitButton } from './QuitButton';
import { ResetButton } from './ResetButton';
import { SettingsButton } from './SettingsButton';

export function Crosshair() {
	const { windowState } = useGlobalContext();
	const [svgContent, setSvgContent] = useState<string | null>(null);

	const sizeMode = (windowState.sizeMode ?? 'normal') as CrosshairWindowStateType['sizeMode'];
	const showControls = SIZE_MODES[sizeMode]?.showControls ?? true;

	const isSvg = useMemo(() => {
		return windowState.crosshair?.toLowerCase().endsWith('.svg') ?? false;
	}, [windowState.crosshair]);

	// Fetch SVG content for inline rendering
	useEffect(() => {
		if (!isSvg || !windowState.crosshair) {
			setSvgContent(null);
			return;
		}

		fetch(`file://${windowState.crosshair}`)
			.then((res) => res.text())
			.then((text) => {
				// Strip XML declaration and doctype, keep only the <svg> element
				const svgMatch = text.match(/<svg[\s\S]*<\/svg>/i);
				setSvgContent(svgMatch ? svgMatch[0] : null);
			})
			.catch(() => {
				setSvgContent(null);
			});
	}, [isSvg, windowState.crosshair]);

	const Reticle = useMemo(() => {
		return reticles.find((r) => r.value === windowState.reticle)?.Icon;
	}, [windowState.reticle]);

	const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		switch (e.detail) {
			case 2:
				// Double click
				// Center app on screen
				window.electron.ipcRenderer.send(ipcChannels.CENTER_WINDOW);
				break;

			default:
				break;
		}
	}, []);

	const handleError = useCallback(
		(e: React.SyntheticEvent<HTMLImageElement>) => {
			e.currentTarget.src = crosshair;
		},
		[],
	);

	return (
		<div
			className="w-full h-full grid grid-cols-[1fr_auto_1fr]"
			onClick={handleClick}
		>
			<div className="controls">
				{showControls && <QuitButton />}
			</div>

			<div id="crosshair-wrapper" className="relative">
				<div id="crosshair">
					{isSvg && svgContent ? (
						<div
							dangerouslySetInnerHTML={{ __html: svgContent }}
						/>
					) : (
						<img
							src={
								windowState.crosshair
									? `file://${windowState.crosshair}`
									: crosshair
							}
							alt=""
							onError={handleError}
						/>
					)}
				</div>
				<div
					id="reticle-wrapper"
					className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
				>
					{Reticle && <Reticle className="w-10 h-10" id="reticle" />}
				</div>
			</div>

			<div className="controls">
				{showControls && (
					<>
						<ResetButton />
						<SettingsButton />
					</>
				)}
			</div>
		</div>
	);
}
