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

  // Les activités sont sur deux parties ; on adore les 6 activités « Convaincre ».
  for (let partie = 0; partie < 2; partie++) {
    const activites = page.locator('fieldset')
    for (let k = 0; k < (await activites.count()); k++) {
      const texte = await activites.nth(k).locator('legend').innerText()
      await activites.nth(k).getByText(/convaincre|diriger|lancer|négocier|événement|la parole/i.test(texte) ? 'J’adore' : 'Pas pour moi', { exact: true }).click()
    }
    if (partie === 0) await page.getByRole('button', { name: /Partie suivante/ }).click()
  }
  await expect(page.getByText(/Convaincre \(100 \/ 100\)/)).toBeVisible()

  await page.getByRole('button', { name: /Partie suivante/ }).click()
  for (const v of ['Bien gagner ma vie', 'Être autonome', 'Travailler en équipe']) await page.getByLabel(v).check()
  await expect(page.getByText('3 sur 3 choisies')).toBeVisible()
  await expect(page.getByLabel('Être utile aux autres')).toBeDisabled()
  await page.getByRole('button', { name: /Partie suivante/ }).click()
  await expect(page.getByText('Partie 4 sur 4')).toBeVisible()
  await page.getByLabel('Rester debout toute la journée').check()

  await page.reload()
  for (let k = 0; k < 2; k++) await page.getByRole('button', { name: /Partie suivante/ }).click()
  await expect(page.getByLabel('Travailler en équipe')).toBeChecked()
  await page.getByRole('button', { name: /Partie suivante/ }).click()
  await expect(page.getByLabel('Rester debout toute la journée')).toBeChecked()
  await sansViolation(page)
})

test('résultats scolaires : tranches, matières aimées et points d’appui', async ({ page }) => {
  await demarrer(page, 'STMG')
  for (let k = 0; k < 3; k++) await page.getByRole('button', { name: /Partie suivante/ }).click()
  await page.getByRole('button', { name: /Étape suivante/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tes résultats (estimations)')

  await page.getByLabel('Mercatique (marketing)').check()
  // On touche la case comme un élève (le bouton radio lui-même est masqué sous son libellé).
  await page.getByRole('group', { name: 'Droit et économie' }).getByText('14 à 16').click()
  await page.getByRole('group', { name: 'Mathématiques' }).getByText('8 à 10').click()
  await expect(page.getByLabel('14 à 16 en Droit et économie', { exact: true })).toBeChecked()
  await expect(page.getByText('2 matière(s) renseignée(s)')).toBeVisible()
  await page.getByLabel('J’aime cette matière : Histoire-géographie').check()
  const appui = page.getByRole('region', { name: /Tes points d’appui/ })
  await expect(appui.getByRole('listitem')).toHaveText(['Droit et économie', 'Histoire-géographie'])
  await sansViolation(page)
})

test('les matières suivent le public : pas de comptabilité en NDRC', async ({ page }) => {
  await demarrer(page, 'BTS_NDRC')
  for (let k = 0; k < 3; k++) await page.getByRole('button', { name: /Partie suivante/ }).click()
  await page.getByRole('button', { name: /Étape suivante/ }).click()
  await expect(page.getByRole('group', { name: 'Relation client et négociation-vente' })).toBeVisible()
  await expect(page.getByText(/Comptabilité|Fiscalité/)).toHaveCount(0)
})
