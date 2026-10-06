import type { Point } from '../../shared/geometry/geometry';
import type { Note, NoteId } from './types';

export interface NotesState {
  notes: readonly Note[];
}

export type NotesAction = { type: 'move'; id: NoteId; position: Point };

/**
 * Updates a single note. Returns the original state object when the
 * note does not exist or nothing changed to skip re-rendering.
 */
function updateNote(
  state: NotesState,
  id: NoteId,
  update: (note: Note) => Partial<Note>,
): NotesState {
  let changed = false;
  const notes = state.notes.map((note) => {
    if (note.id !== id) return note;
    const patch = update(note);
    const keys = Object.keys(patch) as (keyof Note)[];
    if (keys.every((key) => patch[key] === note[key])) return note;
    changed = true;
    return { ...note, ...patch };
  });
  return changed ? { notes } : state;
}

export function notesReducer(state: NotesState, action: NotesAction): NotesState {
  switch (action.type) {
    case 'move':
      return updateNote(state, action.id, () => ({ x: action.position.x, y: action.position.y }));
  }
}
