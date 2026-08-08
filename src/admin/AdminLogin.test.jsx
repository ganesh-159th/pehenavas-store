import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AdminLogin from './AdminLogin';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockAdminLogin = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../store/useStore', () => ({
  useStore: () => ({ adminLogin: mockAdminLogin }),
}));

vi.mock('../firebase', () => ({
  auth: null,
}));

describe('AdminLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const submit = async () => {
    fireEvent.click(screen.getByRole('button', { name: /Sign In to Dashboard/i }));
    await act(async () => {
      vi.advanceTimersByTime(900);
    });
  };

  it('renders the admin portal heading', () => {
    render(<AdminLogin />);
    expect(screen.getByText('Admin Portal')).toBeInTheDocument();
  });

  it('toggles the password visibility', () => {
    render(<AdminLogin />);
    const password = screen.getByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('shows an error when fields are empty', () => {
    render(<AdminLogin />);
    fireEvent.change(screen.getByLabelText('Admin Username'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In to Dashboard/i }));

    expect(screen.getByText('Please enter both username and password.')).toBeInTheDocument();
    expect(mockAdminLogin).not.toHaveBeenCalled();
  });

  it('navigates to the dashboard after a successful login', async () => {
    mockAdminLogin.mockReturnValue(true);
    render(<AdminLogin />);

    await submit();

    expect(mockAdminLogin).toHaveBeenCalledWith('admin', 'admin123');
    expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
  });

  it('shows an error for invalid credentials', async () => {
    mockAdminLogin.mockReturnValue(false);
    render(<AdminLogin />);

    fireEvent.change(screen.getByLabelText('Admin Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });

    await submit();

    expect(screen.getByText('Invalid credentials. Please try again.')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
