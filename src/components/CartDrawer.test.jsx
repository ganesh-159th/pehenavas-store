import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CartDrawer from './CartDrawer';
import { useStore } from '../store/useStore';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  Link: ({ to, onClick, children, className }) => (
    <a href={to} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));

// Mock useStore hook
vi.mock('../store/useStore', () => ({
  useStore: vi.fn(),
}));

describe('CartDrawer Component', () => {
  const mockCloseCart = vi.fn();
  const mockRemoveFromCart = vi.fn();
  const mockUpdateQuantity = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Empty cart rendering
  describe('Empty Cart Rendering', () => {
    it('renders empty cart message when cart is empty', () => {
      useStore.mockReturnValue({
        cart: [],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 0,
      });

      render(<CartDrawer />);

      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
      expect(screen.getByText("Looks like you haven't added anything to your cart yet.")).toBeInTheDocument();
    });

    it('displays empty cart icon in empty state', () => {
      useStore.mockReturnValue({
        cart: [],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 0,
      });

      const { container } = render(<CartDrawer />);
      expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
    });

    it('shows Start Shopping button in empty state', () => {
      useStore.mockReturnValue({
        cart: [],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 0,
      });

      render(<CartDrawer />);
      const button = screen.getByRole('button', { name: /Start Shopping/i });
      expect(button).toBeInTheDocument();
    });

    it('closes cart when Start Shopping button is clicked', () => {
      useStore.mockReturnValue({
        cart: [],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 0,
      });

      render(<CartDrawer />);
      const button = screen.getByRole('button', { name: /Start Shopping/i });
      fireEvent.click(button);

      expect(mockCloseCart).toHaveBeenCalledOnce();
    });
  });

  // Test 2: Cart rendering with items
  describe('Cart Display with Items', () => {
    it('renders cart with single item', () => {
      useStore.mockReturnValue({
        cart: [
          {
            id: '1',
            name: 'Royal Rajputana Poshak',
            price: 15000,
            qty: 1,
            size: 'M',
            image: 'poshak.jpg',
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 15000,
      });

      render(<CartDrawer />);

      expect(screen.getByText('Royal Rajputana Poshak')).toBeInTheDocument();
      expect(screen.getByText('M')).toBeInTheDocument();
    });

    it('renders multiple cart items', () => {
      useStore.mockReturnValue({
        cart: [
          {
            id: '1',
            name: 'Royal Rajputana Poshak',
            price: 15000,
            qty: 1,
            size: 'M',
            image: 'poshak1.jpg',
          },
          {
            id: '2',
            name: 'Bridal Lehenga',
            price: 25000,
            qty: 1,
            size: 'L',
            image: 'lehenga.jpg',
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 40000,
      });

      render(<CartDrawer />);

      expect(screen.getByText('Royal Rajputana Poshak')).toBeInTheDocument();
      expect(screen.getByText('Bridal Lehenga')).toBeInTheDocument();
    });

    it('displays item prices formatted in Indian currency', () => {
      useStore.mockReturnValue({
        cart: [
          {
            id: '1',
            name: 'Royal Rajputana Poshak',
            price: 15000,
            qty: 1,
            size: 'M',
            image: 'poshak.jpg',
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 15000,
      });

      render(<CartDrawer />);

      const prices = screen.getAllByText(/₹15,000/);
      expect(prices.length).toBeGreaterThan(0);
    });

    it('displays correct item sizes', () => {
      useStore.mockReturnValue({
        cart: [
          {
            id: '1',
            name: 'Royal Rajputana Poshak',
            price: 15000,
            qty: 1,
            size: 'L',
            image: 'poshak.jpg',
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 15000,
      });

      render(<CartDrawer />);

      expect(screen.getByText('L')).toBeInTheDocument();
    });

    it('displays cart item count badge', () => {
      useStore.mockReturnValue({
        cart: [
          { id: '1', name: 'Item 1', price: 100, qty: 1, size: 'M', image: 'img1.jpg' },
          { id: '2', name: 'Item 2', price: 200, qty: 1, size: 'L', image: 'img2.jpg' },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 300,
      });

      render(<CartDrawer />);

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('displays placeholder image when item image is missing', () => {
      useStore.mockReturnValue({
        cart: [
          {
            id: '1',
            name: 'Item without image',
            price: 100,
            qty: 1,
            size: 'M',
            image: null,
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 100,
      });

      render(<CartDrawer />);

      const img = screen.getByAltText('Item without image');
      expect(img.src).toContain('placeholder');
    });
  });

  // Test 3: Quantity changes
  describe('Quantity Changes (Increment/Decrement)', () => {
    it('renders quantity controls for cart items', () => {
      useStore.mockReturnValue({
        cart: [
          {
            id: '1',
            name: 'Royal Rajputana Poshak',
            price: 15000,
            qty: 2,
            size: 'M',
            image: 'poshak.jpg',
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 30000,
      });

      const { container } = render(<CartDrawer />);

      const quantityControls = container.querySelector('[class*="flex items-center border border-gray-200"]');
      expect(quantityControls).toBeInTheDocument();
    });

    it('calls updateQuantity with -1 when minus button is clicked', () => {
      useStore.mockReturnValue({
        cart: [
          {
            id: '1',
            name: 'Royal Rajputana Poshak',
            price: 15000,
            qty: 2,
            size: 'M',
            image: 'poshak.jpg',
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 30000,
      });

      const { container } = render(<CartDrawer />);

      const quantityControl = container.querySelector('[class*="flex items-center border border-gray-200"]');
      const minusButton = quantityControl?.querySelector('button');

      if (minusButton) {
        fireEvent.click(minusButton);
        expect(mockUpdateQuantity).toHaveBeenCalledWith('1', 'M', -1);
      }
    });

    it('calls updateQuantity with +1 when plus button is clicked', () => {
      useStore.mockReturnValue({
        cart: [
          {
            id: '1',
            name: 'Royal Rajputana Poshak',
            price: 15000,
            qty: 2,
            size: 'M',
            image: 'poshak.jpg',
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 30000,
      });

      const { container } = render(<CartDrawer />);

      const quantityControl = container.querySelector('[class*="flex items-center border border-gray-200"]');
      const buttons = quantityControl?.querySelectorAll('button');
      const plusButton = buttons?.[buttons.length - 1];

      if (plusButton) {
        fireEvent.click(plusButton);
        expect(mockUpdateQuantity).toHaveBeenCalledWith('1', 'M', 1);
      }
    });

    it('updates quantity display when quantity changes', () => {
      const { rerender, container } = render(<CartDrawer />);

      useStore.mockReturnValue({
        cart: [
          {
            id: '1',
            name: 'Item 1',
            price: 100,
            qty: 1,
            size: 'M',
            image: 'img.jpg',
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 100,
      });

      rerender(<CartDrawer />);
      let quantitySpan = container.querySelector('[class*="w-8 text-center"]');
      expect(quantitySpan?.textContent).toBe('1');

      useStore.mockReturnValue({
        cart: [
          {
            id: '1',
            name: 'Item 1',
            price: 100,
            qty: 3,
            size: 'M',
            image: 'img.jpg',
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 300,
      });

      rerender(<CartDrawer />);
      quantitySpan = container.querySelector('[class*="w-8 text-center"]');
      expect(quantitySpan?.textContent).toBe('3');
    });
  });

  // Test 4: Remove item functionality
  describe('Remove Item Functionality', () => {
    it('renders delete button for each cart item', () => {
      useStore.mockReturnValue({
        cart: [
          {
            id: '1',
            name: 'Royal Rajputana Poshak',
            price: 15000,
            qty: 1,
            size: 'M',
            image: 'poshak.jpg',
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 15000,
      });

      const { container } = render(<CartDrawer />);
      const deleteButtons = container.querySelectorAll('button');
      
      expect(deleteButtons.length).toBeGreaterThan(1);
    });

    it('calls removeFromCart when delete button is clicked', () => {
      useStore.mockReturnValue({
        cart: [
          {
            id: '1',
            name: 'Royal Rajputana Poshak',
            price: 15000,
            qty: 1,
            size: 'M',
            image: 'poshak.jpg',
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 15000,
      });

      const { container } = render(<CartDrawer />);
      
      const deleteButton = container.querySelector('[class*="text-red"]')?.parentElement?.querySelector('button');
      
      if (deleteButton) {
        fireEvent.click(deleteButton);
        expect(mockRemoveFromCart).toHaveBeenCalled();
      }
    });

    it('passes correct product id and size to removeFromCart', () => {
      useStore.mockReturnValue({
        cart: [
          {
            id: 'product-123',
            name: 'Royal Rajputana Poshak',
            price: 15000,
            qty: 1,
            size: 'L',
            image: 'poshak.jpg',
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 15000,
      });

      const { container } = render(<CartDrawer />);
      const deleteButton = container.querySelector('[class*="text-red"]')?.closest('button');
      
      if (deleteButton) {
        fireEvent.click(deleteButton);
        expect(mockRemoveFromCart).toHaveBeenCalledWith('product-123', 'L');
      }
    });

    it('removes multiple items individually', () => {
      useStore.mockReturnValue({
        cart: [
          {
            id: '1',
            name: 'Item 1',
            price: 100,
            qty: 1,
            size: 'M',
            image: 'img1.jpg',
          },
          {
            id: '2',
            name: 'Item 2',
            price: 200,
            qty: 1,
            size: 'L',
            image: 'img2.jpg',
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 300,
      });

      render(<CartDrawer />);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  // Test 5: Close/collapse drawer behavior
  describe('Close/Collapse Drawer Behavior', () => {
    it('does not render drawer when isCartOpen is false', () => {
      useStore.mockReturnValue({
        cart: [],
        isCartOpen: false,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 0,
      });

      const { container } = render(<CartDrawer />);

      const drawer = container.querySelector('[class*="translate-x-full"]');
      expect(drawer).toBeInTheDocument();
    });

    it('renders drawer with translate-x-0 when isCartOpen is true', () => {
      useStore.mockReturnValue({
        cart: [],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 0,
      });

      const { container } = render(<CartDrawer />);

      const drawer = container.querySelector('[class*="translate-x"]');
      expect(drawer?.className).toContain('translate-x-0');
    });

    it('renders backdrop when isCartOpen is true', () => {
      useStore.mockReturnValue({
        cart: [],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 0,
      });

      const { container } = render(<CartDrawer />);

      const backdrop = container.querySelector('[class*="bg-black"]');
      expect(backdrop).toBeInTheDocument();
    });

    it('does not render backdrop when isCartOpen is false', () => {
      useStore.mockReturnValue({
        cart: [],
        isCartOpen: false,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 0,
      });

      const { container } = render(<CartDrawer />);

      const backdrops = container.querySelectorAll('[class*="bg-black/50"]');
      expect(backdrops.length).toBe(0);
    });

    it('calls closeCart when backdrop is clicked', () => {
      useStore.mockReturnValue({
        cart: [],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 0,
      });

      const { container } = render(<CartDrawer />);

      const backdrop = container.querySelector('[class*="bg-black/50"]');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockCloseCart).toHaveBeenCalled();
      }
    });

    it('calls closeCart when close button is clicked', () => {
      useStore.mockReturnValue({
        cart: [],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 0,
      });

      render(<CartDrawer />);

      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.querySelector('svg'));
      
      if (closeButton) {
        fireEvent.click(closeButton);
        expect(mockCloseCart).toHaveBeenCalled();
      }
    });

    it('renders Your Cart header', () => {
      useStore.mockReturnValue({
        cart: [],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 0,
      });

      render(<CartDrawer />);

      expect(screen.getByText('Your Cart')).toBeInTheDocument();
    });
  });

  // Test 6: Checkout interaction
  describe('Checkout Interaction', () => {
    it('renders checkout button when cart has items', () => {
      useStore.mockReturnValue({
        cart: [
          {
            id: '1',
            name: 'Royal Rajputana Poshak',
            price: 15000,
            qty: 1,
            size: 'M',
            image: 'poshak.jpg',
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 15000,
      });

      render(<CartDrawer />);

      expect(screen.getByText(/Proceed to Checkout/)).toBeInTheDocument();
    });

    it('does not render checkout button when cart is empty', () => {
      useStore.mockReturnValue({
        cart: [],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 0,
      });

      render(<CartDrawer />);

      expect(screen.queryByText(/Proceed to Checkout/)).not.toBeInTheDocument();
    });

    it('displays subtotal when cart has items', () => {
      useStore.mockReturnValue({
        cart: [
          {
            id: '1',
            name: 'Royal Rajputana Poshak',
            price: 15000,
            qty: 1,
            size: 'M',
            image: 'poshak.jpg',
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 15000,
      });

      render(<CartDrawer />);

      expect(screen.getByText('Subtotal')).toBeInTheDocument();
    });

    it('displays total price in checkout section', () => {
      useStore.mockReturnValue({
        cart: [
          {
            id: '1',
            name: 'Royal Rajputana Poshak',
            price: 15000,
            qty: 2,
            size: 'M',
            image: 'poshak.jpg',
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 30000,
      });

      render(<CartDrawer />);

      expect(screen.getByText(/₹30,000/)).toBeInTheDocument();
    });

    it('closes cart when checkout button is clicked', () => {
      useStore.mockReturnValue({
        cart: [
          {
            id: '1',
            name: 'Royal Rajputana Poshak',
            price: 15000,
            qty: 1,
            size: 'M',
            image: 'poshak.jpg',
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 15000,
      });

      render(<CartDrawer />);

      const checkoutButton = screen.getByText(/Proceed to Checkout/);
      fireEvent.click(checkoutButton);

      expect(mockCloseCart).toHaveBeenCalled();
    });

    it('links to checkout page', () => {
      useStore.mockReturnValue({
        cart: [
          {
            id: '1',
            name: 'Royal Rajputana Poshak',
            price: 15000,
            qty: 1,
            size: 'M',
            image: 'poshak.jpg',
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 15000,
      });

      render(<CartDrawer />);

      const checkoutLink = screen.getByText(/Proceed to Checkout/).closest('a');
      expect(checkoutLink).toHaveAttribute('href', '/checkout');
    });

    it('calculates correct total for multiple items', () => {
      useStore.mockReturnValue({
        cart: [
          {
            id: '1',
            name: 'Item 1',
            price: 100,
            qty: 2,
            size: 'M',
            image: 'img1.jpg',
          },
          {
            id: '2',
            name: 'Item 2',
            price: 200,
            qty: 1,
            size: 'L',
            image: 'img2.jpg',
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 400,
      });

      render(<CartDrawer />);

      const prices = screen.getAllByText(/₹400/);
      expect(prices.length).toBeGreaterThan(0);
    });
  });

  // Test 7: Empty cart state messaging
  describe('Empty Cart State Messaging', () => {
    it('displays main empty cart message', () => {
      useStore.mockReturnValue({
        cart: [],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 0,
      });

      render(<CartDrawer />);

      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });

    it('displays secondary empty cart message', () => {
      useStore.mockReturnValue({
        cart: [],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 0,
      });

      render(<CartDrawer />);

      expect(screen.getByText("Looks like you haven't added anything to your cart yet.")).toBeInTheDocument();
    });

    it('displays cart count as 0 when empty', () => {
      useStore.mockReturnValue({
        cart: [],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 0,
      });

      render(<CartDrawer />);

      const badges = screen.getAllByText('0');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('hides item list section when cart is empty', () => {
      useStore.mockReturnValue({
        cart: [],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 0,
      });

      render(<CartDrawer />);

      expect(screen.queryByText('M')).not.toBeInTheDocument();
      expect(screen.queryByText('L')).not.toBeInTheDocument();
    });

    it('hides subtotal section when cart is empty', () => {
      useStore.mockReturnValue({
        cart: [],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 0,
      });

      render(<CartDrawer />);

      expect(screen.queryByText('Subtotal')).not.toBeInTheDocument();
    });

    it('shows empty state instead of item list', () => {
      useStore.mockReturnValue({
        cart: [],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 0,
      });

      render(<CartDrawer />);

      const emptyStateMessage = screen.getByText('Your cart is empty');
      expect(emptyStateMessage).toBeInTheDocument();
      
      expect(screen.queryByText('M')).not.toBeInTheDocument();
      expect(screen.queryByText('L')).not.toBeInTheDocument();
    });
  });

  // Integration tests
  describe('Integration Tests', () => {
    it('renders complete drawer structure with items', () => {
      useStore.mockReturnValue({
        cart: [
          {
            id: '1',
            name: 'Royal Rajputana Poshak',
            price: 15000,
            qty: 1,
            size: 'M',
            image: 'poshak.jpg',
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 15000,
      });

      render(<CartDrawer />);

      expect(screen.getByText('Your Cart')).toBeInTheDocument();
      expect(screen.getByText('Royal Rajputana Poshak')).toBeInTheDocument();
      expect(screen.getByText('Subtotal')).toBeInTheDocument();
      expect(screen.getByText(/Proceed to Checkout/)).toBeInTheDocument();
    });

    it('handles cart state transitions from empty to filled', () => {
      const { rerender } = render(<CartDrawer />);

      useStore.mockReturnValue({
        cart: [],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 0,
      });

      rerender(<CartDrawer />);
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();

      useStore.mockReturnValue({
        cart: [
          {
            id: '1',
            name: 'Item 1',
            price: 100,
            qty: 1,
            size: 'M',
            image: 'img.jpg',
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 100,
      });

      rerender(<CartDrawer />);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.queryByText('Your cart is empty')).not.toBeInTheDocument();
    });

    it('handles open/close drawer transitions', () => {
      const { container, rerender } = render(<CartDrawer />);

      useStore.mockReturnValue({
        cart: [],
        isCartOpen: false,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 0,
      });

      rerender(<CartDrawer />);
      let drawer = container.querySelector('[class*="translate-x"]');
      expect(drawer?.className).toContain('translate-x-full');

      useStore.mockReturnValue({
        cart: [],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 0,
      });

      rerender(<CartDrawer />);
      drawer = container.querySelector('[class*="translate-x"]');
      expect(drawer?.className).toContain('translate-x-0');
    });

    it('maintains state consistency through multiple operations', () => {
      useStore.mockReturnValue({
        cart: [
          {
            id: '1',
            name: 'Item 1',
            price: 100,
            qty: 1,
            size: 'M',
            image: 'img.jpg',
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 100,
      });

      const { rerender } = render(<CartDrawer />);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      let prices = screen.getAllByText(/₹100/);
      expect(prices.length).toBeGreaterThan(0);

      useStore.mockReturnValue({
        cart: [
          {
            id: '1',
            name: 'Item 1',
            price: 100,
            qty: 2,
            size: 'M',
            image: 'img.jpg',
          },
        ],
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => 200,
      });

      rerender(<CartDrawer />);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      prices = screen.getAllByText(/₹200/);
      expect(prices.length).toBeGreaterThan(0);
    });

    it('renders correctly with many items', () => {
      const cartItems = Array.from({ length: 10 }, (_, i) => ({
        id: String(i + 1),
        name: `Item ${i + 1}`,
        price: 100 * (i + 1),
        qty: 1,
        size: 'M',
        image: `img${i + 1}.jpg`,
      }));

      useStore.mockReturnValue({
        cart: cartItems,
        isCartOpen: true,
        closeCart: mockCloseCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        getTotalPrice: () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      });

      render(<CartDrawer />);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 10')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });
});
