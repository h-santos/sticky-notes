import type { KeyboardEvent } from 'react';
import type { Point } from '../../shared/geometry/geometry';

const STEP = 10;
const LARGE_STEP = 50;

/** Translates an arrow key press into a delta (Shift for larger steps), or null for other keys. */
export function arrowKeyDelta(event: KeyboardEvent): Point | null {
  const step = event.shiftKey ? LARGE_STEP : STEP;
  switch (event.key) {
    case 'ArrowLeft':
      return { x: -step, y: 0 };
    case 'ArrowRight':
      return { x: step, y: 0 };
    case 'ArrowUp':
      return { x: 0, y: -step };
    case 'ArrowDown':
      return { x: 0, y: step };
    default:
      return null;
  }
}

export const isDeleteKey = (event: KeyboardEvent) =>
  event.key === 'Delete' || event.key === 'Backspace';
