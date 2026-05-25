import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OrderSummary from './OrderSummary';

describe('OrderSummary Component', () => {
  it('renders the order summary correctly', () => {
    // 1. Mock data for the cart
    const mockCart = [
      {
        id: '1',
        size: 'L',
        name: 'Royal Silk Sherwani',
        price: 15000,
        qty: 1,
        image: 'sherwani.jpg'
      }
    ];

    const mockOrderDetails = { id: 'PHN-123456', date: 'April 24, 2026', delivery: 'April 28, 2026' };
    
    // 2. Render the component with mock props
    render(
      <OrderSummary cart={mockCart} cartTotal={15000} orderDetails={mockOrderDetails} onBackToShopping={vi.fn()} />
    );
    
    // 3. Assertions
    expect(screen.getByText('Thank You!')).toBeInTheDocument();
    expect(screen.getByText('Royal Silk Sherwani')).toBeInTheDocument();
    expect(screen.getByText(/Qty: 1/i)).toBeInTheDocument();
  });
});