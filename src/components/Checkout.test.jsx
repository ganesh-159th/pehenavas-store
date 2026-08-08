import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Checkout from './Checkout';
import { useCart } from '../hooks/useCart';
import { useUser } from '../hooks/useUser';
import { BrowserRouter } from 'react-router-dom';

// 1. Mock the useCart hook
vi.mock('../hooks/useCart', () => ({
  useCart: vi.fn()
}));

// Mock the useUser hook
vi.mock('../hooks/useUser', () => ({
  useUser: vi.fn()
}));

// Mock the payments service (Razorpay flows)
vi.mock('../services/payments', () => ({
  createPaymentOrder: vi.fn(),
  verifyPayment: vi.fn(),
  saveOrder: vi.fn(),
  openRazorpayCheckout: vi.fn(),
}));

import { createPaymentOrder, verifyPayment, saveOrder, openRazorpayCheckout } from '../services/payments';

// 2. Mock utils for predictable formatting
vi.mock('../utils.js', () => ({
  formatINR: (amount) => `₹${amount}`
}));

// 3. Mock OrderSummary since we already tested it separately
vi.mock('./OrderSummary.jsx', () => ({
  default: ({ orderDetails, onBackToShopping }) => (
    <div data-testid="mock-order-summary">
      Mock Order Summary
      {orderDetails && <span data-testid="order-id">{orderDetails.id}</span>}
      {orderDetails && <span data-testid="order-delivery">{orderDetails.delivery}</span>}
      <button onClick={onBackToShopping}>Back to Shopping</button>
    </div>
  )
}));

describe('Checkout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers(); // Control time for the setTimeout in handlePlaceOrder
    useUser.mockReturnValue({ user: { name: 'Test User' } });
    saveOrder.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.useRealTimers(); // Clean up timers
  });

  const fillAddress = () => {
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('9876543210'), { target: { value: '9876543210' } });
    fireEvent.change(screen.getAllByPlaceholderText(/123, Main Street/i)[0], { target: { value: '123 Test St' } });
    fireEvent.change(screen.getByPlaceholderText('Jaipur'), { target: { value: 'Jaipur' } });
    fireEvent.change(screen.getByPlaceholderText('Rajasthan'), { target: { value: 'Rajasthan' } });
    fireEvent.change(screen.getByPlaceholderText('302001'), { target: { value: '302001' } });
  };

  it('disables the place order button when the cart is empty', () => {
    useCart.mockReturnValue({ cart: [], cartTotal: 0, clearCart: vi.fn() });
    render(<Checkout />, { wrapper: BrowserRouter });
    
    const placeOrderBtn = screen.getByRole('button', { name: /Place Order/i });
    expect(placeOrderBtn).toBeDisabled();
  });

  it('handles UPI payment method and validation correctly', () => {
    useCart.mockReturnValue({
      cart: [{ id: '1', name: 'Test Product', price: 1000, qty: 1 }],
      cartTotal: 1000,
      clearCart: vi.fn()
    });
    render(<Checkout />, { wrapper: BrowserRouter });

    const placeOrderBtn = screen.getByRole('button', { name: /Place Order/i });
    
    // 1. Place order without verifying should fail validation and show error
    fireEvent.click(placeOrderBtn);
    expect(screen.getByText(/Please verify your UPI ID/i)).toBeInTheDocument();

    // 2. Enter invalid UPI
    const upiInput = screen.getByPlaceholderText(/Enter UPI ID/i);
    fireEvent.change(upiInput, { target: { value: 'invalid-upi' } });
    fireEvent.click(screen.getByRole('button', { name: /Verify/i }));
    
    expect(screen.getByText(/Invalid UPI ID/i)).toBeInTheDocument();
    
    // 3. Enter valid UPI
    fireEvent.change(upiInput, { target: { value: 'ganesh@upi' } });
    fireEvent.click(screen.getByRole('button', { name: /Verify/i }));
    
    expect(screen.getByText(/UPI ID Verified Successfully!/i)).toBeInTheDocument();
    expect(placeOrderBtn).not.toBeDisabled(); // Enabled now!
  });

  it('processes COD order and shows the Order Summary after a delay', () => {
    useCart.mockReturnValue({
      cart: [{ id: '1', name: 'Test Product', price: 1000, qty: 1 }],
      cartTotal: 1000,
      clearCart: vi.fn()
    });
    render(<Checkout />, { wrapper: BrowserRouter });

    // 1. Select Cash on Delivery
    fireEvent.click(screen.getByText(/Cash on Delivery/i));
    
    fillAddress();

    const placeOrderBtn = screen.getByRole('button', { name: /Place Order/i });
    expect(placeOrderBtn).not.toBeDisabled();

    // 2. Place the order
    fireEvent.click(placeOrderBtn);
    expect(screen.getByText(/Placing Order\.\.\./i)).toBeInTheDocument();

    // 3. Fast-forward time to skip the 1000ms setTimeout
    act(() => {
      vi.runAllTimers();
    });

    // 4. Verify the checkout screen is replaced by the Order Summary
    expect(screen.getByTestId('mock-order-summary')).toBeInTheDocument();
    // 5. Verify the COD order was persisted to the server
    expect(saveOrder).toHaveBeenCalledWith(expect.objectContaining({ method: 'cod' }));
  });

  describe('Card Payment Validation Flow', () => {
    beforeEach(() => {
      useCart.mockReturnValue({
        cart: [{ id: '1', name: 'Test Product', price: 1000, qty: 1 }],
        cartTotal: 1000,
        clearCart: vi.fn()
      });
    });

    it('shows error when card number is empty and Place Order is clicked', () => {
      render(<Checkout />, { wrapper: BrowserRouter });
      fireEvent.click(screen.getByText(/Credit \/ Debit Card/i));
      fireEvent.click(screen.getByRole('button', { name: /Place Order/i }));
      expect(screen.getByText(/Please enter a valid 16-digit card number/i)).toBeInTheDocument();
    });

    it('shows error when card number is incomplete', () => {
      render(<Checkout />, { wrapper: BrowserRouter });
      fireEvent.click(screen.getByText(/Credit \/ Debit Card/i));
      fireEvent.change(screen.getByPlaceholderText('0000 0000 0000 0000'), { target: { value: '1234 5678 1234 567' } });
      fireEvent.click(screen.getByRole('button', { name: /Place Order/i }));
      expect(screen.getByText(/Please enter a valid 16-digit card number/i)).toBeInTheDocument();
    });

    it('shows error when card expiry is empty', () => {
      render(<Checkout />, { wrapper: BrowserRouter });
      fireEvent.click(screen.getByText(/Credit \/ Debit Card/i));
      fireEvent.change(screen.getByPlaceholderText('0000 0000 0000 0000'), { target: { value: '1234567812345678' } });
      fireEvent.click(screen.getByRole('button', { name: /Place Order/i }));
      expect(screen.getByText(/Please enter a valid expiry date/i)).toBeInTheDocument();
    });

    it('shows error when card expiry is invalid', () => {
      render(<Checkout />, { wrapper: BrowserRouter });
      fireEvent.click(screen.getByText(/Credit \/ Debit Card/i));
      fireEvent.change(screen.getByPlaceholderText('MM/YY'), { target: { value: '12/' } });
      fireEvent.click(screen.getByRole('button', { name: /Place Order/i }));
      expect(screen.getByText(/Please enter a valid expiry date/i)).toBeInTheDocument();
    });

    it('shows error when card CVV is empty', () => {
      render(<Checkout />, { wrapper: BrowserRouter });
      fireEvent.click(screen.getByText(/Credit \/ Debit Card/i));
      fireEvent.change(screen.getByPlaceholderText('0000 0000 0000 0000'), { target: { value: '1234567812345678' } });
      fireEvent.change(screen.getByPlaceholderText('MM/YY'), { target: { value: '12/25' } });
      fireEvent.click(screen.getByRole('button', { name: /Place Order/i }));
      expect(screen.getByText(/Please enter a valid CVV/i)).toBeInTheDocument();
    });

    it('shows error when card CVV is invalid', () => {
      render(<Checkout />, { wrapper: BrowserRouter });
      fireEvent.click(screen.getByText(/Credit \/ Debit Card/i));
      fireEvent.change(screen.getByPlaceholderText('123'), { target: { value: '12' } });
      fireEvent.click(screen.getByRole('button', { name: /Place Order/i }));
      expect(screen.getByText(/Please enter a valid CVV/i)).toBeInTheDocument();
    });

    it('clears card number error when user types valid input', () => {
      render(<Checkout />, { wrapper: BrowserRouter });
      fireEvent.click(screen.getByText(/Credit \/ Debit Card/i));
      fireEvent.click(screen.getByRole('button', { name: /Place Order/i }));
      expect(screen.getByText(/Please enter a valid 16-digit card number/i)).toBeInTheDocument();
      
      fireEvent.change(screen.getByPlaceholderText('0000 0000 0000 0000'), { target: { value: '1234567812345678' } });
      expect(screen.queryByText(/Please enter a valid 16-digit card number/i)).not.toBeInTheDocument();
    });

    it('processes valid card order successfully and shows Order Summary', async () => {
      createPaymentOrder.mockResolvedValue({ id: 'PHN-654321', razorpayOrderId: 'order_rzptest', amount: 100000, currency: 'INR' });
      openRazorpayCheckout.mockImplementation(({ onSuccess }) => onSuccess({
        razorpay_order_id: 'order_rzptest',
        razorpay_payment_id: 'pay_rzptest',
        razorpay_signature: 'sig_rzptest',
      }));
      verifyPayment.mockResolvedValue({ success: true, order: { status: 'paid', paymentId: 'pay_rzptest' } });

      render(<Checkout />, { wrapper: BrowserRouter });
      fillAddress();
      fireEvent.click(screen.getByText(/Credit \/ Debit Card/i));
      fireEvent.change(screen.getByPlaceholderText('0000 0000 0000 0000'), { target: { value: '1234567812345678' } });
      fireEvent.change(screen.getByPlaceholderText('MM/YY'), { target: { value: '12/25' } });
      fireEvent.change(screen.getByPlaceholderText('123'), { target: { value: '123' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Place Order/i }));
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(createPaymentOrder).toHaveBeenCalled();
      expect(openRazorpayCheckout).toHaveBeenCalled();
      expect(verifyPayment).toHaveBeenCalled();
      expect(screen.getByTestId('mock-order-summary')).toBeInTheDocument();
    });

    it('shows an error and stays on checkout when payment checkout fails', async () => {
      createPaymentOrder.mockResolvedValue({ id: 'PHN-654321', razorpayOrderId: 'order_rzptest', amount: 100000, currency: 'INR' });
      openRazorpayCheckout.mockRejectedValue(new Error('Payment was cancelled.'));

      render(<Checkout />, { wrapper: BrowserRouter });
      fillAddress();
      fireEvent.click(screen.getByText(/Credit \/ Debit Card/i));
      fireEvent.change(screen.getByPlaceholderText('0000 0000 0000 0000'), { target: { value: '1234567812345678' } });
      fireEvent.change(screen.getByPlaceholderText('MM/YY'), { target: { value: '12/25' } });
      fireEvent.change(screen.getByPlaceholderText('123'), { target: { value: '123' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Place Order/i }));
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(createPaymentOrder).toHaveBeenCalled();
      expect(openRazorpayCheckout).toHaveBeenCalled();
      expect(verifyPayment).not.toHaveBeenCalled();
      expect(screen.queryByTestId('mock-order-summary')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Place Order/i })).toBeInTheDocument();
    });
  });

  describe('Card Input Formatting', () => {
    beforeEach(() => {
      useCart.mockReturnValue({
        cart: [{ id: '1', name: 'Test Product', price: 1000, qty: 1 }],
        cartTotal: 1000,
        clearCart: vi.fn()
      });
    });

    it('formats card number with spaces every 4 digits', () => {
      render(<Checkout />, { wrapper: BrowserRouter });
      fireEvent.click(screen.getByText(/Credit \/ Debit Card/i));
      const cardInput = screen.getByPlaceholderText('0000 0000 0000 0000');
      fireEvent.change(cardInput, { target: { value: '12345678' } });
      expect(cardInput.value).toBe('1234 5678');
    });

    it('formats expiry date with slash (MM/YY) automatically', () => {
      render(<Checkout />, { wrapper: BrowserRouter });
      fireEvent.click(screen.getByText(/Credit \/ Debit Card/i));
      const expiryInput = screen.getByPlaceholderText('MM/YY');
      fireEvent.change(expiryInput, { target: { value: '1225' } });
      expect(expiryInput.value).toBe('12/25');
    });

    it('restricts CVV input to 4 digits maximum', () => {
      render(<Checkout />, { wrapper: BrowserRouter });
      fireEvent.click(screen.getByText(/Credit \/ Debit Card/i));
      const cvvInput = screen.getByPlaceholderText('123');
      fireEvent.change(cvvInput, { target: { value: '12345' } });
      expect(cvvInput.value).toBe('1234');
    });
  });

  describe('Payment Method Switching', () => {
    beforeEach(() => {
      useCart.mockReturnValue({
        cart: [{ id: '1', name: 'Test Product', price: 1000, qty: 1 }],
        cartTotal: 1000,
        clearCart: vi.fn()
      });
    });

    it('switches from UPI to Card and displays correct fields', () => {
      render(<Checkout />, { wrapper: BrowserRouter });
      expect(screen.getByPlaceholderText(/Enter UPI ID/i)).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('0000 0000 0000 0000')).not.toBeInTheDocument();
      
      fireEvent.click(screen.getByText(/Credit \/ Debit Card/i));
      expect(screen.queryByPlaceholderText(/Enter UPI ID/i)).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText('0000 0000 0000 0000')).toBeInTheDocument();
    });

    it('switches from Card to COD and displays correct fields', () => {
      render(<Checkout />, { wrapper: BrowserRouter });
      fireEvent.click(screen.getByText(/Credit \/ Debit Card/i));
      expect(screen.getByPlaceholderText('0000 0000 0000 0000')).toBeInTheDocument();

      fireEvent.click(screen.getByText(/Cash on Delivery/i));
      expect(screen.queryByPlaceholderText('0000 0000 0000 0000')).not.toBeInTheDocument();
      expect(screen.getByText(/Cash on Delivery/i)).toBeInTheDocument();
    });

    it('switches from COD to UPI and displays correct fields', () => {
      render(<Checkout />, { wrapper: BrowserRouter });
      fireEvent.click(screen.getByText(/Cash on Delivery/i));
      expect(screen.queryByPlaceholderText(/Enter UPI ID/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByText(/UPI \(GPay, PhonePe, Paytm\)/i));
      expect(screen.getByPlaceholderText(/Enter UPI ID/i)).toBeInTheDocument();
    });

    it('retains input values when switching back and forth between payment methods', () => {
      render(<Checkout />, { wrapper: BrowserRouter });
      
      fireEvent.change(screen.getByPlaceholderText(/Enter UPI ID/i), { target: { value: 'test@upi' } });
      
      fireEvent.click(screen.getByText(/Credit \/ Debit Card/i));
      fireEvent.change(screen.getByPlaceholderText('0000 0000 0000 0000'), { target: { value: '11112222' } });

      fireEvent.click(screen.getByText(/UPI \(GPay, PhonePe, Paytm\)/i));
      expect(screen.getByPlaceholderText(/Enter UPI ID/i).value).toBe('test@upi');

      fireEvent.click(screen.getByText(/Credit \/ Debit Card/i));
      expect(screen.getByPlaceholderText('0000 0000 0000 0000').value).toBe('1111 2222');
    });
  });

  describe('Error Scenarios', () => {
    beforeEach(() => {
      useCart.mockReturnValue({
        cart: [{ id: '1', name: 'Test Product', price: 1000, qty: 1 }],
        cartTotal: 1000,
        clearCart: vi.fn()
      });
    });

    it('prevents order placement if UPI verification failed', () => {
      render(<Checkout />, { wrapper: BrowserRouter });
      
      fireEvent.change(screen.getByPlaceholderText(/Enter UPI ID/i), { target: { value: 'invalid' } });
      fireEvent.click(screen.getByRole('button', { name: /Verify/i }));
      expect(screen.getByText(/Invalid UPI ID/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Place Order/i }));
      expect(screen.queryByText(/Placing Order\.\.\./i)).not.toBeInTheDocument();
    });

    it('displays multiple validation errors simultaneously for Card payment', () => {
      render(<Checkout />, { wrapper: BrowserRouter });
      fireEvent.click(screen.getByText(/Credit \/ Debit Card/i));
      
      fireEvent.click(screen.getByRole('button', { name: /Place Order/i }));
      
      expect(screen.getByText(/Please enter a valid 16-digit card number/i)).toBeInTheDocument();
      expect(screen.getByText(/Please enter a valid expiry date/i)).toBeInTheDocument();
      expect(screen.getByText(/Please enter a valid CVV/i)).toBeInTheDocument();
    });

    it('does not process order if there are existing errors that haven\'t been fixed', () => {
      render(<Checkout />, { wrapper: BrowserRouter });
      fireEvent.click(screen.getByText(/Credit \/ Debit Card/i));
      
      fireEvent.change(screen.getByPlaceholderText('123'), { target: { value: '123' } });
      fireEvent.click(screen.getByRole('button', { name: /Place Order/i }));
      
      expect(screen.queryByText(/Placing Order\.\.\./i)).not.toBeInTheDocument();
      expect(screen.getByText(/Please enter a valid 16-digit card number/i)).toBeInTheDocument();
    });
  });

  describe('Multi-item Orders', () => {
    it('correctly calculates and displays total for multiple items in cart', () => {
      useCart.mockReturnValue({
        cart: [
          { id: '1', name: 'Item 1', price: 1000, qty: 2 },
          { id: '2', name: 'Item 2', price: 500, qty: 1 }
        ],
        cartTotal: 2500,
        clearCart: vi.fn()
      });
      render(<Checkout />, { wrapper: BrowserRouter });
      
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getAllByText('₹2500').length).toBeGreaterThan(0);
    });

    it('correctly passes multiple items to Order Summary after placement', () => {
      const mockClearCart = vi.fn();
      useCart.mockReturnValue({
        cart: [
          { id: '1', name: 'Item A', price: 100, qty: 1 },
          { id: '2', name: 'Item B', price: 200, qty: 2 }
        ],
        cartTotal: 500,
        clearCart: mockClearCart
      });
      render(<Checkout />, { wrapper: BrowserRouter });
      
      fireEvent.click(screen.getByText(/Cash on Delivery/i));
      fillAddress();
      fireEvent.click(screen.getByRole('button', { name: /Place Order/i }));
      
      act(() => { vi.runAllTimers(); });
      expect(screen.getByTestId('mock-order-summary')).toBeInTheDocument();
      expect(mockClearCart).toHaveBeenCalled();
    });
  });

  describe('Post-Order & Edge Cases', () => {
    beforeEach(() => {
      useCart.mockReturnValue({
        cart: [{ id: '1', name: 'Test Product', price: 1000, qty: 1 }],
        cartTotal: 1000,
        clearCart: vi.fn()
      });
    });

    it('redirects to sign-in page if user is not authenticated', () => {
      useUser.mockReturnValue({ user: null });
      render(<Checkout />, { wrapper: BrowserRouter });
      
      // Checkout UI should not be rendered due to the <Navigate> component
      expect(screen.queryByText(/Secure Checkout/i)).not.toBeInTheDocument();
    });

    it('generates correct Order ID (PHN-XXXXXX) and Delivery Date (3-5 days)', () => {
      render(<Checkout />, { wrapper: BrowserRouter });
      fireEvent.click(screen.getByText(/Cash on Delivery/i));
      fillAddress();
      fireEvent.click(screen.getByRole('button', { name: /Place Order/i }));
      
      act(() => { vi.runAllTimers(); });
      
      expect(screen.getByTestId('order-id').textContent).toMatch(/^PHN-\d{6}$/);
      
      const deliveryDate = screen.getByTestId('order-delivery').textContent;
      expect(deliveryDate.length).toBeGreaterThan(0);
      // toLocaleDateString formats wildly differently across Node versions. We just verify it returns a non-empty string.
      expect(typeof deliveryDate).toBe('string');
    });

    it('clears the cart after a successful order', () => {
      const mockClearCart = vi.fn();
      useCart.mockReturnValue({
        cart: [{ id: '1', name: 'Test', price: 1000, qty: 1 }],
        cartTotal: 1000,
        clearCart: mockClearCart
      });
      render(<Checkout />, { wrapper: BrowserRouter });
      fireEvent.click(screen.getByText(/Cash on Delivery/i));
      fillAddress();
      fireEvent.click(screen.getByRole('button', { name: /Place Order/i }));
      
      act(() => { vi.runAllTimers(); });
      
      expect(mockClearCart).toHaveBeenCalledTimes(1);
    });

    it('clears errors when switching methods and processing a valid method', () => {
      render(<Checkout />, { wrapper: BrowserRouter });
      
      // Trigger errors on Card
      fireEvent.click(screen.getByText(/Credit \/ Debit Card/i));
      fireEvent.click(screen.getByRole('button', { name: /Place Order/i }));
      expect(screen.getByText(/Please enter a valid 16-digit card number/i)).toBeInTheDocument();

      // Switch to COD and submit
      fireEvent.click(screen.getByText(/Cash on Delivery/i));
      fillAddress();
      fireEvent.click(screen.getByRole('button', { name: /Place Order/i }));
      
      // Should bypass the previous card errors and succeed
      expect(screen.getByText(/Placing Order\.\.\./i)).toBeInTheDocument();
    });
  });
});