export type NoteId = string & { readonly __brand: 'NoteId' };

export const NOTE_COLORS = ['yellow', 'pink', 'blue', 'green'] as const;
export type NoteColor = (typeof NOTE_COLORS)[number];

export interface Note {
  id: NoteId;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: NoteColor;
  /** Stacking order; higher values render on top. */
  z: number;
}
