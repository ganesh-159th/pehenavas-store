# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh .

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
---

## 🛍️ Pehenavas Store

A modern e-commerce storefront built with React 19, Vite, and Tailwind CSS.

### 🚀 Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd pehenavas-store
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```
   Access the application at `http://localhost:3000/`

### 🛠️ Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3
- **Routing:** React Router 7
- **Testing:** Vitest (Unit) & Cypress (E2E)
- **Linting:** ESLint

### 📖 Documentation

For detailed local environment setup, available scripts, and troubleshooting, please refer to:
👉 **[LOCAL_SETUP.md](./LOCAL_SETUP.md)**

### 🧪 Testing & Quality

- **Unit Tests:** `npm run test`
- **E2E Tests:** `npm run cypress:open`
- **Linting:** `npm run lint`
- **Production Build:** `npm run build`

---

## 🏗️ UI Architecture — Component Hierarchy

```
main.jsx
│
└── <BrowserRouter>
      │
      └── <UserProvider>  ← Auth context (user, login, logout)
            │
            └── <ErrorBoundary>
                  │
                  └── <App>  ← Layout shell
                        │
                        ├── StickyHeader (nav, logo, search, cart icon, auth links)
                        │
                        ├── SearchModal (overlay)
                        │
                        ├── CartDrawer (slide-out)
                        │
                        ├── ConnectionBanner (server status indicator)
                        │
                        ├── ToastNotification (global alerts)
                        │
                        ├── <Routes>
                        │     │
                        │     ├── / → <Suspense> → <Home>
                        │     │     ├── HeroBanner (3-slide carousel)
                        │     │     ├── CategoryFilter (All, Men, Women, Jewellery, etc.)
                        │     │     ├── PriceFilter (min/max range)
                        │     │     ├── SortSelect (default, price, rating)
                        │     │     └── ProductGrid
                        │     │           └── ProductCard × N
                        │     │                 └── QuickAddModal
                        │     │
                        │     ├── /signin → <SignIn> (email/password + Firebase auth)
                        │     │
                        │     ├── /signup → <SignUp> (name/email/password + terms)
                        │     │
                        │     ├── /account → <Account>
                        │     │     └── <Orders>
                        │     │           └── OrderCard × N
                        │     │
                        │     ├── /orders → <Orders>
                        │     │
                        │     ├── /product/:id → <Suspense> → <ProductDetail>
                        │     │     ├── ProductImage gallery
                        │     │     ├── SizeSelector
                        │     │     ├── ColorSelector
                        │     │     └── Reviews
                        │     │           ├── ReviewList
                        │     │           └── ReviewForm
                        │     │
                        │     ├── /checkout → <Checkout>
                        │     │     ├── ShippingAddressForm
                        │     │     ├── PaymentMethod (UPI / Card / COD)
                        │     │     └── OrderSummary sidebar
                        │     │
                        │     ├── /wishlist → <Wishlist>
                        │     │     └── ProductCard × N
                        │     │
                        │     ├── /admin/login → <AdminLogin>
                        │     │
                        │     ├── /admin/dashboard → <AdminDashboard>
                        │     │     ├── Sidebar (Overview, Products, Orders, Customers)
                        │     │     ├── Overview (chart, best-sellers, inventory)
                        │     │     ├── Products (grid + AddProduct modal)
                        │     │     ├── Orders (mock table)
                        │     │     └── Customers (mock table + loyalty tiers)
                        │     │
                        │     ├── /terms → <Terms>
                        │     │
                        │     └── * → <NotFound>
                        │
                        └── Footer
```

### State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Zustand (useStore.js) — persisted to localStorage          │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌──────┐│
│  │ cart    │ │ wishlist │ │ orders  │ │ products │ │admin ││
│  │ (items, │ │ (array)  │ │ (array) │ │ (merged  │ │auth  ││
│  │  qty)   │ │          │ │         │ │  from    │ │      ││
│  └─────────┘ └──────────┘ └─────────┘ │ server + │ └──────┘│
│                                       │ local)   │          │
│                                       └──────────┘          │
│  Tab sync: listens to window.storage events                 │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│  React Context (UserContext.jsx) — persisted to localStorage │
│  { user, login, logout } — synced with Firebase Auth        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│  Component-local state                                      │
│  useReducer → Home (filters, quick-view)                    │
│  useState   → Checkout, SignIn, SignUp, ProductDetail etc.  │
│  react-hook-form → AdminDashboard (AddProduct form)         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action
     │
     ▼
Component (event handler)
     │
     ├──→ Zustand action (addToCart, toggleWishlist, addOrder)
     │       │
     │       └──→ localStorage persist (survives refresh)
     │
     └──→ fetch() to Express API
                 │
                 └──→ Firebase Admin SDK
                         │
                         └──→ Firestore (products, reviews)
```

### Backend Overview

```
Express Server (server.js @ port 3001)
│
├── GET    /api/products              → List all products
├── GET    /api/products/:id          → Get single product
├── POST   /api/products/add          → Add product (auto-increment ID)
├── PUT    /api/products/:id          → Update product
├── DELETE /api/products/remove/:id   → Delete product
├── GET    /api/reviews/:productId    → Get reviews
└── POST   /api/reviews               → Submit review
         │
         └── Firestore collections: products, reviews, meta
```

### Key UI Patterns

- **Lazy loading**: `Home` & `ProductDetail` via `React.lazy()` + `<Suspense>` — Firebase client dynamically imported
- **Protected routes**: `/account`, `/orders`, `/checkout` redirect to `/signin` if unauthenticated; `/admin/dashboard` redirects to `/admin/login`
- **Graceful degradation**: App falls back to local seed data (`src/data/products.js`) when server is offline — connection banner shown at top
- **Error boundary**: `ErrorBoundary.jsx` catches render errors and shows a styled fallback page
- **Animations**: `useFadeIn` hook + Tailwind transitions; CSS keyframes for cart drawer slide-in
- **Toast system**: DOM-managed alerts via `src/utils/alert.js` (independent of React render cycle)
