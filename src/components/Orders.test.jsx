import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Orders from './Orders';

const mockOrders = [
  {
    id: 'ORD-12345',
    date: '2026-04-23',
    status: 'Delivered',
    total: 5000,
    items: [
      { id: '1', name: 'Royal Silk Kurta', qty: 1, image: 'kurta.jpg' }
    ]
  }
];

vi.mock('../services/api', () => ({
  adminApi: {
    getOrders: vi.fn(() => Promise.resolve(mockOrders)),
  }
}));

describe('Orders Component', () => {
  it('renders a list of orders correctly', async () => {
    render(<Orders />);
    
    await waitFor(() => {
      expect(screen.getByText('Your Orders')).toBeInTheDocument();
    });
    expect(screen.getByText('Order #ORD-12345')).toBeInTheDocument();
    expect(screen.getByText('Royal Silk Kurta')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
  });
});