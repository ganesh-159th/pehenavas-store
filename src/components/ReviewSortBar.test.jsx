import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReviewSortBar from './ReviewSortBar';

describe('ReviewSortBar', () => {
  it('renders the review count with correct pluralization', () => {
    render(<ReviewSortBar sort="recent" onSortChange={vi.fn()} reviewCount={1} />);
    expect(screen.getByText('1 review')).toBeInTheDocument();
  });

  it('uses the plural form for multiple reviews', () => {
    render(<ReviewSortBar sort="recent" onSortChange={vi.fn()} reviewCount={5} />);
    expect(screen.getByText('5 reviews')).toBeInTheDocument();
  });

  it('renders all sort options with the current value selected', () => {
    render(<ReviewSortBar sort="highest" onSortChange={vi.fn()} reviewCount={2} />);
    const select = screen.getByRole('combobox');
    expect(select.value).toBe('highest');
    expect(screen.getAllByRole('option')).toHaveLength(4);
  });

  it('calls onSortChange when the selection changes', () => {
    const onSortChange = vi.fn();
    render(<ReviewSortBar sort="recent" onSortChange={onSortChange} reviewCount={2} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'helpful' } });
    expect(onSortChange).toHaveBeenCalledWith('helpful');
  });
});
