# 🛍️ Pehenavas Store

A modern Indian e-commerce web app for royal heritage fashion, built with **React, Vite, Tailwind CSS, Node.js (Express), and Firebase**.

> ⚠️ **Sandbox**: This is a testing environment. No real transactions happen.

---

## ✨ Features (all features throughout the site)

### 🏠 Storefront & Home Page
- **Hero banner carousel** — 3 auto-rotating banners (every 5s) with prev/next arrows and CTA buttons.
- **Category tabs** — All, Women, Men, Jewellery, Footwear, Accessories.
- **Price filter** — Min / max price range inputs.
- **Sorting** — Default, Price (Low→High / High→Low), Top Rated.
- **Live search** — Debounced, case-insensitive search across name, description, and category, with an auto-focused search modal and empty/loading states.
- **Quick View modal** — Quick Add button on every product card opens size + add-to-cart instantly without leaving the page.
- **Product grid** — Responsive cards with lazy-loaded images, hover zoom, star rating, and review count.

### 📦 Product Details
- Large product image, name, 5-star rating row, and description.
- **Size selector** (S/M/L/XL) and **color selector** (pills shown when colors exist).
- Price with strikethrough original price + **Add to Cart**.
- Auto page title, fade-in animation, and a back button.
- Product not-found fallback with a "Return to Store" link.

### ⭐ Reviews System
- **Write / edit / delete** your own reviews with a clickable 5-star picker (min 10 chars).
- **Rating breakdown** — average score + distribution bars for 1–5 stars.
- **"Helpful" voting** — one per user, toggle on/off.
- **Report** a review with a reason (blocks duplicates).
- **Sort reviews** — Most Recent, Highest, Lowest, Most Helpful.
- **Pagination** — "Show More / Show Less" loads 5 at a time.
- Admin shield badge, "(edited)" markers, and per-review dates.

### 🛒 Cart
- Slide-in drawer with line items grouped by product **+ size**.
- **Quantity stepper** (+/−) — at 0 the item is removed; individual remove buttons.
- Cart saved to the browser (**localStorage**) and **synced across open tabs**.
- Live subtotal, item count badge, and "Proceed to Checkout".
- Add-to-cart toast with a **"View Cart"** shortcut.

### ❤️ Wishlist
- Save/remove products with a toggle, live count badge in the header.
- Dedicated wishlist page with per-item remove and **Add to Cart via a size picker modal**.

### 💳 Checkout & Payments
- **Shipping address form** with per-field validation (name, 10-digit phone, address, city, state, 6-digit pincode).
- **Three payment methods**:
  - **UPI** (GPay / PhonePe / Paytm) — live UPI-ID verification with success/error states.
  - **Credit / Debit Card** — auto-formatting card number, MM/YY expiry auto-slash, CVV masking.
  - **Cash on Delivery**.
- Secure **Razorpay** gateway — order creation, payment, and server-side signature verification.
- Order summary with items, FREE delivery, and amount to pay.
- **Order confirmation page** — order number, date, total, payment method, items, delivery estimate, and shipping address.
- Order ID (`PHN-XXXXXX`) and estimated delivery date (3–5 days).

### 👤 Accounts & Authentication
- **Sign up** — name, email, strong-password rules, confirm password, and terms checkbox.
- **Sign in** — email + password with show/hide toggle, guest access, "forgot password?" flow.
- **Forgot / reset password** — emailed reset link + dedicated reset page with a **live password strength meter** and "passwords match" indicator.
- Auto sign-in state sync with Firebase; welcome & verification emails.
- **Account & Orders pages** — personalized greeting and full order history with status badges.

### 🔐 Admin Portal (`/admin/login`, `/admin/dashboard`)
- **Secure admin login** (Firebase-backed with fallback admin/admin123) and "remember me".
- **Sidebar navigation** — Overview, Products, Orders, Customers, Sign Out.
- **Overview** — 12-month revenue chart with hover tooltips, best-sellers list, visual inventory feed, and order status ticker.
- **Products** — add, edit, and delete with image upload & preview, stock/price/category fields, and a two-step **publish confirmation** modal.
- **Orders** — full order table with status pills (Pending, Shipped, Delivered, Returned).
- **Customers** — customer table with loyalty tier badges (Gold, Silver, Platinum, Bronze).
- **Admin search modal** — search products and orders.
- Manual **Sync** button to pull latest products from the server.

### 📧 Automated Emails (Gmail SMTP)
Welcome, password reset, email verification, order confirmation, support request, and feedback emails.

### ⚙️ Engineering & UX
- **Offline-safe** — falls back to local seed data and shows a live connection / sandbox banner.
- **Real-time sync** — products polled every 5s, reviews every 10s from Firestore.
- **Global toast system** (success / danger / warning) plus the cart toast.
- **Keyboard shortcuts** — Escape closes search and modals.
- **Animations** — page fade-ins, cart slide-in, banner cross-fades, image hover zoom, password strength bar, chart tooltips.
- **Accessibility** — dialog ARIA roles, aria-labels on icon buttons, focus rings, autocomplete hints.
- **INR formatting** — all prices use the Indian number format (₹).
- **Tested** — unit tests (Vitest) and end-to-end tests (Cypress).
- **Docker-ready** — run the whole app in containers without installing anything manually.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies (first time only)
npm install

# 2. Start the backend server (Express + Firebase)
npm run server

# 3. Start the frontend (in a second terminal)
npm run dev
```

Open **http://localhost:3000/** in your browser.

> 💡 Prefer Docker? See [LOCAL_SETUP.md](./LOCAL_SETUP.md) for a containerized option.

---

## ☁️ Production Deployment (Render / Railway)

The app is a **single Node/Express server** that serves both the built React
frontend (`dist/`) and the `/api` backend on one port — no separate hosting
needed.

```bash
# Build the frontend (outputs dist/)
npm run build

# Start the production server (serves dist/ + API on PORT, default 3001)
npm run server
```

**Required environment variables (set in the hosting provider):**

| Variable | Purpose |
|----------|---------|
| `FIREBASE_SERVICE_ACCOUNT_B64` | Base64 of your Firebase Admin SDK service-account JSON (required) |
| `VITE_FIREBASE_*` | Firebase web config (used at **build time**) |
| `ADMIN_API_KEY` | Secret protecting admin write routes (set a long random value) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Payment gateway keys |
| `EMAIL_USER` / `EMAIL_PASS` | Gmail App Password for SMTP |
| `APP_URL` | The public origin (e.g. `https://yourapp.onrender.com`) |
| `CORS_ORIGINS` | Comma-separated allowed origins (leave empty in same-origin prod) |

> ⚠️ **`VITE_*` variables must be available at build time.** On Render/Railway
> set them in the service settings so `npm run build` (postinstall) picks them up.
> `FIREBASE_SERVICE_ACCOUNT_B64`, `ADMIN_API_KEY`, `RAZORPAY_KEY_SECRET`,
> `EMAIL_*` and `APP_URL` are runtime-only and read by the server process.

**Docker:** `Dockerfile` is multi-stage (build → runtime) and serves the app
for one process. Set the env vars above when running the container.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 5, Tailwind CSS 3 |
| Routing | React Router 7 |
| State | Zustand (persisted) + React Context |
| Backend | Node.js, Express |
| Database | Firebase (Firestore) |
| Auth | Firebase Authentication |
| Payments | Razorpay |
| Emails | Nodemailer (Gmail SMTP) |
| Testing | Vitest (unit), Cypress (E2E) |

---

## 📁 Project Structure

```
pehenavas-store/
├── src/                  # Frontend
│   ├── components/       # Pages & UI (Home, Cart, Checkout, Reviews...)
│   ├── admin/            # Admin login & dashboard
│   ├── store/            # Zustand store (cart, wishlist, orders)
│   ├── services/         # API calls (products, reviews, payments)
│   ├── context/          # React contexts (user auth)
│   ├── hooks/            # Custom hooks
│   └── data/             # Local seed data (offline fallback)
├── server.js             # Express backend API
├── server/               # Email templates
└── cypress/              # E2E tests
```

---

## 🔗 Backend API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/products` | List all products |
| GET | `/api/products/:id` | Get one product |
| POST | `/api/products/add` | Add a product (admin) |
| PUT | `/api/products/:id` | Update a product |
| DELETE | `/api/products/remove/:id` | Delete a product |
| GET | `/api/reviews/:productId` | Get reviews for a product |
| POST | `/api/reviews` | Submit a review |
| POST | `/api/orders` | Place an order |
| GET | `/api/orders` | Get the logged-in user's orders |
| POST | `/api/payments/create-order` | Create a Razorpay order |
| POST | `/api/payments/verify` | Verify a Razorpay payment |
| POST | `/api/auth/*` | Email endpoints (reset, verify, welcome, support, feedback) |

---

## 📦 Useful Commands

```bash
npm run dev         # Start frontend dev server
npm run server      # Start backend API server
npm run build       # Build for production
npm run preview     # Preview the production build
npm run lint        # Check code with ESLint
npm run test        # Run unit tests (Vitest)
npm run coverage    # Run tests with coverage report
npm run cypress:open # Open Cypress for E2E testing
```

For detailed setup, troubleshooting, and Docker instructions, see **[LOCAL_SETUP.md](./LOCAL_SETUP.md)**.
