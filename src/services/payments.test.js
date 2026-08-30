import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockAuth = { currentUser: null };
vi.mock('../firebase', () => ({ auth: mockAuth }));

const mockConfig = vi.hoisted(() => ({ keyId: 'rzp_test_key' }));
vi.mock('../config', () => ({
  getApiBase: () => 'http://localhost:3001/api',
  getRazorpayKeyId: () => mockConfig.keyId,
}));

import {
  createPaymentOrder,
  verifyPayment,
  saveOrder,
  getUserOrders,
  loadRazorpayScript,
  openRazorpayCheckout,
} from './payments';

const res = (body, ok = true) => ({ ok, json: vi.fn().mockResolvedValue(body) });

describe('payments service', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    mockAuth.currentUser = { getIdToken: vi.fn().mockResolvedValue('token-123') };
    mockConfig.keyId = 'rzp_test_key';
    delete window.Razorpay;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('requires authentication for money operations', async () => {
    mockAuth.currentUser = null;
    await expect(createPaymentOrder({})).rejects.toThrow('Authentication required');
    await expect(verifyPayment({})).rejects.toThrow('Authentication required');
    await expect(saveOrder({})).rejects.toThrow('Authentication required');
    expect(await getUserOrders()).toEqual([]);
  });

  it('creates a payment order and verifies the payment', async () => {
    fetch.mockResolvedValue(res({ id: 'order_1' }));
    const payload = { amount: 25000, method: 'card', items: [], address: {} };

    await expect(createPaymentOrder(payload)).resolves.toEqual({ id: 'order_1' });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/payments/create-order'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-123' },
        body: JSON.stringify(payload),
      })
    );

    fetch.mockResolvedValue(res({ verified: true }));
    await expect(
      verifyPayment({ orderId: 'o1', razorpayOrderId: 'rp1', paymentId: 'p1', signature: 'sig' })
    ).resolves.toEqual({ verified: true });
  });

  it('saves and fetches orders', async () => {
    fetch.mockResolvedValue(res({ id: 'o1' }));
    await expect(saveOrder({ total: 100 })).resolves.toEqual({ id: 'o1' });

    fetch.mockResolvedValue(res([{ id: 'o1' }]));
    await expect(getUserOrders()).resolves.toEqual([{ id: 'o1' }]);
  });

  it('surfaces server errors', async () => {
    fetch.mockResolvedValue(res({ error: 'Insufficient funds' }, false));
    await expect(createPaymentOrder({})).rejects.toThrow('Insufficient funds');
    fetch.mockResolvedValue(res({ error: 'Signature mismatch' }, false));
    await expect(verifyPayment({})).rejects.toThrow('Signature mismatch');
    fetch.mockResolvedValue(res({}, false));
    await expect(saveOrder({})).rejects.toThrow('Failed to save order');
    expect(await getUserOrders()).toEqual([]);
  });

  it('loads the Razorpay checkout script', async () => {
    window.Razorpay = {};
    await expect(loadRazorpayScript()).resolves.toBeUndefined();

    const origCreate = document.createElement.bind(document);
    let script;
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag !== 'script') return origCreate(tag);
      script = origCreate(tag);
      return script;
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => undefined);

    const loading = loadRazorpayScript();
    script.onload();
    await expect(loading).resolves.toBeUndefined();

    const failing = loadRazorpayScript();
    script.onerror();
    await expect(failing).rejects.toThrow('Could not load payment gateway.');
  });

  it('opens the Razorpay checkout with configured handlers', async () => {
    const onSuccess = vi.fn();
    const onFailure = vi.fn();
    class FakeRazorpay {
      constructor(options) {
        this.options = options;
        this.events = {};
      }
      on(name, cb) {
        this.events[name] = cb;
      }
      open() {
        window.__rzp = this;
      }
    }
    window.Razorpay = FakeRazorpay;

    await openRazorpayCheckout({ razorpayOrderId: 'o1', amount: 100, onSuccess, onFailure });

    const rzp = window.__rzp;
    expect(rzp.options).toMatchObject({ key: 'rzp_test_key', amount: 100, order_id: 'o1' });
    rzp.options.handler({ paymentId: 'pay_1' });
    expect(onSuccess).toHaveBeenCalledWith({ paymentId: 'pay_1' });
    rzp.options.modal.ondismiss();
    expect(onFailure).toHaveBeenCalledWith(new Error('Payment was cancelled.'));
    rzp.events['payment.failed']({ error: { description: 'Card declined' } });
    expect(onFailure).toHaveBeenCalledWith(new Error('Card declined'));

    mockConfig.keyId = '';
    await expect(openRazorpayCheckout({ razorpayOrderId: 'o1', amount: 100 })).rejects.toThrow(
      'Razorpay key is not configured.'
    );
  });
});