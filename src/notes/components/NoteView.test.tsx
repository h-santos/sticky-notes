import { render, screen } from '@testing-library/react';
import type { Note, NoteId } from '../model/types';
import { NoteView, type NoteController } from './NoteView';

const controller: NoteController = {
  move: vi.fn(),
  resize: vi.fn(),
  getBoardSize: () => ({ width: 1024, height: 768 }),
};

it('positions and sizes the note from its data', () => {
  const note: Note = {
    id: 'a' as NoteId,
    x: 10,
    y: 20,
    width: 150,
    height: 120,
    text: '',
    color: 'pink',
    z: 3,
  };

  render(<NoteView note={note} controller={controller} />);

  const article = screen.getByRole('article', { name: /note/i });
  expect(article).toHaveAttribute('data-color', 'pink');
  expect(article).toHaveStyle({
    transform: 'translate(10px, 20px)',
    width: '150px',
    height: '120px',
    zIndex: '3',
  });
});
