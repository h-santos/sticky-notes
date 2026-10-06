import { fireEvent, render, screen, within } from '@testing-library/react';
import { Board } from './Board';

const BOARD_RECT = new DOMRect(0, 0, 1024, 768);

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.tagName === 'MAIN' ? BOARD_RECT : new DOMRect();
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function drag(target: Element, from: [number, number], to: [number, number]) {
  fireEvent.pointerDown(target, { button: 0, pointerId: 1, clientX: from[0], clientY: from[1] });
  fireEvent.pointerMove(window, { pointerId: 1, clientX: to[0], clientY: to[1] });
  fireEvent.pointerUp(window, { pointerId: 1, clientX: to[0], clientY: to[1] });
}

const firstNote = () => screen.getAllByRole('article', { name: 'Note' })[0]!;

describe('Board note interactions', () => {
  it('moves a note by dragging its header', () => {
    render(<Board />);
    const note = firstNote();

    drag(note.querySelector('header')!, [100, 85], [400, 285]);

    expect(note).toHaveStyle({ transform: 'translate(380px, 280px)' });
  });

  it('keeps a moved note inside the board', () => {
    render(<Board />);
    const note = firstNote();

    drag(note.querySelector('header')!, [100, 85], [2000, -500]);

    expect(note).toHaveStyle({ transform: 'translate(824px, 0px)' });
  });

  it('resizes a note from its corner, respecting the minimum size', () => {
    render(<Board />);
    const note = firstNote();
    const handle = within(note).getByRole('separator', { name: /resize note/i });

    drag(handle, [280, 240], [330, 280]);
    expect(note).toHaveStyle({ width: '250px', height: '200px' });

    drag(handle, [330, 280], [0, 0]);
    expect(note).toHaveStyle({ width: '80px', height: '60px' });
  });

  it('keeps a resized note inside the board', () => {
    render(<Board />);
    const note = firstNote();
    const handle = within(note).getByRole('separator', { name: /resize note/i });

    drag(handle, [280, 240], [3000, 3000]);

    expect(note).toHaveStyle({ width: '944px', height: '688px' });
  });
});
