import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es'
  },
  server: {
    // Add headers for SharedArrayBuffer support (needed for Stockfish WASM)
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  },
  build: {
    // Ensure assets are properly included
    assetsInclude: ['**/*.wasm', '**/*.mp3', '**/*.png']
  }
})