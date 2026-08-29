import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import Razorpay from 'razorpay';
import { passwordReset, emailVerification, welcomeEmail, supportRequest, feedbackReceived, orderConfirmation } from './server/emailTemplates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const hasStaticBuild = fs.existsSync(path.join(DIST_DIR, 'index.html'));

const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
if (!b64) {
  console.error('FIREBASE_SERVICE_ACCOUNT_B64 environment variable is required');
  process.exit(1);
}
const serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
let razorpay = null;
if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
  console.log('[PAYMENTS] 💳 Razorpay configured');
} else {
  const missing = [
    !RAZORPAY_KEY_ID && 'RAZORPAY_KEY_ID',
    !RAZORPAY_KEY_SECRET && 'RAZORPAY_KEY_SECRET',
  ].filter(Boolean).join(', ');
  console.log(`[PAYMENTS] ⚠️  Razorpay NOT configured — missing ${missing} in .env`);
  console.log('[PAYMENTS]    Card/UPI online payments will be disabled. Add your Razorpay test keys from https://dashboard.razorpay.com to enable them.');
}

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

let mailer = null;
if (EMAIL_USER && EMAIL_PASS) {
  mailer = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
  console.log('[EMAIL] ✉️  Gmail SMTP configured');
  mailer.verify()
    .then(() => console.log('[EMAIL] ✅ SMTP connection verified — emails will be sent to individual users'))
    .catch(err => {
      console.error('[EMAIL] ❌ SMTP verification failed:', err.message);
      console.error('[EMAIL]    Emails will NOT be sent. Check EMAIL_USER and EMAIL_PASS in .env');
      mailer = null;
    });
} else {
  const missing = [
    !EMAIL_USER && 'EMAIL_USER',
    !EMAIL_PASS && 'EMAIL_PASS',
  ].filter(Boolean).join(', ');
  console.log(`[EMAIL] ⚠️  Email not configured — missing ${missing} in .env`);
  console.log('[EMAIL]    Welcome/order/reset emails will be skipped. EMAIL_PASS must be a Gmail App Password (https://myaccount.google.com/apppasswords), not your normal password.');
}

function getRecipient(to, type) {
  const overrides = {
    welcome: process.env.EMAIL_OVERRIDE_WELCOME,
    reset: process.env.EMAIL_OVERRIDE_RESET,
    verify: process.env.EMAIL_OVERRIDE_VERIFY,
    support: process.env.EMAIL_OVERRIDE_SUPPORT,
    feedback: process.env.EMAIL_OVERRIDE_FEEDBACK,
    order: process.env.EMAIL_OVERRIDE_ORDER,
  };
  return overrides[type] || process.env.EMAIL_OVERRIDE || to;
}

async function sendEmail(to, template, type = 'general') {
  if (!mailer) {
    console.log(`[EMAIL] ⚠️  Skipping "${template.subject}" to ${to} — SMTP not configured`);
    return false;
  }
  const recipient = getRecipient(to, type);
  const redirected = recipient !== to;
  if (redirected) {
    console.log(`[EMAIL] 🔄 Redirecting ${type} email: ${to} → ${recipient}`);
  }
  try {
    await mailer.sendMail({
      from: `"Pehenavas" <${EMAIL_FROM}>`,
      to: recipient,
      subject: template.subject,
      html: template.html,
    });
    console.log(`[EMAIL] ✉️  Sent "${template.subject}" to ${recipient}`);
    return true;
  } catch (err) {
    console.error('[EMAIL] 🔴 Failed to send email:', err.message);
    return false;
  }
}

const RETRYABLE_FIRESTORE_CODES = new Set([4, 8, 10, 13, 14, 'deadline-exceeded', 'resource-exhausted', 'aborted', 'internal', 'unavailable']);

function isRetryableWriteError(err) {
  if (RETRYABLE_FIRESTORE_CODES.has(err?.code)) return true;
  if (typeof err?.code === 'string' && RETRYABLE_FIRESTORE_CODES.has(err.code.toLowerCase())) return true;
  return /DEADLINE_EXCEEDED|RESOURCE_EXHAUSTED|UNAVAILABLE|ABORTED|INTERNAL/i.test(String(err?.message || ''));
}

async function withRetry(fn, { retries = 3, baseDelay = 120, maxDelay = 1500 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryableWriteError(err) || attempt === retries) throw err;
      const delay = Math.min(maxDelay, baseDelay * 2 ** attempt + Math.random() * baseDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastErr;
}

function reviewDocId(productId, userId, comment) {
  return crypto
    .createHash('sha256')
    .update(`${String(productId)}|${String(userId)}|${String(comment)}`)
    .digest('hex')
    .slice(0, 32);
}

const reviewRate = new Map();

function checkReviewRate(userId, productId, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const key = `${userId}:${productId}`;
  const entry = reviewRate.get(key);
  if (!entry || entry.resetAt <= now) {
    reviewRate.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

const app = express();
app.use(express.json({ limit: '10mb' }));

// CORS — restrict to configured origins for security. In production the
// frontend is served by this same server (same origin), so no CORS is needed.
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
if (allowedOrigins.length > 0) {
  app.use(cors({
    origin: allowedOrigins.includes('*') ? true : allowedOrigins,
  }));
} else {
  // Development default: only local frontend origins.
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5174', 'http://127.0.0.1:3000', 'http://127.0.0.1:5174'],
  }));
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

const SEED_PRODUCTS = [
  { id: 1, name: 'Royal Silk Sherwani', price: 12499, description: 'Luxurious silk sherwani for weddings.', category: 'Men', image: '', stock: 50, colors: ['Ivory', 'Gold'] },
];

async function seedIfEmpty() {
  const snapshot = await db.collection('products').get();
  if (!snapshot.empty) return;
  const batch = db.batch();
  for (const p of SEED_PRODUCTS) {
    const ref = db.collection('products').doc(String(p.id));
    batch.set(ref, p);
  }
  await batch.commit();
  console.log(`[DB] 🌱 Seeded ${SEED_PRODUCTS.length} initial products`);
}

async function getNextId() {
  const counterRef = db.collection('meta').doc('counters');
  const doc = await counterRef.get();
  let next;
  if (!doc.exists) {
    const snapshot = await db.collection('products').get();
    const maxId = snapshot.docs.reduce((max, d) => Math.max(max, d.data().id || 0), 0);
    next = Math.max(maxId + 1, 100);
  } else {
    next = (doc.data().nextId || 100);
  }
  await counterRef.set({ nextId: next + 1 }, { merge: true });
  return next;
}

app.get('/api/products', async (_req, res) => {
  try {
    const snapshot = await db.collection('products').orderBy('id', 'asc').get();
    const products = snapshot.docs.map(d => d.data());
    console.log('[ADMIN ACTION] 📋 FETCH: Products list retrieved');
    res.json(products);
  } catch (err) {
    console.error('[ADMIN ACTION] 🔴 FETCH error:', err.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products/add', adminAuth, async (req, res) => {
  const { name, price, description, category, image, stock, colors } = req.body;

  if (!name || !name.trim()) {
    console.log('[ADMIN ACTION] 🟡 VALIDATION: Product name is required');
    return res.status(400).json({ error: 'Product name is required' });
  }
  if (price == null || Number(price) < 0) {
    console.log('[ADMIN ACTION] 🟡 VALIDATION: Invalid price value');
    return res.status(400).json({ error: 'Price must be a positive number' });
  }

  const id = await getNextId();
  const product = {
    id,
    name: name.trim(),
    price: Number(price),
    description: description || '',
    category: category || 'Uncategorized',
    image: image || '',
    stock: stock != null ? Number(stock) : 0,
    colors: colors || [],
  };

  try {
    await withRetry(() => db.collection('products').doc(String(id)).set(product));
    console.log(`[ADMIN ACTION] 🟢 SUCCESS: Product "${product.name}" added (₹${product.price})`);
    res.status(201).json(product);
  } catch (err) {
    console.error('[ADMIN ACTION] 🔴 ADD error:', err.message);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// ── Auth middleware ──────────────────────────────────────────────────────────
async function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(header.slice(7));
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Shared-secret admin auth for admin write routes (products add/update/delete).
// The key must be set via ADMIN_API_KEY on the server. The frontend sends it in
// the x-admin-key header (configured with VITE_ADMIN_API_KEY). This is a
// lightweight guard; for stricter control use server-side role checks instead.
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
function adminAuth(req, res, next) {
  if (!ADMIN_API_KEY) {
    // Not configured — allow in dev, fail closed is only enforceable once set.
    console.warn('[ADMIN] ⚠️  ADMIN_API_KEY not set — admin routes are NOT protected. Set it before deploying.');
    return next();
  }
  const provided = req.headers['x-admin-key'];
  const a = Buffer.from(String(provided || ''));
  const b = Buffer.from(ADMIN_API_KEY);
  if (provided && a.length === b.length && crypto.timingSafeEqual(a, b)) {
    return next();
  }
  return res.status(401).json({ error: 'Admin authentication required' });
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function updateProductRating(productId, oldRating, newRating) {
  const ref = db.collection('products').doc(String(productId));
  const snap = await ref.get();
  if (!snap.exists) return;

  const data = snap.data();
  const prevSum = data.ratingSum || 0;
  const count = data.reviews || 0;

  let sum = prevSum;
  let total = count;
  const dist = { ...(data.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }) };

  if (oldRating != null) {
    sum = sum - oldRating + (newRating || 0);
    dist[oldRating] = Math.max(0, (dist[oldRating] || 0) - 1);
    if (newRating) dist[newRating] = (dist[newRating] || 0) + 1;
  } else if (newRating != null) {
    sum += newRating;
    total += 1;
    dist[newRating] = (dist[newRating] || 0) + 1;
  } else {
    return;
  }

  const avg = total ? Math.round((sum / total) * 10) / 10 : 0;
  await ref.set({
    rating: avg,
    reviews: total,
    ratingSum: sum,
    ratingDistribution: dist,
  }, { merge: true });
}

async function removeProductRating(productId, oldRating) {
  const ref = db.collection('products').doc(String(productId));
  const snap = await ref.get();
  if (!snap.exists) return;

  const data = snap.data();
  const prevSum = data.ratingSum || 0;
  const count = data.reviews || 0;

  const sum = prevSum - oldRating;
  const total = Math.max(0, count - 1);
  const dist = { ...(data.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }) };
  dist[oldRating] = Math.max(0, (dist[oldRating] || 0) - 1);

  const avg = total ? Math.round((sum / total) * 10) / 10 : 0;
  await ref.set({
    rating: avg,
    reviews: total,
    ratingSum: sum,
    ratingDistribution: dist,
  }, { merge: true });
}

async function recalcProductRating(productId) {
  const ref = db.collection('products').doc(String(productId));
  const snap = await ref.get();
  if (snap.exists) {
    const d = snap.data();
    return {
      averageRating: d.rating || 0,
      totalReviews: d.reviews || 0,
      distribution: d.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }
  const reviewsSnap = await db.collection('reviews').where('productId', '==', String(productId)).get();
  const reviews = reviewsSnap.docs.map(d => d.data());
  const total = reviews.length;
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  const avg = total ? Math.round((sum / total) * 10) / 10 : 0;
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(r => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });
  await ref.set({ rating: avg, reviews: total, ratingSum: sum, ratingDistribution: distribution }, { merge: true });
  return { averageRating: avg, totalReviews: total, distribution };
}

// ── Reviews API ─────────────────────────────────────────────────────────────

app.get('/api/reviews/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { sort = 'recent' } = req.query;
    let snapshot = await db.collection('reviews')
      .where('productId', '==', String(productId))
      .get();
    let reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    switch (sort) {
      case 'highest':  reviews.sort((a, b) => b.rating - a.rating); break;
      case 'lowest':   reviews.sort((a, b) => a.rating - b.rating); break;
      case 'helpful':  reviews.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0)); break;
      default:         reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    res.json(reviews);
  } catch (err) {
    console.error('[REVIEW] 🔴 Failed to fetch reviews:', err.message);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.get('/api/reviews/product/:productId/stats', async (req, res) => {
  try {
    const stats = await recalcProductRating(req.params.productId);
    res.json(stats);
  } catch (err) {
    console.error('[REVIEW] 🔴 Failed to fetch stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch review stats' });
  }
});

app.get('/api/reviews/batch-helpful', verifyToken, async (req, res) => {
  const { ids } = req.query;
  const { uid } = req.user;
  if (!ids) return res.json({});
  try {
    const reviewIds = ids.split(',');
    const helpfulRefs = reviewIds.map(id =>
      db.collection('review_helpful').doc(`${id}_${uid}`).get()
    );
    const helpfulSnaps = await Promise.all(helpfulRefs);
    const result = {};
    helpfulSnaps.forEach((snap, i) => {
      result[reviewIds[i]] = snap.exists;
    });
    res.json(result);
  } catch {
    res.json({});
  }
});

app.post('/api/reviews', verifyToken, async (req, res) => {
  const { productId, rating, comment } = req.body;
  const { uid } = req.user;

  if (!productId || !rating || !comment?.trim()) {
    return res.status(400).json({ error: 'productId, rating, and comment are required' });
  }
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
  }
  const trimmed = comment.trim();
  if (!checkReviewRate(uid, String(productId))) {
    return res.status(429).json({ error: 'Too many reviews submitted. Please try again later.' });
  }

  const reviewId = reviewDocId(String(productId), uid, trimmed);

  try {
    const existing = await db.collection('reviews').doc(reviewId).get();
    if (existing.exists) {
      return res.status(409).json({ error: 'You have already submitted this exact review.' });
    }

    const userName = req.user.name || req.user.email?.split('@')[0] || 'Anonymous';
    const review = {
      productId: String(productId),
      userId: uid,
      userName,
      rating: ratingNum,
      comment: trimmed,
      date: new Date().toISOString(),
      helpfulCount: 0,
    };
    await withRetry(async () => {
      await Promise.all([
        db.collection('reviews').doc(reviewId).set(review),
        updateProductRating(productId, null, ratingNum),
      ]);
    });

    console.log(`[REVIEW] ⭐ Review added for product #${productId} (${ratingNum}/5) by ${userName}`);
    res.status(201).json({ id: reviewId, ...review });
  } catch (err) {
    console.error('[REVIEW] 🔴 Failed to save review:', err.message);
    const status = isRetryableWriteError(err) ? 503 : 500;
    res.status(status).json({ error: 'Failed to save review. Please try again.' });
  }
});

app.put('/api/reviews/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const { uid } = req.user;

  try {
    const doc = await db.collection('reviews').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Review not found' });
    if (doc.data().userId !== uid) return res.status(403).json({ error: 'Not your review' });

    const updates = {};
    let newRating = null;
    if (rating != null) {
      const r = Number(rating);
      if (!Number.isInteger(r) || r < 1 || r > 5) return res.status(400).json({ error: 'Rating must be 1-5' });
      updates.rating = r;
      newRating = r;
    }
    if (comment != null) {
      const c = comment.trim();
      if (c.length < 10 || c.length > 1000) return res.status(400).json({ error: 'Comment must be 10-1000 characters' });
      updates.comment = c;
    }
    updates.edited = true;
    updates.editedAt = new Date().toISOString();

    const oldRating = doc.data().rating;
    await Promise.all([
      db.collection('reviews').doc(id).set(updates, { merge: true }),
      newRating != null ? updateProductRating(doc.data().productId, oldRating, newRating) : Promise.resolve(),
    ]);

    console.log(`[REVIEW] ✏️  Review ${id} updated by ${uid}`);
    res.json({ id, ...doc.data(), ...updates });
  } catch (err) {
    console.error('[REVIEW] 🔴 Failed to update review:', err.message);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

app.delete('/api/reviews/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { uid } = req.user;

  try {
    const doc = await db.collection('reviews').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Review not found' });

    const isAdmin = req.user.admin === true || req.user.email === process.env.FIREBASE_ADMIN_EMAIL;
    if (doc.data().userId !== uid && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    const productId = doc.data().productId;
    await Promise.all([
      db.collection('reviews').doc(id).delete(),
      removeProductRating(productId, doc.data().rating),
    ]);

    console.log(`[REVIEW] 🗑️  Review ${id} deleted by ${uid}`);
    res.json({ success: true });
  } catch (err) {
    console.error('[REVIEW] 🔴 Failed to delete review:', err.message);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

app.post('/api/reviews/:id/helpful', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { uid } = req.user;

  try {
    const helpfulRef = db.collection('review_helpful').doc(`${id}_${uid}`);
    const [reviewDoc, helpfulDoc] = await Promise.all([
      db.collection('reviews').doc(id).get(),
      helpfulRef.get(),
    ]);
    if (!reviewDoc.exists) return res.status(404).json({ error: 'Review not found' });

    if (helpfulDoc.exists) {
      const newCount = Math.max(0, (reviewDoc.data().helpfulCount || 0) - 1);
      await Promise.all([
        helpfulRef.delete(),
        db.collection('reviews').doc(id).set({ helpfulCount: newCount }, { merge: true }),
      ]);
      return res.json({ helpful: false, helpfulCount: newCount });
    }

    const newCount = (reviewDoc.data().helpfulCount || 0) + 1;
    await Promise.all([
      helpfulRef.set({ reviewId: id, userId: uid, date: new Date().toISOString() }),
      db.collection('reviews').doc(id).set({ helpfulCount: newCount }, { merge: true }),
    ]);
    res.json({ helpful: true, helpfulCount: newCount });
  } catch (err) {
    console.error('[REVIEW] 🔴 Failed to toggle helpful:', err.message);
    res.status(500).json({ error: 'Failed to update helpful status' });
  }
});

app.get('/api/reviews/:id/helpful/status', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { uid } = req.user;
  try {
    const [helpfulDoc, reviewDoc] = await Promise.all([
      db.collection('review_helpful').doc(`${id}_${uid}`).get(),
      db.collection('reviews').doc(id).get(),
    ]);
    res.json({
      helpful: helpfulDoc.exists,
      helpfulCount: reviewDoc.exists ? (reviewDoc.data().helpfulCount || 0) : 0,
    });
  } catch {
    res.json({ helpful: false, helpfulCount: 0 });
  }
});

app.post('/api/reviews/:id/report', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const { uid } = req.user;

  if (!reason?.trim()) return res.status(400).json({ error: 'Reason is required' });

  try {
    const doc = await db.collection('reviews').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Review not found' });

    const existing = await db.collection('review_reports')
      .where('reviewId', '==', id)
      .where('reporterId', '==', uid)
      .limit(1)
      .get();
    if (!existing.empty) {
      return res.status(409).json({ error: 'You have already reported this review' });
    }

    await db.collection('review_reports').add({
      reviewId: id,
      reporterId: uid,
      reason: reason.trim(),
      date: new Date().toISOString(),
    });
    console.log(`[REVIEW] 🚩 Review ${id} reported by ${uid}`);
    res.json({ success: true });
  } catch (err) {
    console.error('[REVIEW] 🔴 Failed to report review:', err.message);
    res.status(500).json({ error: 'Failed to report review' });
  }
});

// ── Orders & Payments API (Razorpay) ────────────────────────────────────────

function buildOrderEmailData(doc) {
  const today = new Date();
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + Math.floor(Math.random() * 3) + 3);
  return {
    id: doc.orderId,
    date: today.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
    delivery: deliveryDate.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' }),
    items: doc.items || [],
    total: doc.amount || 0,
    address: doc.address || {},
    paymentMethod: doc.paymentMethod || 'cod',
    status: doc.status,
  };
}

app.get('/api/payments/razorpay-key', (_req, res) => {
  res.json({ keyId: RAZORPAY_KEY_ID || '' });
});

function buildOrderDoc({ uid, email, orderId, amount, items, address, method }) {
  return {
    orderId,
    userId: uid,
    userEmail: email,
    amount: Number(amount),
    amountPaise: Math.round(Number(amount) * 100),
    currency: 'INR',
    items: Array.isArray(items) ? items : [],
    address: address || {},
    paymentMethod: method,
    createdAt: new Date().toISOString(),
  };
}

app.post('/api/orders', verifyToken, async (req, res) => {
  const { orderId, amount, items, address, method } = req.body;
  if (!orderId || amount == null || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'orderId, amount, and items are required' });
  }
  const doc = {
    ...buildOrderDoc({
      uid: req.user.uid,
      email: req.user.email,
      orderId,
      amount,
      items,
      address,
      method: method || 'cod',
    }),
    status: 'confirmed',
    confirmedAt: new Date().toISOString(),
  };
  try {
    await withRetry(() => db.collection('orders').add(doc));
    console.log(`[ORDER] 🟢 ORDER PLACED (${doc.paymentMethod}): ${orderId} — ₹${doc.amount}`);
    sendEmail(req.user.email, orderConfirmation(req.user.email, buildOrderEmailData(doc)), 'order');
    res.status(201).json({ success: true, order: doc });
  } catch (err) {
    console.error('[ORDER] 🔴 Failed to save order:', err.message);
    res.status(503).json({ error: 'Failed to save order. Please try again.' });
  }
});

app.post('/api/payments/create-order', verifyToken, async (req, res) => {
  const { amount, items, address, method } = req.body;
  if (amount == null || amount <= 0 || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'amount and items are required' });
  }
  if (!razorpay) {
    return res.status(503).json({ error: 'Payment gateway is not configured. Set Razorpay keys in .env on the server.' });
  }
  const orderId = `PHN-${Math.floor(100000 + Math.random() * 900000)}`;
  const amountPaise = Math.round(Number(amount) * 100);
  try {
    const rzpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: orderId,
      notes: { userId: req.user.uid },
    });
    const doc = buildOrderDoc({
      uid: req.user.uid,
      email: req.user.email,
      orderId,
      amount,
      items,
      address,
      method: method || 'upi',
    });
    await withRetry(() => db.collection('orders').add({ ...doc, razorpayOrderId: rzpOrder.id }));
    console.log(`[PAYMENTS] 🧾 Razorpay order created: ${rzpOrder.id} (receipt ${orderId}) — ₹${amount}`);
    res.status(201).json({ id: orderId, razorpayOrderId: rzpOrder.id, amount: amountPaise, currency: 'INR' });
  } catch (err) {
    console.error('[PAYMENTS] 🔴 Failed to create Razorpay order:', err.message);
    res.status(502).json({ error: 'Could not initiate payment. Please try again.' });
  }
});

app.post('/api/payments/verify', verifyToken, async (req, res) => {
  const { orderId, razorpayOrderId, paymentId, signature } = req.body;
  if (!orderId || !razorpayOrderId || !paymentId || !signature) {
    return res.status(400).json({ error: 'Missing payment verification data' });
  }
  if (!RAZORPAY_KEY_SECRET) {
    return res.status(503).json({ error: 'Payment gateway is not configured.' });
  }
  const expected = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${paymentId}`)
    .digest('hex');
  const received = Buffer.from(String(signature));
  const ok = received.length === Buffer.from(expected).length
    && crypto.timingSafeEqual(received, Buffer.from(expected));
  if (!ok) {
    return res.status(400).json({ error: 'Payment signature verification failed.' });
  }
  try {
    const snapshot = await db.collection('orders')
      .where('orderId', '==', orderId)
      .where('userId', '==', req.user.uid)
      .limit(1)
      .get();
    if (snapshot.empty) return res.status(404).json({ error: 'Order not found' });
    const ref = snapshot.docs[0].ref;
    await ref.set({
      status: 'paid',
      paymentId,
      razorpayOrderId,
      paymentStatus: 'captured',
      paidAt: new Date().toISOString(),
    }, { merge: true });
    const order = (await ref.get()).data();
    console.log(`[PAYMENTS] ✅ Payment verified for order ${orderId} (${paymentId})`);
    sendEmail(req.user.email, orderConfirmation(req.user.email, buildOrderEmailData(order)), 'order');
    res.json({ success: true, order });
  } catch (err) {
    console.error('[PAYMENTS] 🔴 Payment verification error:', err.message);
    res.status(500).json({ error: 'Failed to verify payment.' });
  }
});

app.get('/api/orders', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection('orders')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    res.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  } catch (err) {
    console.error('[ORDER] 🔴 Failed to fetch orders:', err.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const doc = await db.collection('products').doc(String(id)).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(doc.data());
  } catch (err) {
    console.error('[ADMIN ACTION] 🔴 FETCH error:', err.message);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.put('/api/products/:id', adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const doc = await db.collection('products').doc(String(id)).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const { name, price, description, category, image, stock, colors } = req.body;
    const updated = {
      id,
      name: name?.trim() || doc.data().name,
      price: price != null ? Number(price) : doc.data().price,
      description: description ?? doc.data().description,
      category: category || doc.data().category,
      image: image ?? doc.data().image,
      stock: stock != null ? Number(stock) : doc.data().stock,
      colors: colors || doc.data().colors,
    };
    await withRetry(() => db.collection('products').doc(String(id)).set(updated));
    console.log(`[ADMIN ACTION] 🟢 UPDATED: Product #${id} "${updated.name}"`);
    res.json(updated);
  } catch (err) {
    console.error('[ADMIN ACTION] 🔴 UPDATE error:', err.message);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/remove/:id', adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const doc = await db.collection('products').doc(String(id)).get();
    if (!doc.exists) {
      console.log(`[ADMIN ACTION] 🔴 ALERT: Product #${id} not found`);
      return res.status(404).json({ error: 'Product not found' });
    }

    const removed = doc.data();
    await withRetry(() => db.collection('products').doc(String(id)).delete());
    console.log(`[ADMIN ACTION] 🔴 ALERT: Product "${removed.name}" removed (ID: ${removed.id})`);
    res.json({ success: true, removed });
  } catch (err) {
    console.error('[ADMIN ACTION] 🔴 DELETE error:', err.message);
    res.status(500).json({ error: 'Failed to remove product' });
  }
});

app.post('/api/auth/sync-user', async (req, res) => {
  const { uid, name, email } = req.body;
  if (!uid || !email) {
    return res.status(400).json({ error: 'uid and email are required' });
  }
  try {
    const ref = db.collection('users').doc(uid);
    const existing = await ref.get();
    if (!existing.exists) {
      await ref.set({ uid, name: name || email.split('@')[0], email, role: 'customer', createdAt: new Date().toISOString() });
      console.log(`[AUTH] 👤 New user saved: ${email}`);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[AUTH] 🔴 sync-user error:', err.message);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

app.post('/api/auth/send-reset-email', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const link = await admin.auth().generatePasswordResetLink(email, {
      url: `${APP_URL}/reset-password`,
      handleCodeInApp: true,
    });
    const sent = await sendEmail(email, passwordReset(email, link), 'reset');
    res.json({ success: true, emailSent: sent });
  } catch (err) {
    if (err.code === 'auth/user-not-found' || String(err.message).startsWith('INTERNAL ASSERT')) {
      return res.status(404).json({ error: 'No account found with this email' });
    }
    console.error('[AUTH] 🔴 Reset email error:', err.message);
    res.status(500).json({ error: 'Failed to send reset email' });
  }
});

app.post('/api/auth/send-verification-email', async (req, res) => {
  const { email, name } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const link = await admin.auth().generateEmailVerificationLink(email, {
      url: `${APP_URL}/signin`,
      handleCodeInApp: true,
    });
    const sent = await sendEmail(email, emailVerification(name || email.split('@')[0], link), 'verify');
    res.json({ success: true, emailSent: sent });
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'No account found with this email' });
    }
    console.error('[AUTH] 🔴 Verification email error:', err.message);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

app.post('/api/auth/send-welcome-email', async (req, res) => {
  const { email, name } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const sent = await sendEmail(email, welcomeEmail(name || email.split('@')[0]), 'welcome');
  res.json({ success: true, emailSent: sent });
});

app.post('/api/auth/send-support-email', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Name, email, subject, and message are required' });
  }

  const sent = await sendEmail(email, supportRequest(name, email, subject, message), 'support');
  console.log(`[SUPPORT] 📩 Support request from ${name} (${email}): ${subject}`);
  res.json({ success: true, emailSent: sent });
});

app.post('/api/auth/send-feedback-email', async (req, res) => {
  const { name, email, rating, category, message } = req.body;
  if (!name || !email || !rating || !category || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sent = await sendEmail(email, feedbackReceived(name, Number(rating), category, message), 'feedback');
  console.log(`[FEEDBACK] ⭐ Feedback from ${name} (${email}): ${rating}/5 — ${category}`);
  res.json({ success: true, emailSent: sent });
});

// ── Static frontend (production) ────────────────────────────────────────────
// When a production build exists (dist/), serve it and fall back to index.html
// for client-side (React Router) routes. All /api routes take precedence.
if (hasStaticBuild) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
  console.log(`[STATIC] 📦 Serving built frontend from ${DIST_DIR}`);
} else {
  app.get('/', (_req, res) => {
    res.send('Pehenavas API is running. Run `npm run build` and restart to serve the web app. API docs: /api/health');
  });
  console.log('[STATIC] ⚠️  No dist/ build found — API only. Run `npm run build` to serve the frontend.');
}

const PORT = process.env.PORT || 3001;
seedIfEmpty().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n╔══════════════════════════════════════════╗`);
    console.log(`║   🏪 PEHENAVAS STORE SERVER             ║`);
    console.log(`║   ${hasStaticBuild ? '🌐 Web + API' : '🔌 API only'}  →  http://localhost:${PORT}${hasStaticBuild ? '' : '/api/products'}  ║`);
    console.log(`╚══════════════════════════════════════════╝\n`);
  });
});
