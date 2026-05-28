import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SignUp from './SignUp';
import { useUser } from '../hooks/useUser';
import { BrowserRouter } from 'react-router-dom';

// 1. Mock the custom hooks
vi.mock('../hooks/useUser', () => ({
  useUser: vi.fn()
}));

vi.mock('../hooks/useFadeIn', () => ({
  useFadeIn: () => true // Always return true so it renders synchronously in tests
}));

// 2. Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('SignUp Component', () => {
  const mockSignup = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useUser.mockReturnValue({ signup: mockSignup });
  });

  const renderComponent = () => render(<SignUp />, { wrapper: BrowserRouter });

  it('renders the sign-up form correctly', () => {
    renderComponent();
    
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  describe('Form Validation', () => {
    it('shows all required error messages on empty submit', () => {
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      expect(screen.getByText('Full name is required.')).toBeInTheDocument();
      expect(screen.getByText('Email is required.')).toBeInTheDocument();
      expect(screen.getByText('Password is required.')).toBeInTheDocument();
      expect(screen.getByText('You must agree to the terms and conditions to create an account.')).toBeInTheDocument();
    });

    it('shows error for invalid email format', () => {
      renderComponent();
      
      fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'invalid@email' } });
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
      
      expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
    });

    it('shows error for weak passwords', () => {
      renderComponent();
      
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'weak' } });
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
      
      expect(screen.getByText(/Password must be at least 8 characters long and include an uppercase letter/i)).toBeInTheDocument();
    });

    it('shows error when passwords do not match', () => {
      renderComponent();
      
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPass@123' } });
      fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'DifferentPass@123' } });
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
      
      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    });
  });

  describe('Interactive UX', () => {
    it('clears error messages when user types in the field', () => {
      renderComponent();
      
      // Trigger errors
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
      expect(screen.getByText('Full name is required.')).toBeInTheDocument();
      
      // Fix error
      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Ganesh' } });
      
      // Error should immediately disappear without resubmitting
      expect(screen.queryByText('Full name is required.')).not.toBeInTheDocument();
    });

    it('clears terms error when checkbox is clicked', () => {
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
      expect(screen.getByText(/You must agree to the terms/i)).toBeInTheDocument();
      
      fireEvent.click(screen.getByRole('checkbox'));
      expect(screen.queryByText(/You must agree to the terms/i)).not.toBeInTheDocument();
    });

    it('toggles password visibility when clicking the eye icon', () => {
      renderComponent();
      
      const passwordInput = screen.getByLabelText('Password');
      // Assuming the first button inside the form is the eye toggle for password
      // lucide-react renders SVGs inside buttons. We'll target the buttons in the relative divs.
      const toggleButtons = screen.getAllByRole('button').filter(btn => btn.className.includes('absolute'));
      const passwordToggleBtn = toggleButtons[0];

      expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Click to show password
      fireEvent.click(passwordToggleBtn);
      expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Click to hide password
      fireEvent.click(passwordToggleBtn);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Successful Registration', () => {
    it('calls signup and navigates to home when registration is fully valid', async () => {
      useUser.mockReturnValue({ signup: mockSignup });
      mockSignup.mockResolvedValue();
      renderComponent();
      
      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'ganesh kumar' } });
      fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'ganesh@example.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPass@123' } });
      fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'StrongPass@123' } });
      fireEvent.click(screen.getByRole('checkbox'));
      
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
      
      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith('ganesh kumar', 'ganesh@example.com', 'StrongPass@123');
      });
      
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });
});