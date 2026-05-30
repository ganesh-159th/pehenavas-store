import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Orders from './Orders';
import { useStore } from '../store/useStore';

// Mock api so getOrders rejects (falling through to local store)
vi.mock('../services/api', () => ({
  adminApi: {
    getOrders: vi.fn(() => Promise.reject(new Error('not available'))),
  }
}));

// Reset the store before each test
beforeEach(() => {
  useStore.setState({
    orders: [
      {
        id: 'ORD-12345',
        date: '2026-04-23',
        status: 'Delivered',
        total: 5000,
        items: [
          { id: '1', name: 'Royal Silk Kurta', qty: 1, image: 'kurta.jpg' }
        ]
      }
    ]
  });
});

describe('Orders Component', () => {
  it('renders a list of orders correctly', async () => {
    render(<Orders />);
    
    // Wait for loading to finish and data to appear
    await waitFor(() => {
      expect(screen.getByText('Order #ORD-12345')).toBeInTheDocument();
    });
    expect(screen.getByText('Your Orders')).toBeInTheDocument();
    expect(screen.getByText('Royal Silk Kurta')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
  });
});