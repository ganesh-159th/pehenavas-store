import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Account from './Account';
import { useUser } from '../hooks/useUser';

// 1. Mock the useUser hook
vi.mock('../hooks/useUser', () => ({
  useUser: vi.fn()
}));

// 2. Mock the Orders component so we just test Account in isolation
vi.mock('./Orders', () => ({
  default: () => <div data-testid="mock-orders">Mock Orders Component</div>
}));

describe('Account Component', () => {
  it('shows sign-in message when user is NOT logged in', () => {
    useUser.mockReturnValue({ user: null }); // Simulate logged out
    render(<Account />, { wrapper: BrowserRouter });
    expect(screen.getByText('Please sign in to view your account.')).toBeInTheDocument();
  });

  it('shows welcome message and orders when user IS logged in', () => {
    useUser.mockReturnValue({ user: { name: 'Ganesh' } }); // Simulate logged in
    render(<Account />, { wrapper: BrowserRouter });
    expect(screen.getByText('Welcome, Ganesh')).toBeInTheDocument();
    expect(screen.getByTestId('mock-orders')).toBeInTheDocument();
  });
});