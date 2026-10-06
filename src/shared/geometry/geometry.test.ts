import { clamp, clampRectPosition, containsPoint, rectFromPoints } from './geometry';

describe('clamp', () => {
  it('keeps values inside the range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(5, 0, 10)).toBe(5);
  });
});

describe('containsPoint', () => {
  it('includes the edges', () => {
    const rect = { x: 0, y: 0, width: 10, height: 10 };
    expect(containsPoint(rect, { x: 10, y: 10 })).toBe(true);
    expect(containsPoint(rect, { x: 11, y: 5 })).toBe(false);
  });
});

describe('rectFromPoints', () => {
  it('normalises corners dragged up and to the left', () => {
    expect(rectFromPoints({ x: 50, y: 40 }, { x: 10, y: 20 })).toEqual({
      x: 10,
      y: 20,
      width: 40,
      height: 20,
    });
  });
});

describe('clampRectPosition', () => {
  it('pulls a rectangle back inside the bounds', () => {
    const rect = { x: 950, y: -20, width: 100, height: 100 };
    expect(clampRectPosition(rect, { width: 1000, height: 800 })).toMatchObject({ x: 900, y: 0 });
  });
});
