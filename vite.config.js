import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Climoraone is always deployed at the root of its hostname.
// Examples:
//   https://dev.climoraone.com/
//   https://climoraone.com/
// Keeping the base path fixed at "/" prevents environment-specific URL rewrites.
export default defineConfig({
  base: '/',
  plugins: [react()],
})
