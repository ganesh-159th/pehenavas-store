import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { createTransport } from 'nodemailer';
import { initializeApp as initAdminApp, cert } from 'firebase-admin/app';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import multer from 'multer';

const PORT = process.env.PORT || 4000;
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '';
const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '';
const FIREBASE_ADMIN_EMAIL = process.env.FIREBASE_ADMIN_EMAIL || '';
const FIREBASE_ADMIN_PASSWORD = process.env.FIREBASE_ADMIN_PASSWORD || '';
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = process.env.SMTP_PORT || '587';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'orders@pehenavas.com';

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1';

let razorpay = null;
let transporter = null;

try {
  const Razorpay = (await import('razorpay')).default;
  if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
  }
} catch (e) {
  console.warn('razorpay not available:', e.message);
}

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT),
    secure: SMTP_PORT === '465',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

let firebaseToken = null;
let tokenExpiry = 0;

async function getFirebaseToken() {
  if (firebaseToken && Date.now() < tokenExpiry) return firebaseToken;
  if (!FIREBASE_ADMIN_EMAIL || !FIREBASE_ADMIN_PASSWORD) return null;
  try {
    const res = await fetch(`${AUTH_BASE}/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: FIREBASE_ADMIN_EMAIL, password: FIREBASE_ADMIN_PASSWORD, returnSecureToken: true }),
    });
    const data = await res.json();
    if (data.idToken) {
      firebaseToken = data.idToken;
      tokenExpiry = Date.now() + (parseInt(data.expiresIn) || 3600) * 1000 - 60000;
      return firebaseToken;
    }
    return null;
  } catch {
    return null;
  }
}

function firestoreFetch(path, options = {}) {
  if (!FIREBASE_PROJECT_ID || !FIREBASE_API_KEY) {
    return Promise.reject(new Error('Firebase not configured'));
  }
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const url = new URL(`${FIRESTORE_BASE}/${path}`);
  url.searchParams.set('key', FIREBASE_API_KEY);
  return getFirebaseToken().then(token => {
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url.toString(), { headers, ...options }).then(r => r.json());
  });
}

function parseFirestoreValue(val) {
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return Number(val.integerValue);
  if (val.doubleValue !== undefined) return Number(val.doubleValue);
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.timestampValue) return val.timestampValue;
  if (val.arrayValue?.values) return val.arrayValue.values.map(parseFirestoreValue);
  if (val.mapValue?.fields) return parseFirestoreDoc({ fields: val.mapValue.fields });
  return val;
}

function parseFirestoreDoc(doc) {
  if (!doc || !doc.name) return null;
  const id = doc.name.split('/').pop();
  const fields = doc.fields || {};
  const data = {};
  for (const [key, val] of Object.entries(fields)) {
    data[key] = parseFirestoreValue(val);
  }
  return { id, ...data };
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) continue;
    if (typeof val === 'string') fields[key] = { stringValue: val };
    else if (typeof val === 'number') fields[key] = Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    else if (typeof val === 'boolean') fields[key] = { booleanValue: val };
    else if (Array.isArray(val)) fields[key] = { arrayValue: { values: val.map(v => ({ stringValue: String(v) })) } };
    else if (typeof val === 'object') fields[key] = { mapValue: { fields: toFirestoreFields(val) } };
  }
  return fields;
}

// Initialize Firebase Admin SDK for storage uploads (bypasses browser CORS)
let adminBucket = null;
try {
  const serviceAccount = (await import('./pehenavas-db-firebase-adminsdk-fbsvc-db464a7991.json', { assert: { type: 'json' } })).default;
  const adminApp = initAdminApp({ credential: cert(serviceAccount), storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET });
  adminBucket = getAdminStorage(adminApp).bucket();
} catch (e) {
  console.warn('Firebase Admin SDK not available — server-side uploads disabled:', e.message);
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    firebase: !!(FIREBASE_PROJECT_ID && FIREBASE_API_KEY),
    razorpay: !!razorpay,
    email: !!transporter,
  });
});

app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    if (!adminBucket) return res.status(503).json({ error: 'Storage not configured on server' });

    const fileName = `products/${Date.now()}_${req.file.originalname}`;
    const file = adminBucket.file(fileName);

    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
      public: true,
    });

    const publicUrl = `https://storage.googleapis.com/${adminBucket.name}/${fileName}`;
    res.json({ url: publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function verifyToken(idToken) {
  const resp = await fetch(`${AUTH_BASE}/accounts:lookup?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const data = await resp.json();
  if (!resp.ok || !data.users?.length) return null;
  const user = data.users[0];
  const admin = user.customAttributes ? JSON.parse(user.customAttributes).admin : false;
  return { uid: user.localId, email: user.email, admin: !!admin };
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  const user = await verifyToken(idToken);
  if (!user || !user.admin) {
    return res.status(403).json({ error: 'Unauthorized — admin access required' });
  }
  req.user = user;
  next();
}

app.post('/api/auth/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const user = await verifyToken(idToken);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Token verification failed', detail: err.message });
  }
});

function requireRazorpay(req, res, next) {
  if (!razorpay) return res.status(503).json({ error: 'Razorpay not configured' });
  next();
}

const PAGE_SIZE = 100;

async function firestoreList(collection) {
  const result = await firestoreFetch(`${collection}?orderBy=createdAt%20desc&pageSize=${PAGE_SIZE}`);
  if (result.documents) {
    return result.documents.map(parseFirestoreDoc).filter(Boolean);
  }
  if (result.error) throw new Error(result.error.message);
  return [];
}

async function firestoreAdd(collection, data) {
  const fields = toFirestoreFields({ ...data, createdAt: new Date().toISOString() });
  const result = await firestoreFetch(collection, {
    method: 'POST',
    body: JSON.stringify({ fields }),
  });
  return parseFirestoreDoc(result) || { id: result.name?.split('/').pop(), ...data };
}

async function firestoreUpdate(collection, docId, data) {
  const fields = toFirestoreFields(data);
  const result = await firestoreFetch(`${collection}/${docId}?updateMask.fieldPaths=${Object.keys(data).join('&updateMask.fieldPaths=')}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  });
  return result;
}

async function firestoreDelete(collection, docId) {
  return firestoreFetch(`${collection}/${docId}`, { method: 'DELETE' });
}

// Products
app.get('/api/products', async (req, res) => {
  try {
    const products = await firestoreList('products');
    res.json(products);
  } catch {
    res.json([]);
  }
});

app.post('/api/products', requireAuth, async (req, res) => {
  try {
    const doc = await firestoreAdd('products', req.body);
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/products/:id', requireAuth, async (req, res) => {
  try {
    await firestoreUpdate('products', req.params.id, req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/products/:id', requireAuth, async (req, res) => {
  try {
    await firestoreDelete('products', req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await firestoreList('orders');
    res.json(orders);
  } catch {
    res.json([]);
  }
});

app.post('/api/orders', requireAuth, async (req, res) => {
  try {
    const doc = await firestoreAdd('orders', req.body);
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/orders/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    await firestoreUpdate('orders', req.params.id, { status });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Razorpay
app.post('/api/payment/create-order', requireRazorpay, async (req, res) => {
  try {
    const { amount } = req.body;
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `phn_${Date.now()}`,
    });
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/payment/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const expected = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
  if (expected === razorpay_signature) {
    res.json({ verified: true });
  } else {
    res.status(400).json({ verified: false, error: 'Invalid signature' });
  }
});

// Email
app.post('/api/email/send-confirmation', async (req, res) => {
  try {
    const { to, orderId, total, items, name } = req.body;
    if (!transporter) return res.status(503).json({ error: 'Email not configured' });

    const itemsList = items.map(i =>
      `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td><td style="padding:8px;border-bottom:1px solid #eee">Qty: ${i.qty}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${(i.price * i.qty).toLocaleString('en-IN')}</td></tr>`
    ).join('');

    await transporter.sendMail({
      from: `"Pehenavas Store" <${FROM_EMAIL}>`,
      to,
      subject: `Order Confirmed — #${orderId}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#1a0a0a;color:#fbbf24;padding:24px;text-align:center;border-radius:12px 12px 0 0">
            <h1 style="margin:0;letter-spacing:4px">PEHENAVAS</h1>
            <p style="margin:4px 0 0;opacity:0.8">The Royal Heritage</p>
          </div>
          <div style="padding:32px;background:#fff;border:1px solid #fce7f3">
            <p style="font-size:18px;color:#1a0a0a">Namaste ${name || 'Valued Customer'},</p>
            <p style="color:#666">Your order has been confirmed!</p>
            <div style="background:#fef2f2;padding:16px;border-radius:8px;margin:16px 0">
              <p style="margin:0;font-weight:bold;color:#1a0a0a">Order #${orderId}</p>
              <p style="margin:4px 0 0;color:#666">Total: <strong>₹${total.toLocaleString('en-IN')}</strong></p>
            </div>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">${itemsList}</table>
            <p style="color:#666;font-size:14px;margin-top:24px">We'll notify you when your order ships.</p>
            <hr style="border:none;border-top:1px solid #fce7f3;margin:24px 0" />
            <p style="color:#999;font-size:12px;text-align:center">Pehenavas — Bringing Royal Heritage to Your Doorstep</p>
          </div>
        </div>
      `,
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, async () => {
  console.log(`Pehenavas server running on http://localhost:${PORT}`);
  if (FIREBASE_PROJECT_ID && FIREBASE_API_KEY) {
    const authed = await getFirebaseToken();
    console.log(`  ✓ Firebase REST API connected (project: ${FIREBASE_PROJECT_ID})${authed ? ' [authenticated]' : ' [unauthenticated — set FIREBASE_ADMIN_EMAIL in .env for write access]'}`);
  } else {
    console.log('  ✗ Firebase not configured — set VITE_FIREBASE_PROJECT_ID in .env');
  }
  if (!razorpay) console.log('  ○ Razorpay not configured — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
  else console.log('  ✓ Razorpay ready');
  if (!transporter) console.log('  ○ Email not configured — set SMTP_* vars in .env');
  else console.log('  ✓ Email ready');
});
