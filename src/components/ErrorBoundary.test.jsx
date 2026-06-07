import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

function GoodComponent() {
  return <div>All good here</div>;
}

function BadComponent() {
  throw new Error('Test error');
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('All good here')).toBeInTheDocument();
  });

  it('renders the error fallback UI when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <BadComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh Page/i })).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it('does not render error UI when there is no error', () => {
    const { container } = render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>
    );

    expect(container.querySelector('button')).not.toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('renders the alert icon SVG', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <BadComponent />
      </ErrorBoundary>
    );

    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it('Refresh Page button calls window.location.reload', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <BadComponent />
      </ErrorBoundary>
    );

    screen.getByRole('button', { name: /Refresh Page/i }).click();
    expect(reloadMock).toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});
