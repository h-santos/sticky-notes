import { memo, useState } from 'react';
import {
  clamp,
  clampRectPosition,
  type Point,
  type Rect,
  type Size,
} from '../../shared/geometry/geometry';
import { usePointerDrag } from '../../shared/hooks/usePointerDrag';
import { MIN_NOTE_SIZE } from '../model/constants';
import type { Note, NoteId } from '../model/types';
import styles from './NoteView.module.css';

export interface NoteController {
  move(id: NoteId, position: Point): void;
  resize(id: NoteId, size: Size): void;
  getBoardSize(): Size;
}

interface NoteViewProps {
  note: Note;
  controller: NoteController;
}

type Interaction = 'moving' | 'resizing';

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

  const resizedRect = (delta: Point): Rect => {
    const board = controller.getBoardSize();
    const maxWidth = Math.max(MIN_NOTE_SIZE.width, board.width - note.x);
    const maxHeight = Math.max(MIN_NOTE_SIZE.height, board.height - note.y);
    return {
      ...note,
      width: clamp(note.width + delta.x, MIN_NOTE_SIZE.width, maxWidth),
      height: clamp(note.height + delta.y, MIN_NOTE_SIZE.height, maxHeight),
    };
  };

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

  const startResize = usePointerDrag({
    onStart: () => setInteraction('resizing'),
    onMove: ({ delta }) => setDraft(resizedRect(delta)),
    onEnd: ({ delta }) => {
      const { width, height } = resizedRect(delta);
      controller.resize(note.id, { width, height });
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
      <div
        className={styles.resizeHandle}
        onPointerDown={startResize}
        role="separator"
        aria-label="Resize note"
        title="Drag to resize"
      />
    </article>
  );
});
