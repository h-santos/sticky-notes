import { render, screen } from '@testing-library/react';
import { App } from './App';

it('renders the empty board', () => {
  render(<App />);
  expect(screen.getByRole('main', { name: /sticky notes board/i })).toBeInTheDocument();
});
