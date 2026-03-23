import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: 'src/main.jsx',
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'bundle.js',
      }
    },
    outDir: 'dist-inline',
    cssCodeSplit: false,
    minify: false,
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  }
})
