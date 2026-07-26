import { getApiBase } from '../config';
const API_BASE = getApiBase();

async function getToken() {
  try {
    const { auth } = await import('../firebase');
    if (!auth?.currentUser) return null;
    return auth.currentUser.getIdToken();
  } catch {
    return null;
  }
}

async function authHeaders() {
  const token = await getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function getProductReviews(productId, sort = 'recent') {
  const res = await fetch(`${API_BASE}/reviews/${productId}?sort=${sort}`);
  if (!res.ok) throw new Error('Failed to fetch reviews');
  return res.json();
}

export async function getReviewStats(productId) {
  const res = await fetch(`${API_BASE}/reviews/product/${productId}/stats`);
  if (!res.ok) throw new Error('Failed to fetch review stats');
  return res.json();
}

export async function addReview({ productId, rating, comment }) {
  const headers = await authHeaders();
  if (!headers.Authorization) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ productId, rating, comment }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to add review');
  }
  return res.json();
}

export async function updateReview(reviewId, { rating, comment }) {
  const headers = await authHeaders();
  if (!headers.Authorization) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/reviews/${reviewId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ rating, comment }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update review');
  }
  return res.json();
}

export async function deleteReview(reviewId) {
  const headers = await authHeaders();
  if (!headers.Authorization) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/reviews/${reviewId}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete review');
  }
  return res.json();
}

export async function toggleHelpful(reviewId) {
  const headers = await authHeaders();
  if (!headers.Authorization) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/reviews/${reviewId}/helpful`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update helpful status');
  }
  return res.json();
}

export async function getHelpfulStatus(reviewId) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/reviews/${reviewId}/helpful/status`, {
    headers,
  });
  if (!res.ok) return { helpful: false, helpfulCount: 0 };
  return res.json();
}

export async function batchHelpfulStatus(reviewIds) {
  const headers = await authHeaders();
  if (!headers.Authorization || !reviewIds.length) return {};
  const res = await fetch(`${API_BASE}/reviews/batch-helpful?ids=${reviewIds.join(',')}`, {
    headers,
  });
  if (!res.ok) return {};
  return res.json();
}

export async function reportReview(reviewId, reason) {
  const headers = await authHeaders();
  if (!headers.Authorization) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/reviews/${reviewId}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to report review');
  }
  return res.json();
}
