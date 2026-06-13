#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

cleanup() {
  echo ""
  echo "Cleaning up..."
  kill $SERVER_PID $VITE_PID 2>/dev/null || true
  wait $SERVER_PID $VITE_PID 2>/dev/null || true
  echo "Done."
}
trap cleanup EXIT INT TERM

echo "Starting Express backend on port 3001..."
node server.js &
SERVER_PID=$!

echo "Starting Vite frontend on port 3000..."
npx vite --port 3000 &
VITE_PID=$!

echo "Waiting for servers to be ready..."

# Wait for Express (port 3001)
for i in $(seq 1 30); do
  if curl -s http://localhost:3001/api/products > /dev/null 2>&1; then
    echo "Express backend is ready on port 3001"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "Timed out waiting for Express backend"
    exit 1
  fi
  sleep 1
done

# Wait for Vite (port 3000)
for i in $(seq 1 30); do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "Vite frontend is ready on port 3000"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "Timed out waiting for Vite frontend"
    exit 1
  fi
  sleep 1
done

echo ""
echo "Running Cypress E2E tests..."
npx cypress run "$@"
