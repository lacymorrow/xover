import { screen } from 'electron';
import { WindowInstanceType } from '../windows';

export const isWindowCentered = (window: WindowInstanceType) => {
	if (!window) return false;
	const { x, y, width, height } = screen.getPrimaryDisplay().workArea;

	const newX = Math.floor(x + (width - window.getSize()[0]) / 2);
	const newY = Math.floor(y + (height - window.getSize()[1]) / 2);
	console.log('isWindowCentered', window.getPosition(), [newX, newY]);
	const [currentX, currentY] = window.getPosition();
	return newX === currentX && newY === currentY;
};

// const bounds = windows.preferencesWindow.getBounds()
// 		const centered = getWindowBoundsCentered( { window: windows.preferencesWindow, useFullBounds: true } )
// 		if ( centered.x === bounds.x && centered.y === bounds.y ) {
