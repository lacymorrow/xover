/**
 * @jest-environment node
 *
 * Regressions for the user-facing v3 features ported in LAC-5182.
 */
import { shouldRegisterKeybind } from '../utils/keybinds';

const state = (
	over: Partial<Parameters<typeof shouldRegisterKeybind>[2]> = {},
) => ({
	allDisabled: false,
	isLocked: false,
	isHidden: false,
	...over,
});

// The switch already existed and its label already said "disable all keyboard
// shortcuts", but the old code only honoured it while the app was locked. These
// pin the v3 #299 contract: off by default, everything off when on, Lock and
// Reset always survive so a locked crosshair is never stranded.
describe('disable-all-keybinds master switch', () => {
	const lock = { action: 'lock', isSafety: true } as const;
	const reset = { action: 'reset', isSafety: true } as const;
	const hide = { action: 'hide' } as const;
	const center = { action: 'center', ignoreWhenLocked: true } as const;

	it('registers everything when the switch is off', () => {
		[lock, reset, hide].forEach((shortcut) => {
			expect(
				shouldRegisterKeybind(shortcut, 'Control+Shift+Alt+X', state()),
			).toBe(true);
		});
	});

	it('drops ordinary keybinds when the switch is on, unlocked', () => {
		expect(
			shouldRegisterKeybind(
				hide,
				'Control+Shift+Alt+H',
				state({ allDisabled: true }),
			),
		).toBe(false);
	});

	// The bug: the old implementation gated the switch behind isLocked, so an
	// unlocked app ignored it entirely and the label was not telling the truth.
	it('applies when unlocked, not only when locked', () => {
		const unlocked = shouldRegisterKeybind(
			hide,
			'Control+Shift+Alt+H',
			state({ allDisabled: true, isLocked: false }),
		);
		const locked = shouldRegisterKeybind(
			hide,
			'Control+Shift+Alt+H',
			state({ allDisabled: true, isLocked: true }),
		);

		expect(unlocked).toBe(false);
		expect(locked).toBe(false);
	});

	it('keeps Lock and Reset alive so the app is never stranded', () => {
		[lock, reset].forEach((shortcut) => {
			expect(
				shouldRegisterKeybind(
					shortcut,
					'Control+Shift+Alt+X',
					state({ allDisabled: true, isLocked: true }),
				),
			).toBe(true);
		});
	});

	it('still treats a cleared keybind as unbound', () => {
		expect(shouldRegisterKeybind(lock, '', state())).toBe(false);
		expect(shouldRegisterKeybind(lock, undefined, state())).toBe(false);
	});

	it('leaves the locked/hidden rule intact', () => {
		expect(
			shouldRegisterKeybind(
				center,
				'Control+Shift+Alt+C',
				state({ isLocked: true }),
			),
		).toBe(false);
		expect(
			shouldRegisterKeybind(
				center,
				'Control+Shift+Alt+C',
				state({ isHidden: true }),
			),
		).toBe(false);
		expect(shouldRegisterKeybind(center, 'Control+Shift+Alt+C', state())).toBe(
			true,
		);
	});
});
