import { defineConfig, devices } from '@playwright/test'

// En local on peut utiliser le Chrome installé (PW_CHANNEL=chrome) ; la CI utilise le Chromium de Playwright.
const channel = process.env.PW_CHANNEL

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:5180' },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'], channel } },
    { name: 'ordinateur', use: { ...devices['Desktop Chrome'], channel } },
  ],
  webServer: { command: 'npx vite --port 5180 --strictPort', url: 'http://localhost:5180', reuseExistingServer: true },
})
