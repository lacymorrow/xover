#!/bin/zsh
# LAC-5725 upgrade path: a user whose config.json still carries showDockIcon.
# electron-store validates settings against a schema that no longer declares the
# key, so this proves the app still boots and the stale value cannot put the
# dock icon back.
set -e
dir="/tmp/lac5973-probe"
tree="/tmp/lac5973-app"
src="/tmp/lac5973-userdata-dockless"
userdata="/tmp/lac5725-userdata-upgrade"

rm -rf "$userdata"
cp -R "$src" "$userdata"
/usr/bin/python3 -I -c '
import json, sys
p = sys.argv[1]
d = json.load(open(p))
d["settings"]["showDockIcon"] = True
json.dump(d, open(p, "w"), indent=2)
print("seeded stale showDockIcon:", d["settings"]["showDockIcon"])
' "$userdata/config.json"

cd "$tree"
echo "--- $(git log --oneline -1)"
./node_modules/.bin/electron release/app --user-data-dir="$userdata" \
	> "$dir/app-upgrade.log" 2>&1 &
job=$!
sleep 12

osascript -l JavaScript "$dir/winlist.js" > "$dir/winlist-upgrade.json"
pid=$(/usr/bin/python3 -I -c '
import json, sys
rows = json.load(open(sys.argv[1]))
hit = [r for r in rows if r.get("owner") in ("CrossOver", "Electron") and r["layer"] > 100]
print(hit[0]["pid"] if hit else "")
' "$dir/winlist-upgrade.json")

if [[ -z "$pid" ]]; then
	echo "FAIL: app did not put a crosshair on screen (boot broken by the stale key?)"
	tail -20 "$dir/app-upgrade.log"
	kill $job 2>/dev/null || true
	exit 1
fi

echo "--- crosshair on screen, app process $pid"
echo "--- activation policy (0 regular/dock icon, 1 accessory/hidden)"
osascript -l JavaScript "$dir/policy.js" "$pid"
echo "--- stale key still in the store after boot?"
/usr/bin/python3 -I -c '
import json, sys
d = json.load(open(sys.argv[1]))
print("showDockIcon present:", "showDockIcon" in d["settings"])
' "$userdata/config.json"
kill $job 2>/dev/null || true
