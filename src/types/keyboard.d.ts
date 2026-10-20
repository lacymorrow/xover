export interface CustomAcceleratorsType {
	lock?: string;
	hide?: string;
	hideReticle?: string;
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
	/**
	 * Survives the "disable all keybinds" master switch. Lock and Reset carry
	 * this so a locked crosshair can never be stranded with no way back.
	 */
	isSafety?: boolean;
}
