import {
  useMemo,
  useReducer,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  clamp,
  containsPoint,
  rectFromPoints,
  type Point,
  type Rect,
  type Size,
} from '../../shared/geometry/geometry';
import { usePointerDrag } from '../../shared/hooks/usePointerDrag';
import { initialNotesState, notesReducer } from '../model/notesReducer';
import { DEFAULT_NOTE_SIZE, MIN_NOTE_SIZE } from '../model/constants';
import { createNoteId } from '../model/noteId';
import type { NoteColor, NoteId } from '../model/types';
import styles from './Board.module.css';
import { NoteView, type NoteController } from './NoteView';
import { KeyboardHelp } from './KeyboardHelp';
import { Trash } from './Trash';

/** Pointer travel (px) below which a press on the board counts as a click. */
const CLICK_TOLERANCE = 4;
/** Notes created from the toolbar cascade from here so they don't stack exactly. */
const TOOLBAR_NOTE_ORIGIN = { x: 32, y: 64 };
const TOOLBAR_NOTE_OFFSET = 24;

export function Board() {
  const [state, dispatch] = useReducer(notesReducer, initialNotesState);
  const boardRef = useRef<HTMLElement>(null);
  // Rectangle being drawn to create a note, in board coordinates.
  const [draftRect, setDraftRect] = useState<Rect | null>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const [isTrashActive, setTrashActive] = useState(false);
  const [createdNoteId, setCreatedNoteId] = useState<NoteId | null>(null);
  const [newNoteColor, setNewNoteColor] = useState<NoteColor>('yellow');
  const [announcement, setAnnouncement] = useState('');
  const newNoteButtonRef = useRef<HTMLButtonElement>(null);

  const controller = useMemo<NoteController>(
    () => ({
      move: (id, position) => dispatch({ type: 'move', id, position }),
      resize: (id, size) => dispatch({ type: 'resize', id, size }),
      remove: (id) => dispatch({ type: 'remove', id }),
      removeWithKeyboard: (id) => {
        dispatch({ type: 'remove', id });
        setAnnouncement('Note deleted');
        // The focused note is gone; keep focus on the board's main control.
        newNoteButtonRef.current?.focus();
      },
      bringToFront: (id) => dispatch({ type: 'bringToFront', id }),
      editText: (id, text) => dispatch({ type: 'editText', id, text }),
      changeColor: (id, color) => {
        dispatch({ type: 'changeColor', id, color });
        setNewNoteColor(color);
      },
      isOverTrash: (clientPoint) => {
        const trash = trashRef.current?.getBoundingClientRect();
        return trash ? containsPoint(trash, clientPoint) : false;
      },
      setTrashActive,
      getBoardSize: () => {
        const bounds = boardRef.current?.getBoundingClientRect();
        return { width: bounds?.width ?? 0, height: bounds?.height ?? 0 };
      },
    }),
    [],
  );

  const toBoardPoint = (client: Point): Point => {
    const bounds = boardRef.current?.getBoundingClientRect();
    if (!bounds) return client;
    return {
      x: clamp(client.x - bounds.left, 0, bounds.width),
      y: clamp(client.y - bounds.top, 0, bounds.height),
    };
  };

  const createNote = (position: Point, size: Size) => {
    const id = createNoteId();
    setCreatedNoteId(id);
    setAnnouncement('Note created');
    dispatch({ type: 'create', id, position, size, color: newNoteColor });
  };

  const createNoteFromToolbar = () => {
    const offset = (state.notes.length % 10) * TOOLBAR_NOTE_OFFSET;
    createNote(
      { x: TOOLBAR_NOTE_ORIGIN.x + offset, y: TOOLBAR_NOTE_ORIGIN.y + offset },
      DEFAULT_NOTE_SIZE,
    );
  };

  const startCreating = usePointerDrag({
    onMove: ({ origin, current }) =>
      setDraftRect(rectFromPoints(toBoardPoint(origin), toBoardPoint(current))),
    onEnd: ({ origin, current, delta }) => {
      setDraftRect(null);
      const isClick = Math.hypot(delta.x, delta.y) < CLICK_TOLERANCE;
      const drawn = rectFromPoints(toBoardPoint(origin), toBoardPoint(current));
      const size = isClick
        ? DEFAULT_NOTE_SIZE
        : {
            width: Math.max(drawn.width, MIN_NOTE_SIZE.width),
            height: Math.max(drawn.height, MIN_NOTE_SIZE.height),
          };
      const bounds = boardRef.current?.getBoundingClientRect();
      const maxX = Math.max(0, (bounds?.width ?? 0) - size.width);
      const maxY = Math.max(0, (bounds?.height ?? 0) - size.height);
      createNote({ x: clamp(drawn.x, 0, maxX), y: clamp(drawn.y, 0, maxY) }, size);
    },
    onCancel: () => setDraftRect(null),
  });

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    // Only presses on empty board space create notes.
    if (event.target === event.currentTarget) startCreating(event);
  };

  return (
    <main
      ref={boardRef}
      className={styles.board}
      aria-label="Sticky notes board"
      onPointerDown={handlePointerDown}
    >
      <div className={styles.toolbar}>
        <button
          ref={newNoteButtonRef}
          type="button"
          className={styles.newNote}
          onClick={createNoteFromToolbar}
        >
          + New note
        </button>
      </div>
      <KeyboardHelp />
      <p className={styles.visuallyHidden} aria-live="polite">
        {announcement}
      </p>
      {state.notes.length === 0 && !draftRect && (
        <p className={styles.hint}>Click or drag on the board to create a note</p>
      )}
      {state.notes.map((note) => (
        <NoteView
          key={note.id}
          note={note}
          controller={controller}
          autoFocus={note.id === createdNoteId}
        />
      ))}
      <Trash ref={trashRef} active={isTrashActive} />
      {draftRect && (
        <div
          className={styles.draft}
          style={{
            transform: `translate(${draftRect.x}px, ${draftRect.y}px)`,
            width: draftRect.width,
            height: draftRect.height,
          }}
        />
      )}
    </main>
  );
}
