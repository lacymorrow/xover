/**
 * Where Settings opens so it does not sit on a crosshair (LAC-6155).
 *
 * Pure: rects in, rect out, no Electron, so Jest can drive it.
 */

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface PlacementDisplay {
	id: number;
	workArea: Rect;
}

export interface PlacementInput {
	/** Current Settings size. It is never changed, only moved. */
	size: { width: number; height: number };
	/** Last position Settings was left at, if any. */
	saved?: { x: number; y: number };
	/** Bounds of every live crosshair window. */
	crosshairs: Rect[];
	/** The crosshair Settings should open next to. Defaults to the first. */
	main?: Rect;
	/** Display tried first. Defaults to the one holding `main`. */
	preferredDisplayId?: number;
	displays: PlacementDisplay[];
	/** Gap kept around every crosshair. */
	margin?: number;
}

export const SETTINGS_MARGIN = 16;

const overlapArea = (a: Rect, b: Rect): number => {
	const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
	const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
	return w > 0 && h > 0 ? w * h : 0;
};

const inflate = (r: Rect, by: number): Rect => ({
	x: r.x - by,
	y: r.y - by,
	width: r.width + by * 2,
	height: r.height + by * 2,
});

const contains = (outer: Rect, inner: Rect): boolean =>
	inner.x >= outer.x &&
	inner.y >= outer.y &&
	inner.x + inner.width <= outer.x + outer.width &&
	inner.y + inner.height <= outer.y + outer.height;

const clamp = (v: number, lo: number, hi: number): number =>
	Math.max(lo, Math.min(v, Math.max(lo, hi)));

const center = (r: Rect) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 });

const hasPoint = (r: Rect, p: { x: number; y: number }): boolean =>
	p.x >= r.x && p.x < r.x + r.width && p.y >= r.y && p.y < r.y + r.height;

const idealCandidates = (
	size: PlacementInput['size'],
	main: Rect | undefined,
	area: Rect,
	gap: number,
): Array<{ x: number; y: number }> => {
	const { width, height } = size;
	const out: Array<{ x: number; y: number }> = [];

	if (main) {
		const c = center(main);
		const cx = c.x - width / 2;
		const cy = c.y - height / 2;
		out.push(
			{ x: main.x + main.width + gap, y: cy }, // right
			{ x: main.x - gap - width, y: cy }, // left
			{ x: cx, y: main.y + main.height + gap }, // below
			{ x: cx, y: main.y - gap - height }, // above
		);
	}

	const right = area.x + area.width - width;
	const bottom = area.y + area.height - height;
	out.push(
		{ x: area.x, y: area.y },
		{ x: right, y: area.y },
		{ x: area.x, y: bottom },
		{ x: right, y: bottom },
	);

	return out;
};

export const placeSettings = (input: PlacementInput): Rect => {
	const { size, saved, crosshairs, displays } = input;
	const margin = input.margin ?? SETTINGS_MARGIN;
	const main = input.main ?? crosshairs[0];
	const obstacles = crosshairs.map((r) => inflate(r, margin));
	const at = (p: { x: number; y: number }): Rect => ({ ...p, ...size });
	const isClear = (r: Rect) => obstacles.every((o) => overlapArea(r, o) === 0);

	// Displays in the order they are tried: preferred, then the rest.
	const mainCenter = main ? center(main) : undefined;
	const preferred =
		displays.find((d) => d.id === input.preferredDisplayId) ??
		displays.find((d) => mainCenter && hasPoint(d.workArea, mainCenter)) ??
		displays[0];
	const ordered = preferred
		? [preferred, ...displays.filter((d) => d !== preferred)]
		: displays;

	// 1. The last saved position, if it still fits a display and covers nothing.
	if (saved) {
		const r = at(saved);
		if (ordered.some((d) => contains(d.workArea, r)) && isClear(r)) {
			return r;
		}
	}

	// 2. Each display in turn: beside the main crosshair, then the corners.
	const all = ordered.flatMap((d) =>
		idealCandidates(size, main, d.workArea, margin).map((p) =>
			at({
				x: clamp(
					p.x,
					d.workArea.x,
					d.workArea.x + d.workArea.width - size.width,
				),
				y: clamp(
					p.y,
					d.workArea.y,
					d.workArea.y + d.workArea.height - size.height,
				),
			}),
		),
	);
	const clear = all.find(isClear);
	if (clear) {
		return clear;
	}

	// 3. Nothing is clear. Least overlap wins, and never over the main center.
	const score = (r: Rect) =>
		crosshairs.reduce((sum, c) => sum + overlapArea(r, c), 0);
	const safe = all.filter((r) => !mainCenter || !hasPoint(r, mainCenter));
	const pool = safe.length > 0 ? safe : all;
	if (pool.length === 0) {
		return at(saved ?? { x: 0, y: 0 });
	}

	return pool.reduce((best, r) => (score(r) < score(best) ? r : best));
};
