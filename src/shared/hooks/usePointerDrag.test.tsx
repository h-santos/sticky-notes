import { fireEvent, render, screen } from '@testing-library/react';
import { usePointerDrag, type DragCallbacks } from './usePointerDrag';

function Handle(props: DragCallbacks) {
  const onPointerDown = usePointerDrag(props);
  return <div data-testid="handle" onPointerDown={onPointerDown} />;
}

const setup = () => {
  const callbacks = { onStart: vi.fn(), onMove: vi.fn(), onEnd: vi.fn(), onCancel: vi.fn() };
  render(<Handle {...callbacks} />);
  return callbacks;
};

describe('usePointerDrag', () => {
  it('reports deltas relative to the starting point', () => {
    const callbacks = setup();

    fireEvent.pointerDown(screen.getByTestId('handle'), {
      button: 0,
      clientX: 10,
      clientY: 10,
      pointerId: 1,
    });
    fireEvent.pointerMove(window, { clientX: 30, clientY: 15, pointerId: 1 });
    fireEvent.pointerUp(window, { clientX: 40, clientY: 25, pointerId: 1 });

    expect(callbacks.onStart).toHaveBeenCalledWith({ x: 10, y: 10 });
    expect(callbacks.onMove).toHaveBeenCalledWith(
      expect.objectContaining({ delta: { x: 20, y: 5 } }),
    );
    expect(callbacks.onEnd).toHaveBeenCalledWith(
      expect.objectContaining({ delta: { x: 30, y: 15 } }),
    );
  });

  it('ignores non-primary buttons', () => {
    const callbacks = setup();

    fireEvent.pointerDown(screen.getByTestId('handle'), { button: 2, pointerId: 1 });

    expect(callbacks.onStart).not.toHaveBeenCalled();
  });

  it('cancels on Escape and stops listening', () => {
    const callbacks = setup();

    fireEvent.pointerDown(screen.getByTestId('handle'), { button: 0, pointerId: 1 });
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.pointerUp(window, { pointerId: 1 });

    expect(callbacks.onCancel).toHaveBeenCalledOnce();
    expect(callbacks.onEnd).not.toHaveBeenCalled();
  });
});
