import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReviewForm from './ReviewForm';

describe('ReviewForm', () => {
  it('renders the write a review heading with a default rating of 5', () => {
    render(<ReviewForm onSubmit={vi.fn()} submitting={false} />);
    expect(screen.getByText('Write a Review')).toBeInTheDocument();
    expect(screen.getByText('5/5')).toBeInTheDocument();
  });

  it('renders edit mode with prefilled values', () => {
    render(
      <ReviewForm
        initialRating={3}
        initialComment="An existing comment"
        onSubmit={vi.fn()}
        submitting={false}
        isEditing
      />
    );
    expect(screen.getByText('Edit Review')).toBeInTheDocument();
    expect(screen.getByText('3/5')).toBeInTheDocument();
    expect(screen.getByText('Update Review')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('An existing comment');
  });

  it('submits the trimmed comment with the selected rating', () => {
    const onSubmit = vi.fn();
    render(<ReviewForm onSubmit={onSubmit} submitting={false} />);

    const starButtons = screen.getAllByRole('button').filter((b) => b.textContent.trim() === '');
    fireEvent.click(starButtons[3]);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '  Excellent quality piece  ' } });
    fireEvent.click(screen.getByRole('button', { name: /Submit Review/i }));

    expect(onSubmit).toHaveBeenCalledWith({ rating: 4, comment: 'Excellent quality piece' });
  });

  it('does not submit a comment shorter than 10 characters', () => {
    const onSubmit = vi.fn();
    render(<ReviewForm onSubmit={onSubmit} submitting={false} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /Submit Review/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables the submit button while submitting', () => {
    render(<ReviewForm onSubmit={vi.fn()} submitting />);
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submitting/i })).toBeDisabled();
  });

  it('shows the cancel button and invokes onCancel when clicked', () => {
    const onCancel = vi.fn();
    render(<ReviewForm onSubmit={vi.fn()} onCancel={onCancel} submitting={false} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
