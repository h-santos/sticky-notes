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

// Moves rect the minimum distance needed to keep it fully inside bounds
export function clampRectPosition(rect: Rect, bounds: Size): Rect {
  return {
    ...rect,
    x: clamp(rect.x, 0, Math.max(0, bounds.width - rect.width)),
    y: clamp(rect.y, 0, Math.max(0, bounds.height - rect.height)),
  };
}
