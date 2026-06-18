import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ping': {
        target: 'https://ibrat-backend-hi7w.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});