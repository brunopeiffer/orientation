import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

async function sansViolation(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([])
}

/** Démarre à l'étape des poursuites (parcours BTS), commune déjà choisie : aucun appel réseau n'est nécessaire. */
async function demarrer(page: Page, publicId: string) {
  const externes: string[] = []
  page.on('request', (r) => { if (!r.url().startsWith('http://localhost')) externes.push(r.url()) })
  await page.goto('/')
  await page.evaluate((publicId) => {
    const ids = ['e', 'p', 'd', 'o'].flatMap((d) => Array.from({ length: 9 }, (_, k) => `${d}${k + 1}`))
    const state = {
      prenom: 'Sam', publicId, etape: 5, avertissementLu: true,
      personnalite: Object.fromEntries(ids.map((i) => [i, 3])),
      gouts: { activites: {}, environnements: [], valeurs: [], refus: [] },
      scolarite: { option: null, notes: {}, aimees: [] },
      mobilite: { commune: { nom: 'Illkirch-Graffenstaden', code: '67218', cp: '67400', lat: 48.5247, lon: 7.7224 }, rayon: 50 },
    }
    localStorage.setItem('orientation-etat', JSON.stringify({ state, version: 4 }))
  }, publicId)
  await page.reload()
  return externes
}

test('BTS CG : chaque voie indique son canal (hors Parcoursup affiché) et les offres proches, accessibles', async ({ page }) => {
  const externes = await demarrer(page, 'BTS_CG')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Poursuites d’études après ton BTS')

  const voies = page.getByRole('region', { name: 'Les voies possibles' }).getByRole('listitem')
  const n = await voies.count()
  expect(n).toBeGreaterThanOrEqual(7)
  for (let k = 0; k < n; k++) {
    const v = voies.nth(k)
    await expect(v.getByText(/^(Sur|Hors) Parcoursup$/)).toBeVisible()
    await expect(v.getByText('Comment candidater :')).toBeVisible()
    await expect(v.getByRole('link').first()).toBeVisible()
  }
  await expect(page.getByText('Hors Parcoursup', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: /Diplôme de comptabilité et de gestion/ })).toBeVisible()

  for (const titre of [/Licences professionnelles en lien avec ton BTS \(\d+\)/, /^DCG/, /^BUT en lien avec ton BTS/]) {
    await expect(page.getByRole('heading', { level: 3, name: titre })).toBeVisible()
  }
  await expect(page.getByRole('link', { name: /Fiche de l’établissement/ }).first()).toHaveAttribute('href', /^https:\/\/paysage\.enseignementsup-recherche\.gouv\.fr\/structures\//)
  await expect(page.getByText('estimation', { exact: true }).first()).toBeVisible()
  await sansViolation(page)
  expect(externes).toEqual([]) // données locales de l'app : rien ne sort
})

test('BTS NDRC : pas de DCG, des licences pro commerciales', async ({ page }) => {
  await demarrer(page, 'BTS_NDRC')
  await expect(page.getByRole('heading', { name: /Diplôme de comptabilité et de gestion/ })).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 3, name: /^DCG/ })).toHaveCount(0)
  const lp = page.getByRole('region', { name: /Licences professionnelles en lien avec ton BTS/ })
  await expect(lp.getByText(/commerce|commercial|marketing|clientele/i).first()).toBeVisible()
})
