import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockAuth = { currentUser: null };
vi.mock('../firebase', () => ({
  auth: mockAuth,
}));

import {
  getProductReviews,
  getReviewStats,
  addReview,
  updateReview,
  deleteReview,
  toggleHelpful,
  getHelpfulStatus,
  batchHelpfulStatus,
  reportReview,
} from './reviews';

function jsonResponse(body, ok = true) {
  return { ok, json: vi.fn().mockResolvedValue(body) };
}

describe('review service', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    mockAuth.currentUser = { getIdToken: vi.fn().mockResolvedValue('token-123') };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('getProductReviews fetches with the given sort and returns JSON', async () => {
    const reviews = [{ id: '1', comment: 'Great' }];
    fetch.mockResolvedValue(jsonResponse(reviews));

    const result = await getProductReviews('p1', 'highest');

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/reviews/p1?sort=highest'));
    expect(result).toEqual(reviews);
  });

  it('getProductReviews throws when not ok', async () => {
    fetch.mockResolvedValue(jsonResponse({}, false));
    await expect(getProductReviews('p1')).rejects.toThrow('Failed to fetch reviews');
  });

  it('getReviewStats fetches the stats endpoint', async () => {
    const stats = { average: 4.5 };
    fetch.mockResolvedValue(jsonResponse(stats));

    const result = await getReviewStats('p1');

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/reviews/product/p1/stats'));
    expect(result).toEqual(stats);
  });

  it('getReviewStats throws when not ok', async () => {
    fetch.mockResolvedValue(jsonResponse({}, false));
    await expect(getReviewStats('p1')).rejects.toThrow('Failed to fetch review stats');
  });

  it('addReview requires authentication', async () => {
    mockAuth.currentUser = null;
    await expect(addReview({ productId: 'p1', rating: 5, comment: 'Nice' })).rejects.toThrow(
      'Authentication required'
    );
  });

  it('addReview posts an authenticated request', async () => {
    fetch.mockResolvedValue(jsonResponse({ id: 'r1' }));

    const result = await addReview({ productId: 'p1', rating: 5, comment: 'Beautiful piece' });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/reviews'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token-123' }),
        body: JSON.stringify({ productId: 'p1', rating: 5, comment: 'Beautiful piece' }),
      })
    );
    expect(result).toEqual({ id: 'r1' });
  });

  it('addReview surfaces server errors', async () => {
    fetch.mockResolvedValue(jsonResponse({ error: 'Too short' }, false));
    await expect(addReview({ productId: 'p1', rating: 5, comment: 'Nice' })).rejects.toThrow('Too short');
  });

  it('updateReview sends an authenticated PUT', async () => {
    fetch.mockResolvedValue(jsonResponse({ id: 'r1', rating: 4 }));

    const result = await updateReview('r1', { rating: 4, comment: 'Updated' });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/reviews/r1'),
      expect.objectContaining({ method: 'PUT' })
    );
    expect(result).toEqual({ id: 'r1', rating: 4 });
  });

  it('updateReview throws when unauthenticated', async () => {
    mockAuth.currentUser = null;
    await expect(updateReview('r1', { rating: 4, comment: 'x' })).rejects.toThrow('Authentication required');
  });

  it('deleteReview sends an authenticated DELETE', async () => {
    fetch.mockResolvedValue(jsonResponse({ success: true }));

    const result = await deleteReview('r1');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/reviews/r1'),
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(result).toEqual({ success: true });
  });

  it('deleteReview throws when not ok', async () => {
    fetch.mockResolvedValue(jsonResponse({ error: 'Not found' }, false));
    await expect(deleteReview('r1')).rejects.toThrow('Not found');
  });

  it('toggleHelpful posts and returns the updated status', async () => {
    fetch.mockResolvedValue(jsonResponse({ helpful: true, helpfulCount: 3 }));

    const result = await toggleHelpful('r1');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/reviews/r1/helpful'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(result).toEqual({ helpful: true, helpfulCount: 3 });
  });

  it('toggleHelpful requires auth', async () => {
    mockAuth.currentUser = null;
    await expect(toggleHelpful('r1')).rejects.toThrow('Authentication required');
  });

  it('getHelpfulStatus returns the status when ok', async () => {
    fetch.mockResolvedValue(jsonResponse({ helpful: true }));
    expect(await getHelpfulStatus('r1')).toEqual({ helpful: true });
  });

  it('getHelpfulStatus returns defaults when not ok', async () => {
    fetch.mockResolvedValue(jsonResponse({}, false));
    expect(await getHelpfulStatus('r1')).toEqual({ helpful: false, helpfulCount: 0 });
  });

  it('batchHelpfulStatus returns {} when unauthenticated', async () => {
    mockAuth.currentUser = null;
    expect(await batchHelpfulStatus(['r1', 'r2'])).toEqual({});
  });

  it('batchHelpfulStatus returns {} for an empty id list', async () => {
    expect(await batchHelpfulStatus([])).toEqual({});
  });

  it('batchHelpfulStatus returns {} when the request fails', async () => {
    fetch.mockResolvedValue(jsonResponse({}, false));
    expect(await batchHelpfulStatus(['r1'])).toEqual({});
  });

  it('batchHelpfulStatus returns statuses when ok', async () => {
    fetch.mockResolvedValue(jsonResponse({ r1: { helpful: true } }));
    const result = await batchHelpfulStatus(['r1']);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/reviews/batch-helpful?ids=r1'), expect.any(Object));
    expect(result).toEqual({ r1: { helpful: true } });
  });

  it('reportReview posts the reason', async () => {
    fetch.mockResolvedValue(jsonResponse({ success: true }));

    const result = await reportReview('r1', 'spam');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/reviews/r1/report'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ reason: 'spam' }) })
    );
    expect(result).toEqual({ success: true });
  });

  it('reportReview requires auth', async () => {
    mockAuth.currentUser = null;
    await expect(reportReview('r1', 'spam')).rejects.toThrow('Authentication required');
  });

  it('reportReview surfaces server errors', async () => {
    fetch.mockResolvedValue(jsonResponse({ error: 'Failed' }, false));
    await expect(reportReview('r1', 'spam')).rejects.toThrow('Failed');
  });
});
