import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';
import { useUser } from '../hooks/useUser';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the useUser hook
vi.mock('../hooks/useUser', () => ({
  useUser: vi.fn()
}));

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the Pehenavas logo', () => {
      useUser.mockReturnValue({ user: null });
      render(<Header />, { wrapper: BrowserRouter });
      expect(screen.getByText('Pehenavas')).toBeInTheDocument();
    });

    it('renders Account & Orders text', () => {
      useUser.mockReturnValue({ user: null });
      render(<Header />, { wrapper: BrowserRouter });
      expect(screen.getByText('Account & Orders')).toBeInTheDocument();
    });

    it('renders Cart text', () => {
      useUser.mockReturnValue({ user: null });
      render(<Header />, { wrapper: BrowserRouter });
      expect(screen.getByText('Cart')).toBeInTheDocument();
    });

    it('renders as a header element with correct styling classes', () => {
      useUser.mockReturnValue({ user: null });
      render(<Header />, { wrapper: BrowserRouter });
      const headerElement = screen.getByText('Pehenavas').closest('header');
      expect(headerElement).toHaveClass('bg-gray-800', 'text-white', 'p-4', 'flex', 'justify-between', 'items-center');
    });
  });

  describe('User Greeting Display', () => {
    it('displays user greeting when user is logged in', () => {
      useUser.mockReturnValue({ user: { name: 'Ganesh' } });
      render(<Header />, { wrapper: BrowserRouter });
      expect(screen.getByText('Hello, Ganesh')).toBeInTheDocument();
    });

    it('displays user name in greeting with correct format', () => {
      useUser.mockReturnValue({ user: { name: 'John' } });
      render(<Header />, { wrapper: BrowserRouter });
      expect(screen.getByText('Hello, John')).toBeInTheDocument();
    });

    it('does not display greeting when user is not logged in', () => {
      useUser.mockReturnValue({ user: null });
      render(<Header />, { wrapper: BrowserRouter });
      expect(screen.queryByText(/Hello,/)).not.toBeInTheDocument();
    });

    it('updates greeting when user changes from logged out to logged in', () => {
      useUser.mockReturnValue({ user: null });
      const { rerender } = render(<Header />, { wrapper: BrowserRouter });
      expect(screen.queryByText(/Hello,/)).not.toBeInTheDocument();

      useUser.mockReturnValue({ user: { name: 'Alice' } });
      rerender(<Header />);
      expect(screen.getByText('Hello, Alice')).toBeInTheDocument();
    });
  });

  describe('Sign In Button - When Not Logged In', () => {
    it('displays Sign In button when user is not logged in', () => {
      useUser.mockReturnValue({ user: null });
      render(<Header />, { wrapper: BrowserRouter });
      const signInButton = screen.getByRole('button', { name: /Sign In/i });
      expect(signInButton).toBeInTheDocument();
    });

    it('does not display Sign In button when user is logged in', () => {
      useUser.mockReturnValue({ user: { name: 'Ganesh' } });
      render(<Header />, { wrapper: BrowserRouter });
      expect(screen.queryByRole('button', { name: /Sign In/i })).not.toBeInTheDocument();
    });

    it('navigates to sign in page when Sign In button is clicked', () => {
      useUser.mockReturnValue({ user: null });
      render(<Header />, { wrapper: BrowserRouter });

      const signInButton = screen.getByRole('button', { name: /Sign In/i });
      fireEvent.click(signInButton);

      expect(mockNavigate).toHaveBeenCalledWith('/signin');
    });

    it('Sign In button navigates to sign in with correct path', () => {
      useUser.mockReturnValue({ user: null });
      render(<Header />, { wrapper: BrowserRouter });

      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/signin');
    });
  });

  describe('Sign In/Logout Behavior - When Logged In', () => {
    it('does not display Sign In button when user is logged in', () => {
      useUser.mockReturnValue({ user: { name: 'Ganesh' } });
      render(<Header />, { wrapper: BrowserRouter });
      expect(screen.queryByRole('button', { name: /Sign In/i })).not.toBeInTheDocument();
    });

    it('displays greeting message instead of Sign In button when logged in', () => {
      useUser.mockReturnValue({ user: { name: 'Ganesh' } });
      render(<Header />, { wrapper: BrowserRouter });
      expect(screen.getByText('Hello, Ganesh')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Sign In/i })).not.toBeInTheDocument();
    });

    it('maintains user greeting across multiple renders', () => {
      useUser.mockReturnValue({ user: { name: 'Priya' } });
      const { rerender } = render(<Header />, { wrapper: BrowserRouter });

      expect(screen.getByText('Hello, Priya')).toBeInTheDocument();

      rerender(<Header />);
      expect(screen.getByText('Hello, Priya')).toBeInTheDocument();
    });
  });

  describe('Account & Orders Text Rendering', () => {
    it('renders Account & Orders text when user is not logged in', () => {
      useUser.mockReturnValue({ user: null });
      render(<Header />, { wrapper: BrowserRouter });
      expect(screen.getByText('Account & Orders')).toBeInTheDocument();
    });

    it('renders Account & Orders text when user is logged in', () => {
      useUser.mockReturnValue({ user: { name: 'Ganesh' } });
      render(<Header />, { wrapper: BrowserRouter });
      expect(screen.getByText('Account & Orders')).toBeInTheDocument();
    });

    it('displays Account & Orders in correct position in header', () => {
      useUser.mockReturnValue({ user: null });
      render(<Header />, { wrapper: BrowserRouter });
      const accountOrdersText = screen.getByText('Account & Orders');
      expect(accountOrdersText).toBeInTheDocument();
      expect(accountOrdersText.className).toContain('mr-4');
    });
  });

  describe('Integration Tests', () => {
    it('renders all header elements in correct order', () => {
      useUser.mockReturnValue({ user: null });
      render(<Header />, { wrapper: BrowserRouter });

      const header = screen.getByText('Pehenavas').closest('header');
      expect(header).toBeInTheDocument();

      const signInButton = screen.getByRole('button', { name: /Sign In/i });
      const accountOrders = screen.getByText('Account & Orders');
      const cart = screen.getByText('Cart');

      expect(signInButton).toBeInTheDocument();
      expect(accountOrders).toBeInTheDocument();
      expect(cart).toBeInTheDocument();
    });

    it('shows complete header structure for logged-out user', () => {
      useUser.mockReturnValue({ user: null });
      render(<Header />, { wrapper: BrowserRouter });

      expect(screen.getByText('Pehenavas')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
      expect(screen.getByText('Account & Orders')).toBeInTheDocument();
      expect(screen.getByText('Cart')).toBeInTheDocument();
    });

    it('shows complete header structure for logged-in user', () => {
      useUser.mockReturnValue({ user: { name: 'Ganesh' } });
      render(<Header />, { wrapper: BrowserRouter });

      expect(screen.getByText('Pehenavas')).toBeInTheDocument();
      expect(screen.getByText('Hello, Ganesh')).toBeInTheDocument();
      expect(screen.getByText('Account & Orders')).toBeInTheDocument();
      expect(screen.getByText('Cart')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Sign In/i })).not.toBeInTheDocument();
    });

    it('navigates to sign in when Sign In button is clicked', () => {
      useUser.mockReturnValue({ user: null });
      render(<Header />, { wrapper: BrowserRouter });

      expect(screen.queryByText(/Hello,/)).not.toBeInTheDocument();

      const signInButton = screen.getByRole('button', { name: /Sign In/i });
      fireEvent.click(signInButton);

      expect(mockNavigate).toHaveBeenCalledWith('/signin');
    });
  });
});
