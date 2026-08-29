# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Copy the built frontend + server source
COPY --from=build /app/dist ./dist
COPY server.js .
COPY server ./server

EXPOSE 3001

# Environment variables are injected by the host (Render/Railway/cloud).
CMD ["node", "server.js"]
