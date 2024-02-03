import { screen } from 'electron';
import { WindowInstanceType } from '../windows';

export const centerWindow = (window: WindowInstanceType) => {
	if (!window) return;
	const { x, y, width, height } = screen.getPrimaryDisplay().workArea;

	const newX = Math.floor(x + (width - window.getSize()[0]) / 2);
	const newY = Math.floor(y + (height - window.getSize()[1]) / 2);

	window.setPosition(newX, newY);
};
