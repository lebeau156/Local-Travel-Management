import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8080'),
    strictPort: false,
    allowedHosts: ['.railway.app', '.up.railway.app'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['.railway.app', '.up.railway.app'],
  },
})
