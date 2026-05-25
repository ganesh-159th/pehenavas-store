import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Home from './Home';
import { useCart } from '../hooks/useCart';
import { BrowserRouter } from 'react-router-dom';

// Mock hooks and utils
vi.mock('../hooks/useCart', () => ({
  useCart: vi.fn()
}));

vi.mock('../utils.js', () => ({
  formatINR: (amount) => `₹${amount}`
}));

describe('Home Component', () => {
  const mockAddToCart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers(); // We use fake timers to test the 3-second success message and 5-second banner slide
    useCart.mockReturnValue({ addToCart: mockAddToCart });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders products and handles the Quick Add to cart flow', () => {
    // Render with empty search queries so it defaults to the full product list
    render(<Home searchResults={[]} searchQuery="" />, { wrapper: BrowserRouter });

    // 1. Verify the component rendered successfully
    expect(screen.getByText('Royal Rajwadi Poshak')).toBeInTheDocument();

    // 2. Click the first "Quick Add" button to open the modal
    const quickAddBtns = screen.getAllByText(/Quick Add/i);
    fireEvent.click(quickAddBtns[0]);

    // 3. Select a size (e.g., 'L')
    const sizeBtn = screen.getByRole('button', { name: 'L' });
    fireEvent.click(sizeBtn);

    // 4. Click Add to Cart
    const addToCartBtn = screen.getAllByRole('button', { name: /Add to Cart/i }).find(btn => btn.textContent.includes('Add to Cart'));
    fireEvent.click(addToCartBtn);

    // 5. Verify the cart hook was called properly with the size
    expect(mockAddToCart).toHaveBeenCalledWith(expect.any(Object), 'L');
  });
});