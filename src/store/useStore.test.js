import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

vi.mock('../utils/alert', () => ({
  showAlert: vi.fn(),
}));

describe('useStore', () => {
  let useStore;

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    ({ useStore } = await import('./useStore'));
    useStore.setState({
      cart: [],
      wishlist: [],
      orders: [],
      isCartOpen: false,
      isAdminAuthenticated: false,
      toastMessage: null,
      products: [
        { id: 1, name: 'Product A', price: 100, category: 'Men' },
        { id: 2, name: 'Product B', price: 200, category: 'Women' },
      ],
      serverConnected: false,
    });
  });

  describe('Cart Actions', () => {
    it('addToCart adds a new item', () => {
      act(() => {
        useStore.getState().addToCart({ id: 3, name: 'New', price: 50 }, 'M');
      });
      const cart = useStore.getState().cart;
      expect(cart).toHaveLength(1);
      expect(cart[0]).toMatchObject({ id: 3, name: 'New', price: 50, size: 'M', qty: 1 });
    });

    it('addToCart opens the cart drawer and sets toast', () => {
      act(() => {
        useStore.getState().addToCart({ id: 3, name: 'New', price: 50 }, 'M');
      });
      const state = useStore.getState();
      expect(state.isCartOpen).toBe(true);
      expect(state.toastMessage).toContain('New');
    });

    it('addToCart increments qty for duplicate product and size', () => {
      act(() => {
        useStore.getState().addToCart({ id: 1, name: 'Product A', price: 100 }, 'M');
      });
      act(() => {
        useStore.getState().addToCart({ id: 1, name: 'Product A', price: 100 }, 'M');
      });
      const cart = useStore.getState().cart;
      expect(cart).toHaveLength(1);
      expect(cart[0].qty).toBe(2);
    });

    it('addToCart adds separate entries for different sizes', () => {
      act(() => {
        useStore.getState().addToCart({ id: 1, name: 'Product A', price: 100 }, 'M');
      });
      act(() => {
        useStore.getState().addToCart({ id: 1, name: 'Product A', price: 100 }, 'L');
      });
      expect(useStore.getState().cart).toHaveLength(2);
    });

    it('removeFromCart removes the correct item', () => {
      act(() => {
        useStore.getState().addToCart({ id: 1, name: 'Product A', price: 100 }, 'M');
      });
      act(() => {
        useStore.getState().addToCart({ id: 2, name: 'Product B', price: 200 }, 'L');
      });
      act(() => {
        useStore.getState().removeFromCart(1, 'M');
      });
      expect(useStore.getState().cart).toHaveLength(1);
      expect(useStore.getState().cart[0].id).toBe(2);
    });

    it('updateItemQuantity updates qty', () => {
      act(() => {
        useStore.getState().addToCart({ id: 1, name: 'Product A', price: 100 }, 'M');
      });
      act(() => {
        useStore.getState().updateItemQuantity(1, 'M', 5);
      });
      expect(useStore.getState().cart[0].qty).toBe(5);
    });

    it('updateItemQuantity removes item if qty < 1', () => {
      act(() => {
        useStore.getState().addToCart({ id: 1, name: 'Product A', price: 100 }, 'M');
      });
      act(() => {
        useStore.getState().updateItemQuantity(1, 'M', 0);
      });
      expect(useStore.getState().cart).toHaveLength(0);
    });

    it('clearCart empties the cart', () => {
      act(() => {
        useStore.getState().addToCart({ id: 1, name: 'Product A', price: 100 }, 'M');
      });
      act(() => {
        useStore.getState().clearCart();
      });
      expect(useStore.getState().cart).toHaveLength(0);
    });

    it('updateQuantity increments by amount', () => {
      act(() => {
        useStore.getState().addToCart({ id: 1, name: 'Product A', price: 100 }, 'M');
      });
      act(() => {
        useStore.getState().updateQuantity(1, 'M', 2);
      });
      expect(useStore.getState().cart[0].qty).toBe(3);
    });

    it('updateQuantity does not go below 1', () => {
      act(() => {
        useStore.getState().addToCart({ id: 1, name: 'Product A', price: 100 }, 'M');
      });
      act(() => {
        useStore.getState().updateQuantity(1, 'M', -5);
      });
      expect(useStore.getState().cart[0].qty).toBe(1);
    });
  });

  describe('Cart Drawer', () => {
    it('openCart and closeCart toggle isCartOpen', () => {
      act(() => useStore.getState().openCart());
      expect(useStore.getState().isCartOpen).toBe(true);
      act(() => useStore.getState().closeCart());
      expect(useStore.getState().isCartOpen).toBe(false);
    });

    it('toggleCart flips the value', () => {
      act(() => useStore.getState().toggleCart());
      expect(useStore.getState().isCartOpen).toBe(true);
      act(() => useStore.getState().toggleCart());
      expect(useStore.getState().isCartOpen).toBe(false);
    });
  });

  describe('Wishlist Actions', () => {
    it('toggleWishlist adds item when not present', () => {
      act(() => {
        useStore.getState().toggleWishlist({ id: 1, name: 'Product A' });
      });
      expect(useStore.getState().wishlist).toHaveLength(1);
    });

    it('toggleWishlist removes item when already present', () => {
      act(() => {
        useStore.getState().toggleWishlist({ id: 1, name: 'Product A' });
      });
      act(() => {
        useStore.getState().toggleWishlist({ id: 1, name: 'Product A' });
      });
      expect(useStore.getState().wishlist).toHaveLength(0);
    });
  });

  describe('Admin Auth', () => {
    it('adminLogin returns true for correct credentials', () => {
      const result = useStore.getState().adminLogin('admin', 'admin123');
      expect(result).toBe(true);
      expect(useStore.getState().isAdminAuthenticated).toBe(true);
    });

    it('adminLogin returns false for incorrect credentials', () => {
      const result = useStore.getState().adminLogin('admin', 'wrong');
      expect(result).toBe(false);
      expect(useStore.getState().isAdminAuthenticated).toBe(false);
    });

    it('adminLogout sets isAdminAuthenticated to false', () => {
      useStore.getState().adminLogin('admin', 'admin123');
      act(() => useStore.getState().adminLogout());
      expect(useStore.getState().isAdminAuthenticated).toBe(false);
    });
  });

  describe('Orders', () => {
    it('addOrder adds an order to the list', () => {
      const order = { id: 'ORD-001', items: [], total: 500 };
      act(() => {
        useStore.getState().addOrder(order);
      });
      expect(useStore.getState().orders).toHaveLength(1);
      expect(useStore.getState().orders[0]).toEqual(order);
    });
  });

  describe('Product Management', () => {
    it('addProduct prepends a product with defaults', () => {
      act(() => {
        useStore.getState().addProduct({ name: 'New Product', price: 99 });
      });
      const products = useStore.getState().products;
      expect(products).toHaveLength(3);
      expect(products[0]).toMatchObject({
        name: 'New Product',
        price: 99,
        rating: 0,
        reviews: 0,
        colors: [],
        description: '',
      });
    });

    it('removeProduct removes a product by id', () => {
      act(() => {
        useStore.getState().removeProduct(1);
      });
      expect(useStore.getState().products).toHaveLength(1);
      expect(useStore.getState().products[0].id).toBe(2);
    });

    it('updateProduct updates matching product fields', () => {
      act(() => {
        useStore.getState().updateProduct({ id: 1, price: 999 });
      });
      expect(useStore.getState().products[0].price).toBe(999);
      expect(useStore.getState().products[0].name).toBe('Product A');
    });

    it('syncProducts merges server products with local products', () => {
      const serverProducts = [
        { id: 1, name: 'Product A from Server', price: 150 },
        { id: 3, name: 'Server Only', price: 300 },
      ];
      act(() => {
        useStore.getState().syncProducts(serverProducts);
      });
      const products = useStore.getState().products;
      expect(products.find(p => p.id === 1).name).toBe('Product A from Server');
      expect(products.find(p => p.id === 3)).toBeDefined();
      expect(products.find(p => p.id === 2)).toBeDefined();
    });
  });

  describe('Server Connection', () => {
    it('setServerConnected updates serverConnected state', () => {
      expect(useStore.getState().serverConnected).toBe(false);
      act(() => useStore.getState().setServerConnected(true));
      expect(useStore.getState().serverConnected).toBe(true);
    });
  });

  describe('Toast', () => {
    it('hideToast clears the toast message', () => {
      act(() => {
        useStore.getState().addToCart({ id: 1, name: 'Test', price: 10 }, 'M');
      });
      expect(useStore.getState().toastMessage).toBeTruthy();
      act(() => useStore.getState().hideToast());
      expect(useStore.getState().toastMessage).toBeNull();
    });
  });
});
