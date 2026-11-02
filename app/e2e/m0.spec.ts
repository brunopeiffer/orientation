import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const AVERTISSEMENT = /Tes réponses sont enregistrées uniquement sur cet appareil et ce navigateur\./

async function sansViolation(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([])
}

async function demarrer(page: Page) {
  await page.goto('/')
  await page.getByLabel(/Ton prénom/).fill('Inès')
  await page.getByLabel('BTS Comptabilité et gestion (CG)').check()
  await page.getByRole('button', { name: /C’est parti/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ton profil de personnalité')
}

test('l’avertissement est visible au premier écran et la page est accessible', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('avertissement')).toHaveText(AVERTISSEMENT)
  await sansViolation(page)
})

test('il faut choisir où on en est pour commencer', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /C’est parti/ }).click()
  await expect(page.getByText('Choisis où tu en es pour continuer.')).toBeVisible()
})

test('reprise là où on s’est arrêté après rechargement', async ({ page }) => {
  await demarrer(page)
  await page.getByRole('button', { name: /Suivant/ }).click()
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2')
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tes goûts, envies et refus')
  await expect(page.getByText(/Content de te revoir, Inès/)).toBeVisible()
  await sansViolation(page)
})

test('sauvegarder puis reprendre une sauvegarde', async ({ page }) => {
  await demarrer(page)
  const dl = page.waitForEvent('download')
  await page.getByRole('button', { name: /Sauvegarder/ }).click()
  const fichier = await (await dl).path()
  expect((await dl).suggestedFilename()).toMatch(/^orientation-sauvegarde-\d{4}-\d{2}-\d{2}\.json$/)

  await page.getByRole('button', { name: /Tout effacer/ }).click()
  await page.getByRole('button', { name: 'Oui, tout effacer' }).click()
  await expect(page.getByTestId('avertissement')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('orientation-etat'))).toBeNull()

  await page.getByLabel(/Reprendre une sauvegarde/).setInputFiles(fichier)
  await expect(page.getByText('Ta sauvegarde a bien été rechargée.')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ton profil de personnalité')
})

test('un fichier invalide est refusé avec un message clair', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel(/Reprendre une sauvegarde/).setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"a":1}') })
  await expect(page.getByRole('status').filter({ hasText: /pas une sauvegarde valide/ })).toBeVisible()
})

test('aucun appel réseau hors de l’app', async ({ page }) => {
  const hotes = new Set<string>()
  page.on('request', (r) => hotes.add(new URL(r.url()).host))
  await demarrer(page)
  expect([...hotes]).toEqual(['localhost:5180'])
})
