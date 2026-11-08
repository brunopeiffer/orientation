import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page, type Request } from '@playwright/test'

async function sansViolation(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([])
}

const OFFRES = {
  source: 'La bonne alternance (offres de France Travail, Indeed, Monster et d’autres partenaires)', date: '2026-11-03',
  offres: [{ id: 'o1', titre: 'Assistant comptable en alternance', entreprise: 'SADEC', siret: '111', adresse: '1 rue Saglio 67100 Strasbourg',
    lat: 48.555, lon: 7.744, contrats: ['Apprentissage'], debut: '2027-09-01T00:00:00.000Z', niveau: 'Licence, BUT', url: 'https://labonnealternance.apprentissage.beta.gouv.fr/offre/o1', partenaire: 'France Travail' }],
  recruteurs: [{ siret: '222', nom: 'Fiducial Strasbourg', adresse: '2 rue X', lat: 48.57, lon: 7.75, activite: 'Activités comptables', url: null }],
}
const FORMATIONS = {
  source: 'La bonne alternance (catalogue des formations en apprentissage du réseau des Carif-Oref)', date: '2026-11-08',
  formations: [{ id: 'f1', titre: 'Licence professionnelle gestion de la paie', organisme: 'Cnam Grand Est', ville: 'Strasbourg', lat: 48.58, lon: 7.75,
    distanciel: false, qualiopi: true, onisep: 'https://www.onisep.fr/x', debut: '2027-09-01' }],
}
const ENTREPRISES = { results: [
  { nom_complet: 'FIDUCIAL', matching_etablissements: [{ siret: '222', adresse: '2 RUE X 67000 STRASBOURG', latitude: '48.57', longitude: '7.75', activite_principale: '69.20Z', etat_administratif: 'A' }] },
  { nom_complet: 'CABINET DUPONT', matching_etablissements: [{ siret: '333', adresse: '3 RUE Y 67400 ILLKIRCH', latitude: '48.53', longitude: '7.72', activite_principale: '69.20Z', etat_administratif: 'A' }] },
] }

type Capture = { url: string; corps: string | null; entetes: Record<string, string> }

/** Étape alternance, profil « organiser » (pistes en gestion), commune choisie ; proxy et Recherche d'entreprises simulés. */
async function demarrer(page: Page, { proxy = 200, handicap = { actif: false, sujets: [] as string[] } } = {}) {
  const sortantes: Capture[] = []
  page.on('request', (r: Request) => { if (!r.url().startsWith('http://localhost')) sortantes.push({ url: r.url(), corps: r.postData(), entetes: r.headers() }) })
  await page.route('https://proxy.test/**', (route) => proxy !== 200 ? route.fulfill({ status: proxy, json: { erreur: 'non_configure' } })
    : route.fulfill({ json: route.request().url().includes('/formations?') ? FORMATIONS : OFFRES }))
  await page.route('https://recherche-entreprises.api.gouv.fr/**', (route) => route.fulfill({ json: ENTREPRISES }))
  await page.goto('/')
  await page.evaluate((handicap) => {
    const ids = ['e', 'p', 'd', 'o'].flatMap((d) => Array.from({ length: 9 }, (_, k) => `${d}${k + 1}`))
    const activites = Object.fromEntries(['r', 'i', 'a', 's', 'e', 'c'].flatMap((t) => [1, 2, 3].map((k) => [`${t}${k}`, t === 'c' ? 2 : 0])))
    const state = {
      prenom: 'Léa', publicId: 'BTS_CG', etape: 6, avertissementLu: true,
      personnalite: Object.fromEntries(ids.map((i) => [i, 3])),
      gouts: { activites, environnements: ['bureau'], valeurs: ['stabilite'], refus: [] },
      scolarite: { option: null, notes: {}, aimees: [] },
      mobilite: { commune: { nom: 'Illkirch-Graffenstaden', code: '67218', cp: '67400', lat: 48.524658, lon: 7.722443 }, rayon: 20 },
      handicap,
    }
    localStorage.setItem('orientation-etat', JSON.stringify({ state, version: 5 }))
  }, handicap)
  await page.reload()
  return sortantes
}

test('alternance : offres via le proxy, entreprises sans doublon, paramètres minimaux, accessible', async ({ page }) => {
  const sortantes = await demarrer(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Entreprises et alternance')
  expect(sortantes).toEqual([]) // rien ne part avant « Chercher »
  await sansViolation(page)

  await page.getByRole('button', { name: 'Chercher' }).click()
  await expect(page.getByRole('heading', { name: /1 offre en alternance/ })).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: 'Assistant comptable en alternance' })).toBeVisible()
  await expect(page.getByText(/Publiée via France Travail/)).toBeVisible()
  // Fiducial vient des deux sources : une seule fois, avec le badge ; puis le cabinet trouvé par Recherche d'entreprises.
  await expect(page.getByRole('heading', { name: /2 entreprises proches/ })).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: 'Fiducial Strasbourg' })).toHaveCount(1)
  await expect(page.getByText(/Susceptible de recruter en alternance/)).toHaveCount(1)
  await expect(page.getByRole('heading', { name: /1 formation en apprentissage \(bac\+3, après ton BTS\)/ })).toBeVisible()
  await expect(page.getByText(/Cnam Grand Est · Strasbourg/)).toBeVisible()
  await expect(page.getByText(/Organisme certifié Qualiopi/)).toBeVisible()
  await expect(page.getByRole('link', { name: /Fiche officielle de l’entreprise : CABINET DUPONT/ })).toHaveAttribute('href', 'https://annuaire-entreprises.data.gouv.fr/etablissement/333')
  await sansViolation(page)

  const proxy = sortantes.filter((s) => s.url.startsWith('https://proxy.test/alternance'))
  const form = sortantes.filter((s) => s.url.startsWith('https://proxy.test/formations'))
  expect(form).toHaveLength(1)
  expect([...new URL(form[0].url).searchParams.keys()].sort()).toEqual(['lat', 'lon', 'niveau', 'radius', 'romes'])
  expect(new URL(form[0].url).searchParams.get('niveau')).toBe('6')
  const ent = sortantes.filter((s) => s.url.startsWith('https://recherche-entreprises.api.gouv.fr/'))
  expect(proxy).toHaveLength(1)
  expect(ent).toHaveLength(1)
  const p = new URL(proxy[0].url)
  expect([...p.searchParams.keys()].sort()).toEqual(['lat', 'lon', 'radius', 'romes'])
  expect([p.searchParams.get('lat'), p.searchParams.get('lon'), p.searchParams.get('radius')]).toEqual(['48.52', '7.72', '20'])
  expect(p.searchParams.get('romes')).toMatch(/^[A-N]\d{4}(,[A-N]\d{4}){0,4}$/)
  expect([...new URL(ent[0].url).searchParams.keys()].sort()).toEqual(['activite_principale', 'lat', 'long', 'per_page', 'radius'])
  expect(sortantes.every((s) => s.corps === null)).toBe(true)
  expect(JSON.stringify(sortantes)).not.toMatch(/Léa/) // jamais le prénom
})

test('mode dégradé : proxy indisponible → liens préremplis vers La bonne alternance', async ({ page }) => {
  await demarrer(page, { proxy: 503 })
  await page.getByRole('button', { name: 'Chercher' }).click()
  await expect(page.getByText(/La recherche d’offres ne répond pas/)).toBeVisible()
  const lien = page.getByRole('link', { name: /^Offres « .+ » près de Illkirch-Graffenstaden/ }).first()
  const href = new URL((await lien.getAttribute('href'))!)
  expect(href.origin + href.pathname).toBe('https://labonnealternance.apprentissage.beta.gouv.fr/recherche')
  expect(href.searchParams.get('latitude')).toBe('48.52')
  expect(href.searchParams.has('handi')).toBe(false)
  await expect(page.getByRole('heading', { name: /entreprises? proches?/ })).toBeVisible() // l'autre source fonctionne toujours
})

test('handicap : opt-in, local, et absent de TOUTE requête réseau', async ({ page }) => {
  // 1. Requêtes sans module handicap.
  const sans = await demarrer(page)
  await page.getByRole('button', { name: 'Chercher' }).click()
  await expect(page.getByRole('heading', { name: /entreprises proches/ })).toBeVisible()

  // 2. Même parcours, module activé et sujets cochés dans l'interface.
  const page2 = await page.context().newPage()
  const avec = await demarrer(page2)
  await page2.getByLabel('Afficher les informations sur le handicap').check()
  await page2.getByLabel('La RQTH (reconnaissance de la qualité de travailleur handicapé)').check()
  await page2.getByLabel('L’alternance', { exact: true }).check()
  await expect(page2.getByText(/MDPH de ton département/)).toBeVisible()
  await sansViolation(page2)
  await page2.reload()
  await expect(page2.getByLabel('Afficher les informations sur le handicap')).toBeChecked() // gardé localement
  await page2.getByRole('button', { name: 'Chercher' }).click()
  await expect(page2.getByRole('heading', { name: /entreprises proches/ })).toBeVisible()

  // Aucune trace du handicap dans les URL, corps ou en-têtes ; requêtes identiques avec ou sans le module.
  expect(JSON.stringify(avec)).not.toMatch(/handi|rqth|amenagement|mdph|sujets|"etudes"|actif/i)
  expect(avec.map((s) => s.url).sort()).toEqual(sans.map((s) => s.url).sort())

  await page2.getByRole('button', { name: 'Effacer ces informations' }).click()
  await expect(page2.getByLabel('Afficher les informations sur le handicap')).not.toBeChecked()
  expect(await page2.evaluate(() => JSON.parse(localStorage.getItem('orientation-etat')!).state.handicap)).toEqual({ actif: false, sujets: [] })
})
