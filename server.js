import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import { passwordReset, emailVerification, welcomeEmail, supportRequest, feedbackReceived } from './server/emailTemplates.js';

const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
if (!b64) {
  console.error('FIREBASE_SERVICE_ACCOUNT_B64 environment variable is required');
  process.exit(1);
}
const serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

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
} else {
  console.log('[EMAIL] ⚠️  Email not configured (set EMAIL_USER and EMAIL_PASS in .env)');
}

function getRecipient(to, type) {
  const overrides = {
    welcome: process.env.EMAIL_OVERRIDE_WELCOME,
    reset: process.env.EMAIL_OVERRIDE_RESET,
    verify: process.env.EMAIL_OVERRIDE_VERIFY,
    support: process.env.EMAIL_OVERRIDE_SUPPORT,
    feedback: process.env.EMAIL_OVERRIDE_FEEDBACK,
  };
  return overrides[type] || process.env.EMAIL_OVERRIDE || to;
}

async function sendEmail(to, template, type = 'general') {
  if (!mailer) {
    console.log('[EMAIL] ⚠️  Skipping email — SMTP not configured');
    return false;
  }
  const recipient = getRecipient(to, type);
  try {
    await mailer.sendMail({
      from: `"Pehenavas" <${EMAIL_FROM}>`,
      to: recipient,
      subject: template.subject,
      html: template.html,
    });
    const target = recipient !== to ? `${to} → ${recipient}` : recipient;
    console.log(`[EMAIL] ✉️  Sent "${template.subject}" to ${target}`);
    return true;
  } catch (err) {
    console.error('[EMAIL] 🔴 Failed to send email:', err.message);
    return false;
  }
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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

app.post('/api/products/add', async (req, res) => {
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
    await db.collection('products').doc(String(id)).set(product);
    console.log(`[ADMIN ACTION] 🟢 SUCCESS: Product "${product.name}" added (₹${product.price})`);
    res.status(201).json(product);
  } catch (err) {
    console.error('[ADMIN ACTION] 🔴 ADD error:', err.message);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

app.get('/api/reviews/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const snapshot = await db.collection('reviews')
      .where('productId', '==', String(productId))
      .orderBy('date', 'desc')
      .get();
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(reviews);
  } catch (err) {
    console.error('[REVIEW] 🔴 Failed to fetch reviews:', err.message);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.post('/api/reviews', async (req, res) => {
  const { productId, userId, userName, rating, comment } = req.body;
  if (!productId || !userId || !rating || !comment?.trim()) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const review = {
      productId: String(productId),
      userId,
      userName: userName || 'Anonymous',
      rating: Number(rating),
      comment: comment.trim(),
      date: new Date().toISOString(),
    };
    const docRef = await db.collection('reviews').add(review);
    console.log(`[REVIEW] ⭐ Review added for product #${productId} (${review.rating}/5)`);
    res.status(201).json({ id: docRef.id, ...review });
  } catch (err) {
    console.error('[REVIEW] 🔴 Failed to save review:', err.message);
    res.status(500).json({ error: 'Failed to save review' });
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

app.put('/api/products/:id', async (req, res) => {
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
    await db.collection('products').doc(String(id)).set(updated);
    console.log(`[ADMIN ACTION] 🟢 UPDATED: Product #${id} "${updated.name}"`);
    res.json(updated);
  } catch (err) {
    console.error('[ADMIN ACTION] 🔴 UPDATE error:', err.message);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/remove/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const doc = await db.collection('products').doc(String(id)).get();
    if (!doc.exists) {
      console.log(`[ADMIN ACTION] 🔴 ALERT: Product #${id} not found`);
      return res.status(404).json({ error: 'Product not found' });
    }

    const removed = doc.data();
    await db.collection('products').doc(String(id)).delete();
    console.log(`[ADMIN ACTION] 🔴 ALERT: Product "${removed.name}" removed (ID: ${removed.id})`);
    res.json({ success: true, removed });
  } catch (err) {
    console.error('[ADMIN ACTION] 🔴 DELETE error:', err.message);
    res.status(500).json({ error: 'Failed to remove product' });
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
    if (err.code === 'auth/user-not-found') {
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

const PORT = 3001;
seedIfEmpty().then(() => {
  app.listen(PORT, () => {
    console.log(`\n╔══════════════════════════════════════════╗`);
    console.log(`║   🏪 PEHENAVAS ADMIN API SERVER        ║`);
    console.log(`║   http://localhost:${PORT}/api/products  ║`);
    console.log(`╚══════════════════════════════════════════╝\n`);
  });
});
