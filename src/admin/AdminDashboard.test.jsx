import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminDashboard from './AdminDashboard';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  adminLogout: vi.fn(),
  addProduct: vi.fn(),
  removeProduct: vi.fn(),
  setServerConnected: vi.fn(),
  showAlert: vi.fn(),
  syncProducts: vi.fn(),
  signOut: vi.fn(),
}));

const mockUseStore = vi.hoisted(() =>
  Object.assign(vi.fn(), { getState: () => ({ syncProducts: mocks.syncProducts }) })
);

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('../store/useStore', () => ({ useStore: mockUseStore }));
vi.mock('../utils/alert', () => ({ showAlert: mocks.showAlert }));
vi.mock('../services/api', () => ({
  adminApi: {
    getProducts: vi.fn(),
    addProduct: vi.fn(),
    updateProduct: vi.fn(),
    removeProduct: vi.fn(),
  },
}));
vi.mock('../firebase', () => ({ auth: {} }));
vi.mock('firebase/auth', () => ({ signOut: mocks.signOut }));

import { adminApi } from '../services/api';

const products = [
  { id: 'p1', name: 'Royal Silk Kurta', price: 2999, category: 'Men', stock: 15, image: '' },
];

async function renderDashboard(authenticated = true) {
  mockUseStore.mockReturnValue({
    isAdminAuthenticated: authenticated,
    adminLogout: mocks.adminLogout,
    products,
    addProduct: mocks.addProduct,
    removeProduct: mocks.removeProduct,
    serverConnected: true,
    setServerConnected: mocks.setServerConnected,
  });
  render(<AdminDashboard />);
  await act(async () => {});
}

async function openAndSubmit({ name = 'Kurta', price = '100', stock = '5' } = {}) {
  fireEvent.click(screen.getByRole('button', { name: /Add Product/i }));
  fireEvent.change(screen.getByPlaceholderText('e.g. Royal Silk Sherwani'), { target: { value: name } });
  fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: price } });
  fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: stock } });
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Men' } });
  fireEvent.submit(screen.getByText('Save Product').closest('form'));
  await act(async () => {});
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.getProducts.mockReset().mockResolvedValue(products);
    adminApi.addProduct.mockReset().mockResolvedValue({ id: 'p9', name: 'New Product' });
    adminApi.removeProduct.mockReset().mockResolvedValue({ success: true });
  });

  it('redirects to login when unauthenticated and renders otherwise', async () => {
    await renderDashboard(false);
    expect(mocks.navigate).toHaveBeenCalledWith('/admin/login');

    await renderDashboard();
    expect(screen.getByRole('heading', { name: 'overview' })).toBeInTheDocument();
    expect(screen.getByText('Royal Silk Kurta')).toBeInTheDocument();
  });

  it('rejects invalid product data', async () => {
    await renderDashboard();
    await openAndSubmit({ name: '   ' });
    expect(mocks.showAlert).toHaveBeenCalledWith('Product name is required.', 'warning');

    await openAndSubmit({ price: '-10' });
    expect(mocks.showAlert).toHaveBeenCalledWith('Price must be a positive number.', 'warning');

    await openAndSubmit({ stock: '-3' });
    expect(mocks.showAlert).toHaveBeenCalledWith('Stock cannot be negative.', 'warning');
  });

  it('publishes a valid product', async () => {
    adminApi.addProduct.mockReset().mockResolvedValue({ id: 'p9', name: 'Silk Dupatta' });
    await renderDashboard();
    await openAndSubmit({ name: 'Silk Dupatta', price: '1200', stock: '20' });

    expect(screen.getByText('Publish Product')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Yes, Publish' }));
    await act(async () => {});

    expect(adminApi.addProduct).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Silk Dupatta', price: 1200, stock: 20 })
    );
    expect(mocks.addProduct).toHaveBeenCalledWith({ id: 'p9', name: 'Silk Dupatta' });
  });

  it('warns when publishing fails', async () => {
    adminApi.addProduct.mockReset().mockRejectedValue(new Error('offline'));
    await renderDashboard();
    await openAndSubmit();

    fireEvent.click(screen.getByRole('button', { name: 'Yes, Publish' }));
    await act(async () => {});

    expect(mocks.showAlert).toHaveBeenCalledWith(
      'Failed to save product to server. Check server connection.',
      'danger'
    );
  });

  it('deletes a product after confirmation', async () => {
    await renderDashboard();
    fireEvent.click(screen.getAllByRole('button').find((b) => b.querySelector('svg.lucide-trash-2')));

    expect(screen.getByText('Delete Product')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Yes, Delete' }));
    await act(async () => {});

    expect(adminApi.removeProduct).toHaveBeenCalledWith('p1');
    expect(mocks.removeProduct).toHaveBeenCalledWith('p1');
  });
});