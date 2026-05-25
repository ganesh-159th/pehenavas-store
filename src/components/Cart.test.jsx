import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Cart from './Cart';
import { useCart } from '../hooks/useCart';
import { useUser } from '../hooks/useUser';

// 1. Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

// 2. Mock the useCart hook
vi.mock('../hooks/useCart', () => ({
  useCart: vi.fn()
}));

// 3. Mock the useUser hook
vi.mock('../hooks/useUser', () => ({
  useUser: vi.fn()
}));

// 3. Mock the utility function so currency formatting is predictable in the test
vi.mock('../utils.js', () => ({
  formatINR: (amount) => `₹${amount}`
}));

describe('Cart Component', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Reset mocks before each test
  });

  it('returns null and does not render when isCartOpen is false', () => {
    useUser.mockReturnValue({ user: null });
    useCart.mockReturnValue({ isCartOpen: false });
    const { container } = render(<Cart />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the empty cart state correctly', () => {
    useUser.mockReturnValue({ user: null });
    useCart.mockReturnValue({
      isCartOpen: true,
      cart: [],
      setIsCartOpen: vi.fn(),
    });
    render(<Cart />);
    
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
  });

  it('renders cart items and handles checkout navigation', () => {
    useUser.mockReturnValue({ user: { name: 'Test User' } });
    const mockSetIsCartOpen = vi.fn();
    useCart.mockReturnValue({
      isCartOpen: true,
      cart: [
        { id: '1', name: 'Royal Rajputana Poshak', price: 15000, qty: 1, size: 'M', image: 'poshak.jpg' }
      ],
      cartTotal: 15000,
      setIsCartOpen: mockSetIsCartOpen,
      removeFromCart: vi.fn(),
      updateItemQuantity: vi.fn(),
    });

    render(<Cart />);
    
    expect(screen.getByText('Royal Rajputana Poshak')).toBeInTheDocument();
    
    // Test the checkout flow
    fireEvent.click(screen.getByText('Proceed to Checkout'));
    
    // Verify it closes the cart and navigates to the checkout page
    expect(mockSetIsCartOpen).toHaveBeenCalledWith(false);
    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });
});