import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@monaco-editor/react', 'monaco-editor'],
  },
  server: {
    port: 3010,
  },
})
