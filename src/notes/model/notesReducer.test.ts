import { initialNotesState, notesReducer, type NotesAction, type NotesState } from './notesReducer';
import type { NoteId } from './types';

const id = (value: string) => value as NoteId;

const state: NotesState = {
  notes: [
    { id: id('a'), x: 10, y: 20, width: 150, height: 120, text: '', color: 'yellow', z: 1 },
    { id: id('b'), x: 50, y: 60, width: 150, height: 120, text: '', color: 'pink', z: 2 },
  ],
};

describe('notesReducer', () => {
  it('creates a note on top of existing ones', () => {
    const create = (noteId: string): NotesAction => ({
      type: 'create',
      id: id(noteId),
      position: { x: 10, y: 20 },
      size: { width: 150, height: 120 },
      color: 'yellow',
    });

    const next = [create('a'), create('b')].reduce(notesReducer, initialNotesState);

    expect(next.notes).toHaveLength(2);
    expect(next.notes[1]).toMatchObject({ id: 'b', x: 10, y: 20, width: 150, height: 120, z: 2 });
  });

  it('moves a note', () => {
    const next = notesReducer(state, { type: 'move', id: id('a'), position: { x: 300, y: 200 } });

    expect(next.notes[0]).toMatchObject({ x: 300, y: 200, width: 150, height: 120 });
    expect(next.notes[1]).toBe(state.notes[1]);
  });

  it('resizes a note', () => {
    const next = notesReducer(state, {
      type: 'resize',
      id: id('a'),
      size: { width: 90, height: 80 },
    });

    expect(next.notes[0]).toMatchObject({ x: 10, y: 20, width: 90, height: 80 });
    expect(next.notes[1]).toBe(state.notes[1]);
  });

  it('removes a note', () => {
    const next = notesReducer(state, { type: 'remove', id: id('a') });

    expect(next.notes.map((note) => note.id)).toEqual(['b']);
  });

  it('brings a note to the front', () => {
    const next = notesReducer(state, { type: 'bringToFront', id: id('a') });

    expect(next.notes[0]?.z).toBe(3);
    expect(next.notes[1]).toBe(state.notes[1]);
  });

  it('edits the text of a note', () => {
    const next = notesReducer(state, { type: 'editText', id: id('a'), text: 'Feed the cats' });

    expect(next.notes[0]?.text).toBe('Feed the cats');
    expect(next.notes[1]).toBe(state.notes[1]);
  });

  it('returns the same state when nothing changes', () => {
    expect(notesReducer(state, { type: 'editText', id: id('a'), text: '' })).toBe(state);
    expect(notesReducer(state, { type: 'remove', id: id('missing') })).toBe(state);
    expect(notesReducer(state, { type: 'bringToFront', id: id('b') })).toBe(state);
    expect(notesReducer(state, { type: 'move', id: id('b'), position: { x: 50, y: 60 } })).toBe(
      state,
    );
    expect(notesReducer(state, { type: 'move', id: id('missing'), position: { x: 0, y: 0 } })).toBe(
      state,
    );
    expect(
      notesReducer(state, { type: 'resize', id: id('b'), size: { width: 150, height: 120 } }),
    ).toBe(state);
  });
});
