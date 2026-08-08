import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { adminApi } from './api';

describe('adminApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('getProducts returns the product list on success', async () => {
    const products = [{ id: '1', name: 'Poshak' }];
    fetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(products) });

    const result = await adminApi.getProducts();

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/products'));
    expect(result).toEqual(products);
  });

  it('getProducts throws when the request fails', async () => {
    fetch.mockResolvedValue({ ok: false, json: vi.fn() });

    await expect(adminApi.getProducts()).rejects.toThrow('Failed to fetch products');
  });

  it('addProduct posts JSON and returns the created product', async () => {
    const created = { id: '2', name: 'New Poshak' };
    const product = { name: 'New Poshak', price: 1000 };
    fetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(created) });

    const result = await adminApi.addProduct(product);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/products/add'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(product) })
    );
    expect(result).toEqual(created);
  });

  it('addProduct throws with the server error message', async () => {
    fetch.mockResolvedValue({ ok: false, json: vi.fn().mockResolvedValue({ error: 'Duplicate name' }) });

    await expect(adminApi.addProduct({})).rejects.toThrow('Duplicate name');
  });

  it('updateProduct sends PUT with the product payload', async () => {
    const updated = { id: '2', name: 'Updated' };
    fetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(updated) });

    const result = await adminApi.updateProduct('2', { name: 'Updated' });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/products/2'),
      expect.objectContaining({ method: 'PUT' })
    );
    expect(result).toEqual(updated);
  });

  it('updateProduct throws with the server error message', async () => {
    fetch.mockResolvedValue({ ok: false, json: vi.fn().mockResolvedValue({ error: 'Not found' }) });

    await expect(adminApi.updateProduct('2', {})).rejects.toThrow('Not found');
  });

  it('removeProduct sends DELETE for the given id', async () => {
    fetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ success: true }) });

    const result = await adminApi.removeProduct('9');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/products/remove/9'),
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(result).toEqual({ success: true });
  });

  it('removeProduct throws when the request fails', async () => {
    fetch.mockResolvedValue({ ok: false, json: vi.fn().mockResolvedValue({ error: 'Failed to remove product' }) });

    await expect(adminApi.removeProduct('9')).rejects.toThrow('Failed to remove product');
  });
});
