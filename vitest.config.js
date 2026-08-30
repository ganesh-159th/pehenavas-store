import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'clover'],
      include: ['src/**/*.{js,jsx}'],
      thresholds: {
        statements: 70,
        branches: 75,
        functions: 65,
        lines: 70,
        'src/store/**': {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
        'src/services/**': {
          statements: 80,
          branches: 70,
          functions: 80,
          lines: 80,
        },
        'src/components/Checkout.jsx': {
          statements: 80,
          branches: 80,
          functions: 75,
          lines: 80,
        },
        'src/components/ReviewCard.jsx': {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80,
        },
        'src/components/ReviewForm.jsx': {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
      }
    }
  },
  server: {
    deps: {
      inline: ['html-encoding-sniffer', '@exodus/bytes']
    }
  }
});