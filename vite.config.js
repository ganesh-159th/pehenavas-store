import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    server: {
      deps: {
        inline: ['@exodus/bytes', 'html-encoding-sniffer', 'jsdom']
      }
    },
    deps: {
      optimizer: {
        web: {
          enabled: false
        }
      }
    }
  }
})