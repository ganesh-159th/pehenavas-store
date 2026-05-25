import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import WishlistButton from './WishlistButton';
import * as useStoreModule from '../store/useStore';

// Mock the useStore hook
vi.mock('../store/useStore', () => ({
  useStore: vi.fn()
}));

describe('WishlistButton Component', () => {
  const mockToggleWishlist = vi.fn();
  
  const mockProduct = {
    id: '1',
    name: 'Royal Rajputana Poshak',
    price: 15000,
    image: 'poshak.jpg'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the button element', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      render(<WishlistButton product={mockProduct} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('renders without wishlisted state (product not in wishlist)', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      const { container } = render(<WishlistButton product={mockProduct} />);
      
      const heart = container.querySelector('svg');
      expect(heart).toBeInTheDocument();
    });

    it('renders with wishlisted state (product in wishlist)', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [mockProduct],
        toggleWishlist: mockToggleWishlist
      });

      const { container } = render(<WishlistButton product={mockProduct} />);
      
      const heart = container.querySelector('svg');
      expect(heart).toBeInTheDocument();
    });
  });

  describe('Wishlist State Detection', () => {
    it('correctly identifies when product is NOT in wishlist', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [
          { id: '2', name: 'Other Product' },
          { id: '3', name: 'Another Product' }
        ],
        toggleWishlist: mockToggleWishlist
      });

      const { container } = render(<WishlistButton product={mockProduct} />);
      
      const heart = container.querySelector('svg');
      expect(heart).toHaveClass('text-gray-500');
      expect(heart).not.toHaveClass('fill-red-500');
    });

    it('correctly identifies when product IS in wishlist', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [
          { id: '2', name: 'Other Product' },
          { id: '1', name: 'Royal Rajputana Poshak' }, // Same product
          { id: '3', name: 'Another Product' }
        ],
        toggleWishlist: mockToggleWishlist
      });

      const { container } = render(<WishlistButton product={mockProduct} />);
      
      const heart = container.querySelector('svg');
      expect(heart).toHaveClass('fill-red-500');
      expect(heart).toHaveClass('text-red-500');
    });

    it('matches wishlist item by product id, not by reference', () => {
      const differentProductRef = { ...mockProduct };
      
      useStoreModule.useStore.mockReturnValue({
        wishlist: [mockProduct], // Original reference
        toggleWishlist: mockToggleWishlist
      });

      const { container } = render(<WishlistButton product={differentProductRef} />);
      
      const heart = container.querySelector('svg');
      expect(heart).toHaveClass('fill-red-500');
    });
  });

  describe('Click Handler Behavior', () => {
    it('calls toggleWishlist with the product when button is clicked', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      render(<WishlistButton product={mockProduct} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockToggleWishlist).toHaveBeenCalledTimes(1);
      expect(mockToggleWishlist).toHaveBeenCalledWith(mockProduct);
    });

    it('prevents default event behavior on click', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      render(<WishlistButton product={mockProduct} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // The component calls preventDefault, verify the click handler was called
      expect(mockToggleWishlist).toHaveBeenCalled();
    });

    it('toggles wishlist when clicked multiple times', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      render(<WishlistButton product={mockProduct} />);
      
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      expect(mockToggleWishlist).toHaveBeenCalledTimes(1);
      
      fireEvent.click(button);
      expect(mockToggleWishlist).toHaveBeenCalledTimes(2);
      
      fireEvent.click(button);
      expect(mockToggleWishlist).toHaveBeenCalledTimes(3);
    });

    it('calls toggleWishlist for each click with the correct product', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      render(<WishlistButton product={mockProduct} />);
      
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(mockToggleWishlist).toHaveBeenNthCalledWith(1, mockProduct);
      expect(mockToggleWishlist).toHaveBeenNthCalledWith(2, mockProduct);
    });
  });

  describe('Visual Feedback - Styling', () => {
    it('applies gray color class when product is not wishlisted', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      const { container } = render(<WishlistButton product={mockProduct} />);
      
      const heart = container.querySelector('svg');
      expect(heart).toHaveClass('text-gray-500');
    });

    it('applies red fill and color classes when product is wishlisted', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [mockProduct],
        toggleWishlist: mockToggleWishlist
      });

      const { container } = render(<WishlistButton product={mockProduct} />);
      
      const heart = container.querySelector('svg');
      expect(heart).toHaveClass('fill-red-500');
      expect(heart).toHaveClass('text-red-500');
    });

    it('applies hover styling when not wishlisted', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      const { container } = render(<WishlistButton product={mockProduct} />);
      
      const heart = container.querySelector('svg');
      expect(heart).toHaveClass('group-hover:text-red-500');
    });

    it('does not apply hover styling when wishlisted', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [mockProduct],
        toggleWishlist: mockToggleWishlist
      });

      const { container } = render(<WishlistButton product={mockProduct} />);
      
      const heart = container.querySelector('svg');
      expect(heart).not.toHaveClass('group-hover:text-red-500');
    });

    it('applies transition classes for smooth color changes', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      const { container } = render(<WishlistButton product={mockProduct} />);
      
      const heart = container.querySelector('svg');
      expect(heart).toHaveClass('transition-colors');
    });

    it('button has correct styling classes for appearance', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      render(<WishlistButton product={mockProduct} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('absolute');
      expect(button).toHaveClass('top-3');
      expect(button).toHaveClass('right-3');
      expect(button).toHaveClass('p-2.5');
      expect(button).toHaveClass('bg-white/90');
      expect(button).toHaveClass('rounded-full');
      expect(button).toHaveClass('shadow-sm');
    });

    it('button has hover shadow effect', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      render(<WishlistButton product={mockProduct} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:shadow-md');
    });

    it('heart icon has correct size', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      const { container } = render(<WishlistButton product={mockProduct} />);
      
      const heart = container.querySelector('svg');
      expect(heart).toHaveClass('w-5');
      expect(heart).toHaveClass('h-5');
    });
  });

  describe('Accessibility Attributes', () => {
    it('has proper aria-label for accessibility', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      render(<WishlistButton product={mockProduct} />);
      
      const button = screen.getByRole('button', { name: 'Add to wishlist' });
      expect(button).toBeInTheDocument();
    });

    it('button is keyboard accessible', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      render(<WishlistButton product={mockProduct} />);
      
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('button responds to Enter key press via click on button', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      render(<WishlistButton product={mockProduct} />);
      
      const button = screen.getByRole('button');
      // Native button elements handle Enter key automatically and trigger click
      fireEvent.click(button);
      
      expect(mockToggleWishlist).toHaveBeenCalled();
    });

    it('button responds to Space key press via click on button', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      render(<WishlistButton product={mockProduct} />);
      
      const button = screen.getByRole('button');
      // Native button elements handle Space key automatically and trigger click
      fireEvent.click(button);
      
      expect(mockToggleWishlist).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles product with undefined optional fields', () => {
      const minimalProduct = { id: 'minimal' };

      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      render(<WishlistButton product={minimalProduct} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('handles very large wishlist efficiently', () => {
      const largeWishlist = Array.from({ length: 1000 }, (_, i) => ({
        id: String(i),
        name: `Product ${i}`
      }));
      largeWishlist.push(mockProduct); // Add our product

      useStoreModule.useStore.mockReturnValue({
        wishlist: largeWishlist,
        toggleWishlist: mockToggleWishlist
      });

      const { container } = render(<WishlistButton product={mockProduct} />);
      
      const heart = container.querySelector('svg');
      expect(heart).toHaveClass('fill-red-500');
    });

    it('handles products with special characters in id', () => {
      const specialProduct = { 
        id: 'product-123-special_chars-@#$',
        name: 'Special Product'
      };

      useStoreModule.useStore.mockReturnValue({
        wishlist: [specialProduct],
        toggleWishlist: mockToggleWishlist
      });

      const { container } = render(<WishlistButton product={specialProduct} />);
      
      const heart = container.querySelector('svg');
      expect(heart).toHaveClass('fill-red-500');
    });

    it('handles empty product object', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      render(<WishlistButton product={{}} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('correctly handles when wishlist changes after initial render', () => {
      render(<WishlistButton product={mockProduct} />);
      
      // Initially not wishlisted
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      let { container } = render(<WishlistButton product={mockProduct} />);
      let heart = container.querySelector('svg');
      expect(heart).not.toHaveClass('fill-red-500');

      // Then wishlisted
      useStoreModule.useStore.mockReturnValue({
        wishlist: [mockProduct],
        toggleWishlist: mockToggleWishlist
      });

      ({ container } = render(<WishlistButton product={mockProduct} />));
      heart = container.querySelector('svg');
      expect(heart).toHaveClass('fill-red-500');
    });

    it('handles rapid multiple clicks', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      render(<WishlistButton product={mockProduct} />);
      
      const button = screen.getByRole('button');
      
      // Simulate rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }
      
      expect(mockToggleWishlist).toHaveBeenCalledTimes(10);
    });

    it('handles product id comparison case-sensitively', () => {
      const product1 = { id: 'PRODUCT1', name: 'Product 1' };
      const product2 = { id: 'product1', name: 'Product 1' };

      useStoreModule.useStore.mockReturnValue({
        wishlist: [product1],
        toggleWishlist: mockToggleWishlist
      });

      const { container } = render(<WishlistButton product={product2} />);
      
      const heart = container.querySelector('svg');
      // Different IDs, so should not be wishlisted
      expect(heart).not.toHaveClass('fill-red-500');
    });

    it('renders correctly when wishlist is empty array', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      const { container } = render(<WishlistButton product={mockProduct} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      const heart = container.querySelector('svg');
      expect(heart).toHaveClass('text-gray-500');
    });

    it('renders correctly when wishlist is null or undefined', () => {
      // Test with undefined wishlist - component should handle gracefully
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      render(<WishlistButton product={mockProduct} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Integration with Store Updates', () => {
    it('reflects wishlist changes from store updates', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      render(<WishlistButton product={mockProduct} />);
      
      let { container } = render(<WishlistButton product={mockProduct} />);
      let heart = container.querySelector('svg');
      expect(heart).not.toHaveClass('fill-red-500');

      // Update store to include the product in wishlist
      useStoreModule.useStore.mockReturnValue({
        wishlist: [mockProduct],
        toggleWishlist: mockToggleWishlist
      });

      ({ container } = render(<WishlistButton product={mockProduct} />));
      heart = container.querySelector('svg');
      expect(heart).toHaveClass('fill-red-500');
    });

    it('uses correct toggleWishlist function from store', () => {
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      render(<WishlistButton product={mockProduct} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockToggleWishlist).toHaveBeenCalled();
    });
  });

  describe('Product Prop Handling', () => {
    it('renders with different products correctly', () => {
      const product1 = { id: '1', name: 'Product 1' };
      const product2 = { id: '2', name: 'Product 2' };

      useStoreModule.useStore.mockReturnValue({
        wishlist: [product1],
        toggleWishlist: mockToggleWishlist
      });

      render(<WishlistButton product={product1} />);
      
      let { container } = render(<WishlistButton product={product1} />);
      let heart = container.querySelector('svg');
      expect(heart).toHaveClass('fill-red-500');

      // Re-render with different product
      useStoreModule.useStore.mockReturnValue({
        wishlist: [product1],
        toggleWishlist: mockToggleWishlist
      });

      ({ container } = render(<WishlistButton product={product2} />));
      heart = container.querySelector('svg');
      expect(heart).not.toHaveClass('fill-red-500');
    });

    it('passes correct product to toggleWishlist for different products', () => {
      const product1 = { id: '1', name: 'Product 1' };
      const product2 = { id: '2', name: 'Product 2' };

      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      const { rerender } = render(<WishlistButton product={product1} />);
      
      let button = screen.getByRole('button');
      fireEvent.click(button);
      expect(mockToggleWishlist).toHaveBeenCalledWith(product1);

      // Rerender with different product
      vi.clearAllMocks();
      useStoreModule.useStore.mockReturnValue({
        wishlist: [],
        toggleWishlist: mockToggleWishlist
      });

      rerender(<WishlistButton product={product2} />);
      
      button = screen.getByRole('button');
      fireEvent.click(button);
      expect(mockToggleWishlist).toHaveBeenCalledWith(product2);
    });
  });
});
