export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Point, Size {}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function containsPoint(rect: Rect, point: Point): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

// Normalised rectangle spanned by two corners, whichever order they come in
export function rectFromPoints(a: Point, b: Point): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

// Moves rect the minimum distance needed to keep it fully inside bounds
export function clampRectPosition(rect: Rect, bounds: Size): Rect {
  return {
    ...rect,
    x: clamp(rect.x, 0, Math.max(0, bounds.width - rect.width)),
    y: clamp(rect.y, 0, Math.max(0, bounds.height - rect.height)),
  };
}
