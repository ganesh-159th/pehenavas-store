import { productsService, ordersService } from './db';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function serverFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  return res.json();
}

export const adminApi = {
  async getProducts() {
    return productsService.getAll();
  },

  async addProduct(product) {
    return productsService.add(product);
  },

  async updateProduct(id, data) {
    await productsService.update(id, data);
    await serverFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async removeProduct(id) {
    await productsService.remove(id);
    await serverFetch(`/products/${id}`, { method: 'DELETE' });
  },

  async getOrders() {
    try {
      const fromServer = await serverFetch('/orders');
      if (fromServer) return fromServer;
    } catch {
      // Server unavailable — fall back to local Firestore
    }
    return ordersService.getAll();
  },

  async addOrder(order) {
    const saved = await ordersService.add(order);
    await serverFetch('/orders', { method: 'POST', body: JSON.stringify(order) });
    return saved;
  },

  async updateOrderStatus(id, status) {
    await serverFetch(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
  },

  async uploadProductImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.url;
  },

  async createPaymentOrder(amount) {
    const result = await serverFetch('/payment/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    return result;
  },

  async verifyPayment(data) {
    return serverFetch('/payment/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async sendOrderConfirmation({ to, orderId, total, items, name }) {
    return serverFetch('/email/send-confirmation', {
      method: 'POST',
      body: JSON.stringify({ to, orderId, total, items, name }),
    });
  },

  async healthCheck() {
    return serverFetch('/health');
  },
};
