export interface CustomAcceleratorsType {
	quit?: string;
	reset?: string;
	moveUp?: string;
	moveDown?: string;
	moveLeft?: string;
	moveRight?: string;
	duplicate?: string;
	lock?: string;
	hide?: string;
	center?: string;
	changeDisplay?: string;
	nextWindow?: string;
}

export interface KeyboardShortcut {
	action: keyof CustomAcceleratorsType;
	fn: () => void;
}
