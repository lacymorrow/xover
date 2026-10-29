"""Joins the probe's window ids against the on-screen lists.

argv: ids.json fullscreen-list.json desktop-list.json

A window on neither list was never shown, which is a harness fault rather than
an answer about fullscreen Spaces.
"""
import json
import sys

ids = json.load(open(sys.argv[1]))
full = {int(r["id"]) for r in json.load(open(sys.argv[2]))}
desk = {int(r["id"]) for r in json.load(open(sys.argv[3]))}

print(f"mode={ids['mode']} pid={ids['pid']}")
for win in ids["windows"]:
    wid = int(win["id"])
    if wid not in desk and wid not in full:
        verdict = "NEVER SHOWN (harness fault)"
    elif wid in full:
        verdict = "FLOATS over the fullscreen Space"
    else:
        verdict = "desktop only: does NOT float"
    print(
        f"  {win['label']:<26} dockVisibleAtCreate={str(win['dockVisible']):<5} "
        f"isVisible={str(win.get('isVisible')):<5} {verdict}"
    )
