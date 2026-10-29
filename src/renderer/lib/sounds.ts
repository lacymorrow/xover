import { VOLUME } from '@/config/config';

/* Cache of Audio elements, for instant playback */
const cache: Record<string, HTMLAudioElement> = {};

/**
 * Every sound CrossOver can play. The set is deliberately small (LAC-6154):
 * the app sits over a game, so a sound has to confirm something the person did
 * blind with a hotkey, or tell them something they have to act on. Anything
 * they can already see on screen stays silent.
 *
 * The shipped files are peak-normalized to -3 dBFS so one VOLUME applies to
 * all of them and the short lock click is as audible as the longer chimes. The
 * rest of the sound pack is kept in src/static/sounds, which is not bundled.
 */
export const sounds: Record<string, { url: string; volume: number }> = {
	// Lock and unlock are the reason sound exists here: a hotkey press with no
	// visible change to the crosshair.
	LOCK: {
		url: 'ui-sounds/primary-system/ui_lock.wav',
		volume: VOLUME,
	},
	UNLOCK: {
		url: 'ui-sounds/primary-system/ui_unlock.wav',
		volume: VOLUME,
	},
	// Center can also be a hotkey, and the crosshair may be off on another
	// display where the move isn't visible. v3 played a cue here too.
	CENTER: {
		url: 'ui-sounds/primary-system/navigation_forward-selection-minimal.wav',
		volume: VOLUME,
	},
	// Something to act on: an update is waiting. Also the test sound.
	NOTIFICATION: {
		url: 'ui-sounds/alerts/notification_simple-01.wav',
		volume: VOLUME,
	},
	// Reserved. No call site yet, kept so a celebration has a sound when one
	// is earned.
	HERO: {
		url: 'ui-sounds/heros/hero_decorative-celebration-01.wav',
		volume: VOLUME,
	},
};

export const preload = (basepath = '') => {
	console.warn(`Preloading sounds from ${basepath}`);

	let audio: HTMLAudioElement | undefined;
	Object.keys(sounds).forEach((name) => {
		if (!cache[name]) {
			cache[name] = new window.Audio();

			const sound = sounds[name];
			audio = cache[name];
			audio.volume = sound.volume;
			audio.src = `file://${basepath}${sound.url}`; // this requires web security to be disabled
		}
	});

	return audio;
};

export const play = ({ name, path }: { name: string; path: string }) => {
	const sound = name.toUpperCase();
	console.info(`Playing sound: ${name}, path: ${path}`);

	let audio: HTMLAudioElement | undefined = cache[sound];
	if (!audio) {
		preload(path);
		audio = cache[sound];
	}

	if (audio) {
		audio.currentTime = 0;
		audio.play().catch(console.error);
	}
};
