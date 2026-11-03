import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

async function sansViolation(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([])
}

/** Démarre à l'étape des pistes métiers, avec un profil rempli (personnalité neutre, types d'intérêts adorés). */
async function demarrer(page: Page, publicId: string, refus: string[] = [], adores = ['e', 's']) {
  await page.goto('/')
  await page.evaluate(({ publicId, refus, adores }) => {
    const ids = ['e', 'p', 'd', 'o'].flatMap((d) => Array.from({ length: 9 }, (_, k) => `${d}${k + 1}`))
    const activites = Object.fromEntries(['r', 'i', 'a', 's', 'e', 'c'].flatMap((t) =>
      [1, 2, 3].map((k) => [`${t}${k}`, adores.includes(t) ? 2 : 0])))
    const state = {
      prenom: '', publicId, etape: 4, avertissementLu: true,
      personnalite: Object.fromEntries(ids.map((i) => [i, 3])),
      gouts: { activites, environnements: ['boutique'], valeurs: ['salaire', 'contact'], refus },
      scolarite: { option: null, notes: {}, aimees: [] },
    }
    localStorage.setItem('orientation-etat', JSON.stringify({ state, version: 3 }))
  }, { publicId, refus, adores })
  await page.reload()
}

const cartes = (page: Page) => page.getByRole('listitem').filter({ has: page.getByRole('heading', { level: 2 }) })

test('pistes métiers NDRC : 8 à 12 pistes, aucune en comptabilité, score détaillé, accessibles', async ({ page }) => {
  await demarrer(page, 'BTS_NDRC', ['objectifs_vente'])
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pistes métiers et test de réalité')
  const n = await cartes(page).count()
  expect(n).toBeGreaterThanOrEqual(8)
  expect(n).toBeLessThanOrEqual(12)
  await expect(page.getByText(/Comptabilité, gestion, finance/)).toHaveCount(0)

  const premiere = cartes(page).first()
  await premiere.getByText('Pourquoi ce score ?').click()
  for (const l of ['Tes intérêts', 'Cadre de travail et valeurs', 'Ta personnalité', 'Tes matières fortes']) {
    await expect(premiere.getByText(l)).toBeVisible()
  }
  await expect(premiere.getByText('pas assez d’infos')).toBeVisible() // matières non renseignées
  await premiere.getByText('Test de réalité : le métier au quotidien').click()
  await expect(premiere.getByText('Les contraintes')).toBeVisible()
  await expect(premiere.getByRole('link', { name: /Fiche complète sur France Travail/ })).toHaveAttribute('target', '_blank')

  await expect(page.getByText('Ce qui pourrait te freiner').first()).toBeVisible()
  await expect(page.getByText(/Licence Ouverte/)).toBeVisible()
  await sansViolation(page)
})

test('pistes métiers CG : un profil « organiser » obtient des métiers de gestion', async ({ page }) => {
  await demarrer(page, 'BTS_CG', [], ['c'])
  await expect(cartes(page).first()).toBeVisible()
  await expect(page.getByText(/Comptabilité, gestion, finance|Paie et ressources humaines/).first()).toBeVisible()
})
