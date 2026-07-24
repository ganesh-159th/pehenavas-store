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
        statements: 50,
        branches: 75,
        functions: 40,
        lines: 50,
      }
    }
  },
  server: {
    deps: {
      inline: ['html-encoding-sniffer', '@exodus/bytes']
    }
  }
});