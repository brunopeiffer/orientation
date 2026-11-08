import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

async function sansViolation(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([])
}

/** État v6 à l'étape donnée (1 goûts, 2 résultats, 3 personnalité, 4 métiers, 5 formations, 6 alternance, 7 synthèse). */
async function poser(page: Page, etape: number, avecGouts = true) {
  await page.goto('/')
  await page.evaluate(({ etape, avecGouts }) => {
    const activites = avecGouts ? Object.fromEntries(['r', 'i', 'a', 's', 'e', 'c'].flatMap((t) => [1, 2, 3, 4, 5, 6].map((k) => [`${t}${k}`, 'ce'.includes(t) ? 2 : 0]))) : {}
    const state = {
      prenom: 'Léa', publicId: 'STMG', etape, avertissementLu: true, personnalite: {},
      gouts: { activites, environnements: ['bureau'], valeurs: ['salaire'], refus: [] },
      scolarite: { option: 'GF', notes: {}, aimees: [] },
      mobilite: { commune: { nom: 'Illkirch-Graffenstaden', code: '67218', cp: '67400', lat: 48.524658, lon: 7.722443 }, rayon: 20 },
      handicap: { actif: false, sujets: [] }, favoris: { metiers: [], formations: [] },
    }
    localStorage.setItem('orientation-etat', JSON.stringify({ state, version: 6 }))
  }, { etape, avecGouts })
  await page.reload()
}

test('favoris : un métier et une formation gardés apparaissent dans la synthèse', async ({ page }) => {
  await poser(page, 4)
  const carte = page.getByRole('listitem').filter({ has: page.getByRole('heading', { level: 2 }) }).first()
  const metier = await carte.getByRole('heading', { level: 2 }).innerText()
  await carte.getByRole('button', { name: /Garder/ }).click()
  await expect(carte.getByRole('button', { name: /Gardé/ })).toHaveAttribute('aria-pressed', 'true')
  await sansViolation(page)

  await page.getByRole('button', { name: /Étape suivante/ }).click()
  const formation = page.getByRole('listitem').filter({ has: page.getByRole('heading', { level: 3 }) }).first()
  const intitule = await formation.getByRole('heading', { level: 3 }).innerText()
  await formation.getByRole('button', { name: /Garder/ }).click()

  await page.getByText('Toutes les étapes').click()
  await page.getByRole('button', { name: /7\. Ta synthèse/ }).click()
  const favoris = page.locator('section', { has: page.getByRole('heading', { name: 'Mes favoris' }) })
  await expect(favoris).toContainText(metier)
  await expect(favoris).toContainText(intitule)
  await expect(page.getByRole('heading', { name: 'Financer tes études et te loger' })).toBeVisible()
})

test('menu des étapes : aller directement à une étape, l’étape courante est signalée', async ({ page }) => {
  await poser(page, 7)
  await page.getByText('Toutes les étapes').click()
  await expect(page.getByRole('button', { name: /7\. Ta synthèse/ })).toHaveAttribute('aria-current', 'step')
  await page.getByRole('button', { name: /2\. Tes résultats/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tes résultats (estimations)')
})

test('alternance sans goûts : on invite à remplir « Tes goûts », aucune recherche possible', async ({ page }) => {
  await poser(page, 6, false)
  await expect(page.getByText(/Réponds d’abord à l’étape « Tes goûts »/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Chercher' })).toHaveCount(0)
  await page.getByRole('button', { name: /Aller à « Tes goûts »/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tes goûts, envies et refus')
})

test('pistes : chaque piste indique les études pour y arriver', async ({ page }) => {
  await poser(page, 4)
  const carte = page.getByRole('listitem').filter({ has: page.getByRole('heading', { level: 2 }) }).first()
  await carte.getByText('Test de réalité : le métier au quotidien').click()
  await expect(carte.getByText('Les études pour y arriver')).toBeVisible()
  await expect(carte.getByText(/Par exemple : .*(BTS|BUT|Licence|DCG)/)).toBeVisible()
  // Le quotidien est propre à chaque métier (fiche ROME), pas un texte commun à la famille.
  const cartes = page.getByRole('listitem').filter({ has: page.getByRole('heading', { level: 2 }) })
  const textes: string[] = []
  for (const k of [0, 1]) {
    const c = cartes.nth(k)
    if (k > 0) await c.getByText('Test de réalité : le métier au quotidien').click() // la 1re est déjà ouverte
    await expect(c.getByText('Ce que fait ce métier')).toBeVisible()
    textes.push(await c.getByText('Ce que fait ce métier').locator('xpath=following-sibling::p[1]').innerText())
  }
  expect(textes[0]).not.toBe(textes[1])
})
