import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Get API URL depending on environment
const API_DEV = 'http://localhost:5000';
const API_PROD = 'https://acenexacbt.onrender.com'; 

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    plugins: [react()],
    base: './', // Relative paths for production build
    server: {
      port: 5173,
      strictPort: true,
      open: true,
      proxy: {
        '/api': {
          target: API_DEV,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(isProd ? API_PROD : API_DEV)
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  };
});
