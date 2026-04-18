// vite.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    env: {
      // expose the API base URL to tests — never hardcode
      VITE_API_BASE_URL: 'http://localhost:3001',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: [
        'src/tests/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/styles/**',
        'src/i18n/**',
        'src/shared/types/**',
        'src/shared/components/ui/**',
        'src/api/model/**',
        'src/api/services/generated/**',
        'src/app/providers.tsx',
        'src/app/router.tsx',
      ],
    },
  },
});
