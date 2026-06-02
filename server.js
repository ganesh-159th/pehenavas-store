import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('./pehenavas-db-firebase-adminsdk-fbsvc-db464a7991.json', 'utf-8')
);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

let products = [
  { id: 1, name: 'Royal Silk Sherwani', price: 12499, description: 'Luxurious silk sherwani for weddings.', category: 'Men', image: '', stock: 50, colors: ['Ivory', 'Gold'] },
  { id: 2, name: 'Classic White Kurta', price: 2999, description: 'Comfortable cotton kurta.', category: 'Men', image: '', stock: 100, colors: ['White', 'Beige'] },
  { id: 3, name: 'Velvet Bandhgala', price: 8999, description: 'Elegant velvet bandhgala jacket.', category: 'Men', image: '', stock: 30, colors: ['Black', 'Maroon'] },
  { id: 4, name: 'Embroidered Lehenga', price: 14999, description: 'Beautiful embroidered bridal lehenga.', category: 'Women', image: '', stock: 20, colors: ['Red', 'Pink', 'Gold'] },
];

let nextId = 100;

app.post('/api/orders', async (req, res) => {
  const order = { ...req.body };
  try {
    await db.collection('orders').doc(order.id).set(order);
    console.log(`[ORDER] 🟢 Order ${order.id} saved to Firestore`);
    res.status(201).json(order);
  } catch (err) {
    console.error(`[ORDER] 🔴 Failed to save order ${order.id}:`, err.message);
    res.status(500).json({ error: 'Failed to save order' });
  }
});

app.get('/api/orders', async (_req, res) => {
  try {
    const snapshot = await db.collection('orders').orderBy('date', 'desc').get();
    const orders = snapshot.docs.map(doc => doc.data());
    res.json(orders);
  } catch (err) {
    console.error('[ORDER] 🔴 Failed to fetch orders:', err.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/api/products', (_req, res) => {
  console.log('[ADMIN ACTION] 📋 FETCH: Products list retrieved');
  res.json(products);
});

app.post('/api/products/add', (req, res) => {
  const { name, price, description, category, image, stock, colors } = req.body;

  if (!name || !name.trim()) {
    console.log('[ADMIN ACTION] 🟡 VALIDATION: Product name is required');
    return res.status(400).json({ error: 'Product name is required' });
  }
  if (price == null || Number(price) < 0) {
    console.log('[ADMIN ACTION] 🟡 VALIDATION: Invalid price value');
    return res.status(400).json({ error: 'Price must be a positive number' });
  }

  const product = {
    id: nextId++,
    name: name.trim(),
    price: Number(price),
    description: description || '',
    category: category || 'Uncategorized',
    image: image || '',
    stock: stock != null ? Number(stock) : 0,
    colors: colors || []
  };
  products.push(product);
  console.log(`[ADMIN ACTION] 🟢 SUCCESS: Product "${product.name}" added (₹${product.price})`);
  res.status(201).json(product);
});

app.delete('/api/products/remove/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = products.findIndex((p) => p.id === id);

  if (idx === -1) {
    console.log(`[ADMIN ACTION] 🔴 ALERT: Product #${id} not found`);
    return res.status(404).json({ error: 'Product not found' });
  }

  const [removed] = products.splice(idx, 1);
  console.log(`[ADMIN ACTION] 🔴 ALERT: Product "${removed.name}" removed (ID: ${removed.id})`);
  res.json({ success: true, removed });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║   🏪 PEHENAVAS ADMIN API SERVER        ║`);
  console.log(`║   http://localhost:${PORT}/api/products  ║`);
  console.log(`╚══════════════════════════════════════════╝\n`);
});
