/// <reference types="vitest" />
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { politique } from './src/csp'

/** Au build seulement (le serveur de développement a besoin de scripts en ligne pour le rechargement à chaud). */
const csp = (proxyUrl: string): Plugin => ({
  name: 'csp',
  apply: 'build',
  transformIndexHtml: (html) => {
    if (!html.includes('<meta name="referrer"')) throw new Error('CSP : repère <meta name="referrer"> absent de index.html, la protection ne serait pas injectée')
    return html.replace('<meta name="referrer"', `<meta http-equiv="Content-Security-Policy" content="${politique(proxyUrl)}" />\n    <meta name="referrer"`)
  },
})

export default defineConfig(({ mode }) => ({
  base: './', // GitHub Pages sert l'app dans un sous-dossier
  plugins: [react(), tailwindcss(), csp(loadEnv(mode, '.', 'VITE_').VITE_PROXY_URL ?? '')],
  server: { fs: { allow: ['..'] } }, // config/ est à la racine du dépôt
  test: { environment: 'jsdom', include: ['src/**/*.test.ts'], setupFiles: ['src/test-setup.ts'] },
}))
