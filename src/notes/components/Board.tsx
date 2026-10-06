import { useMemo, useReducer, useRef } from 'react';
import { notesReducer } from '../model/notesReducer';
import type { Note, NoteId } from '../model/types';
import styles from './Board.module.css';
import { NoteView, type NoteController } from './NoteView';

const SAMPLE_NOTES: readonly Note[] = [
  { id: 'a' as NoteId, x: 80, y: 80, width: 200, height: 160, text: '', color: 'yellow', z: 1 },
  { id: 'b' as NoteId, x: 320, y: 140, width: 200, height: 160, text: '', color: 'pink', z: 2 },
  { id: 'c' as NoteId, x: 560, y: 80, width: 200, height: 160, text: '', color: 'blue', z: 3 },
  { id: 'd' as NoteId, x: 200, y: 200, width: 240, height: 180, text: '', color: 'green', z: 4 },
];

export function Board() {
  const [state, dispatch] = useReducer(notesReducer, { notes: SAMPLE_NOTES });
  const boardRef = useRef<HTMLElement>(null);

  const controller = useMemo<NoteController>(
    () => ({
      move: (id, position) => dispatch({ type: 'move', id, position }),
      resize: (id, size) => dispatch({ type: 'resize', id, size }),
      getBoardSize: () => {
        const bounds = boardRef.current?.getBoundingClientRect();
        return { width: bounds?.width ?? 0, height: bounds?.height ?? 0 };
      },
    }),
    [],
  );

  return (
    <main ref={boardRef} className={styles.board} aria-label="Sticky notes board">
      {state.notes.length === 0 && <p className={styles.empty}>No notes yet.</p>}
      {state.notes.map((note) => (
        <NoteView key={note.id} note={note} controller={controller} />
      ))}
    </main>
  );
}
