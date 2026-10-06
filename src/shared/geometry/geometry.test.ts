import { clamp, clampRectPosition } from './geometry';

describe('clamp', () => {
  it('keeps values inside the range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(5, 0, 10)).toBe(5);
  });
});

describe('clampRectPosition', () => {
  it('pulls a rectangle back inside the bounds', () => {
    const rect = { x: 950, y: -20, width: 100, height: 100 };
    expect(clampRectPosition(rect, { width: 1000, height: 800 })).toMatchObject({ x: 900, y: 0 });
  });
});
