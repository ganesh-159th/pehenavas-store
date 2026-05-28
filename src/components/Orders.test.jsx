import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Orders from './Orders';
import { useStore } from '../store/useStore';

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
  it('renders a list of orders correctly', () => {
    render(<Orders />);
    
    // Verify the static heading
    expect(screen.getByText('Your Orders')).toBeInTheDocument();
    // Verify the mocked data is displayed
    expect(screen.getByText('Order #ORD-12345')).toBeInTheDocument();
    expect(screen.getByText('Royal Silk Kurta')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
  });
});