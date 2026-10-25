import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Plain Vite app. Unit tests (Vitest) live next to the code as *.test.ts.
export default defineConfig({
  base: './', // relative paths: the built site works from any folder (GitHub Pages sub-path, etc.)
  plugins: [react()],
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
})
