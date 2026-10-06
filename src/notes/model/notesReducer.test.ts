import { notesReducer, type NotesState } from './notesReducer';
import type { NoteId } from './types';

const id = (value: string) => value as NoteId;

const state: NotesState = {
  notes: [
    { id: id('a'), x: 10, y: 20, width: 150, height: 120, text: '', color: 'yellow', z: 1 },
    { id: id('b'), x: 50, y: 60, width: 150, height: 120, text: '', color: 'pink', z: 2 },
  ],
};

describe('notesReducer', () => {
  it('moves a note', () => {
    const next = notesReducer(state, { type: 'move', id: id('a'), position: { x: 300, y: 200 } });

    expect(next.notes[0]).toMatchObject({ x: 300, y: 200, width: 150, height: 120 });
    expect(next.notes[1]).toBe(state.notes[1]);
  });

  it('returns the same state when nothing changes', () => {
    expect(notesReducer(state, { type: 'move', id: id('b'), position: { x: 50, y: 60 } })).toBe(
      state,
    );
    expect(notesReducer(state, { type: 'move', id: id('missing'), position: { x: 0, y: 0 } })).toBe(
      state,
    );
  });
});
