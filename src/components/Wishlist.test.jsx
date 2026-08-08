import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Wishlist from './Wishlist';
import { MemoryRouter } from 'react-router-dom';
import { useStore } from '../store/useStore';

vi.mock('../hooks/useFadeIn', () => ({
  useFadeIn: () => true,
}));

vi.mock('../store/useStore', () => ({
  useStore: vi.fn(),
}));

vi.mock('../hooks/useCart', () => ({
  useCart: vi.fn(),
}));

vi.mock('../utils.js', () => ({
  formatINR: (amount) => `₹${amount}`,
}));

import { useCart } from '../hooks/useCart';

const product = {
  id: 'p1',
  name: 'Royal Poshak',
  price: 15000,
  image: 'poshak.jpg',
};

describe('Wishlist Component', () => {
  const mockToggleWishlist = vi.fn();
  const mockAddToCart = vi.fn();

  const renderWishlist = (wishlist) => {
    useStore.mockReturnValue({ wishlist, toggleWishlist: mockToggleWishlist });
    useCart.mockReturnValue({ addToCart: mockAddToCart });
    return render(
      <MemoryRouter>
        <Wishlist />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the empty state with a link back to the collection', () => {
    renderWishlist([]);
    expect(screen.getByText('Your wishlist is empty')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explore Collection/i })).toHaveAttribute('href', '/');
  });

  it('renders the wishlist items with a count badge', () => {
    renderWishlist([product, { ...product, id: 'p2', name: 'Second Item' }]);
    expect(screen.getByText('Royal Poshak')).toBeInTheDocument();
    expect(screen.getByText('Second Item')).toBeInTheDocument();
    expect(screen.getByText('2 items')).toBeInTheDocument();
  });

  it('removes an item from the wishlist', () => {
    renderWishlist([product]);
    fireEvent.click(screen.getByLabelText('Remove from wishlist'));
    expect(mockToggleWishlist).toHaveBeenCalledWith(product);
  });

  it('adds an item to the cart with the selected size from the modal', () => {
    renderWishlist([product]);

    fireEvent.click(screen.getByText('Add to Cart'));
    expect(screen.getByText('Select Size')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'XL' }));
    const modalButtons = screen.getAllByRole('button', { name: /Add to Cart/ });
    fireEvent.click(modalButtons[modalButtons.length - 1]);

    expect(mockAddToCart).toHaveBeenCalledWith(product, 'XL');
  });

  it('closes the size modal without adding when cancelled', () => {
    renderWishlist([product]);

    fireEvent.click(screen.getByText('Add to Cart'));
    expect(screen.getByText('Select Size')).toBeInTheDocument();

    const closeButton = screen
      .getAllByRole('button')
      .find((b) => b.textContent.trim() === '' && !b.getAttribute('aria-label'));
    fireEvent.click(closeButton);

    expect(screen.queryByText('Select Size')).not.toBeInTheDocument();
    expect(mockAddToCart).not.toHaveBeenCalled();
  });
});
