import type { Point, Size } from '../../shared/geometry/geometry';
import type { Note, NoteColor, NoteId } from './types';

export interface NotesState {
  notes: readonly Note[];
}

export type NotesAction =
  | { type: 'create'; id: NoteId; position: Point; size: Size; color: NoteColor }
  | { type: 'move'; id: NoteId; position: Point }
  | { type: 'resize'; id: NoteId; size: Size }
  | { type: 'remove'; id: NoteId }
  | { type: 'bringToFront'; id: NoteId }
  | { type: 'editText'; id: NoteId; text: string }
  | { type: 'changeColor'; id: NoteId; color: NoteColor };

export const initialNotesState: NotesState = { notes: [] };

function topZ(notes: readonly Note[]): number {
  return notes.reduce((max, note) => Math.max(max, note.z), 0);
}

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
    case 'create': {
      const note: Note = {
        id: action.id,
        ...action.position,
        ...action.size,
        color: action.color,
        text: '',
        z: topZ(state.notes) + 1,
      };
      return { notes: [...state.notes, note] };
    }
    case 'move':
      return updateNote(state, action.id, () => ({ x: action.position.x, y: action.position.y }));
    case 'resize':
      return updateNote(state, action.id, () => ({
        width: action.size.width,
        height: action.size.height,
      }));
    case 'editText':
      return updateNote(state, action.id, () => ({ text: action.text }));
    case 'changeColor':
      return updateNote(state, action.id, () => ({ color: action.color }));
    case 'remove': {
      const notes = state.notes.filter((note) => note.id !== action.id);
      return notes.length === state.notes.length ? state : { notes };
    }
    case 'bringToFront': {
      const top = topZ(state.notes);
      return updateNote(state, action.id, (note) =>
        note.z === top && state.notes.filter((n) => n.z === top).length === 1 ? {} : { z: top + 1 },
      );
    }
  }
}
