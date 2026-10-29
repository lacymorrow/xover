# Sound library (not bundled)

The full UI sound pack. Nothing in the app reads this folder: `electron-builder`
ships `assets/**` only (see `build.extraResources` in package.json), and the
renderer loads sounds from `assets/sounds` via `rendererPaths.sounds`.

`assets/sounds` holds only the sounds CrossOver actually plays, so the download
doesn't carry 19 MB of audio nobody hears (LAC-6154). This folder is where the
unused options live until one earns a call site.

## Promoting a sound

1. Copy the file into the matching `assets/sounds/ui-sounds/<group>/` folder.
2. Level-match it to the rest of the shipped set: mean around -22 dBFS, peak no
   higher than -3 dBFS.

   ```sh
   # read the current peak, then apply the difference
   ffmpeg -i <file> -af volumedetect -f null /dev/null
   ffmpeg -i <file> -af volume=<+N>dB -c:a pcm_s24le -ar 48000 -ac 2 <out>
   ```

3. Map it in `src/renderer/lib/sounds.ts` and give it a call site. Keep it short
   (under ~300ms for anything that can fire mid-game) and only for something the
   person can't already see.

`src/__tests__/sound-design.test.ts` checks that every mapped sound ships, that
nothing plays an unmapped name, and that `assets/sounds` carries no dead weight.
