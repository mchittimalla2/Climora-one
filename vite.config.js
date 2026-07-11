import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const basePath = process.env.VITE_APP_BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [react()],
})