#!/bin/zsh
# LAC-5973 item 1 probe. Usage: run-probe.sh <baseline|restore>
set -e
mode="$1"
dir="$(cd "$(dirname "$0")" && pwd)"
electron="$HOME/repo/xover/node_modules/.bin/electron"
ids="$dir/ids-$mode.json"
rm -f "$ids"

echo "--- probe $mode: launching electron"
"$electron" "$dir/dock-probe.js" --mode="$mode" --out="$ids" --delay=14000 --life=60000 \
	> "$dir/probe-$mode.log" 2>&1 &
probe=$!
sleep 4

echo "--- putting Safari into a native fullscreen Space"
osascript -l JavaScript "$dir/fullscreen.js" on

echo "--- waiting for the probe to create its windows"
for i in {1..30}; do
	[[ -f "$ids" ]] && break
	sleep 1
done
[[ -f "$ids" ]] || { echo "probe never wrote $ids"; cat "$dir/probe-$mode.log"; exit 1; }

probe_pid=$(/usr/bin/python3 -I -c "import json,sys;print(json.load(open(sys.argv[1]))['pid'])" "$ids")

echo "--- on-screen window list while the fullscreen Space is active"
osascript -l JavaScript "$dir/winlist.js" > "$dir/winlist-$mode.json"

echo "--- activation policy of the probe process (0 regular, 1 accessory)"
osascript -l JavaScript "$dir/policy.js" "$probe_pid"

echo "--- leaving fullscreen"
osascript -l JavaScript "$dir/fullscreen.js" off || true
sleep 4

# Control read. A window missing from both lists was never on screen at all,
# which is a harness bug and not an answer about Spaces.
echo "--- on-screen window list back on the desktop Space"
osascript -l JavaScript "$dir/winlist.js" > "$dir/winlist-$mode-desktop.json"

kill $probe 2>/dev/null || true

/usr/bin/python3 -I "$dir/report.py" "$ids" "$dir/winlist-$mode.json" "$dir/winlist-$mode-desktop.json"
