import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

async function sansViolation(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([])
}

async function demarrer(page: Page) {
  await page.goto('/')
  await page.getByLabel('Terminale STMG').check()
  await page.getByRole('button', { name: /C’est parti/ }).click()
  // Le test de personnalité (facultatif) vient après les goûts et les résultats.
  for (let k = 0; k < 3; k++) await page.getByRole('button', { name: /Partie suivante/ }).click()
  for (let k = 0; k < 2; k++) await page.getByRole('button', { name: /Étape suivante/ }).click()
}

/** Répond à toutes les questions de la page avec le libellé donné. */
async function repondrePage(page: Page, libelle: string) {
  const groupes = page.locator('fieldset')
  for (let k = 0; k < (await groupes.count()); k++) await groupes.nth(k).getByLabel(libelle, { exact: true }).check()
}

test('questionnaire : réponse manquante signalée, reprise, résultats accessibles', async ({ page }) => {
  await demarrer(page)
  await expect(page.getByText('Page 1 sur 6')).toBeVisible()
  await sansViolation(page)

  await page.getByRole('button', { name: /Page suivante/ }).click()
  await expect(page.getByRole('alert')).toContainText('il en manque 6')

  await repondrePage(page, 'Plutôt d’accord')
  await page.getByRole('button', { name: /Page suivante/ }).click()
  await expect(page.getByText('Page 2 sur 6')).toBeVisible()

  // Reprise après rechargement : on revient sur la page 2, la première sans réponse.
  await page.reload()
  await expect(page.getByText(/Page 2 sur 6 · 6 réponses sur 36/)).toBeVisible()

  for (let p = 2; p <= 6; p++) {
    await repondrePage(page, 'Entre les deux')
    await page.getByRole('button', { name: p < 6 ? /Page suivante/ : 'Voir mon profil' }).click()
  }

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ton profil de personnalité en 4 dimensions')
  await expect(page.getByText('Ce test donne une photo de tes préférences aujourd’hui, pas une étiquette définitive.')).toBeVisible()
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(
    ['Énergie', 'Perception', 'Décision', 'Organisation', /Tes points forts$/, /Tes points de vigilance$/])
  await sansViolation(page)

  await page.getByRole('button', { name: /Étape suivante/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pistes métiers et test de réalité')
})

test('le test de personnalité est facultatif : on peut le passer', async ({ page }) => {
  await demarrer(page)
  await expect(page.getByText(/Ce test est/)).toBeVisible()
  await page.getByRole('button', { name: /Je ne fais pas ce test/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pistes métiers et test de réalité')
})
