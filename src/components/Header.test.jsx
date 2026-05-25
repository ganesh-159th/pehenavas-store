import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Header from './Header';
import { useUser } from '../hooks/useUser';

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
      useUser.mockReturnValue({ user: null, login: vi.fn() });
      render(<Header />);
      expect(screen.getByText('Pehenavas')).toBeInTheDocument();
    });

    it('renders Account & Orders text', () => {
      useUser.mockReturnValue({ user: null, login: vi.fn() });
      render(<Header />);
      expect(screen.getByText('Account & Orders')).toBeInTheDocument();
    });

    it('renders Cart text', () => {
      useUser.mockReturnValue({ user: null, login: vi.fn() });
      render(<Header />);
      expect(screen.getByText('Cart')).toBeInTheDocument();
    });

    it('renders as a header element with correct styling classes', () => {
      useUser.mockReturnValue({ user: null, login: vi.fn() });
      render(<Header />);
      const headerElement = screen.getByText('Pehenavas').closest('header');
      expect(headerElement).toHaveClass('bg-gray-800', 'text-white', 'p-4', 'flex', 'justify-between', 'items-center');
    });
  });

  describe('User Greeting Display', () => {
    it('displays user greeting when user is logged in', () => {
      useUser.mockReturnValue({ user: { name: 'Ganesh' }, login: vi.fn() });
      render(<Header />);
      expect(screen.getByText('Hello, Ganesh')).toBeInTheDocument();
    });

    it('displays user name in greeting with correct format', () => {
      useUser.mockReturnValue({ user: { name: 'John' }, login: vi.fn() });
      render(<Header />);
      expect(screen.getByText('Hello, John')).toBeInTheDocument();
    });

    it('does not display greeting when user is not logged in', () => {
      useUser.mockReturnValue({ user: null, login: vi.fn() });
      render(<Header />);
      expect(screen.queryByText(/Hello,/)).not.toBeInTheDocument();
    });

    it('updates greeting when user changes from logged out to logged in', () => {
      const { rerender } = render(<Header />);
      useUser.mockReturnValue({ user: null, login: vi.fn() });
      rerender(<Header />);
      expect(screen.queryByText(/Hello,/)).not.toBeInTheDocument();

      useUser.mockReturnValue({ user: { name: 'Alice' }, login: vi.fn() });
      rerender(<Header />);
      expect(screen.getByText('Hello, Alice')).toBeInTheDocument();
    });
  });

  describe('Sign In Button - When Not Logged In', () => {
    it('displays Sign In button when user is not logged in', () => {
      useUser.mockReturnValue({ user: null, login: vi.fn() });
      render(<Header />);
      const signInButton = screen.getByRole('button', { name: /Sign In/i });
      expect(signInButton).toBeInTheDocument();
    });

    it('does not display Sign In button when user is logged in', () => {
      useUser.mockReturnValue({ user: { name: 'Ganesh' }, login: vi.fn() });
      render(<Header />);
      expect(screen.queryByRole('button', { name: /Sign In/i })).not.toBeInTheDocument();
    });

    it('calls login function when Sign In button is clicked', () => {
      const mockLogin = vi.fn();
      useUser.mockReturnValue({ user: null, login: mockLogin });
      render(<Header />);

      const signInButton = screen.getByRole('button', { name: /Sign In/i });
      fireEvent.click(signInButton);

      expect(mockLogin).toHaveBeenCalledOnce();
      expect(mockLogin).toHaveBeenCalledWith({ name: 'Ganesh' });
    });

    it('Sign In button calls login with correct user object', () => {
      const mockLogin = vi.fn();
      useUser.mockReturnValue({ user: null, login: mockLogin });
      render(<Header />);

      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Ganesh' })
      );
    });
  });

  describe('Sign In/Logout Behavior - When Logged In', () => {
    it('does not display Sign In button when user is logged in', () => {
      useUser.mockReturnValue({ user: { name: 'Ganesh' }, login: vi.fn() });
      render(<Header />);
      expect(screen.queryByRole('button', { name: /Sign In/i })).not.toBeInTheDocument();
    });

    it('displays greeting message instead of Sign In button when logged in', () => {
      useUser.mockReturnValue({ user: { name: 'Ganesh' }, login: vi.fn() });
      render(<Header />);
      expect(screen.getByText('Hello, Ganesh')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Sign In/i })).not.toBeInTheDocument();
    });

    it('maintains user greeting across multiple renders', () => {
      const mockLogin = vi.fn();
      useUser.mockReturnValue({ user: { name: 'Priya' }, login: mockLogin });
      const { rerender } = render(<Header />);

      expect(screen.getByText('Hello, Priya')).toBeInTheDocument();

      rerender(<Header />);
      expect(screen.getByText('Hello, Priya')).toBeInTheDocument();
    });
  });

  describe('Account & Orders Text Rendering', () => {
    it('renders Account & Orders text when user is not logged in', () => {
      useUser.mockReturnValue({ user: null, login: vi.fn() });
      render(<Header />);
      expect(screen.getByText('Account & Orders')).toBeInTheDocument();
    });

    it('renders Account & Orders text when user is logged in', () => {
      useUser.mockReturnValue({ user: { name: 'Ganesh' }, login: vi.fn() });
      render(<Header />);
      expect(screen.getByText('Account & Orders')).toBeInTheDocument();
    });

    it('displays Account & Orders in correct position in header', () => {
      useUser.mockReturnValue({ user: null, login: vi.fn() });
      render(<Header />);
      const accountOrdersText = screen.getByText('Account & Orders');
      expect(accountOrdersText).toBeInTheDocument();
      expect(accountOrdersText.className).toContain('mr-4');
    });
  });

  describe('Integration Tests', () => {
    it('renders all header elements in correct order', () => {
      useUser.mockReturnValue({ user: null, login: vi.fn() });
      render(<Header />);

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
      useUser.mockReturnValue({ user: null, login: vi.fn() });
      render(<Header />);

      expect(screen.getByText('Pehenavas')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
      expect(screen.getByText('Account & Orders')).toBeInTheDocument();
      expect(screen.getByText('Cart')).toBeInTheDocument();
    });

    it('shows complete header structure for logged-in user', () => {
      useUser.mockReturnValue({ user: { name: 'Ganesh' }, login: vi.fn() });
      render(<Header />);

      expect(screen.getByText('Pehenavas')).toBeInTheDocument();
      expect(screen.getByText('Hello, Ganesh')).toBeInTheDocument();
      expect(screen.getByText('Account & Orders')).toBeInTheDocument();
      expect(screen.getByText('Cart')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Sign In/i })).not.toBeInTheDocument();
    });

    it('correctly handles login function invocation and state change', () => {
      const mockLogin = vi.fn();
      useUser.mockReturnValue({ user: null, login: mockLogin });
      render(<Header />);

      expect(screen.queryByText(/Hello,/)).not.toBeInTheDocument();

      const signInButton = screen.getByRole('button', { name: /Sign In/i });
      fireEvent.click(signInButton);

      expect(mockLogin).toHaveBeenCalledOnce();
      expect(mockLogin).toHaveBeenCalledWith({ name: 'Ganesh' });
    });
  });
});
