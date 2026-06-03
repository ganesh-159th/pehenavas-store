const API_BASE = 'http://localhost:3001/api';

export async function addReview({ productId, userId, userName, rating, comment }) {
  const res = await fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, userId, userName, rating, comment }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to add review');
  }
  return res.json();
}

export async function getProductReviews(productId) {
  const res = await fetch(`${API_BASE}/reviews/${productId}`);
  if (!res.ok) throw new Error('Failed to fetch reviews');
  return res.json();
}
