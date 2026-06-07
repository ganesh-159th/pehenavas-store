import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import net from 'net';

vi.mock('firebase-admin', () => ({
  default: {
    initializeApp: vi.fn(),
    credential: { cert: vi.fn(() => ({})) },
    firestore: vi.fn(),
  },
}));

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    readFileSync: vi.fn(() => JSON.stringify({ type: 'service_account', project_id: 'test' })),
  };
});

function getPort() {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const port = s.address().port;
      s.close(() => resolve(port));
    });
  });
}

function createMockDoc(data) {
  return { exists: true, data: () => data, id: data.id };
}

function createMockSnapshot(docs) {
  return {
    empty: docs.length === 0,
    docs: docs.map(d => createMockDoc(d)),
  };
}

describe('Server API', () => {
  let app;
  let setDb;
  let started = false;

  async function ensureApp() {
    if (!started) {
      vi.stubGlobal('console', { ...console, log: vi.fn(), error: vi.fn() });
      const mod = await import('../server.js');
      app = mod.app;
      setDb = mod.setDb;
      started = true;
    }
  }

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  describe('Input Validation', () => {
    let server;

    beforeAll(async () => {
      await ensureApp();
    });

    beforeEach(async () => {
      const port = await getPort();
      await new Promise((resolve) => {
        server = app.listen(port, '127.0.0.1', resolve);
      });
    });

    afterEach(() => {
      server?.close();
    });

    it('POST /api/products/add returns 400 if name is missing', async () => {
      const addr = server.address();
      const res = await fetch(`http://127.0.0.1:${addr.port}/api/products/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: 999 }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Product name is required');
    });

    it('POST /api/products/add returns 400 if price is negative', async () => {
      const addr = server.address();
      const res = await fetch(`http://127.0.0.1:${addr.port}/api/products/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', price: -1 }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Price must be a positive number');
    });

    it('POST /api/reviews returns 400 if required fields are missing', async () => {
      const addr = server.address();
      const res = await fetch(`http://127.0.0.1:${addr.port}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: '1' }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe('Firestore Integration', () => {
    beforeAll(async () => {
      await ensureApp();
    });

    async function withFreshServer(mockDb, testFn) {
      setDb(mockDb);
      const port = await getPort();
      const server = await new Promise((resolve) => {
        const s = app.listen(port, '127.0.0.1', () => resolve(s));
      });
      try {
        await testFn(port);
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    }

    it('GET /api/products returns empty array when no products exist', async () => {
      await withFreshServer(
        { collection: vi.fn().mockReturnValue({ orderBy: () => ({ get: () => Promise.resolve(createMockSnapshot([])) }) }) },
        async (port) => {
          const res = await fetch(`http://127.0.0.1:${port}/api/products`);
          expect(res.status).toBe(200);
          const data = await res.json();
          expect(data).toEqual([]);
        }
      );
    });

    it('GET /api/products returns products when they exist', async () => {
      const mockProducts = [
        { id: 1, name: 'Royal Silk Sherwani', price: 12499, category: 'Men', stock: 50 },
        { id: 2, name: 'Embroidered Lehenga', price: 14999, category: 'Women', stock: 30 },
      ];
      await withFreshServer(
        { collection: vi.fn().mockReturnValue({ orderBy: () => ({ get: () => Promise.resolve(createMockSnapshot(mockProducts)) }) }) },
        async (port) => {
          const res = await fetch(`http://127.0.0.1:${port}/api/products`);
          expect(res.status).toBe(200);
          const data = await res.json();
          expect(data).toHaveLength(2);
          expect(data[0].name).toBe('Royal Silk Sherwani');
        }
      );
    });

    it('GET /api/products returns 500 on firestore error', async () => {
      await withFreshServer(
        { collection: vi.fn().mockReturnValue({ orderBy: () => ({ get: () => Promise.reject(new Error('Firestore error')) }) }) },
        async (port) => {
          const res = await fetch(`http://127.0.0.1:${port}/api/products`);
          expect(res.status).toBe(500);
          const data = await res.json();
          expect(data.error).toBe('Failed to fetch products');
        }
      );
    });

    it('GET /api/products/:id returns a product by id', async () => {
      const mockProduct = { id: 1, name: 'Royal Silk Sherwani', price: 12499 };
      await withFreshServer(
        { collection: vi.fn().mockReturnValue({ doc: () => ({ get: () => Promise.resolve(createMockDoc(mockProduct)) }) }) },
        async (port) => {
          const res = await fetch(`http://127.0.0.1:${port}/api/products/1`);
          expect(res.status).toBe(200);
          const data = await res.json();
          expect(data.name).toBe('Royal Silk Sherwani');
        }
      );
    });

    it('GET /api/products/:id returns 404 if not found', async () => {
      await withFreshServer(
        { collection: vi.fn().mockReturnValue({ doc: () => ({ get: () => Promise.resolve({ exists: false }) }) }) },
        async (port) => {
          const res = await fetch(`http://127.0.0.1:${port}/api/products/999`);
          expect(res.status).toBe(404);
        }
      );
    });

    it('POST /api/products/add creates a product', async () => {
      let callCount = 0;
      await withFreshServer(
        {
          collection: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              return { doc: () => ({ get: () => Promise.resolve({ exists: true, data: () => ({ nextId: 100 }) }), set: vi.fn() }) };
            }
            return { doc: () => ({ set: vi.fn() }) };
          }),
        },
        async (port) => {
          const res = await fetch(`http://127.0.0.1:${port}/api/products/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'New Product', price: 999, stock: 10 }),
          });
          expect(res.status).toBe(201);
          const data = await res.json();
          expect(data.name).toBe('New Product');
          expect(data.id).toBe(100);
        }
      );
    });

    it('DELETE /api/products/remove/:id removes product', async () => {
      const mockProduct = { id: 1, name: 'Royal Silk Sherwani', price: 12499 };
      await withFreshServer(
        { collection: vi.fn().mockReturnValue({ doc: () => ({ get: () => Promise.resolve(createMockDoc(mockProduct)), delete: vi.fn() }) }) },
        async (port) => {
          const res = await fetch(`http://127.0.0.1:${port}/api/products/remove/1`, { method: 'DELETE' });
          expect(res.status).toBe(200);
          expect((await res.json()).success).toBe(true);
        }
      );
    });

    it('PUT /api/products/:id updates product', async () => {
      const mockProduct = { id: 1, name: 'Royal Silk Sherwani', price: 12499 };
      await withFreshServer(
        { collection: vi.fn().mockReturnValue({ doc: () => ({ get: () => Promise.resolve(createMockDoc(mockProduct)), set: vi.fn() }) }) },
        async (port) => {
          const res = await fetch(`http://127.0.0.1:${port}/api/products/1`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Updated', price: 19999 }),
          });
          expect(res.status).toBe(200);
          const data = await res.json();
          expect(data.name).toBe('Updated');
        }
      );
    });

    it('POST /api/reviews submits a review', async () => {
      await withFreshServer(
        { collection: vi.fn().mockReturnValue({ add: () => Promise.resolve({ id: 'new-review' }) }) },
        async (port) => {
          const res = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: '1', userId: 'u1', userName: 'T', rating: 4, comment: 'Nice' }),
          });
          expect(res.status).toBe(201);
          expect((await res.json()).rating).toBe(4);
        }
      );
    });
  });
});
