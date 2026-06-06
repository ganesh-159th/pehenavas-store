const API_URL = 'http://localhost:3001/api';

const COLORS = ['Red', 'Blue', 'Gold', 'Ivory', 'Black', 'Maroon', 'Navy', 'Green'];
const CATEGORIES = ['Men', 'Women', 'Accessories'];
const ADJECTIVES = ['Royal', 'Classic', 'Modern', 'Elegant', 'Premium', 'Luxury', 'Traditional', 'Contemporary'];
const TYPES = ['Silk Sherwani', 'Cotton Kurta', 'Lehenga Choli', 'Saree', 'Necklace Set', 'Bracelet', 'Earrings', 'Turban'];

const FAKE_NAMES = [
  'Aarav Sharma', 'Priya Patel', 'Rohan Singh', 'Ananya Gupta', 'Vikram Reddy',
  'Sneha Kapoor', 'Arjun Mehta', 'Divya Joshi', 'Karan Verma', 'Isha Nair',
  'Rahul Desai', 'Neha Agarwal', 'Aditya Kumar', 'Pooja Saxena', 'Manish Yadav',
  'Kriti Bhatia', 'Siddharth Rao', 'Tanvi Malhotra', 'Harsh Tiwari', 'Riya Sen',
];

let productIdCounter = 100;

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function apiCall(label, url, options = {}) {
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), ...options });
    const ms = Date.now() - start;
    const status = res.status;
    let body;
    try { body = await res.json(); } catch { body = null; }
    return { label, status, ms, ok: status < 500, body };
  } catch (err) {
    return { label, status: 'ERR', ms: Date.now() - start, ok: false, error: err.message };
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function simulateUser(userIndex) {
  const name = FAKE_NAMES[userIndex % FAKE_NAMES.length];
  const results = [];

  // 1. List all products
  results.push(await apiCall('GET /products', `${API_URL}/products`));
  await sleep(randomInt(50, 200));

  // 2. View a specific product (IDs 1 or 2 exist)
  const existingId = randomInt(1, 2);
  results.push(await apiCall(`GET /products/${existingId}`, `${API_URL}/products/${existingId}`));
  await sleep(randomInt(50, 200));

  // 3. Create a new product (admin action)
  const newProduct = {
    id: ++productIdCounter,
    name: `${randomPick(ADJECTIVES)} ${randomPick(TYPES)}`,
    price: randomInt(500, 50000),
    description: 'Added during load test',
    category: randomPick(CATEGORIES),
    image: '',
    stock: randomInt(5, 100),
    colors: [randomPick(COLORS), randomPick(COLORS)].filter((v, i, a) => a.indexOf(v) === i),
  };
  results.push(await apiCall('POST /products/add', `${API_URL}/products/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newProduct),
  }));
  await sleep(randomInt(50, 200));

  // 4. View the newly created product
  results.push(await apiCall(`GET /products/${newProduct.id}`, `${API_URL}/products/${newProduct.id}`));
  await sleep(randomInt(50, 200));

  // 5. Delete the newly created product
  results.push(await apiCall(`DELETE /products/remove/${newProduct.id}`, `${API_URL}/products/remove/${newProduct.id}`, {
    method: 'DELETE',
  }));

  return results;
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  🏪 PEHENAVAS — Load Test (100 users)');
  console.log('═══════════════════════════════════════════════');
  console.log(`  API: ${API_URL}`);
  console.log('═══════════════════════════════════════════════\n');

  try {
    await fetch(`${API_URL}/products`, { signal: AbortSignal.timeout(2000) });
    console.log('✅ API is reachable\n');
  } catch {
    console.log('❌ API not reachable — exiting\n');
    process.exit(1);
  }

  const allResults = [];
  const startTime = Date.now();

  const BATCH_SIZE = 10;
  for (let batch = 0; batch < 10; batch++) {
    const start = batch * BATCH_SIZE;
    const promises = [];
    for (let i = start; i < start + BATCH_SIZE && i < 100; i++) {
      promises.push(simulateUser(i));
    }
    const batchResults = await Promise.all(promises);
    allResults.push(...batchResults);

    const flat = batchResults.flat();
    const ok = flat.filter(r => r.ok).length;
    const err = flat.filter(r => !r.ok).length;
    console.log(`  Batch ${batch + 1}/10: ${flat.length} reqs, ${ok} ok, ${err} err`);
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  const flat = allResults.flat();
  const total = flat.length;
  const succeeded = flat.filter(r => r.ok).length;
  const failed = flat.filter(r => !r.ok).length;
  const avgMs = flat.filter(r => r.ok).reduce((s, r) => s + r.ms, 0) / Math.max(succeeded, 1);

  const byEndpoint = {};
  for (const r of flat) {
    if (!byEndpoint[r.label]) byEndpoint[r.label] = { total: 0, ok: 0, err: 0, ms: [] };
    byEndpoint[r.label].total++;
    if (r.ok) { byEndpoint[r.label].ok++; byEndpoint[r.label].ms.push(r.ms); }
    else byEndpoint[r.label].err++;
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('  📊 RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Total requests:    ${total}`);
  console.log(`  Successful:        ${succeeded}`);
  console.log(`  Failed:            ${failed}`);
  console.log(`  Avg response time: ${avgMs.toFixed(0)}ms`);
  console.log(`  Total duration:    ${totalTime}s`);
  console.log(`  Users simulated:   100`);
  console.log('\n  Per-endpoint breakdown:');
  for (const [label, stats] of Object.entries(byEndpoint)) {
    const avg = stats.ms.length ? (stats.ms.reduce((s, v) => s + v, 0) / stats.ms.length).toFixed(0) : '-';
    console.log(`    ${label.padEnd(30)} ${stats.total} calls  ${stats.ok} ok  ${stats.err} err  avg ${avg}ms`);
  }
  console.log('═══════════════════════════════════════════════\n');
}

main().catch(console.error);
