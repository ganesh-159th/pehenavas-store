import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ProductDetail from './ProductDetail';
import { BrowserRouter } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import * as ReactRouter from 'react-router-dom';

// 1. Mock dependencies
vi.mock('../hooks/useCart', () => ({
  useCart: vi.fn()
}));

vi.mock('../hooks/useFadeIn', () => ({
  useFadeIn: () => true
}));

const mockUseUser = vi.hoisted(() => vi.fn().mockReturnValue({ user: null }));
vi.mock('../hooks/useUser', () => ({
  useUser: mockUseUser
}));

vi.mock('../services/reviews', () => ({
  addReview: vi.fn(),
  getProductReviews: vi.fn().mockResolvedValue([])
}));

const mockUseStore = vi.hoisted(() => vi.fn());
vi.mock('../store/useStore', () => ({
  useStore: mockUseStore
}));

vi.mock('../utils.js', () => ({
  formatINR: (amount) => `₹${amount}`
}));

// 2. Partially mock react-router-dom to control useParams and useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn()
  };
});

// 3. Mock PRODUCTS data
vi.mock('../data/products.js', () => ({
  PRODUCTS: [
    {
      id: '1',
      name: 'Royal Rajputana Poshak',
      price: 15000,
      originalPrice: 18000,
      description: 'A stunning traditional poshak.',
      image: 'poshak.jpg',
      rating: 4.5,
      reviews: 128,
      category: 'Women'
    }
  ]
}));

describe('ProductDetail Component', () => {
  const mockAddToCart = vi.fn();
  const mockNavigate = vi.fn();

  const mockProducts = [
    {
      id: '1',
      name: 'Royal Rajputana Poshak',
      price: 15000,
      originalPrice: 18000,
      description: 'A stunning traditional poshak.',
      image: 'poshak.jpg',
      rating: 4.5,
      reviews: 128,
      category: 'Women'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useCart.mockReturnValue({ addToCart: mockAddToCart });
    ReactRouter.useNavigate.mockReturnValue(mockNavigate);
    mockUseUser.mockReturnValue({ user: null });
    mockUseStore.mockImplementation((selector) =>
      selector({ products: mockProducts })
    );
  });

  afterEach(() => {
    document.title = ''; // Reset document title after each test
  });

  const renderComponent = () => render(<ProductDetail />, { wrapper: BrowserRouter });

  describe('Valid Product Display', () => {
    beforeEach(() => {
      ReactRouter.useParams.mockReturnValue({ id: '1' });
    });

    it('renders the product name correctly', () => {
      renderComponent();
      expect(screen.getByText('Royal Rajputana Poshak')).toBeInTheDocument();
    });

    it('displays the product description', () => {
      renderComponent();
      expect(screen.getByText('A stunning traditional poshak.')).toBeInTheDocument();
    });

    it('renders the product image with correct alt text', () => {
      renderComponent();
      const img = screen.getByRole('img', { name: 'Royal Rajputana Poshak' });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'poshak.jpg');
    });

    it('displays the formatted price', () => {
      renderComponent();
      expect(screen.getByText('₹15000')).toBeInTheDocument();
    });

    it('displays the crossed out original price (price * 1.2)', () => {
      renderComponent();
      expect(screen.getByText('₹18000')).toBeInTheDocument();
    });

    it('displays the number of reviews', async () => {
      renderComponent();
      expect(await screen.findByText(/0 reviews/)).toBeInTheDocument();
    });

    it('sets the document title to the product name for SEO', () => {
      renderComponent();
      expect(document.title).toBe('Royal Rajputana Poshak | Pehenavas');
    });

    it('navigates back when the Back button is clicked', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /Back/i }));
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('Interactive Features', () => {
    beforeEach(() => {
      ReactRouter.useParams.mockReturnValue({ id: '1' });
    });

    it('defaults to size M', () => {
      renderComponent();
      const sizeM = screen.getByRole('button', { name: 'M' });
      expect(sizeM).toHaveClass('bg-rose-950'); // Has active styling
    });

    it('updates selected size on click', () => {
      renderComponent();
      const sizeL = screen.getByRole('button', { name: 'L' });
      
      fireEvent.click(sizeL);
      
      expect(sizeL).toHaveClass('bg-rose-950'); // Is now active
      
      const sizeM = screen.getByRole('button', { name: 'M' });
      expect(sizeM).not.toHaveClass('bg-rose-950'); // Is no longer active
    });

    it('calls addToCart with default size (M) when Add to Cart is clicked', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /Add to Cart/i }));
      
      expect(mockAddToCart).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1', name: 'Royal Rajputana Poshak' }), 
        'M'
      );
    });

    it('calls addToCart with selected size when Add to Cart is clicked', () => {
      renderComponent();
      
      // Select XL
      fireEvent.click(screen.getByRole('button', { name: 'XL' }));
      
      // Click Add to Cart
      fireEvent.click(screen.getByRole('button', { name: /Add to Cart/i }));
      
      // Assert we pass the correct object and 'XL' size
      expect(mockAddToCart).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1', name: 'Royal Rajputana Poshak' }), 
        'XL'
      );
    });
  });

  describe('Invalid Product (404 Fallback)', () => {
    beforeEach(() => {
      ReactRouter.useParams.mockReturnValue({ id: '99999' }); // Invalid ID
    });

    it('renders the Product Not Found message', () => {
      renderComponent();
      expect(screen.getByText('Product Not Found')).toBeInTheDocument();
      expect(screen.getByText(/The item you are looking for does not exist/i)).toBeInTheDocument();
    });

    it('provides a link to return to the store', () => {
      renderComponent();
      const returnLink = screen.getByRole('link', { name: /Return to Store/i });
      expect(returnLink).toBeInTheDocument();
      expect(returnLink).toHaveAttribute('href', '/');
    });

    it('sets the document title to Product Not Found', () => {
      renderComponent();
      expect(document.title).toBe('Product Not Found | Pehenavas');
    });
  });
});