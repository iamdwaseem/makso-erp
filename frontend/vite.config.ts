import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    build: {
      // Keep CI/terminal output focused on actionable issues.
      chunkSizeWarningLimit: 2000,
    },
    server: {
      proxy: {
        // Forward /api to the backend so auth/me and dashboard/stats work when using baseURL '/api'
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
  };
});
