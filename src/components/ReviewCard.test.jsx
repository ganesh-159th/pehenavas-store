import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReviewCard from './ReviewCard';
import { useUser } from '../hooks/useUser';

vi.mock('../hooks/useUser', () => ({
  useUser: vi.fn(),
}));

vi.mock('../services/reviews', () => ({
  toggleHelpful: vi.fn(),
  deleteReview: vi.fn(),
  reportReview: vi.fn(),
}));

import { toggleHelpful, deleteReview, reportReview } from '../services/reviews';

const review = {
  id: 'r1',
  userId: 'u1',
  userName: 'Ganesh',
  rating: 5,
  comment: 'Absolutely stunning craftsmanship.',
  helpfulCount: 2,
};

describe('ReviewCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUser.mockReturnValue({ user: { uid: 'u1' } });
  });

  it('renders the review details', () => {
    render(<ReviewCard review={review} />);
    expect(screen.getByText('Ganesh')).toBeInTheDocument();
    expect(screen.getByText('Absolutely stunning craftsmanship.')).toBeInTheDocument();
    expect(screen.getByText('Helpful (2)')).toBeInTheDocument();
  });

  it('marks the review as edited when applicable', () => {
    render(<ReviewCard review={{ ...review, edited: true }} />);
    expect(screen.getByText('(edited)')).toBeInTheDocument();
  });

  it('shows the delete button to the owner and deletes after confirm', async () => {
    window.confirm = vi.fn().mockReturnValue(true);
    deleteReview.mockResolvedValue({});
    const onDeleted = vi.fn();

    render(<ReviewCard review={review} onDeleted={onDeleted} />);

    fireEvent.click(screen.getByText('Delete'));
    expect(window.confirm).toHaveBeenCalled();
    expect(deleteReview).toHaveBeenCalledWith('r1');
    await screen.findByText('Delete');
    expect(onDeleted).toHaveBeenCalledWith('r1');
  });

  it('does not delete when confirm is cancelled', () => {
    window.confirm = vi.fn().mockReturnValue(false);
    render(<ReviewCard review={review} />);
    fireEvent.click(screen.getByText('Delete'));
    expect(deleteReview).not.toHaveBeenCalled();
  });

  it('invokes onEdit when the owner clicks Edit', () => {
    const onEdit = vi.fn();
    render(<ReviewCard review={review} onEdit={onEdit} />);
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(review);
  });

  it('toggles helpful status', async () => {
    toggleHelpful.mockResolvedValue({ helpful: true, helpfulCount: 3 });

    render(<ReviewCard review={review} />);
    fireEvent.click(screen.getByText(/Helpful/));

    expect(toggleHelpful).toHaveBeenCalledWith('r1');
    expect(await screen.findByText('Helpful (3)')).toBeInTheDocument();
  });

  it('disables the helpful button for guests', () => {
    useUser.mockReturnValue({ user: null });
    render(<ReviewCard review={review} />);
    expect(screen.getByRole('button', { name: /Helpful/ })).toBeDisabled();
  });

  it('allows reporting a review and submits the reason', async () => {
    useUser.mockReturnValue({ user: { uid: 'other' } });
    reportReview.mockResolvedValue({});

    render(<ReviewCard review={review} />);

    fireEvent.click(screen.getByText('Report'));
    fireEvent.change(screen.getByPlaceholderText('Spam, inappropriate, offensive...'), {
      target: { value: 'Spam content' },
    });
    fireEvent.click(screen.getByText('Submit'));

    expect(reportReview).toHaveBeenCalledWith('r1', 'Spam content');
    expect(await screen.findByText('Reported')).toBeInTheDocument();
  });

  it('renders the admin shield for admin viewers', () => {
    useUser.mockReturnValue({ user: { uid: 'other' } });
    render(<ReviewCard review={review} isAdmin />);
    expect(screen.getByTitle('Admin view')).toBeInTheDocument();
  });
});
