import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // string shorthand: http://localhost:5173/foo -> http://localhost:3000/foo
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    }
  }
})