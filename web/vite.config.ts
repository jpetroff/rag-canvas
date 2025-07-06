/* eslint-disable @typescript-eslint/no-unused-vars */
import { defineConfig, Rollup } from 'vite'
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
      '@app-components': path.resolve('./src/app-components'),
      '@pages': path.resolve('./src/pages'),
      '@assets': path.resolve('./src/assets'),
      '@store': path.resolve('./src/store'),
      '@shared': path.resolve('./src/shared'),
    },
  },
})
