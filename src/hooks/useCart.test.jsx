import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCart } from './useCart';

vi.mock('../store/useStore', () => ({
  useStore: vi.fn(),
}));

import { useStore } from '../store/useStore';

describe('useCart', () => {
  const mockState = {
    cart: [
      { id: '1', name: 'A', price: 100, qty: 2 },
      { id: '2', name: 'B', price: 50, qty: 1 },
    ],
    isCartOpen: true,
    setIsCartOpen: vi.fn(),
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    updateItemQuantity: vi.fn(),
    clearCart: vi.fn(),
    toastMessage: 'hi',
    hideToast: vi.fn(),
  };

  beforeEach(() => {
    useStore.mockImplementation((selector) => selector(mockState));
  });

  it('exposes the cart state and computes the cart total', () => {
    const { result } = renderHook(() => useCart());

    expect(result.current.cart).toEqual(mockState.cart);
    expect(result.current.isCartOpen).toBe(true);
    expect(result.current.cartTotal).toBe(250);
    expect(result.current.addToCart).toBe(mockState.addToCart);
    expect(result.current.hideToast).toBe(mockState.hideToast);
  });

  it('returns a zero total for an empty cart', () => {
    useStore.mockImplementation((selector) => selector({ ...mockState, cart: [] }));

    const { result } = renderHook(() => useCart());

    expect(result.current.cartTotal).toBe(0);
  });
});
