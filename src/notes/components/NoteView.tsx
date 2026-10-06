import { memo, useState } from 'react';
import {
  clampRectPosition,
  type Point,
  type Rect,
  type Size,
} from '../../shared/geometry/geometry';
import { usePointerDrag } from '../../shared/hooks/usePointerDrag';
import type { Note, NoteId } from '../model/types';
import styles from './NoteView.module.css';

export interface NoteController {
  move(id: NoteId, position: Point): void;
  getBoardSize(): Size;
}

interface NoteViewProps {
  note: Note;
  controller: NoteController;
}

type Interaction = 'moving';

export const NoteView = memo(function NoteView({ note, controller }: NoteViewProps) {
  // While dragging, the note renders from local state and only commits to the
  // store on release, so a drag re-renders this note alone.
  const [draft, setDraft] = useState<Rect | null>(null);
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const rect = draft ?? note;

  const reset = () => {
    setDraft(null);
    setInteraction(null);
  };

  const movedRect = (delta: Point): Rect =>
    clampRectPosition(
      { ...note, x: note.x + delta.x, y: note.y + delta.y },
      controller.getBoardSize(),
    );

  // Final geometry is recomputed from the drag delta rather than read from
  // draft, which may lag a frame behind the last pointermove.
  const startMove = usePointerDrag({
    onStart: () => setInteraction('moving'),
    onMove: ({ delta }) => setDraft(movedRect(delta)),
    onEnd: ({ delta }) => {
      const { x, y } = movedRect(delta);
      controller.move(note.id, { x, y });
      reset();
    },
    onCancel: reset,
  });

  return (
    <article
      className={styles.note}
      data-color={note.color}
      data-interaction={interaction ?? undefined}
      aria-label="Note"
      style={{
        transform: `translate(${rect.x}px, ${rect.y}px)`,
        width: rect.width,
        height: rect.height,
        zIndex: note.z,
      }}
    >
      <header className={styles.grip} onPointerDown={startMove} title="Drag to move" />
      <div className={styles.body} />
    </article>
  );
});
