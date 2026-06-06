import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { useCart } from './hooks/useCart';
import { useUser } from './hooks/useUser';

// 1. Mock the custom hooks
vi.mock('./hooks/useCart', () => ({
  useCart: vi.fn()
}));

vi.mock('./hooks/useUser', () => ({
  useUser: vi.fn()
}));

// 2. Mock utility functions
vi.mock('./utils.js', () => ({
  formatINR: (amount) => `₹${amount}`
}));

// 3. Mock fetch to prevent real network calls
globalThis.fetch = vi.fn(() => Promise.reject(new Error('fetch not available')));

// 4. Mock window.scrollTo since jsdom (the simulated browser) doesn't implement it
window.scrollTo = vi.fn();

describe('App Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default hook returns for a logged-out user with an empty cart
    useCart.mockReturnValue({
      cart: [],
      isCartOpen: false,
      setIsCartOpen: vi.fn(),
      cartTotal: 0
    });
    useUser.mockReturnValue({
      user: null,
      logout: vi.fn()
    });
  });

  it('renders the header, footer, and home page by default', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    // Instantly available components
    expect(screen.getAllByText('PEHENAVAS')[0]).toBeInTheDocument();
    expect(screen.getByText(/Get to Know Us/i)).toBeInTheDocument();
    
    // Wait for Suspense to finish lazy-loading the Home page
    expect(await screen.findByText('The Royal Rajputana Collection')).toBeInTheDocument();
  });

  it('opens the search modal and displays results dynamically', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    // 1. Find and click the search icon button in the header
    // (It's the second button in the DOM after the mobile menu)
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]); 

    // 2. Wait for the modal to open
    const searchInput = await screen.findByPlaceholderText(/Search for royal heritage products/i);
    expect(searchInput).toBeInTheDocument();

    // 3. Type 'saree'
    fireEvent.change(searchInput, { target: { value: 'saree' } });

    // 4. Verify the global PRODUCTS data is filtered and displayed in the modal
    // We use findAllByText because it appears in both the Modal and the Home page behind it!
    const sareeElements = await screen.findAllByText('Jaipuri Bandhani Saree');
    expect(sareeElements[0]).toBeInTheDocument();
  });

  it('navigates to the sign in page when clicking Sign In', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Namaste, Sign in'));

    // Wait for Suspense to load SignIn.jsx
    expect(await screen.findByText('Sign in to access your account')).toBeInTheDocument();
  });
});