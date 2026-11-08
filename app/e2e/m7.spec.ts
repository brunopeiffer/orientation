import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']
async function sansViolation(page: Page, etiquette: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`), etiquette).toEqual([])
}

const COMMUNE = { nom: 'Illkirch-Graffenstaden', code: '67218', cp: '67400', lat: 48.524658, lon: 7.722443 }

/** État complet (tous les écrans remplis) pour le public donné, à l'étape donnée. */
async function poser(page: Page, publicId: string, etape: number, commune: typeof COMMUNE | null = COMMUNE) {
  await page.evaluate(({ publicId, etape, commune }) => {
    const ids = ['e', 'p', 'd', 'o'].flatMap((d) => Array.from({ length: 9 }, (_, k) => `${d}${k + 1}`))
    const activites = Object.fromEntries(['r', 'i', 'a', 's', 'e', 'c'].flatMap((t) => [1, 2, 3].map((k) => [`${t}${k}`, 'ce'.includes(t) ? 2 : 0])))
    const state = {
      prenom: 'Léa', publicId, etape, avertissementLu: true,
      personnalite: Object.fromEntries(ids.map((i) => [i, i.startsWith('e') ? 5 : 3])),
      gouts: { activites, environnements: ['bureau'], valeurs: ['salaire', 'contact'], refus: ['objectifs_vente'] },
      scolarite: { option: publicId === 'STMG' ? 'MER' : null, notes: {}, aimees: [] },
      mobilite: { commune, rayon: 20 },
      handicap: { actif: true, sujets: ['rqth'] },
    }
    localStorage.setItem('orientation-etat', JSON.stringify({ state, version: 5 }))
  }, { publicId, etape, commune })
  await page.reload()
}

test.describe('synthèse imprimable', () => {
  test('impression A4 : navigation masquée, texte lisible, 3 pages au plus, jamais le handicap', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'le PDF se génère une fois, sur le projet ordinateur')
    await page.goto('/')
    await poser(page, 'STMG', 7)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ma synthèse d’orientation – Léa')
    await expect(page).toHaveTitle(/Ta synthèse et ton plan d’action – étape 7 sur 7/)
    await sansViolation(page, 'synthèse')

    await page.emulateMedia({ media: 'print' })
    for (const masque of [page.getByRole('navigation', { name: 'Progression' }), page.getByRole('button', { name: /Imprimer/ }),
      page.getByRole('button', { name: 'Étape précédente' }), page.getByRole('region', { name: 'Sauvegarde de tes réponses' })]) {
      await expect(masque).toBeHidden()
    }
    await expect(page.getByRole('heading', { name: 'Mes 5 premières pistes métiers' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Mon plan d’action' })).toBeVisible()
    const taille = await page.locator('main li').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    expect(taille).toBeGreaterThanOrEqual(13) // ≈ 10 pt au moins
    expect(await page.locator('main').innerText()).not.toMatch(/handicap|RQTH|MDPH/)

    const pdf = await page.pdf({ format: 'A4', printBackground: false })
    const pages = pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []
    expect(pages.length).toBeGreaterThanOrEqual(1)
    expect(pages.length).toBeLessThanOrEqual(3)
  })
})

test.describe('accessibilité (RGAA / WCAG 2.2 AA)', () => {
  test('navigation au clavier : lien d’évitement, accueil complet, focus visible, titre de page', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'parcours clavier testé sur ordinateur')
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    await page.keyboard.press('Tab') // y compris sur macOS, où Tab saute les liens sans tabIndex explicite
    const evitement = page.getByRole('link', { name: 'Aller au contenu' })
    await expect(evitement).toBeFocused()
    await expect(evitement).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page.locator('#contenu')).toBeFocused()

    await page.keyboard.press('Tab')
    await page.keyboard.press('Space') // premier choix du groupe : Terminale STMG
    await expect(page.getByLabel('Terminale STMG')).toBeChecked()
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/Ton prénom/)).toBeFocused()
    await page.keyboard.type('Léa')
    for (let k = 0; k < 15 && !(await page.getByRole('button', { name: /C’est parti/ }).evaluate((b) => b === document.activeElement)); k++) {
      await page.keyboard.press('Tab')
    }
    const contour = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle)
    expect(contour).not.toBe('none') // focus visible (WCAG 2.4.7)
    await page.keyboard.press('Enter')

    await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
    await expect(page).toHaveTitle(/Tes goûts, envies et refus – étape 1 sur 7 – Mon orientation/)
    await page.keyboard.press('Tab')
    await page.keyboard.press('Space') // répondre à la première question au clavier
    await expect(page.locator('fieldset').first().locator('input:checked')).toHaveCount(1)
  })

  for (const publicId of ['STMG', 'BTS_NDRC', 'BTS_SAM']) {
    test(`${publicId} : toutes les étapes sans violation axe et sans défilement horizontal à 320 px`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 }) // WCAG 1.4.10 : contenu lisible sans défilement horizontal
      await page.goto('/')
      for (let etape = 0; etape <= 7; etape++) {
        await poser(page, publicId, etape)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await page.waitForLoadState('networkidle')
        await sansViolation(page, `${publicId} étape ${etape}`)
        const debord = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(debord, `${publicId} étape ${etape}`).toBeLessThanOrEqual(1)
      }
    })
  }
})

test('audit confidentialité : requêtes réseau ⊆ liste de la page Confidentialité, aucun cookie, un seul stockage', async ({ page, context }) => {
  const hotes = new Set<string>()
  page.on('request', (r) => { const u = new URL(r.url()); if (u.hostname !== 'localhost') hotes.add(u.host) })
  await page.route('https://data.geopf.fr/**', (r) => r.fulfill({ json: { features: [{ geometry: { coordinates: [COMMUNE.lon, COMMUNE.lat] },
    properties: { name: COMMUNE.nom, citycode: COMMUNE.code, postcode: COMMUNE.cp, context: '67, Bas-Rhin, Grand Est' } }] } }))
  await page.route('https://recherche-entreprises.api.gouv.fr/**', (r) => r.fulfill({ json: { results: [] } }))
  await page.route('https://proxy.test/**', (r) => r.fulfill({ json: { source: 'La bonne alternance', date: '2026-11-04', offres: [], recruteurs: [] } }))

  // Parcours complet, avec toutes les fonctions qui peuvent contacter un service.
  await page.goto('/')
  await poser(page, 'STMG', 5, null)
  await page.getByLabel('Commune ou code postal').fill('Illkirch')
  await page.getByRole('button', { name: 'Chercher' }).click()
  await page.getByRole('button', { name: /Illkirch-Graffenstaden \(67400\)/ }).click()
  await expect(page.getByRole('heading', { name: /formations? trouvées?/ })).toBeVisible()
  await page.getByRole('button', { name: /Étape suivante/ }).click()
  await page.getByRole('button', { name: 'Chercher' }).click()
  await expect(page.getByRole('heading', { name: /offres? en alternance/ })).toBeVisible()
  await page.getByRole('button', { name: /Étape suivante/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Ma synthèse/)
  await poser(page, 'BTS_CG', 5)
  await expect(page.getByRole('heading', { name: /Licences professionnelles/ })).toBeVisible()

  await page.getByText('Confidentialité : ce qui sort de ton appareil').click()
  const listes = (await page.getByRole('region', { name: 'Sauvegarde de tes réponses' }).locator('xpath=..').innerText()).match(/\(([a-z0-9.-]+\.[a-z]{2,})\)/g)!
    .map((x) => x.slice(1, -1))
  expect(new Set(listes)).toEqual(new Set(['data.geopf.fr', 'recherche-entreprises.api.gouv.fr', 'proxy.test']))
  expect([...hotes].every((h) => listes.includes(h)), [...hotes].join(', ')).toBe(true)
  expect(hotes.size).toBe(3) // les trois services ont bien été sollicités, et rien d'autre

  expect(await context.cookies()).toEqual([])
  expect(await page.evaluate(() => [Object.keys(localStorage), Object.keys(sessionStorage)])).toEqual([['orientation-etat'], []])
})
