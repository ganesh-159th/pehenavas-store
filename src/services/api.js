import { getApiBase } from '../config';
const API_BASE = getApiBase();
const ADMIN_KEY = import.meta.env.VITE_ADMIN_API_KEY || '';

function adminHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    ...(ADMIN_KEY ? { 'x-admin-key': ADMIN_KEY } : {}),
    ...extra,
  };
}

export const adminApi = {
  async getProducts() {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  async addProduct(product) {
    const res = await fetch(`${API_BASE}/products/add`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add product');
    }
    return res.json();
  },

  async updateProduct(id, product) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update product');
    }
    return res.json();
  },

  async removeProduct(id) {
    const res = await fetch(`${API_BASE}/products/remove/${id}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to remove product');
    }
    return res.json();
  },
};
