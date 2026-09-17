import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server proxies API + WebSocket calls to the Spring Boot backend on 8080,
// so the frontend can call same-origin paths and avoid CORS during development.
export default defineConfig({
  plugins: [react()],
  // sockjs-client references the Node `global`; map it to the browser global.
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/ws': { target: 'http://localhost:8080', changeOrigin: true, ws: true },
      '/actuator': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
});
