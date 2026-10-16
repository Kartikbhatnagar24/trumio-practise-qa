import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 7410,
    proxy: {
      '/api': { target: 'http://127.0.0.1:7420', rewrite: (path) => path.replace(/^\/api/, '') },
    },
  },
});
