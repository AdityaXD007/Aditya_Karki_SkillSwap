import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: '0.0.0.0',      // Listen on all interfaces
    port: 5173,
    watch: {
      usePolling: true    // Important for Docker
    },
    hmr: {
      // Allow Vite to detect the host automatically for devtunnels
      clientPort: 443 
    }
  }
})