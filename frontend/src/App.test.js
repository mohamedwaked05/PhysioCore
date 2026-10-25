import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { assessInjury } from './api/public';

// CRA 5's Jest cannot resolve React Router 7's package exports. Use the same
// upstream router exports and supply the Web API absent from its older jsdom.
jest.mock('react-router-dom', () => {
  global.TextEncoder = require('util').TextEncoder;
  return jest.requireActual('react-router');
}, { virtual: true });
jest.mock('./api/axios', () => ({}));
jest.mock('./api/public', () => ({ assessInjury: jest.fn() }));

test('guest landing mounts the chatbot and submits an assessment', async () => {
  localStorage.clear();
  window.history.replaceState({}, '', '/');
  assessInjury.mockResolvedValueOnce({ data: { message: 'How did it happen?' } });
  render(<App />);
  expect(screen.getByRole('heading', { name: /The smarter way to recover/ })).toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Message input' }), { target: { value: 'My ankle hurts' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  expect(await screen.findByText('How did it happen?')).toBeInTheDocument();
  expect(assessInjury).toHaveBeenCalledWith([
    expect.objectContaining({ role: 'assistant' }),
    { role: 'user', content: 'My ankle hurts' },
  ]);
});
