#!/bin/zsh
# Does the fix cost a macOS user their dock icon? showDockIcon defaults to true,
# so the app must end up as a regular app (activation policy 0) even though the
# crosshair window was created while the process was a UIElement.
#
# The pid comes from the window list, not from the shell job: `electron <dir>`
# is a launcher and the app runs as a child of it.
set -e
dir="/tmp/lac5973-probe"
tree="/tmp/lac5973-app"
userdata="/tmp/lac5973-userdata-dock"

cd "$tree"
echo "--- $(git log --oneline -1)"
rm -rf "$userdata"
./node_modules/.bin/electron release/app --user-data-dir="$userdata" \
	> "$dir/app-dock.log" 2>&1 &
job=$!
sleep 12

osascript -l JavaScript "$dir/winlist.js" > "$dir/winlist-dock.json"
pid=$(/usr/bin/python3 -I -c '
import json, sys
rows = json.load(open(sys.argv[1]))
hit = [r for r in rows if r.get("owner") in ("CrossOver", "Electron") and r["layer"] > 100]
print(hit[0]["pid"] if hit else "")
' "$dir/winlist-dock.json")

if [[ -z "$pid" ]]; then
	echo "no crosshair window on screen, nothing to read"
	kill $job 2>/dev/null || true
	exit 1
fi

echo "--- activation policy of the app process $pid (0 regular/dock icon, 1 accessory/hidden)"
osascript -l JavaScript "$dir/policy.js" "$pid"
kill $job 2>/dev/null || true
