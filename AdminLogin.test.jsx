import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminLogin from './AdminLogin';
import { useStore } from './src/store/useStore';

// Mock the useStore hook
vi.mock('./src/store/useStore', () => ({
  useStore: vi.fn(),
}));

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminLogin Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.mockReturnValue({ adminLogin: vi.fn() });
  });

  const renderComponent = () => {
    render(
      <BrowserRouter>
        <AdminLogin />
      </BrowserRouter>
    );
  };

  it('renders the login portal correctly', () => {
    renderComponent();
    expect(screen.getByText('Admin Portal')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('shows validation error when submitting with empty fields', () => {
    renderComponent();
    
    // Clear the default values and submit
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: ' ' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: ' ' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in to dashboard/i }));

    // Assert the error message is displayed
    expect(screen.getByText('Please enter both username and password.')).toBeInTheDocument();
  });
});