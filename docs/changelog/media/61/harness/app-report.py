"""Did CrossOver's crosshair window stay on screen over the fullscreen Space?

argv: label fullscreen-list.json desktop-list.json

The crosshair sits at the screen-saver window level, so it is the only
CrossOver window above layer 100. kCGWindowName needs Screen Recording
permission, which graphite does not have, so the owner name and the layer are
what identify it.
"""
import json
import sys

label = sys.argv[1]


def crosshairs(path):
    rows = json.load(open(path))
    return [
        r
        for r in rows
        if r.get("owner") in ("CrossOver", "Electron") and r["layer"] > 100
    ]


full = crosshairs(sys.argv[2])
desk = crosshairs(sys.argv[3])

print(f"{label}:")
print(f"  desktop Space:    {len(desk)} crosshair window(s) {[(r['id'], r['layer']) for r in desk]}")
print(f"  fullscreen Space: {len(full)} crosshair window(s) {[(r['id'], r['layer']) for r in full]}")

if not desk:
    print("  VERDICT: inconclusive, the app showed no crosshair window at all")
elif full:
    print("  VERDICT: the crosshair DRAWS over the fullscreen Space")
else:
    print("  VERDICT: the crosshair is GONE on the fullscreen Space")
