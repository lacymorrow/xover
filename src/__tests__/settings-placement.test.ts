/**
 * @jest-environment node
 *
 * Settings opens beside the crosshairs, never over them (LAC-6155).
 */
import {
	PlacementDisplay,
	Rect,
	placeSettings,
} from '../main/utils/settings-placement';

const hd: PlacementDisplay = {
	id: 1,
	workArea: { x: 0, y: 0, width: 1920, height: 1080 },
};
const second: PlacementDisplay = {
	id: 2,
	workArea: { x: 1920, y: 0, width: 1920, height: 1080 },
};
const size = { width: 800, height: 600 };

const crosshairAt = (cx: number, cy: number, s = 100): Rect => ({
	x: cx - s / 2,
	y: cy - s / 2,
	width: s,
	height: s,
});

const hits = (a: Rect, b: Rect) =>
	a.x < b.x + b.width &&
	b.x < a.x + a.width &&
	a.y < b.y + b.height &&
	b.y < a.y + a.height;

const inside = (r: Rect, area: Rect) =>
	r.x >= area.x &&
	r.y >= area.y &&
	r.x + r.width <= area.x + area.width &&
	r.y + r.height <= area.y + area.height;

describe('placeSettings', () => {
	it('keeps the saved position when it is clear', () => {
		const c = crosshairAt(960, 540);
		const r = placeSettings({
			size,
			saved: { x: 50, y: 50 },
			crosshairs: [c],
			displays: [hd],
		});
		expect(r).toEqual({ x: 50, y: 50, ...size });
	});

	it('moves off a saved position that covers the crosshair', () => {
		const c = crosshairAt(960, 540);
		const r = placeSettings({
			size,
			saved: { x: 560, y: 240 },
			crosshairs: [c],
			displays: [hd],
		});
		expect(hits(r, c)).toBe(false);
		expect(inside(r, hd.workArea)).toBe(true);
	});

	it('puts Settings to the right of a crosshair centered on 1080p', () => {
		const c = crosshairAt(960, 540);
		const r = placeSettings({ size, crosshairs: [c], displays: [hd] });
		expect(r.x).toBeGreaterThanOrEqual(c.x + c.width);
		expect(r.y).toBe(540 - 300);
		expect(hits(r, c)).toBe(false);
	});

	it.each([
		['left edge', 60, 540],
		['right edge', 1860, 540],
		['top edge', 960, 60],
		['bottom edge', 960, 1020],
		['top-left corner', 60, 60],
		['bottom-right corner', 1860, 1020],
	])('stays clear of a crosshair near the %s', (_name, x, y) => {
		const c = crosshairAt(x, y);
		const r = placeSettings({ size, crosshairs: [c], displays: [hd] });
		expect(hits(r, c)).toBe(false);
		expect(inside(r, hd.workArea)).toBe(true);
	});

	it('clears two crosshairs at once', () => {
		const a = crosshairAt(700, 150);
		const b = crosshairAt(1220, 150);
		const r = placeSettings({
			size,
			main: a,
			crosshairs: [a, b],
			displays: [hd],
		});
		expect(hits(r, a)).toBe(false);
		expect(hits(r, b)).toBe(false);
	});

	it('opens on the display of the main crosshair', () => {
		const c = crosshairAt(2880, 540);
		const r = placeSettings({
			size,
			crosshairs: [c],
			displays: [hd, second],
		});
		expect(inside(r, second.workArea)).toBe(true);
		expect(hits(r, c)).toBe(false);
	});

	it('falls to another display when the first has no room', () => {
		const tiny: PlacementDisplay = {
			id: 1,
			workArea: { x: 0, y: 0, width: 900, height: 700 },
		};
		const c = crosshairAt(450, 350, 300);
		const r = placeSettings({
			size,
			crosshairs: [c],
			displays: [tiny, second],
		});
		expect(inside(r, second.workArea)).toBe(true);
	});

	it('minimises overlap and spares the main center when nothing fits', () => {
		const tiny: PlacementDisplay = {
			id: 1,
			workArea: { x: 0, y: 0, width: 1000, height: 700 },
		};
		const c = crosshairAt(500, 350, 300);
		const r = placeSettings({
			size: { width: 400, height: 400 },
			crosshairs: [c],
			displays: [tiny],
		});
		const centerPt = { x: 500, y: 350 };
		const covers =
			centerPt.x >= r.x &&
			centerPt.x < r.x + r.width &&
			centerPt.y >= r.y &&
			centerPt.y < r.y + r.height;
		expect(covers).toBe(false);
		expect(inside(r, tiny.workArea)).toBe(true);
	});

	it('uses a corner when there is no crosshair at all', () => {
		const r = placeSettings({ size, crosshairs: [], displays: [hd] });
		expect(inside(r, hd.workArea)).toBe(true);
	});
});
