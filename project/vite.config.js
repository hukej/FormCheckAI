import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@tensorflow')) return 'ml-engine';
            if (id.includes('three')) return '3d-engine';
            if (id.includes('@react-three')) return '3d-react';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('framer-motion')) return 'animations';
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1500,
    reportCompressedSize: false, // Przyspiesza build
    cssCodeSplit: true,
  }
})
