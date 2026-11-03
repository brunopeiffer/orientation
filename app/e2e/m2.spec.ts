import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

async function sansViolation(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([])
}

/** Démarre directement à l'étape des goûts (test de personnalité déjà rempli). */
async function demarrer(page: Page, publicId: string) {
  await page.goto('/')
  await page.evaluate((publicId) => {
    const ids = ['e', 'p', 'd', 'o'].flatMap((d) => Array.from({ length: 9 }, (_, k) => `${d}${k + 1}`))
    const state = {
      prenom: '', publicId, etape: 2, avertissementLu: true,
      personnalite: Object.fromEntries(ids.map((i) => [i, 3])),
      gouts: { activites: {}, environnements: [], valeurs: [], refus: [] },
      scolarite: { option: null, notes: {}, aimees: [] },
    }
    localStorage.setItem('orientation-etat', JSON.stringify({ state, version: 3 }))
  }, publicId)
  await page.reload()
}

test('goûts : intérêts dominants, 3 valeurs au maximum, reprise après rechargement', async ({ page }) => {
  await demarrer(page, 'STMG')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tes goûts, envies et refus')
  await sansViolation(page)

  const activites = page.locator('fieldset')
  for (let k = 0; k < (await activites.count()); k++) {
    const texte = await activites.nth(k).locator('legend').innerText()
    await activites.nth(k).getByText(/convaincre|diriger|lancer/i.test(texte) ? 'J’adore' : 'Pas pour moi', { exact: true }).click()
  }
  await expect(page.getByText(/Convaincre \(100 \/ 100\)/)).toBeVisible()

  for (const v of ['Bien gagner ma vie', 'Être autonome', 'Travailler en équipe']) await page.getByLabel(v).check()
  await expect(page.getByText('3 sur 3 choisies')).toBeVisible()
  await expect(page.getByLabel('Être utile aux autres')).toBeDisabled()
  await page.getByLabel('Rester debout toute la journée').check()

  await page.reload()
  await expect(page.getByLabel('Travailler en équipe')).toBeChecked()
  await expect(page.getByLabel('Rester debout toute la journée')).toBeChecked()
  await sansViolation(page)
})

test('résultats scolaires : tranches, matières aimées et points d’appui', async ({ page }) => {
  await demarrer(page, 'STMG')
  await page.getByRole('button', { name: /Étape suivante/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tes résultats (estimations)')

  await page.getByLabel('Mercatique (marketing)').check()
  await page.getByLabel('Droit et économie', { exact: true }).selectOption({ label: '14 à 16' })
  await page.getByLabel('Mathématiques', { exact: true }).selectOption({ label: '8 à 10' })
  await page.getByLabel('J’aime : Histoire-géographie').check()
  const appui = page.getByRole('region', { name: /Tes points d’appui/ })
  await expect(appui.getByRole('listitem')).toHaveText(['Droit et économie', 'Histoire-géographie'])
  await sansViolation(page)
})

test('les matières suivent le public : pas de comptabilité en NDRC', async ({ page }) => {
  await demarrer(page, 'BTS_NDRC')
  await page.getByRole('button', { name: /Étape suivante/ }).click()
  await expect(page.getByLabel('Relation client et négociation-vente', { exact: true })).toBeVisible()
  await expect(page.getByText(/Comptabilité|Fiscalité/)).toHaveCount(0)
})
