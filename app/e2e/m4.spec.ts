import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

async function sansViolation(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([])
}

const COMMUNE = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [7.722443, 48.524658] },
  properties: { name: 'Illkirch-Graffenstaden', citycode: '67218', postcode: '67400', context: '67, Bas-Rhin, Grand Est' } }] }

/** Démarre à l'étape des formations (lycée), avec des goûts « organiser, convaincre » ; le géocodage IGN est simulé. */
async function demarrer(page: Page, publicId = 'STMG') {
  const requetes: URL[] = []
  await page.route('https://data.geopf.fr/**', (route) => {
    requetes.push(new URL(route.request().url()))
    return route.fulfill({ json: COMMUNE })
  })
  await page.goto('/')
  await page.evaluate((publicId) => {
    const ids = ['e', 'p', 'd', 'o'].flatMap((d) => Array.from({ length: 9 }, (_, k) => `${d}${k + 1}`))
    const activites = Object.fromEntries(['r', 'i', 'a', 's', 'e', 'c'].flatMap((t) => [1, 2, 3].map((k) => [`${t}${k}`, 'ce'.includes(t) ? 2 : 0])))
    const state = {
      prenom: 'Léa', publicId, etape: 5, avertissementLu: true,
      personnalite: Object.fromEntries(ids.map((i) => [i, 3])),
      gouts: { activites, environnements: ['bureau'], valeurs: ['salaire'], refus: [] },
      scolarite: { option: null, notes: {}, aimees: [] },
      mobilite: { commune: null, rayon: 20 },
    }
    localStorage.setItem('orientation-etat', JSON.stringify({ state, version: 4 }))
  }, publicId)
  await page.reload()
  return requetes
}

test('formations : commune, distances estimées, chances d’accès prudentes, filtres, accessibles', async ({ page }) => {
  const requetes = await demarrer(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Formations près de chez toi')
  await sansViolation(page)

  await page.getByLabel('Commune ou code postal').fill('Illkirch')
  await page.getByRole('button', { name: 'Chercher' }).click()
  await page.getByRole('button', { name: /Illkirch-Graffenstaden \(67400\)/ }).click()
  await expect(page.getByText('Ta commune :')).toContainText('Illkirch-Graffenstaden')

  // Seul le texte tapé part au géocodage : ni prénom, ni réponses.
  expect(requetes).toHaveLength(1)
  expect([...requetes[0].searchParams.keys()].sort()).toEqual(['limit', 'q', 'type'])
  expect(requetes[0].searchParams.get('q')).toBe('Illkirch')

  const titre = page.getByRole('heading', { level: 2, name: /formations? trouvées?/ })
  await expect(titre).toBeVisible()
  const n = Number((await titre.innerText()).split(' ')[0])
  expect(n).toBeGreaterThan(0)
  const premiere = page.getByRole('listitem').filter({ has: page.getByRole('heading', { level: 3 }) }).first()
  await expect(premiere.getByText('estimation')).toBeVisible()
  await expect(premiere.getByText(/Chances d’accès : non disponible|Accès|sélective/).first()).toBeVisible()
  await expect(premiere.getByText(/En lien avec tes pistes/)).toBeVisible()
  await expect(page.getByText(/vol d’oiseau × 1,3/)).toBeVisible()
  await expect(page.getByText(/Licence Ouverte/).first()).toBeVisible()
  await sansViolation(page)

  await page.getByLabel('En apprentissage (alternance) seulement').check()
  const toutesApprentissage = page.getByRole('listitem').filter({ has: page.getByRole('heading', { level: 3 }) })
  const k = await toutesApprentissage.count()
  for (let x = 0; x < k; x++) await expect(toutesApprentissage.nth(x).getByText('En apprentissage')).toBeVisible()

  // La commune et le rayon sont gardés au rechargement.
  await page.getByText('50 km', { exact: true }).click()
  await page.reload()
  await expect(page.getByText('Ta commune :')).toContainText('Illkirch-Graffenstaden')
  await expect(page.getByLabel('50 km')).toBeChecked()
})

test('la page Confidentialité liste exactement les services contactés', async ({ page }) => {
  await demarrer(page)
  await page.getByText('Confidentialité : ce qui sort de ton appareil').click()
  // Liste générée depuis config/sources.json : chaque service indique ce qui lui est envoyé, jamais le prénom.
  for (const hote of ['data.geopf.fr', 'recherche-entreprises.api.gouv.fr', 'proxy.test']) await expect(page.getByText(`(${hote})`)).toBeVisible()
  await expect(page.getByText(/Jamais ton prénom/)).toHaveCount(3)
})
