import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStore } from './useStore';

vi.mock('../utils/alert', () => ({
  showAlert: vi.fn(),
}));

import { showAlert } from '../utils/alert';

const product = {
  id: 'p1',
  name: 'Royal Poshak',
  price: 1000,
  colors: ['red'],
  description: 'A royal outfit',
};

describe('useStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.setState({
      cart: [],
      wishlist: [],
      orders: [],
      isCartOpen: false,
      isAdminAuthenticated: false,
      toastMessage: null,
      reviewStatsCache: {},
      serverConnected: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('addProduct prepends a normalized product', () => {
    useStore.getState().addProduct(product);
    const added = useStore.getState().products[0];
    expect(added.id).toBe('p1');
    expect(added.originalPrice).toBe(1000);
    expect(added.rating).toBe(0);
    expect(added.reviews).toBe(0);
    expect(useStore.getState().products.length).toBeGreaterThan(1);
  });

  it('addProduct fills default values when missing', () => {
    useStore.getState().addProduct({ name: 'No ID' });
    const added = useStore.getState().products[0];
    expect(added.id).toBeDefined();
    expect(added.rating).toBe(0);
    expect(added.reviews).toBe(0);
    expect(added.originalPrice).toBeUndefined();
    expect(added.colors).toEqual([]);
    expect(added.description).toBe('');
  });

  it('updateProduct merges fields into the matching product', () => {
    useStore.getState().addProduct(product);
    useStore.getState().updateProduct({ id: 'p1', price: 2000 });
    const updated = useStore.getState().products.find((p) => p.id === 'p1');
    expect(updated.price).toBe(2000);
  });

  it('removeProduct deletes the product and shows an alert', async () => {
    useStore.getState().addProduct(product);
    useStore.getState().removeProduct('p1');
    expect(useStore.getState().products.find((p) => p.id === 'p1')).toBeUndefined();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(showAlert).toHaveBeenCalled();
  });

  it('removeProduct does nothing for a missing product', () => {
    useStore.getState().removeProduct('nope');
    expect(showAlert).not.toHaveBeenCalled();
  });

  it('syncProducts replaces products with the server list', () => {
    useStore.getState().syncProducts([product]);
    expect(useStore.getState().products).toEqual([product]);
  });

  it('syncProducts handles a non-array payload', () => {
    useStore.getState().syncProducts(null);
    expect(useStore.getState().products).toEqual([]);
  });

  it('openCart, closeCart, toggleCart, setIsCartOpen update the drawer state', () => {
    const s = useStore.getState();
    s.openCart();
    expect(useStore.getState().isCartOpen).toBe(true);
    s.closeCart();
    expect(useStore.getState().isCartOpen).toBe(false);
    s.toggleCart();
    expect(useStore.getState().isCartOpen).toBe(true);
    s.setIsCartOpen(false);
    expect(useStore.getState().isCartOpen).toBe(false);
  });

  it('addToCart adds a new item and opens the cart', () => {
    useStore.getState().addToCart(product, 'M');
    const state = useStore.getState();
    expect(state.cart).toHaveLength(1);
    expect(state.cart[0]).toMatchObject({ id: 'p1', size: 'M', qty: 1 });
    expect(state.isCartOpen).toBe(true);
    expect(state.toastMessage).toContain('added to cart');
  });

  it('addToCart increments quantity for an existing item', () => {
    useStore.getState().addToCart(product, 'M');
    useStore.getState().addToCart(product, 'M');
    expect(useStore.getState().cart[0].qty).toBe(2);
  });

  it('removeFromCart removes the matching item', () => {
    useStore.getState().addToCart(product, 'M');
    useStore.getState().removeFromCart('p1', 'M');
    expect(useStore.getState().cart).toHaveLength(0);
  });

  it('updateItemQuantity sets the quantity for a matching item', () => {
    useStore.getState().addToCart(product, 'M');
    useStore.getState().updateItemQuantity('p1', 'M', 3);
    expect(useStore.getState().cart[0].qty).toBe(3);
  });

  it('updateItemQuantity removes the item when qty drops below 1', () => {
    useStore.getState().addToCart(product, 'M');
    useStore.getState().updateItemQuantity('p1', 'M', 0);
    expect(useStore.getState().cart).toHaveLength(0);
  });

  it('updateQuantity adjusts qty but never below 1', () => {
    useStore.getState().addToCart(product, 'M');
    useStore.getState().updateQuantity('p1', 'M', -5);
    expect(useStore.getState().cart[0].qty).toBe(1);
    useStore.getState().updateQuantity('p1', 'M', 2);
    expect(useStore.getState().cart[0].qty).toBe(3);
  });

  it('clearCart empties the cart and hideToast clears the message', () => {
    useStore.getState().addToCart(product, 'M');
    useStore.getState().clearCart();
    expect(useStore.getState().cart).toHaveLength(0);
    useStore.getState().hideToast();
    expect(useStore.getState().toastMessage).toBeNull();
  });

  it('addOrder prepends an order', () => {
    const order = { id: 'o1', total: 100 };
    useStore.getState().addOrder(order);
    expect(useStore.getState().orders[0]).toEqual(order);
  });

  it('setReviewStats stores stats keyed by product id', () => {
    useStore.getState().setReviewStats('p1', { average: 4.2 });
    expect(useStore.getState().reviewStatsCache.p1).toEqual({ average: 4.2 });
  });

  it('setServerConnected updates the connection flag', () => {
    useStore.getState().setServerConnected(true);
    expect(useStore.getState().serverConnected).toBe(true);
  });

  it('adminLogin authenticates with the default credentials', () => {
    expect(useStore.getState().adminLogin('admin', 'admin123')).toBe(true);
    expect(useStore.getState().isAdminAuthenticated).toBe(true);
  });

  it('adminLogin rejects invalid credentials', () => {
    expect(useStore.getState().adminLogin('admin', 'wrong')).toBe(false);
    expect(useStore.getState().isAdminAuthenticated).toBe(false);
  });

  it('adminLogout clears authentication', () => {
    useStore.getState().adminLogin('admin', 'admin123');
    useStore.getState().adminLogout();
    expect(useStore.getState().isAdminAuthenticated).toBe(false);
  });

  it('toggleWishlist adds and removes a product', () => {
    const s = useStore.getState();
    s.toggleWishlist(product);
    expect(useStore.getState().wishlist).toContainEqual(product);
    useStore.getState().toggleWishlist(product);
    expect(useStore.getState().wishlist).toHaveLength(0);
  });
});
