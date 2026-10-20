import { KeyboardShortcut } from '../types/keyboard';

export interface KeybindAppState {
	/** The "disable all keybinds" master switch */
	allDisabled: boolean;
	isLocked: boolean;
	isHidden: boolean;
}

/**
 * Should this shortcut be registered right now?
 *
 * Pure on purpose: the master switch (v3 #299) is easy to get subtly wrong, and
 * getting it wrong strands a user with a locked crosshair and no way back.
 *
 * Rules, in order:
 *  - the master switch turns everything off except safety actions (Lock, Reset)
 *  - a shortcut with no accelerator is unbound
 *  - `ignoreWhenLocked` shortcuts are off while locked or hidden, since they
 *    move or spawn windows the user cannot see or drag
 */
export const shouldRegisterKeybind = (
	shortcut: Pick<
		KeyboardShortcut,
		'action' | 'isSafety' | 'ignoreWhenLocked'
	> & { action?: string },
	keybind: string | undefined,
	{ allDisabled, isLocked, isHidden }: KeybindAppState,
): boolean => {
	if (allDisabled && !shortcut.isSafety) {
		return false;
	}

	if (!shortcut.action || !keybind) {
		return false;
	}

	if ((isLocked || isHidden) && shortcut.ignoreWhenLocked) {
		return false;
	}

	return true;
};
