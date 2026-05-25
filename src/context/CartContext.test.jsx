import React, { useContext } from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CartProvider, CartContext } from './CartContext';

// Helper hook to access the context
const useCartContext = () => useContext(CartContext);

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with empty cart and zero total when localStorage is empty', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper: CartProvider });
    expect(result.current.cart).toEqual([]);
    expect(result.current.cartTotal).toBe(0);
  });

  it('initializes with cart data from localStorage', () => {
    const initialCart = [{ id: '1', name: 'Test Product', price: 1000, qty: 2, size: 'M' }];
    localStorage.setItem('pehenavas_cart', JSON.stringify(initialCart));
    
    const { result } = renderHook(() => useCartContext(), { wrapper: CartProvider });
    expect(result.current.cart).toEqual(initialCart);
    expect(result.current.cartTotal).toBe(2000); // 1000 * 2
  });

  it('addToCart() adds a new item and syncs with localStorage', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper: CartProvider });
    
    act(() => {
      result.current.addToCart({ id: '2', name: 'New Item', price: 500 }, 'L');
    });
    
    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0]).toEqual({ id: '2', name: 'New Item', price: 500, size: 'L', qty: 1 });
    expect(JSON.parse(localStorage.getItem('pehenavas_cart'))).toEqual(result.current.cart);
  });

  it('addToCart() increments quantity if identical item (id and size) already exists', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper: CartProvider });
    
    act(() => { result.current.addToCart({ id: '2', name: 'New Item', price: 500 }, 'L'); });
    act(() => { result.current.addToCart({ id: '2', name: 'New Item', price: 500 }, 'L'); });
    
    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].qty).toBe(2);
  });

  it('addToCart() adds as a separate line item if sizes are different', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper: CartProvider });
    
    act(() => { result.current.addToCart({ id: '2', name: 'New Item', price: 500 }, 'L'); });
    act(() => { result.current.addToCart({ id: '2', name: 'New Item', price: 500 }, 'M'); });
    
    expect(result.current.cart).toHaveLength(2);
  });

  it('addToCart() triggers the global toast and automatically clears it after 3 seconds', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper: CartProvider });
    
    act(() => {
      result.current.addToCart({ id: '2', name: 'Toast Product', price: 500 }, 'L');
    });
    
    expect(result.current.toastMessage).toBe('Toast Product added to cart!');
    
    // Fast forward 3 seconds
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    expect(result.current.toastMessage).toBeNull();
  });

  it('hideToast() clears the toast message manually', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper: CartProvider });
    
    act(() => { result.current.addToCart({ id: '2', name: 'Toast Product', price: 500 }, 'L'); });
    expect(result.current.toastMessage).not.toBeNull();
    
    act(() => { result.current.hideToast(); });
    expect(result.current.toastMessage).toBeNull();
  });

  it('updateItemQuantity() updates the quantity accurately', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper: CartProvider });
    act(() => { result.current.addToCart({ id: '1', price: 100 }, 'M'); });
    
    act(() => { result.current.updateItemQuantity('1', 'M', 5); });
    
    expect(result.current.cart[0].qty).toBe(5);
    expect(result.current.cartTotal).toBe(500);
  });

  it('updateItemQuantity() removes the item if requested quantity is < 1', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper: CartProvider });
    act(() => { result.current.addToCart({ id: '1', price: 100 }, 'M'); });
    
    act(() => { result.current.updateItemQuantity('1', 'M', 0); });
    
    expect(result.current.cart).toHaveLength(0);
  });
});