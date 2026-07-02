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
        perFile: true,
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      }
    }
  },
  server: {
    deps: {
      inline: ['html-encoding-sniffer', '@exodus/bytes']
    }
  }
});