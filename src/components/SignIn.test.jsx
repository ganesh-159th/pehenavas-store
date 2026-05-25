import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SignIn from './SignIn';
import { useUser } from '../hooks/useUser';
import { BrowserRouter } from 'react-router-dom';

// 1. Mock the useUser hook
vi.mock('../hooks/useUser', () => ({
  useUser: vi.fn()
}));

// 2. Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('SignIn Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sign-in form correctly', () => {
    useUser.mockReturnValue({ login: vi.fn() });
    render(<SignIn />, { wrapper: BrowserRouter }); // Wrapped in BrowserRouter because of <Link>

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('navigates to home without logging in when clicking guest button', () => {
    const mockLogin = vi.fn();
    useUser.mockReturnValue({ login: mockLogin });
    render(<SignIn />, { wrapper: BrowserRouter });

    fireEvent.click(screen.getByRole('button', { name: /Continue as Guest/i }));
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});