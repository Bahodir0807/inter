import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_TARGET = 'https://ibrat-backend-hi7w.onrender.com';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
      },
      '/users': {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
      },
      '/courses': {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
      },
      '/groups': {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
      },
      '/schedule': {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
      },
      '/payments': {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
      },
      '/branches': {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
      },
      '/grades': {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
      },
      '/homework': {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
      },
      '/notifications': {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
      },
    },
  },
});