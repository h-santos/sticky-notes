import { memo } from 'react';
import type { Note } from '../model/types';
import styles from './NoteView.module.css';

interface NoteViewProps {
  note: Note;
}

export const NoteView = memo(function NoteView({ note }: NoteViewProps) {
  return (
    <article
      className={styles.note}
      data-color={note.color}
      aria-label="Note"
      style={{
        transform: `translate(${note.x}px, ${note.y}px)`,
        width: note.width,
        height: note.height,
        zIndex: note.z,
      }}
    >
      <header className={styles.grip} />
      <div className={styles.body} />
    </article>
  );
});
