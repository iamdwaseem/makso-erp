import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // Must match backend PORT (see backend/.env). Override with VITE_PROXY_TARGET in frontend/.env
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://127.0.0.1:4000';
  const apiProxy = {
    '/api': {
      target: proxyTarget,
      changeOrigin: true,
    },
  };

  return {
    plugins: [react()],
    build: {
      // Keep CI/terminal output focused on actionable issues.
      chunkSizeWarningLimit: 2000,
    },
    server: {
      proxy: apiProxy,
    },
    // `vite preview` does not inherit `server.proxy` — without this, /api/* returns 404 (no backend).
    preview: {
      proxy: apiProxy,
    },
  };
});
