import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Target production-grade rollup config
    target: 'es2020',
    // Enable minification
    minify: 'terser',
    // Chunk size optimization
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor'
            }
            if (id.includes('axios')) {
              return 'api'
            }
            if (id.includes('zustand')) {
              return 'state'
            }
            return 'dependencies'
          }
        },
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name ?? ''
          if (/\.(gif|jpe?g|png|svg|webp)$/.test(name)) {
            return 'images/[name]-[hash][extname]'
          }
          if (/\.css$/.test(name)) {
            return 'css/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
    // Source maps in production for debugging
    sourcemap: true,
    // Report compressed size
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500,
  },
  server: {
    // Development server configuration
    port: 5173,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
      },
    },
  },
})