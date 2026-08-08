import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Terms from './Terms';
import { useUser } from '../hooks/useUser';

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../hooks/useFadeIn', () => ({
  useFadeIn: () => true,
}));

vi.mock('../hooks/useUser', () => ({
  useUser: vi.fn(),
}));

describe('Terms Component', () => {
  it('renders the terms and conditions heading', () => {
    useUser.mockReturnValue({ user: null });
    render(<Terms />);
    expect(screen.getByText('Terms and Conditions')).toBeInTheDocument();
  });

  it('navigates to the store when a logged-in user clicks Go Back', () => {
    useUser.mockReturnValue({ user: { uid: '1' } });
    render(<Terms />);
    fireEvent.click(screen.getByText('Go Back'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('navigates to sign-in when a guest clicks Go Back', () => {
    useUser.mockReturnValue({ user: null });
    render(<Terms />);
    fireEvent.click(screen.getByText('Go Back'));
    expect(mockNavigate).toHaveBeenCalledWith('/signin');
  });
});
