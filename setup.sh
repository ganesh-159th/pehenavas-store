#!/bin/bash

if [ ! -f .env ] && [ -f .env.example ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
fi

echo "Installing dependencies for pehenavas-store..."
npm install

echo "Starting the project..."
npm run dev