import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockAuth = { currentUser: null };
vi.mock('../firebase', () => ({
  auth: mockAuth,
}));

const mockConfig = vi.hoisted(() => ({ keyId: 'rzp_test_key' }));
vi.mock('../config', () => ({
  getApiBase: () => 'http://localhost:3001/api',
  getRazorpayKeyId: () => mockConfig.keyId,
}));

import {
  getKeyId,
  createPaymentOrder,
  verifyPayment,
  saveOrder,
  getUserOrders,
  loadRazorpayScript,
  openRazorpayCheckout,
} from './payments';

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

function jsonResponse(body, ok = true) {
  return { ok, json: vi.fn().mockResolvedValue(body) };
}

class FakeRazorpay {
  constructor(options) {
    this.options = options;
    this.handlers = {};
  }
  on(event, cb) {
    this.handlers[event] = cb;
  }
  open() {
    window.__rzp = this;
  }
}

describe('payments service', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    mockAuth.currentUser = { getIdToken: vi.fn().mockResolvedValue('token-123') };
    mockConfig.keyId = 'rzp_test_key';
    delete window.Razorpay;
    delete window.__rzp;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.querySelectorAll(`script[src="${CHECKOUT_SRC}"]`).forEach((s) => s.remove());
  });

  it('getKeyId returns the configured Razorpay key id', () => {
    expect(getKeyId()).toBe('rzp_test_key');
  });

  it('createPaymentOrder requires authentication', async () => {
    mockAuth.currentUser = null;
    await expect(createPaymentOrder({ amount: 100 })).rejects.toThrow('Authentication required');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('createPaymentOrder posts the order payload with an auth header', async () => {
    fetch.mockResolvedValue(jsonResponse({ id: 'order_1' }));
    const payload = {
      amount: 25000,
      method: 'card',
      items: [{ id: 'p1' }],
      address: { line1: 'Home', name: 'Test User' },
    };

    const result = await createPaymentOrder(payload);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/payments/create-order'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token-123' }),
        body: JSON.stringify(payload),
      })
    );
    expect(result).toEqual({ id: 'order_1' });
  });

  it('createPaymentOrder surfaces the server error message', async () => {
    fetch.mockResolvedValue(jsonResponse({ error: 'Insufficient funds' }, false));
    await expect(createPaymentOrder({ amount: 100 })).rejects.toThrow('Insufficient funds');
  });

  it('createPaymentOrder falls back to a default error message', async () => {
    fetch.mockResolvedValue(jsonResponse({}, false));
    await expect(createPaymentOrder({ amount: 100 })).rejects.toThrow('Could not initiate payment');
  });

  it('verifyPayment requires authentication', async () => {
    mockAuth.currentUser = null;
    await expect(verifyPayment({})).rejects.toThrow('Authentication required');
  });

  it('verifyPayment posts the verification payload', async () => {
    fetch.mockResolvedValue(jsonResponse({ verified: true }));
    const payload = { orderId: 'o1', razorpayOrderId: 'rp1', paymentId: 'pay1', signature: 'sig' };

    await verifyPayment(payload);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/payments/verify'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) })
    );
  });

  it('verifyPayment throws when verification fails', async () => {
    fetch.mockResolvedValue(jsonResponse({ error: 'Signature mismatch' }, false));
    await expect(verifyPayment({})).rejects.toThrow('Signature mismatch');
  });

  it('saveOrder requires authentication', async () => {
    mockAuth.currentUser = null;
    await expect(saveOrder({})).rejects.toThrow('Authentication required');
  });

  it('saveOrder posts the order', async () => {
    fetch.mockResolvedValue(jsonResponse({ id: 'o1' }));
    const order = { items: [], total: 100, delivery: 'Express' };

    const result = await saveOrder(order);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/orders'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(order) })
    );
    expect(result).toEqual({ id: 'o1' });
  });

  it('getUserOrders returns [] when unauthenticated', async () => {
    mockAuth.currentUser = null;
    expect(await getUserOrders()).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('getUserOrders returns [] when the request fails', async () => {
    fetch.mockResolvedValue(jsonResponse({}, false));
    expect(await getUserOrders()).toEqual([]);
  });

  it('getUserOrders returns the fetched orders', async () => {
    const orders = [{ id: 'o1' }];
    fetch.mockResolvedValue(jsonResponse(orders));

    expect(await getUserOrders()).toEqual(orders);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/orders'), expect.anything());
  });

  it('loadRazorpayScript resolves immediately when Razorpay is already loaded', async () => {
    window.Razorpay = {};
    await expect(loadRazorpayScript()).resolves.toBeUndefined();
    expect(document.querySelector(`script[src="${CHECKOUT_SRC}"]`)).toBeNull();
  });

  it('loadRazorpayScript injects the checkout script and resolves on load', async () => {
    const origCreateElement = document.createElement.bind(document);
    let createdScript = null;
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag !== 'script') return origCreateElement(tag);
      createdScript = origCreateElement(tag);
      return createdScript;
    });
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => undefined);

    const promise = loadRazorpayScript();

    expect(appendSpy).toHaveBeenCalledWith(createdScript);
    createdScript.onload();
    await expect(promise).resolves.toBeUndefined();
  });

  it('loadRazorpayScript rejects when the script fails to load', async () => {
    const origCreateElement = document.createElement.bind(document);
    let createdScript = null;
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag !== 'script') return origCreateElement(tag);
      createdScript = origCreateElement(tag);
      return createdScript;
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => undefined);

    const promise = loadRazorpayScript();

    createdScript.onerror();
    await expect(promise).rejects.toThrow('Could not load payment gateway.');
  });

  it('loadRazorpayScript waits for an already-injected script to load', async () => {
    const existing = document.createElement('script');
    existing.src = CHECKOUT_SRC;
    const origQuerySelector = document.querySelector.bind(document);
    vi.spyOn(document, 'querySelector').mockImplementation((selector) => {
      if (selector === `script[src="${CHECKOUT_SRC}"]`) return existing;
      return origQuerySelector(selector);
    });

    const promise = loadRazorpayScript();

    existing.dispatchEvent(new Event('load'));
    await expect(promise).resolves.toBeUndefined();
  });

  it('openRazorpayCheckout throws when the key is not configured', async () => {
    mockConfig.keyId = '';
    await expect(
      openRazorpayCheckout({ razorpayOrderId: 'o1', amount: 100 })
    ).rejects.toThrow('Razorpay key is not configured.');
  });

  it('openRazorpayCheckout wires up success, dismiss and failure handlers', async () => {
    window.Razorpay = FakeRazorpay;
    const onSuccess = vi.fn();
    const onFailure = vi.fn();

    await openRazorpayCheckout({
      razorpayOrderId: 'order_1',
      amount: 5000,
      currency: 'INR',
      name: 'Pehenavas',
      description: 'Pehenavas order',
      onSuccess,
      onFailure,
    });

    const rzp = window.__rzp;
    expect(rzp).toBeDefined();
    expect(rzp.options).toMatchObject({
      key: 'rzp_test_key',
      amount: 5000,
      currency: 'INR',
      name: 'Pehenavas',
      order_id: 'order_1',
    });

    rzp.options.handler({ paymentId: 'pay_1' });
    expect(onSuccess).toHaveBeenCalledWith({ paymentId: 'pay_1' });

    rzp.options.modal.ondismiss();
    expect(onFailure).toHaveBeenCalledWith(new Error('Payment was cancelled.'));

    rzp.handlers['payment.failed']({ error: { description: 'Card declined' } });
    expect(onFailure).toHaveBeenCalledWith(new Error('Card declined'));
  });
});