import { memo, useRef, useState, type KeyboardEvent } from 'react';
import {
  clamp,
  clampRectPosition,
  type Point,
  type Rect,
  type Size,
} from '../../shared/geometry/geometry';
import { usePointerDrag } from '../../shared/hooks/usePointerDrag';
import { arrowKeyDelta, isDeleteKey } from '../../shared/keyboard/keyboard';
import { MAX_NOTE_TEXT_LENGTH, MIN_NOTE_SIZE } from '../model/constants';
import { NOTE_COLORS, type Note, type NoteColor, type NoteId } from '../model/types';
import { MOVE_HELP_ID, RESIZE_HELP_ID } from './KeyboardHelp';
import styles from './NoteView.module.css';

export interface NoteController {
  move(id: NoteId, position: Point): void;
  resize(id: NoteId, size: Size): void;
  remove(id: NoteId): void;
  /** Deletes a note from the keyboard: announces it and moves focus somewhere sensible. */
  removeWithKeyboard(id: NoteId): void;
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
  const moveHandleRef = useRef<HTMLButtonElement>(null);
  const resizeHandleRef = useRef<HTMLButtonElement>(null);
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
  // usePointerDrag cancels the browser's default focus change, so move focus to the pressed
  // handle explicitly
  const startMove = usePointerDrag({
    onStart: () => {
      moveHandleRef.current?.focus({ preventScroll: true });
      setInteraction('moving');
    },
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
    onStart: () => {
      resizeHandleRef.current?.focus({ preventScroll: true });
      setInteraction('resizing');
    },
    onMove: ({ delta }) => setDraft(resizedRect(delta)),
    onEnd: ({ delta }) => {
      const { width, height } = resizedRect(delta);
      controller.resize(note.id, { width, height });
      reset();
    },
    onCancel: reset,
  });

  // Keyboard alternatives to dragging (WCAG 2.5.7), applied directly to the store
  const handleMoveKeyDown = (event: KeyboardEvent) => {
    const delta = arrowKeyDelta(event);
    if (delta) {
      event.preventDefault();
      const { x, y } = movedRect(delta);
      controller.move(note.id, { x, y });
    } else if (isDeleteKey(event)) {
      event.preventDefault();
      controller.removeWithKeyboard(note.id);
    }
  };

  const handleResizeKeyDown = (event: KeyboardEvent) => {
    const delta = arrowKeyDelta(event);
    if (!delta) return;
    event.preventDefault();
    const { width, height } = resizedRect(delta);
    controller.resize(note.id, { width, height });
  };

  return (
    <article
      className={styles.note}
      data-color={note.color}
      data-interaction={interaction ?? undefined}
      aria-label="Note"
      onPointerDown={() => controller.bringToFront(note.id)}
      onFocus={() => controller.bringToFront(note.id)}
      style={{
        transform: `translate(${rect.x}px, ${rect.y}px)`,
        width: rect.width,
        height: rect.height,
        zIndex: note.z,
      }}
    >
      <header className={styles.grip} onPointerDown={startMove} title="Drag to move">
        <button
          type="button"
          ref={moveHandleRef}
          className={styles.moveHandle}
          aria-label="Move note"
          aria-describedby={MOVE_HELP_ID}
          onKeyDown={handleMoveKeyDown}
        />
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
      <button
        type="button"
        ref={resizeHandleRef}
        className={styles.resizeHandle}
        onPointerDown={startResize}
        onKeyDown={handleResizeKeyDown}
        aria-label="Resize note"
        aria-describedby={RESIZE_HELP_ID}
        title="Drag to resize"
      />
      {/* Visible counterpart of KeyboardHelp; screen readers already get it via aria-describedby. */}
      <span className={styles.keyHint} data-for="move" aria-hidden="true">
        ↑↓←→ move · Shift: bigger steps · Delete: remove
      </span>
      <span className={styles.keyHint} data-for="resize" aria-hidden="true">
        ↑↓←→ resize · Shift: bigger steps
      </span>
    </article>
  );
});
