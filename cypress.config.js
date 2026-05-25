import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5174',
    setupNodeEvents(on) {
      on('task', {
        log(message) {
          console.log(message);
          return null; // Tasks must return a value or a promise
        },
      });
    },
  },
});