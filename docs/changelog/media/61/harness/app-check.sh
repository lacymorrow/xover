#!/bin/zsh
# LAC-5973 item 1, end to end: does the real v4 app draw its crosshair over a
# native macOS fullscreen Space? Usage: app-check.sh <branch> <label>
set -e
branch="$1"
label="$2"
dir="/tmp/lac5973-probe"
tree="/tmp/lac5973-app"
userdata="/tmp/lac5973-userdata-$label"

cd "$HOME/repo/xover"
git fetch --quiet origin
if [[ ! -d "$tree" ]]; then
	git worktree add --force "$tree" "origin/$branch"
	ln -sfn "$HOME/repo/xover/node_modules" "$tree/node_modules"
	ln -sfn "$HOME/repo/xover/release/app/node_modules" "$tree/release/app/node_modules"
	ln -sfn "$HOME/repo/xover/release/app/node_modules" "$tree/src/node_modules"
fi

cd "$tree"
git checkout --quiet --detach "origin/$branch"
echo "--- $label: $(git log --oneline -1)"

echo "--- building main + renderer"
npm run build > "$dir/build-$label.log" 2>&1 || { tail -30 "$dir/build-$label.log"; exit 1; }

rm -rf "$userdata"
echo "--- launching the app"
./node_modules/.bin/electron release/app --user-data-dir="$userdata" \
	> "$dir/app-$label.log" 2>&1 &
app=$!
sleep 12

echo "--- putting Safari into a native fullscreen Space"
osascript -l JavaScript "$dir/fullscreen.js" on
sleep 4

echo "--- on-screen window list while the fullscreen Space is active"
osascript -l JavaScript "$dir/winlist.js" > "$dir/app-winlist-$label.json"

echo "--- leaving fullscreen"
osascript -l JavaScript "$dir/fullscreen.js" off || true
sleep 4
osascript -l JavaScript "$dir/winlist.js" > "$dir/app-winlist-$label-desktop.json"

kill $app 2>/dev/null || true
sleep 2
pkill -f "lac5973-userdata-$label" 2>/dev/null || true

/usr/bin/python3 -I "$dir/app-report.py" "$label" \
	"$dir/app-winlist-$label.json" "$dir/app-winlist-$label-desktop.json"
