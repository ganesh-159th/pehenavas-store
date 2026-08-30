#!/bin/bash
# Pehenavas one-time setup
# - Creates .env from .env.example (if missing) with all PUBLIC values pre-filled
# - Prompts only for the SECRET values (never stored in git)
# - Auto-detects the Firebase admin JSON to avoid manual base64
# - Installs dependencies
set -e

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "Creating .env from .env.example (public defaults are pre-filled)..."
  cp .env.example .env
else
  echo ".env already exists - skipping creation."
fi

# ---- SECRET 1: Firebase admin service account (base64) ----
if grep -q '^FIREBASE_SERVICE_ACCOUNT_B64=$' .env; then
  KEY=$(ls pehenavas-db-firebase-adminsdk-*.json 2>/dev/null | head -n1 || true)
  if [ -n "$KEY" ]; then
    echo "Found $KEY - encoding automatically..."
    B64=$(base64 -i "$KEY" | tr -d '\n')
    sed -i '' "s|^FIREBASE_SERVICE_ACCOUNT_B64=.*|FIREBASE_SERVICE_ACCOUNT_B64=$B64|" .env
  else
    echo "No Firebase admin JSON found in project root."
    read -rp "Paste the base64 of your Firebase admin key (or press Enter to skip): " B64
    if [ -n "$B64" ]; then
      sed -i '' "s|^FIREBASE_SERVICE_ACCOUNT_B64=.*|FIREBASE_SERVICE_ACCOUNT_B64=$B64|" .env
    else
      echo "Skipping Firebase admin - the server will still run; only admin routes are limited."
    fi
  fi
else
  echo "FIREBASE_SERVICE_ACCOUNT_B64 already set - skipping."
fi

# ---- SECRET 2: Gmail SMTP (App Password) ----
if grep -q '^EMAIL_PASS=your-16-char-app-password$' .env; then
  echo ""
  echo "Optional: Gmail SMTP for automated emails (reset/welcome/order notifications)."
  echo "Skip this - the website still works, just no emails are sent."
  read -rp "Your Gmail address (e.g. you@gmail.com) or press Enter to skip: " EMAIL_USER_IN
  if [ -n "$EMAIL_USER_IN" ]; then
    read -rp "Gmail App Password (16 chars, no spaces): " EMAIL_PASS_IN
    sed -i '' "s|^EMAIL_USER=.*|EMAIL_USER=$EMAIL_USER_IN|" .env
    sed -i '' "s|^EMAIL_PASS=.*|EMAIL_PASS=$EMAIL_PASS_IN|" .env
    sed -i '' "s|^EMAIL_FROM=.*|EMAIL_FROM=$EMAIL_USER_IN|" .env
    echo "Gmail SMTP configured."
  else
    echo "Skipping email configuration."
  fi
else
  echo "EMAIL_PASS already set - skipping."
fi

# ---- SECRET 3: Razorpay ----
if grep -q '^RAZORPAY_KEY_SECRET=$' .env; then
  echo ""
  echo "Optional: Razorpay keys for online card/UPI payments."
  echo "Get test keys from https://dashboard.razorpay.com. Skip to disable online payments."
  read -rp "Razorpay Key ID (or press Enter to skip): " RZ_ID
  if [ -n "$RZ_ID" ]; then
    read -rp "Razorpay Key Secret: " RZ_SECRET
    sed -i '' "s|^RAZORPAY_KEY_ID=.*|RAZORPAY_KEY_ID=$RZ_ID|" .env
    sed -i '' "s|^VITE_RAZORPAY_KEY_ID=.*|VITE_RAZORPAY_KEY_ID=$RZ_ID|" .env
    sed -i '' "s|^RAZORPAY_KEY_SECRET=.*|RAZORPAY_KEY_SECRET=$RZ_SECRET|" .env
    echo "Razorpay configured."
  else
    echo "Skipping Razorpay configuration."
  fi
else
  echo "RAZORPAY_KEY_SECRET already set - skipping."
fi

echo ""
echo "Installing dependencies..."
npm install

echo ""
echo "Setup complete! Run 'npm run dev:full' to start (frontend + backend)."
echo "The website works with zero further configuration."
