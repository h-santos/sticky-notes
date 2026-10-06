import { render, screen } from '@testing-library/react';
import { App } from './App';

it('renders the empty board with a hint', () => {
  render(<App />);
  expect(screen.getByRole('main', { name: /sticky notes board/i })).toBeInTheDocument();
  expect(screen.getByText(/click or drag on the board/i)).toBeInTheDocument();
});
