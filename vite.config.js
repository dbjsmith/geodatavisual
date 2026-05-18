import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Netlify dev proxies functions; this lets `vite dev` standalone fall back gracefully
    proxy: {
      '/api': 'http://localhost:8888',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
