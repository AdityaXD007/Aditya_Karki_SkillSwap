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
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true
    },
    // Only use secure HMR (wss/443) if the VITE_TUNNEL variable is 'true'
    hmr: process.env.VITE_TUNNEL === 'true' ? {
      protocol: 'wss',
      clientPort: 443
    } : true
  }
})