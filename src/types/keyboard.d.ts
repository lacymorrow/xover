export interface CustomAcceleratorsType {
	lock?: string;
	hide?: string;
	center?: string;
	quit?: string;
	reset?: string;
	moveUp?: string;
	moveDown?: string;
	moveLeft?: string;
	moveRight?: string;
	newWindow?: string;
	duplicateWindow?: string;
	changeDisplay?: string;
	focusNextWindow?: string;
	closeAll?: string;
}

export interface KeyboardShortcut {
	action: keyof CustomAcceleratorsType;
	fn: () => void;
	ignoreWhenLocked?: boolean;
	allowUnbind?: boolean;
}
