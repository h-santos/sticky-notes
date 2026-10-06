import { memo, useState } from 'react';
import {
  clamp,
  clampRectPosition,
  type Point,
  type Rect,
  type Size,
} from '../../shared/geometry/geometry';
import { usePointerDrag } from '../../shared/hooks/usePointerDrag';
import { MAX_NOTE_TEXT_LENGTH, MIN_NOTE_SIZE } from '../model/constants';
import { NOTE_COLORS, type Note, type NoteColor, type NoteId } from '../model/types';
import styles from './NoteView.module.css';

export interface NoteController {
  move(id: NoteId, position: Point): void;
  resize(id: NoteId, size: Size): void;
  remove(id: NoteId): void;
  bringToFront(id: NoteId): void;
  editText(id: NoteId, text: string): void;
  changeColor(id: NoteId, color: NoteColor): void;
  getBoardSize(): Size;
  /** Whether a client-coordinate point is over the trash zone. */
  isOverTrash(clientPoint: Point): boolean;
  setTrashActive(active: boolean): void;
}

interface NoteViewProps {
  note: Note;
  controller: NoteController;
  /** Focuses the text field on mount, e.g. right after the user creates the note. */
  autoFocus?: boolean;
}

type Interaction = 'moving' | 'resizing' | 'deleting';

export const NoteView = memo(function NoteView({
  note,
  controller,
  autoFocus = false,
}: NoteViewProps) {
  // While dragging, the note renders from local state and only commits to the
  // store on release, so a drag re-renders this note alone.
  const [draft, setDraft] = useState<Rect | null>(null);
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const rect = draft ?? note;

  const reset = () => {
    setDraft(null);
    setInteraction(null);
    controller.setTrashActive(false);
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
    onMove: ({ delta, current }) => {
      const overTrash = controller.isOverTrash(current);
      setDraft(movedRect(delta));
      setInteraction(overTrash ? 'deleting' : 'moving');
      controller.setTrashActive(overTrash);
    },
    onEnd: ({ delta, current }) => {
      reset();
      if (controller.isOverTrash(current)) {
        controller.remove(note.id);
      } else {
        const { x, y } = movedRect(delta);
        controller.move(note.id, { x, y });
      }
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
      onPointerDown={() => controller.bringToFront(note.id)}
      style={{
        transform: `translate(${rect.x}px, ${rect.y}px)`,
        width: rect.width,
        height: rect.height,
        zIndex: note.z,
      }}
    >
      <header className={styles.grip} onPointerDown={startMove} title="Drag to move">
        <fieldset
          className={styles.colors}
          aria-label="Note colour"
          onPointerDown={(event) => event.stopPropagation()}
        >
          {NOTE_COLORS.map((color) => (
            <input
              key={color}
              type="radio"
              name={`color-${note.id}`}
              checked={note.color === color}
              aria-label={color}
              className={styles.colorRadio}
              data-color={color}
              onChange={() => controller.changeColor(note.id, color)}
            />
          ))}
        </fieldset>
      </header>
      <textarea
        className={styles.text}
        value={note.text}
        onChange={(event) => controller.editText(note.id, event.target.value)}
        placeholder="Write something…"
        aria-label="Note text"
        maxLength={MAX_NOTE_TEXT_LENGTH}
        autoFocus={autoFocus}
        spellCheck={false}
      />
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
