import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AdminDashboard from './AdminDashboard';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockAdminLogout = vi.hoisted(() => vi.fn());
const mockAddProduct = vi.hoisted(() => vi.fn());
const mockRemoveProduct = vi.hoisted(() => vi.fn());
const mockSetServerConnected = vi.hoisted(() => vi.fn());
const mockShowAlert = vi.hoisted(() => vi.fn());
const mockSyncProducts = vi.hoisted(() => vi.fn());
const mockSignOut = vi.hoisted(() => vi.fn());

const mockUseStore = vi.hoisted(() =>
  Object.assign(vi.fn(), {
    getState: () => ({ syncProducts: mockSyncProducts }),
  })
);

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../store/useStore', () => ({
  useStore: mockUseStore,
}));

vi.mock('../utils/alert', () => ({
  showAlert: mockShowAlert,
}));

vi.mock('../services/api', () => ({
  adminApi: {
    getProducts: vi.fn(),
    addProduct: vi.fn(),
    updateProduct: vi.fn(),
    removeProduct: vi.fn(),
  },
}));

vi.mock('../firebase', () => ({
  auth: {},
}));

vi.mock('firebase/auth', () => ({
  signOut: mockSignOut,
}));

import { adminApi } from '../services/api';

const sampleProducts = [
  { id: 'p1', name: 'Royal Silk Kurta', price: 2999, category: 'Men', stock: 15, image: 'https://example.com/a.jpg' },
  { id: 'p2', name: 'Embroidered Lehenga', price: 14999, category: 'Women', stock: 3, image: 'https://example.com/b.jpg' },
];

function setStoreState(overrides = {}) {
  mockUseStore.mockReturnValue({
    isAdminAuthenticated: true,
    adminLogout: mockAdminLogout,
    products: sampleProducts,
    addProduct: mockAddProduct,
    removeProduct: mockRemoveProduct,
    serverConnected: true,
    setServerConnected: mockSetServerConnected,
    ...overrides,
  });
}

async function renderDashboard(overrides = {}) {
  setStoreState(overrides);
  render(<AdminDashboard />);
  await act(async () => {});
}

function getForm() {
  return screen.getByText('Save Product').closest('form');
}

function openAddModal() {
  fireEvent.click(screen.getByRole('button', { name: /Add Product/i }));
}

async function fillAddForm({ name = 'Kurta', price = '100', stock = '5' } = {}) {
  fireEvent.change(screen.getByPlaceholderText('e.g. Royal Silk Sherwani'), { target: { value: name } });
  fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: price } });
  fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: stock } });
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Men' } });
  fireEvent.submit(getForm());
  await act(async () => {});
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.getProducts.mockReset().mockResolvedValue(sampleProducts);
    adminApi.addProduct.mockReset().mockResolvedValue({ id: 'p9', name: 'New Product' });
    adminApi.removeProduct.mockReset().mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dashboard and product inventory when authenticated', async () => {
    await renderDashboard();

    expect(screen.getByRole('heading', { name: 'overview' })).toBeInTheDocument();
    expect(screen.getByText('Royal Silk Kurta')).toBeInTheDocument();
    expect(screen.getAllByText('Embroidered Lehenga').length).toBeGreaterThan(0);
    expect(
      screen.getByText('Live Connection — Backend server connected. Data is synced.')
    ).toBeInTheDocument();
  });

  it('redirects to the admin login when unauthenticated', async () => {
    await renderDashboard({ isAdminAuthenticated: false });

    expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
  });

  it('shows the sandbox banner when the server is disconnected', async () => {
    await renderDashboard({ serverConnected: false });

    expect(
      screen.getByText('Sandbox Mode — Backend server not connected. Changes are local only.')
    ).toBeInTheDocument();
  });

  it('opens the add product modal', async () => {
    await renderDashboard();

    openAddModal();

    expect(screen.getByText('Add New Product')).toBeInTheDocument();
  });

  it('rejects a product with an empty name', async () => {
    await renderDashboard();
    openAddModal();

    await fillAddForm({ name: '   ', price: '2500', stock: '10' });

    expect(mockShowAlert).toHaveBeenCalledWith('Product name is required.', 'warning');
    expect(screen.queryByText('Publish Product')).not.toBeInTheDocument();
  });

  it('rejects a product with a negative price', async () => {
    await renderDashboard();
    openAddModal();

    await fillAddForm({ price: '-10' });

    expect(mockShowAlert).toHaveBeenCalledWith('Price must be a positive number.', 'warning');
    expect(screen.queryByText('Publish Product')).not.toBeInTheDocument();
  });

  it('rejects a product with negative stock', async () => {
    await renderDashboard();
    openAddModal();

    await fillAddForm({ stock: '-3' });

    expect(mockShowAlert).toHaveBeenCalledWith('Stock cannot be negative.', 'warning');
    expect(screen.queryByText('Publish Product')).not.toBeInTheDocument();
  });

  it('publishes a valid product after confirmation', async () => {
    adminApi.addProduct.mockReset().mockResolvedValue({ id: 'p3', name: 'Silk Dupatta' });
    await renderDashboard();
    openAddModal();

    await fillAddForm({ name: 'Silk Dupatta', price: '1200', stock: '20' });

    expect(screen.getByText('Publish Product')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to publish/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Yes, Publish' }));
    await act(async () => {});

    expect(adminApi.addProduct).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Silk Dupatta', price: 1200, stock: 20 })
    );
    expect(mockAddProduct).toHaveBeenCalledWith({ id: 'p3', name: 'Silk Dupatta' });
    expect(mockShowAlert).toHaveBeenCalledWith('Product added successfully!', 'success');
  });

  it('keeps the modal open and warns when publishing fails', async () => {
    adminApi.addProduct.mockReset().mockRejectedValue(new Error('offline'));
    await renderDashboard();
    openAddModal();

    await fillAddForm();

    fireEvent.click(screen.getByRole('button', { name: 'Yes, Publish' }));
    await act(async () => {});

    expect(mockShowAlert).toHaveBeenCalledWith(
      'Failed to save product to server. Check server connection.',
      'danger'
    );
    expect(screen.getByText('Publish Product')).toBeInTheDocument();
  });

  it('deletes a product after confirmation', async () => {
    await renderDashboard();

    const trashButton = screen
      .getAllByRole('button')
      .find((b) => b.querySelector('svg.lucide-trash-2'));
    fireEvent.click(trashButton);

    expect(screen.getByText('Delete Product')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Yes, Delete' }));
    await act(async () => {});

    expect(adminApi.removeProduct).toHaveBeenCalledWith('p1');
    expect(mockRemoveProduct).toHaveBeenCalledWith('p1');
    expect(screen.queryByText('Delete Product')).not.toBeInTheDocument();
  });

  it('warns when a product cannot be deleted', async () => {
    adminApi.removeProduct.mockReset().mockRejectedValue(new Error('offline'));
    await renderDashboard();

    const trashButton = screen
      .getAllByRole('button')
      .find((b) => b.querySelector('svg.lucide-trash-2'));
    fireEvent.click(trashButton);

    fireEvent.click(screen.getByRole('button', { name: 'Yes, Delete' }));
    await act(async () => {});

    expect(mockShowAlert).toHaveBeenCalledWith(
      'Could not delete "Royal Silk Kurta". Check server connection.',
      'danger'
    );
  });

  it('syncs products with the server when the Sync button is clicked', async () => {
    const remote = [{ id: 'r1', name: 'Remote Kurta', price: 1, category: 'Men', stock: 1, image: '' }];
    adminApi.getProducts.mockReset().mockResolvedValueOnce(sampleProducts).mockResolvedValue(remote);
    await renderDashboard();

    fireEvent.click(screen.getByRole('button', { name: /Sync/i }));
    await act(async () => {});

    expect(mockSyncProducts).toHaveBeenLastCalledWith(remote);
    expect(mockSetServerConnected).toHaveBeenLastCalledWith(true);
    expect(mockShowAlert).toHaveBeenCalledWith('Products synced with server.', 'success');
  });

  it('falls back to local data when syncing fails', async () => {
    adminApi.getProducts.mockReset().mockRejectedValue(new Error('offline'));
    await renderDashboard();

    fireEvent.click(screen.getByRole('button', { name: /Sync/i }));
    await act(async () => {});

    expect(mockSetServerConnected).toHaveBeenLastCalledWith(false);
    expect(mockShowAlert).toHaveBeenCalledWith(
      'Could not connect to server. Using local data.',
      'warning'
    );
  });

  it('logs out and navigates to the admin login', async () => {
    await renderDashboard();

    fireEvent.click(screen.getByRole('button', { name: /Sign Out/i }));
    await act(async () => {});

    expect(mockAdminLogout).toHaveBeenCalled();
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
  });
});