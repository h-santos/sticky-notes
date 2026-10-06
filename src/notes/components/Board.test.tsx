import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MAX_NOTE_TEXT_LENGTH } from '../model/constants';
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
    const handle = within(note).getByRole('button', { name: /resize note/i });

    drag(handle, [300, 260], [350, 300]);
    expect(note).toHaveStyle({ width: '250px', height: '200px' });

    drag(handle, [350, 300], [0, 0]);
    expect(note).toHaveStyle({ width: '80px', height: '60px' });
  });

  it('keeps a resized note inside the board', () => {
    render(<Board />);
    const note = createNote();
    const handle = within(note).getByRole('button', { name: /resize note/i });

    drag(handle, [300, 260], [3000, 3000]);

    expect(note).toHaveStyle({ width: '924px', height: '668px' });
  });
  it('moves focus to the note being dragged', () => {
    render(<Board />);
    drag(board(), [100, 100], [100, 100]);
    drag(board(), [500, 300], [500, 300]);
    const [first, second] = notes();
    expect(within(second!).getByRole('textbox', { name: /note text/i })).toHaveFocus();

    drag(first!.querySelector('header')!, [150, 105], [200, 150]);
    expect(within(first!).getByRole('button', { name: /move note/i })).toHaveFocus();

    drag(within(second!).getByRole('button', { name: /resize note/i }), [700, 460], [720, 480]);
    expect(within(second!).getByRole('button', { name: /resize note/i })).toHaveFocus();
  });

  it('brings a note to the front when it is pressed', () => {
    render(<Board />);
    drag(board(), [100, 100], [100, 100]);
    drag(board(), [500, 300], [500, 300]);
    const [first, second] = notes();
    expect(Number(second!.style.zIndex)).toBeGreaterThan(Number(first!.style.zIndex));

    fireEvent.pointerDown(first!, { button: 0, pointerId: 1 });

    expect(Number(first!.style.zIndex)).toBeGreaterThan(Number(second!.style.zIndex));
  });
});

describe('Board trash', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.tagName === 'MAIN') return BOARD_RECT;
      if (this.getAttribute('aria-label') === 'Trash') return new DOMRect(872, 632, 128, 112);
      return new DOMRect();
    });
  });

  it('deletes a note dropped on the trash', () => {
    render(<Board />);
    drag(board(), [100, 100], [100, 100]);
    const header = screen.getByRole('article', { name: 'Note' }).querySelector('header')!;

    fireEvent.pointerDown(header, { button: 0, pointerId: 1, clientX: 150, clientY: 105 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 900, clientY: 680 });
    expect(screen.getByText(/release to delete/i)).toBeInTheDocument();
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 900, clientY: 680 });

    expect(screen.queryByRole('article', { name: 'Note' })).not.toBeInTheDocument();
    expect(screen.getByText(/drop here to delete/i)).toBeInTheDocument();
  });

  it('keeps a note dropped elsewhere', () => {
    render(<Board />);
    drag(board(), [100, 100], [100, 100]);
    const header = screen.getByRole('article', { name: 'Note' }).querySelector('header')!;

    drag(header, [150, 105], [500, 400]);

    expect(screen.getByRole('article', { name: 'Note' })).toBeInTheDocument();
  });
});

describe('Board text editing', () => {
  it('focuses a new note and lets the user type into it', async () => {
    const user = userEvent.setup();
    render(<Board />);

    drag(board(), [100, 100], [100, 100]);
    const text = screen.getByRole('textbox', { name: /note text/i });
    expect(text).toHaveFocus();

    await user.type(text, 'Call Anna');

    expect(text).toHaveValue('Call Anna');
  });

  it('limits the note text length', async () => {
    const user = userEvent.setup();
    render(<Board />);

    drag(board(), [100, 100], [100, 100]);
    const text = screen.getByRole('textbox', { name: /note text/i });
    await user.paste('a'.repeat(MAX_NOTE_TEXT_LENGTH + 1));

    expect(text).toHaveValue('a'.repeat(MAX_NOTE_TEXT_LENGTH));
  });
});

describe('Board colours', () => {
  it('recolours a note and uses that colour for the next one', async () => {
    const user = userEvent.setup();
    render(<Board />);
    drag(board(), [100, 100], [100, 100]);

    await user.click(screen.getByRole('radio', { name: 'pink' }));
    expect(screen.getByRole('article', { name: 'Note' })).toHaveAttribute('data-color', 'pink');

    drag(board(), [500, 100], [500, 100]);
    expect(notes()[1]).toHaveAttribute('data-color', 'pink');
  });

  it('changes the colour with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<Board />);
    drag(board(), [100, 100], [100, 100]);

    screen.getByRole('radio', { name: 'yellow' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('radio', { name: 'pink' })).toBeChecked();
    expect(screen.getByRole('article', { name: 'Note' })).toHaveAttribute('data-color', 'pink');
  });
});

describe('Board keyboard support', () => {
  it('moves and resizes a note with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<Board />);
    drag(board(), [100, 100], [100, 100]);
    const note = screen.getByRole('article', { name: 'Note' });

    screen.getByRole('button', { name: /move note/i }).focus();
    await user.keyboard('{ArrowRight}{Shift>}{ArrowDown}{/Shift}');
    expect(note).toHaveStyle({ transform: 'translate(110px, 150px)' });

    screen.getByRole('button', { name: /resize note/i }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(note).toHaveStyle({ width: '190px' });
  });

  it('creates a note from the toolbar and focuses its text', async () => {
    const user = userEvent.setup();
    render(<Board />);

    await user.click(screen.getByRole('button', { name: /new note/i }));

    expect(screen.getByRole('textbox', { name: /note text/i })).toHaveFocus();
    expect(screen.getByText('Note created')).toBeInTheDocument();
  });

  it('deletes a note with the Delete key and keeps focus on the board', async () => {
    const user = userEvent.setup();
    render(<Board />);
    await user.click(screen.getByRole('button', { name: /new note/i }));

    screen.getByRole('button', { name: /move note/i }).focus();
    await user.keyboard('{Delete}');

    expect(screen.queryByRole('article', { name: 'Note' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new note/i })).toHaveFocus();
    expect(screen.getByText('Note deleted')).toBeInTheDocument();
  });

  it('describes the keyboard controls of the note handles', () => {
    render(<Board />);
    drag(board(), [100, 100], [100, 100]);

    expect(screen.getByRole('button', { name: /move note/i })).toHaveAccessibleDescription(
      /arrow keys to move the note/i,
    );
    expect(screen.getByRole('button', { name: /resize note/i })).toHaveAccessibleDescription(
      /arrow keys to resize the note/i,
    );
  });
});
