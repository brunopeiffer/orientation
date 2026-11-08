import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dedoublonner, LBA, LBA_FORMATIONS, normaliserTitre, traiter, type Deps, type Env, type Offre, type Recruteur } from './index'

const ORIGINE = 'https://exemple.github.io'
const JETON = 'jeton-de-test-pas-un-vrai'
const env = (p: Partial<Env> = {}): Env => ({ LBA_TOKEN: JETON, ALLOWED_ORIGINS: `${ORIGINE},http://localhost:5181`, ...p })
const req = (chemin: string, init: RequestInit & { origine?: string | null } = {}) => {
  const { origine = ORIGINE, ...reste } = init
  return new Request(`https://proxy.exemple/${chemin}`, { ...reste, headers: { ...(origine ? { Origin: origine } : {}), 'CF-Connecting-IP': '203.0.113.7' } })
}
const OK = 'alternance?lat=48.5247&lon=7.7224&radius=30&romes=M1213,M1203'

const job = (id: string, titre: string, siret: string, partenaire: string) => ({
  identifier: { id, partner_label: partenaire, partner_job_id: id },
  workplace: { name: 'SADEC', brand: null, legal_name: 'SADEC', siret, location: { address: '1 rue Saglio 67100 Strasbourg', geopoint: { type: 'Point', coordinates: [7.744, 48.555] } } },
  apply: { url: 'https://labonnealternance.apprentissage.beta.gouv.fr/x', phone: null },
  contract: { type: ['Apprentissage'], start: '2027-09-01T00:00:00.000Z' },
  offer: { title: titre, target_diploma: { european: '6', label: 'Licence, BUT' } },
})
const LBA_REPONSE = {
  jobs: [job('a', 'Assistant comptable H/F en alternance', '35146169400363', 'France Travail'), job('b', 'Assistant(e) comptable (F/H)', '35146169400363', 'Indeed'), job('c', 'Assistant paie', '11111111111111', 'France Travail')],
  recruiters: [
    { workplace: { name: 'SADEC', siret: '35146169400363', location: { address: 'x', geopoint: { coordinates: [7.7, 48.5] } }, domain: { naf: { code: '6920Z', label: 'Activités comptables' } } }, apply: { url: 'https://exemple.fr' } },
    { workplace: { name: 'Fiducial', siret: '22222222222222', location: { address: 'y', geopoint: { coordinates: [7.7, 48.5] } }, domain: { naf: { code: '6920Z', label: 'Activités comptables' } } }, apply: { url: 'http://pas-https.fr' } },
    { workplace: { name: 'Fiducial bis', siret: '22222222222222' } },
  ],
  warnings: [],
}

function deps(reponse: () => Response = () => Response.json(LBA_REPONSE)): Deps & { appels: string[]; entetes: Headers[] } {
  const stock = new Map<string, Response>()
  const appels: string[] = []
  const entetes: Headers[] = []
  return {
    appels, entetes,
    fetch: vi.fn(async (url: string | URL | Request, init?: RequestInit) => { appels.push(String(url)); entetes.push(new Headers(init?.headers)); return reponse() }) as unknown as typeof fetch,
    cache: { match: async (r) => stock.get(r.url)?.clone(), put: async (r, res) => { stock.set(r.url, res) } },
  }
}

let consoles: ReturnType<typeof vi.spyOn>[] = []
beforeEach(() => { consoles = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) => vi.spyOn(console, m)) })
afterEach(() => {
  for (const c of consoles) expect(c, 'le proxy ne doit rien journaliser').not.toHaveBeenCalled()
  vi.restoreAllMocks()
})

describe('CORS : seule l’app peut appeler le proxy', () => {
  it('refuse une origine inconnue ou absente, sans en-tête CORS', async () => {
    for (const origine of ['https://pirate.exemple', null]) {
      const r = await traiter(req(OK, { origine }), env(), deps())
      expect(r.status).toBe(403)
      expect(r.headers.get('Access-Control-Allow-Origin')).toBeNull()
    }
  })

  it('autorise l’origine de l’app, et répond au pré-vol', async () => {
    const r = await traiter(req(OK), env(), deps())
    expect(r.headers.get('Access-Control-Allow-Origin')).toBe(ORIGINE)
    const pre = await traiter(req(OK, { method: 'OPTIONS' }), env(), deps())
    expect(pre.status).toBe(204)
    expect(pre.headers.get('Access-Control-Allow-Methods')).toBe('GET')
  })
})

describe('paramètres et configuration', () => {
  it('refuse des paramètres invalides sans appeler La bonne alternance', async () => {
    const d = deps()
    for (const q of ['alternance?lat=abc&lon=7&radius=30&romes=M1203', 'alternance?lat=48&lon=7&radius=0&romes=M1203',
      'alternance?lat=48&lon=7&radius=30&romes=DROP', 'alternance?lat=48&lon=7&radius=30&romes=']) {
      expect((await traiter(req(q), env(), d)).status).toBe(400)
    }
    expect((await traiter(req('autre'), env(), d)).status).toBe(404)
    expect(d.appels).toEqual([])
  })

  it('sans jeton configuré : 503 « non configuré », l’app passe en mode dégradé', async () => {
    const r = await traiter(req(OK), env({ LBA_TOKEN: undefined }), deps())
    expect(r.status).toBe(503)
    expect(await r.json()).toEqual({ erreur: 'non_configure' })
  })
})

describe('appel à La bonne alternance', () => {
  it('envoie le jeton dans l’en-tête, des coordonnées arrondies, et ne renvoie jamais le jeton', async () => {
    const d = deps()
    const r = await traiter(req(OK), env(), d)
    expect(r.status).toBe(200)
    const u = new URL(d.appels[0])
    expect(`${u.origin}${u.pathname}`).toBe(LBA)
    expect(Object.fromEntries(u.searchParams)).toEqual({ latitude: '48.52', longitude: '7.72', radius: '30', romes: 'M1203,M1213' })
    expect(d.entetes[0].get('Authorization')).toBe(`Bearer ${JETON}`)
    const texte = await r.text()
    expect(texte).not.toContain(JETON)
    expect([...r.headers.values()].join(' ')).not.toContain(JETON)
  })

  it('met en cache une heure : la même recherche n’appelle La bonne alternance qu’une fois', async () => {
    const d = deps()
    await traiter(req(OK), env(), d)
    const r2 = await traiter(req('alternance?lat=48.5249&lon=7.7221&radius=30&romes=M1203,M1213'), env(), d)
    expect(r2.headers.get('X-Cache')).toBe('HIT')
    expect(d.appels).toHaveLength(1)
  })

  it('limite de débit : 429 sans appeler la source', async () => {
    const d = deps()
    const r = await traiter(req(OK), env({ LIMITEUR: { limit: async ({ key }) => ({ success: key !== '203.0.113.7' }) } }), d)
    expect(r.status).toBe(429)
    expect(r.headers.get('Retry-After')).toBe('60')
    expect(d.appels).toEqual([])
  })

  it('source en panne ou réponse inattendue : erreur propre, rien en cache', async () => {
    expect((await traiter(req(OK), env(), deps(() => new Response('x', { status: 500 })))).status).toBe(503)
    const r429 = await traiter(req(OK), env(), deps(() => new Response('x', { status: 429 })))
    expect(r429.status).toBe(503)
    expect(await r429.json()).toEqual({ erreur: 'indisponible', statut: 429 })
    const rx = await traiter(req(OK), env(), deps(() => { throw new TypeError('secret dans le message') }))
    expect(await rx.json()).toEqual({ erreur: 'indisponible', statut: 'TypeError' })
    expect((await traiter(req(OK), env(), deps(() => new Response('x', { status: 401 })))).status).toBe(502)
    const d = deps(() => Response.json({ resultats: [] }))
    expect(await (await traiter(req(OK), env(), d)).json()).toEqual({ erreur: 'reponse_inattendue' })
    await traiter(req(OK), env(), d)
    expect(d.appels).toHaveLength(2)
  })

  it('ne garde que des liens https et les champs utiles', async () => {
    const corps = await (await traiter(req(OK), env(), deps())).json() as { offres: Offre[]; recruteurs: Recruteur[]; source: string }
    expect(corps.source).toMatch(/La bonne alternance/)
    expect(corps.offres[0]).toMatchObject({ titre: 'Assistant comptable H/F en alternance', entreprise: 'SADEC', lat: 48.555, lon: 7.744, contrats: ['Apprentissage'] })
    expect(corps.recruteurs).toEqual([expect.objectContaining({ nom: 'Fiducial', url: null })])
  })
})

describe('dédoublonnage', () => {
  const o = (p: Partial<Offre>): Offre => ({ id: '1', titre: 'Commercial', entreprise: 'A', siret: '1', adresse: null, lat: null, lon: null, contrats: [], debut: null, niveau: null, url: null, partenaire: null, ...p })
  const r = (siret: string): Recruteur => ({ siret, nom: siret, adresse: null, lat: null, lon: null, activite: null, url: null })

  it('une même offre publiée par plusieurs partenaires n’apparaît qu’une fois', () => {
    const { offres } = dedoublonner([
      o({ id: '1', titre: 'Commercial(e) H/F en alternance', partenaire: 'France Travail' }),
      o({ id: '2', titre: 'Commercial en alternance (F/H)', partenaire: 'Indeed' }),
      o({ id: '3', titre: 'Commercial', siret: '2' }),
      o({ id: '4', titre: 'Assistant commercial' }),
    ], [])
    expect(offres.map((x) => x.id)).toEqual(['1', '3', '4'])
  })

  it('sans SIRET, compare le nom de l’entreprise', () => {
    expect(dedoublonner([o({ siret: null, entreprise: 'Société Générale' }), o({ id: '2', siret: null, entreprise: 'SOCIETE GENERALE' })], []).offres).toHaveLength(1)
  })

  it('une entreprise qui a déjà une offre ou apparaît deux fois n’est listée qu’une fois', () => {
    expect(dedoublonner([o({})], [r('1'), r('2'), r('2')]).recruteurs.map((x) => x.siret)).toEqual(['2'])
  })

  it('normalise les titres', () => {
    expect(normaliserTitre('Assistant(e) Comptable H/F en Alternance')).toBe(normaliserTitre('assistant comptable (f/h)'))
  })
})

describe('formations en apprentissage', () => {
  const formation = (id: string, titre: string, enseigne: string) => ({
    identifiant: { cle_ministere_educatif: id },
    certification: { valeur: { intitule: { cfd: { court: 'X', long: titre }, rncp: null } } },
    formateur: { organisme: { etablissement: { enseigne }, unite_legale: { raison_sociale: 'CNAM' }, renseignements_specifiques: { qualiopi: true } } },
    lieu: { adresse: { commune: { nom: 'Strasbourg' } }, geolocalisation: { type: 'Point', coordinates: [7.75, 48.58] } },
    modalite: { entierement_a_distance: false }, onisep: { url: 'https://www.onisep.fr/x', lien_site_onisepfr: null, intitule: null },
    sessions: [{ debut: '2027-09-01', fin: '2028-07-01' }],
  })
  const REPONSE = { data: [formation('a', 'Licence pro commerce', 'Cnam Grand Est'), formation('b', 'Licence pro commerce', 'Cnam Grand Est'), { identifiant: {} }], pagination: {} }
  const F = OK.replace('alternance?', 'formations?')

  it('appelle la recherche de formations de niveau 6 avec la clé, garde l’utile, une fois par formation', async () => {
    const d = deps(() => Response.json(REPONSE))
    const r = await traiter(req(F), env(), d)
    expect(r.status).toBe(200)
    const u = new URL(d.appels[0])
    expect(`${u.origin}${u.pathname}`).toBe(LBA_FORMATIONS)
    expect(u.searchParams.get('target_diploma_level')).toBe('6')
    expect(d.entetes[0].get('Authorization')).toBe(`Bearer ${JETON}`)
    const corps = await r.json()
    expect(corps.formations).toEqual([{ id: 'a', titre: 'Licence pro commerce', organisme: 'Cnam Grand Est', ville: 'Strasbourg', lat: 48.58, lon: 7.75,
      distanciel: false, qualiopi: true, onisep: 'https://www.onisep.fr/x', debut: '2027-09-01' }])
    expect(JSON.stringify(corps)).not.toContain(JETON)
  })

  it('cache distinct des offres d’emploi ; réponse inattendue : erreur propre', async () => {
    const d = deps(() => Response.json(REPONSE))
    await traiter(req(F), env(), d)
    await traiter(req(OK), env(), deps())
    expect((await traiter(req(F), env(), d)).headers.get('X-Cache')).toBe('HIT')
    expect((await traiter(req(F), env(), deps(() => Response.json({ jobs: [] })))).status).toBe(502)
    expect((await traiter(req(`${F}&niveau=9`), env(), deps())).status).toBe(400)
    const d5 = deps(() => Response.json(REPONSE))
    await traiter(req(`${F}&niveau=5`), env(), d5)
    expect(new URL(d5.appels[0]).searchParams.get('target_diploma_level')).toBe('5')
  })
})

it('le code du proxy ne contient aucun appel à console (aucun journal de paramètres)', () => {
  expect(readFileSync(new URL('./index.ts', import.meta.url), 'utf8')).not.toMatch(/console\./)
})
