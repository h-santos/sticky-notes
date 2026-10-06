import type { Rect } from '../../shared/geometry/geometry';

export type NoteId = string & { readonly __brand: 'NoteId' };

export const NOTE_COLORS = ['yellow', 'pink', 'blue', 'green'] as const;
export type NoteColor = (typeof NOTE_COLORS)[number];

export interface Note extends Rect {
  id: NoteId;
  text: string;
  color: NoteColor;
  /** Stacking order; higher values render on top. */
  z: number;
}

export const MIN_NOTE_SIZE = { width: 80, height: 60 } as const;
