import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Navigate } from 'react-router-dom';
import Account from './Account';
import { useUser } from '../hooks/useUser';

vi.mock('../hooks/useUser', () => ({
  useUser: vi.fn()
}));

vi.mock('./Orders', () => ({
  default: () => <div data-testid="mock-orders">Mock Orders Component</div>
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: vi.fn(({ to, state }) => {
      return <div data-testid="navigate" data-to={to} data-message={state?.message} />;
    }),
  };
});

describe('Account Component', () => {
  it('redirects to sign-in when user is NOT logged in', () => {
    useUser.mockReturnValue({ user: null });
    render(
      <MemoryRouter initialEntries={['/account']}>
        <Account />
      </MemoryRouter>
    );
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/signin');
  });

  it('shows welcome message and orders when user IS logged in', () => {
    useUser.mockReturnValue({ user: { name: 'Ganesh' } });
    render(<Account />, { wrapper: MemoryRouter });
    expect(screen.getByText('Welcome, Ganesh')).toBeInTheDocument();
    expect(screen.getByTestId('mock-orders')).toBeInTheDocument();
  });
});