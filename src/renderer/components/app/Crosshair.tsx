/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import { SIZE_MODES } from '@/config/config';
import { ipcChannels } from '@/config/ipc-channels';
import { CrosshairWindowStateType } from '@/config/settings';
import { useActionStateContext } from '@/renderer/context/action-state-context';
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
	const { secondary } = useActionStateContext();
	const [svgContent, setSvgContent] = useState<string | null>(null);

	const sizeMode = (windowState.sizeMode ?? 'normal') as CrosshairWindowStateType['sizeMode'];
	const showControls = SIZE_MODES[sizeMode]?.showControls ?? true;

	// Resolve active crosshair and reticle based on secondary state
	const activeCrosshair = useMemo(() => {
		const value = secondary && windowState.crosshairSecondary
			? windowState.crosshairSecondary
			: windowState.crosshair;
		// Ignore relative paths (invalid stored values)
		if (value && !value.startsWith('/') && !/^[A-Z]:\\/i.test(value)) {
			return undefined;
		}
		return value;
	}, [secondary, windowState.crosshair, windowState.crosshairSecondary]);

	const activeReticle = useMemo(() => {
		if (secondary) {
			return windowState.reticleSecondary;
		}
		return windowState.reticle;
	}, [secondary, windowState.reticle, windowState.reticleSecondary]);

	const isSvg = useMemo(() => {
		return activeCrosshair?.toLowerCase().endsWith('.svg') ?? false;
	}, [activeCrosshair]);

	// Fetch SVG content for inline rendering
	useEffect(() => {
		if (!isSvg || !activeCrosshair) {
			setSvgContent(null);
			return;
		}

		fetch(`file://${activeCrosshair}`)
			.then((res) => res.text())
			.then((text) => {
				// Strip XML declaration and doctype, keep only the <svg> element
				const svgMatch = text.match(/<svg[\s\S]*<\/svg>/i);
				if (!svgMatch) {
					setSvgContent(null);
					return;
				}
				// Sanitize: strip script tags, event handlers, and data URIs
				const sanitized = svgMatch[0]
					.replace(/<script[\s\S]*?<\/script>/gi, '')
					.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
					.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
				setSvgContent(sanitized);
			})
			.catch(() => {
				setSvgContent(null);
			});
	}, [isSvg, activeCrosshair]);

	const Reticle = useMemo(() => {
		return reticles.find((r) => r.value === activeReticle)?.Icon;
	}, [activeReticle]);

	// Use native dblclick event since -webkit-app-region: drag swallows regular clicks
	useEffect(() => {
		const handleDblClick = () => {
			window.electron.ipcRenderer.send(ipcChannels.CENTER_WINDOW);
		};
		document.addEventListener('dblclick', handleDblClick);
		return () => document.removeEventListener('dblclick', handleDblClick);
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
								activeCrosshair
									? `file://${activeCrosshair}`
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
