# Sound clips for #69 (LAC-6154)

Every clip is rendered at the volume the app actually plays sounds at
(`VOLUME = 0.15`), not normalized, so the before/after difference you hear is
the difference a person hears. Turn your output up to a normal level and leave
it there across clips.

- `before-set.mp4` / `after-set.mp4` — the whole set back to back. Before:
  startup, lock, unlock, center (DONE), update, reset, notification. After:
  lock, unlock, center, notification, hero.
- `before-lock.mp4` vs `after-lock.mp4` — the point of the change. The lock
  click went from -37.8 to -19.5 dBFS peak, 18.3 dB louder, and is now the same
  loudness as everything else instead of 16 dB under it.
- `before-unlock.mp4` vs `after-unlock.mp4` — same, and now matched to lock.
- `before-center-done.mp4` vs `after-center.mp4` — 1.14s celebration replaced by
  a 0.25s move cue.
- `before-notification.mp4` vs `after-notification.mp4` — 1.60s chime replaced by
  the 0.82s one.
- `after-hero.mp4` — reserve, no call site.
- `before-startup.mp4`, `before-update.mp4`, `before-reset.mp4` — cut. The 3.16s
  ambient on launch, the 1.90s high-intensity alert on a background update
  check, and an error tone for pressing Reset on purpose.
