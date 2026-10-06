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

const board = () => screen.getByRole('main', { name: /sticky notes board/i });
const notes = () => screen.queryAllByRole('article', { name: 'Note' });

describe('Board note creation', () => {
  it('creates a default-sized note on click', () => {
    render(<Board />);

    drag(board(), [100, 50], [100, 50]);

    expect(notes()).toHaveLength(1);
    expect(notes()[0]).toHaveStyle({
      transform: 'translate(100px, 50px)',
      width: '200px',
      height: '160px',
    });
  });

  it('creates a note with the size drawn by dragging', () => {
    render(<Board />);

    drag(board(), [400, 300], [100, 50]);

    expect(notes()[0]).toHaveStyle({
      transform: 'translate(100px, 50px)',
      width: '300px',
      height: '250px',
    });
  });

  it('keeps new notes inside the board', () => {
    render(<Board />);

    drag(board(), [1000, 700], [1000, 700]);

    expect(notes()[0]).toHaveStyle({ transform: 'translate(824px, 608px)' });
  });
});

describe('Board note interactions', () => {
  const createNote = () => {
    drag(board(), [100, 100], [100, 100]);
    return notes().at(-1)!;
  };

  it('moves a note by dragging its header without creating another one', () => {
    render(<Board />);
    const note = createNote();

    drag(note.querySelector('header')!, [150, 105], [450, 305]);

    expect(note).toHaveStyle({ transform: 'translate(400px, 300px)' });
    expect(notes()).toHaveLength(1);
  });

  it('keeps a moved note inside the board', () => {
    render(<Board />);
    const note = createNote();

    drag(note.querySelector('header')!, [150, 105], [2000, -500]);

    expect(note).toHaveStyle({ transform: 'translate(824px, 0px)' });
  });

  it('resizes a note from its corner, respecting the minimum size', () => {
    render(<Board />);
    const note = createNote();
    const handle = within(note).getByRole('separator', { name: /resize note/i });

    drag(handle, [300, 260], [350, 300]);
    expect(note).toHaveStyle({ width: '250px', height: '200px' });

    drag(handle, [350, 300], [0, 0]);
    expect(note).toHaveStyle({ width: '80px', height: '60px' });
  });

  it('keeps a resized note inside the board', () => {
    render(<Board />);
    const note = createNote();
    const handle = within(note).getByRole('separator', { name: /resize note/i });

    drag(handle, [300, 260], [3000, 3000]);

    expect(note).toHaveStyle({ width: '924px', height: '668px' });
  });
});
