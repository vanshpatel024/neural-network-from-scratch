import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE || process.env.VITE_BASE_PATH || '/',
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/katex')) {
            return 'docs-katex';
          }
          if (id.includes('node_modules/shiki')) {
            return 'docs-shiki';
          }
          if (id.includes('node_modules/recharts')) {
            return 'docs-recharts';
          }
          if (id.includes('node_modules/mafs')) {
            return 'docs-mafs';
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
