import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: {
    port: 7450,
    proxy: {
      '/api': { target: process.env.API_UPSTREAM ?? 'http://127.0.0.1:7460', rewrite: (url) => url.replace(/^\/api/, '') },
    },
  },
  test: { environment: 'jsdom' },
});
