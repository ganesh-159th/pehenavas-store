import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminDashboard from './AdminDashboard';

const { mockNavigate, mockGetState, mockUseStore, mockStoreStateRef } = vi.hoisted(() => {
  const mockNav = vi.fn();
  const mockState = {
    isAdminAuthenticated: true,
    adminLogout: vi.fn(),
    products: [],
    addProduct: vi.fn(),
    removeProduct: vi.fn(),
    serverConnected: true,
    setServerConnected: vi.fn(),
    syncProducts: vi.fn(),
  };
  const getState = vi.fn(() => mockState);
  const useStore = Object.assign(vi.fn((selector) => {
    if (typeof selector === 'function') return selector(mockState);
    return mockState;
  }), {
    getState,
    persist: { rehydrate: vi.fn() },
  });
  return { mockNavigate: mockNav, mockGetState: getState, mockUseStore: useStore, mockStoreStateRef: mockState };
});

vi.mock('../store/useStore', () => ({
  useStore: mockUseStore,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('react-hook-form', () => ({
  useForm: vi.fn(() => ({
    register: vi.fn(),
    handleSubmit: vi.fn((fn) => (e) => { e?.preventDefault?.(); return fn({}); }),
    reset: vi.fn(),
    formState: { errors: {} },
  })),
}));

vi.mock('../services/api', () => ({
  adminApi: {
    getProducts: vi.fn(() => Promise.resolve([])),
    addProduct: vi.fn(),
    removeProduct: vi.fn(),
  },
}));

vi.mock('../utils/alert', () => ({
  showAlert: vi.fn(),
}));

vi.mock('../firebase', () => ({
  auth: null,
}));

vi.mock('../utils', () => ({
  formatINR: (v) => `₹${v}`,
}));

const sampleProducts = [
  { id: 101, name: 'Royal Silk Sherwani', price: 12499, category: 'Men', image: '', stock: 50, description: '', colors: [] },
  { id: 102, name: 'Embroidered Lehenga', price: 14999, category: 'Women', image: '', stock: 30, description: '', colors: [] },
];

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreStateRef.products = sampleProducts;
    mockStoreStateRef.isAdminAuthenticated = true;
    mockStoreStateRef.serverConnected = true;
  });

  it('renders the dashboard header when authenticated', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('renders sidebar navigation items', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('returns null when not authenticated to prevent flicker', () => {
    mockStoreStateRef.isAdminAuthenticated = false;
    const { container } = render(<AdminDashboard />);
    expect(container.innerHTML).toBe('');
  });

  it('shows server connected banner when serverConnected is true', () => {
    render(<AdminDashboard />);
    expect(screen.getByText(/Live Connection/)).toBeInTheDocument();
  });

  it('shows sandbox mode banner when serverConnected is false', () => {
    mockStoreStateRef.serverConnected = false;
    render(<AdminDashboard />);
    expect(screen.getByText(/Sandbox Mode/)).toBeInTheDocument();
  });

  it('displays the active section title', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('overview')).toBeInTheDocument();
  });

  it('renders the sync button', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('Sync')).toBeInTheDocument();
  });

  it('renders the Add Product button', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('Add Product')).toBeInTheDocument();
  });

  it('opens the Add Product modal when button clicked', () => {
    render(<AdminDashboard />);
    fireEvent.click(screen.getByText('Add Product'));
    expect(screen.getByText('Add New Product')).toBeInTheDocument();
    expect(screen.getByText('Save Product')).toBeInTheDocument();
  });

  it('closes the Add Product modal when close button clicked', () => {
    render(<AdminDashboard />);
    fireEvent.click(screen.getByText('Add Product'));
    const closeBtns = screen.getAllByRole('button');
    const xBtn = closeBtns.find(b => b.innerHTML.includes('svg'));
    if (xBtn) fireEvent.click(xBtn);
    expect(screen.queryByText('Add New Product')).not.toBeInTheDocument();
  });

  it('renders product cards in the inventory feed', () => {
    render(<AdminDashboard />);
    expect(screen.getAllByText('Royal Silk Sherwani').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Embroidered Lehenga').length).toBeGreaterThan(0);
  });

  it('renders the search placeholder input', () => {
    render(<AdminDashboard />);
    const searchInputs = screen.getAllByPlaceholderText(/Search/);
    expect(searchInputs.length).toBeGreaterThan(0);
  });

  it('switches section when sidebar nav is clicked', () => {
    render(<AdminDashboard />);
    const productsNav = screen.getByText('Products');
    fireEvent.click(productsNav);
    expect(screen.getByText('Manage your product inventory')).toBeInTheDocument();
  });
});
