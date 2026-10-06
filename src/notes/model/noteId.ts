import type { NoteId } from './types';

export function createNoteId(): NoteId {
  return crypto.randomUUID() as NoteId;
}
