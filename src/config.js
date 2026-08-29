const API_PORT = 3001;

export function getApiBase() {
  const envUrl = import.meta.env.VITE_API_URL;
  // Explicit production URL (e.g. https://api.example.com/api) always wins.
  if (envUrl && !envUrl.includes('localhost')) return envUrl.replace(/\/$/, '');
  // In production the frontend is served by the same server → use a relative path.
  if (import.meta.env.PROD) return '/api';
  // Development: backend on port 3001 at the same host.
  return `http://${window.location.hostname}:${API_PORT}/api`;
}

export function getRazorpayKeyId() {
  return import.meta.env.VITE_RAZORPAY_KEY_ID || '';
}
