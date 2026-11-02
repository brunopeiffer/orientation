/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './', // GitHub Pages sert l'app dans un sous-dossier
  plugins: [react(), tailwindcss()],
  server: { fs: { allow: ['..'] } }, // config/ est à la racine du dépôt
  test: { environment: 'jsdom', include: ['src/**/*.test.ts'], setupFiles: ['src/test-setup.ts'] },
})
