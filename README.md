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
