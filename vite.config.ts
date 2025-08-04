// ===============================
// vite.config.ts
// ===============================
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/automatic-parakeet/', // GitHub Pagesのサブディレクトリに対応
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})