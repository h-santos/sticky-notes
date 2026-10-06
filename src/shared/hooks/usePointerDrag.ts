import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { Point } from '../geometry/geometry';

export interface DragState {
  // Pointer position (client coordinates) when the drag started
  origin: Point;
  // Latest pointer position (client coordinates)
  current: Point;
  delta: Point;
}

export interface DragCallbacks {
  onStart?: (origin: Point) => void;
  onMove: (drag: DragState) => void;
  onEnd: (drag: DragState) => void;
  // Called when the drag is aborted with Escape or by the browser (pointercancel)
  onCancel?: () => void;
}

const toPoint = (event: PointerEvent | ReactPointerEvent): Point => ({
  x: event.clientX,
  y: event.clientY,
});

/**
 * Generic primary-button drag gesture built on pointer events.
 * Returns a handler to attach to onPointerDown. Move/up listeners are bound to
 * window so the drag keeps working when the pointer leaves the element
 */
export function usePointerDrag(callbacks: DragCallbacks) {
  // Keep the latest callbacks without re-creating the pointerdown handler,
  // so memoised children receiving it don't re-render.
  const callbacksRef = useRef(callbacks);
  useLayoutEffect(() => {
    callbacksRef.current = callbacks;
  });

  const cleanupRef = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanupRef.current?.(), []);

  return useCallback((event: ReactPointerEvent<Element>) => {
    if (event.button !== 0 || cleanupRef.current) return;
    // Prevents text selection and native image/link dragging while dragging.
    event.preventDefault();

    const origin = toPoint(event);
    const pointerId = event.pointerId;
    const stateFor = (current: Point): DragState => ({
      origin,
      current,
      delta: { x: current.x - origin.x, y: current.y - origin.y },
    });

    const handleMove = (e: PointerEvent) => {
      if (e.pointerId === pointerId) callbacksRef.current.onMove(stateFor(toPoint(e)));
    };
    const handleUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      cleanup();
      callbacksRef.current.onEnd(stateFor(toPoint(e)));
    };
    const handleCancel = () => {
      cleanup();
      callbacksRef.current.onCancel?.();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel();
    };

    function cleanup() {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleCancel);
      window.removeEventListener('keydown', handleKeyDown);
      cleanupRef.current = null;
    }

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleCancel);
    window.addEventListener('keydown', handleKeyDown);
    cleanupRef.current = cleanup;

    callbacksRef.current.onStart?.(origin);
  }, []);
}
