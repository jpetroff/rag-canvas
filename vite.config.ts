/* eslint-disable @typescript-eslint/no-unused-vars */
import { defineConfig, type Rollup } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

function manualChunks(id: string, meta: Rollup.ManualChunkMeta) {
  if (id.includes('node_modules')) {
    return 'vendor'
  }

  return null
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 8081,
    allowedHosts: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: manualChunks,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve('./src'),
      '@components': path.resolve('./src/components'),
      '@fragments': path.resolve('./src/fragments'),
      '@pages': path.resolve('./src/pages'),
      '@utils': path.resolve('./src/utils'),
      '@store': path.resolve('./src/store'),
      '@convex': path.resolve('./convex')
    },
  },
})
