import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// VisioCore - Vite Yapılandırma Dosyası
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
