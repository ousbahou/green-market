import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // target: 'http://localhost:3001',
        target: 'https://green-market-order-v2.vercel.app',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
