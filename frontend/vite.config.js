import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        // Keep CI/terminal output focused on actionable issues.
        chunkSizeWarningLimit: 2000,
    },
});
