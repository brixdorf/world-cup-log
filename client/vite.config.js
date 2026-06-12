import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // In dev, Vite forwards /api/* to the Express server
      // In production this is handled by Nginx
      '/api': {
        target:      'http://localhost:3003',
        changeOrigin: true,
      },
    },
  },
});
