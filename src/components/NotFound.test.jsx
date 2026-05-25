import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import NotFound from './NotFound';
import { BrowserRouter } from 'react-router-dom';
import { useFadeIn } from '../hooks/useFadeIn';

// Mock the useFadeIn hook
vi.mock('../hooks/useFadeIn', () => ({
  useFadeIn: vi.fn()
}));

describe('NotFound Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the NotFound component without crashing', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('renders with BrowserRouter wrapper due to Link component', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      // Component should render without throwing an error
      expect(screen.getByText('404')).toBeInTheDocument();
    });
  });

  describe('404 Message Display', () => {
    it('displays the 404 error code prominently', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('404');
      expect(heading).toHaveClass('text-7xl', 'md:text-9xl');
    });

    it('displays "Page Not Found" heading', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Page Not Found');
      expect(heading).toHaveClass('text-2xl', 'md:text-3xl');
    });

    it('displays descriptive error message', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      const description = screen.getByText(/Alas, the royal chambers you seek are nowhere to be found/i);
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('text-gray-600');
    });

    it('displays additional message context', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      expect(screen.getByText(/They may have been moved, or perhaps they never existed at all/i)).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('renders a "Return to Royal Collection" link', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      const link = screen.getByRole('link', { name: /Return to Royal Collection/i });
      expect(link).toBeInTheDocument();
    });

    it('home link navigates to root path', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      const link = screen.getByRole('link', { name: /Return to Royal Collection/i });
      expect(link).toHaveAttribute('href', '/');
    });

    it('home link has proper styling classes', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      const link = screen.getByRole('link', { name: /Return to Royal Collection/i });
      expect(link).toHaveClass('inline-flex');
      expect(link).toHaveClass('items-center');
      expect(link).toHaveClass('justify-center');
      expect(link).toHaveClass('bg-gradient-to-r');
      expect(link).toHaveClass('hover:scale-105');
    });

    it('home link has focus ring styling', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      const link = screen.getByRole('link', { name: /Return to Royal Collection/i });
      expect(link).toHaveClass('focus:outline-none');
      expect(link).toHaveClass('focus:ring-2');
    });
  });

  describe('Page Content and Styling', () => {
    it('renders container with proper styling', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      const container = screen.getByText('404').closest('div');
      expect(container).toHaveClass('bg-white');
      expect(container).toHaveClass('rounded-xl');
      expect(container).toHaveClass('shadow-md');
      expect(container).toHaveClass('border');
      expect(container).toHaveClass('border-rose-100');
    });

    it('container has flex layout for centering', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      const container = screen.getByText('404').closest('div');
      expect(container).toHaveClass('flex');
      expect(container).toHaveClass('flex-col');
      expect(container).toHaveClass('items-center');
      expect(container).toHaveClass('justify-center');
    });

    it('container has responsive padding', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      const container = screen.getByText('404').closest('div');
      expect(container).toHaveClass('py-24');
      expect(container).toHaveClass('px-4');
    });

    it('container has max-width constraint', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      const container = screen.getByText('404').closest('div');
      expect(container).toHaveClass('max-w-4xl');
      expect(container).toHaveClass('mx-auto');
    });

    it('renders decorative SVG icon', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      const svg = screen.getByText('404').closest('div').querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('w-20', 'h-20');
      expect(svg).toHaveClass('mx-auto');
    });

    it('icon has pulsing animation', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      const iconContainer = screen.getByText('404').closest('div').querySelector('svg').parentElement;
      expect(iconContainer).toHaveClass('animate-pulse');
      expect(iconContainer).toHaveClass('text-amber-500');
    });

    it('404 heading has serif font', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      const heading = screen.getByText('404');
      expect(heading).toHaveClass('font-serif');
      expect(heading).toHaveClass('font-bold');
    });

    it('404 heading has proper color styling', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      const heading = screen.getByText('404');
      expect(heading).toHaveClass('text-rose-950');
    });

    it('Page Not Found heading has rose color', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      const heading = screen.getByText('Page Not Found');
      expect(heading).toHaveClass('text-rose-900');
      expect(heading).toHaveClass('font-bold');
    });

    it('description text has responsive sizing', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      const description = screen.getByText(/Alas, the royal chambers you seek/i);
      expect(description).toHaveClass('text-base');
      expect(description).toHaveClass('md:text-lg');
    });
  });

  describe('Fade-in Animation', () => {
    it('applies fade-in styles when visible', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      const container = screen.getByText('404').closest('div');
      expect(container).toHaveClass('opacity-100');
      expect(container).toHaveClass('translate-y-0');
    });

    it('applies hidden styles when not visible', () => {
      useFadeIn.mockReturnValue(false);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      const container = screen.getByText('404').closest('div');
      expect(container).toHaveClass('opacity-0');
      expect(container).toHaveClass('translate-y-12');
    });

    it('applies transition classes for smooth animation', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      const container = screen.getByText('404').closest('div');
      expect(container).toHaveClass('transition-all');
      expect(container).toHaveClass('duration-1000');
      expect(container).toHaveClass('ease-out');
      expect(container).toHaveClass('transform');
    });

    it('calls useFadeIn hook', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      expect(useFadeIn).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      
      expect(h1).toHaveTextContent('404');
      expect(h2).toHaveTextContent('Page Not Found');
    });

    it('link has descriptive text content', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      const link = screen.getByRole('link');
      expect(link.textContent).toBeTruthy();
      expect(link.textContent).toMatch(/Return to Royal Collection/);
    });

    it('renders valid HTML structure', () => {
      useFadeIn.mockReturnValue(true);
      const { container } = render(<NotFound />, { wrapper: BrowserRouter });
      
      // Check main div exists
      const mainDiv = container.querySelector('div');
      expect(mainDiv).toBeTruthy();
      
      // Check nested structure
      const link = container.querySelector('a');
      expect(link).toBeTruthy();
      expect(link.getAttribute('href')).toBe('/');
    });
  });

  describe('Integration', () => {
    it('exports component as default', () => {
      expect(NotFound).toBeTruthy();
    });

    it('renders complete page structure', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(screen.getByText(/Alas, the royal chambers/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Return to Royal Collection/i })).toBeInTheDocument();
    });

    it('renders all text content correctly', () => {
      useFadeIn.mockReturnValue(true);
      render(<NotFound />, { wrapper: BrowserRouter });
      
      // Check all main text elements are present
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(screen.getByText(/Alas, the royal chambers you seek are nowhere to be found/)).toBeInTheDocument();
      expect(screen.getByText(/They may have been moved, or perhaps they never existed at all/)).toBeInTheDocument();
    });
  });
});
