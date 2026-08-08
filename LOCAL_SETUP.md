# Pehenavas Store - Local Environment Setup

## Prerequisites Check
```bash
node --version    # Should be v20.19+, v22.12+, or v24+
npm --version     # Should be v10.0+
```

---

## Docker Setup (Alternative — No Manual Installation Needed)

Run the entire project in containers without installing Node, npm, or any dependencies on your machine.

### 1. Install Docker Desktop
Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) and launch it.

### 2. Build & Start
```bash
cd /path/to/pehenavas-store
docker compose up --build
```

### 3. Open in Browser
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api/products

### Live Reload
- Edit frontend files → saved changes auto-refresh in the browser
- Edit `server.js` → backend auto-restarts via `--watch`

### Useful Commands
```bash
docker compose up          # Start (skip build)
docker compose down        # Stop containers
docker compose up --build  # Rebuild after package.json changes
```

---

## Step 1: Install Project Dependencies

```bash
cd /path/to/pehenavas-store
npm install
```

This will install:
- React 19.2.0
- Vite 5.4.0 (build tool)
- Tailwind CSS 3.4.19
- React Router DOM 7.13.1
- Testing libraries (Vitest, Cypress)
- ESLint (code quality)
- And 480+ other packages

---

## Step 2: Start Development Server

```bash
npm run dev
```

Access at: **http://localhost:5174/**

---

## All Available Commands

### 🚀 Development
```bash
npm run dev           # Start dev server with hot reload
```

### 🏗️ Build & Production
```bash
npm run build         # Build for production
npm run preview       # Preview production build locally
```

### 🔍 Code Quality
```bash
npm run lint          # Check code with ESLint
npm run lint -- --fix # Auto-fix linting issues
```

### ✅ Testing
```bash
npm run test          # Run unit tests (Vitest)
npm run coverage      # Run tests with coverage report
npm run cypress:open  # Open Cypress for E2E testing
npm run cypress run   # Run E2E tests headless
```

### 🎯 Run Everything
```bash
npm run test:all      # Lint + Build + Unit Tests + Coverage + E2E
```

---

## Quick Start (One Command at a Time)

```bash
# 1. Navigate to project
cd /Users/ganesh159th/Desktop/pehenavas-store

# 2. Install dependencies (only first time or after package.json changes)
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# http://localhost:5174/
```

---

## Development Workflow

```bash
# 1. Start dev server (keep running)
npm run dev

# 2. Edit files in src/ directory
# (changes auto-reload in browser)

# 3. Before committing, run:
npm run lint         # Check code quality
npm run test         # Run unit tests
npm run build        # Build for production
```

---

## Full Setup for CI/CD or Fresh Install

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Verify everything works
npm run lint
npm run build
npm run test
npm run coverage

# Start dev server
npm run dev
```

---

## Environment Files Needed

Currently, the project doesn't require any `.env` file. All config is in:
- `vite.config.js` - Build config
- `tailwind.config.js` - Styling config
- `eslint.config.js` - Linting config

---

## Project Dependencies Summary

| Tool | Command | Purpose |
|------|---------|---------|
| **Vite** | `npm run dev` | Development server with HMR |
| **React** | Built-in | UI framework |
| **React Router** | Built-in | Client-side routing |
| **Tailwind CSS** | Built-in | Styling |
| **Vitest** | `npm run test` | Unit testing |
| **Cypress** | `npm run cypress:open` | E2E testing |
| **ESLint** | `npm run lint` | Code quality |

---

## Troubleshooting Commands

```bash
# Clear npm cache
npm cache clean --force

# Rebuild node_modules from scratch
rm -rf node_modules
npm install

# Clear Vite cache
rm -rf node_modules/.vite

# Check for outdated packages
npm outdated

# Update packages (carefully)
npm update

# Check for security vulnerabilities
npm audit
npm audit fix  # Auto-fix (may break things)
```

---

## Common Issues & Solutions

### Issue: Port 5174 already in use
```bash
npm run dev -- --port 3000
```

### Issue: npm install fails
```bash
npm cache clean --force
rm package-lock.json
npm install
```

### Issue: Linting errors on save
```bash
npm run lint -- --fix
```

### Issue: Tests failing
```bash
npm run test          # Run tests
npm run coverage      # See what's not covered
```

---

## That's Everything! 🎉

**TL;DR - Just run these 3 commands:**

```bash
cd /Users/ganesh159th/Desktop/pehenavas-store
npm install
npm run dev
```

Then open: **http://localhost:5174/**

