import { getApiBase, getRazorpayKeyId } from '../config';

const API_BASE = getApiBase();
const RAZORPAY_CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

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

export function getKeyId() {
  return getRazorpayKeyId();
}

export async function createPaymentOrder({ amount, method, items, address }) {
  const headers = await authHeaders();
  if (!headers.Authorization) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/payments/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ amount, method, items, address }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Could not initiate payment');
  }
  return res.json();
}

export async function verifyPayment({ orderId, razorpayOrderId, paymentId, signature }) {
  const headers = await authHeaders();
  if (!headers.Authorization) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/payments/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ orderId, razorpayOrderId, paymentId, signature }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Payment verification failed');
  }
  return res.json();
}

export async function saveOrder(order) {
  const headers = await authHeaders();
  if (!headers.Authorization) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(order),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save order');
  }
  return res.json();
}

export async function getUserOrders() {
  const headers = await authHeaders();
  if (!headers.Authorization) return [];
  const res = await fetch(`${API_BASE}/orders`, { headers });
  if (!res.ok) return [];
  return res.json();
}

export function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    if (document.querySelector(`script[src="${RAZORPAY_CHECKOUT_SRC}"]`)) {
      document.querySelector(`script[src="${RAZORPAY_CHECKOUT_SRC}"]`)
        .addEventListener('load', () => resolve(), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load payment gateway.'));
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout({
  razorpayOrderId,
  amount,
  currency = 'INR',
  name = 'Pehenavas',
  description = 'Pehenavas order',
  onSuccess,
  onFailure,
}) {
  const key = getKeyId();
  if (!key) {
    throw new Error('Razorpay key is not configured.');
  }
  await loadRazorpayScript();

  const options = {
    key,
    amount,
    currency,
    name,
    description,
    order_id: razorpayOrderId,
    handler: (response) => {
      onSuccess && onSuccess(response);
    },
    modal: {
      ondismiss: () => {
        onFailure && onFailure(new Error('Payment was cancelled.'));
      },
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', (response) => {
    onFailure && onFailure(new Error(response?.error?.description || 'Payment failed.'));
  });
  rzp.open();
}
