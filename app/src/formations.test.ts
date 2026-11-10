import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  acces, categorie, chargerPortes, etudesPour, chargerRegion, portesAVenir, COEF_DETOUR, distanceRoute, familles, filtrer, INDEX, LIENS, regionsUtiles, volOiseau, type Formation,
} from './formations'
import { chercherCommunes } from './geocodage'
import { FAMILLES } from './metiers'
import { obtenirJson, SOURCES } from './net'

const STRASBOURG = { lat: 48.5734, lon: 7.7521 }
const COLMAR = { lat: 48.0794, lon: 7.3585 }
const f = (p: Partial<Formation> = {}): Formation => ({
  i: '1', n: 'BTS - Comptabilité et gestion', p: [], t: 'BTS - BTSA - BTSM', e: 'Lycée', v: 'Colmar', d: 'Haut-Rhin',
  la: COLMAR.lat, lo: COLMAR.lon, pu: true, a: false, h: false, f: 'https://dossier.parcoursup.fr/x', ...p,
})

describe('distances', () => {
  it('vol d’oiseau Strasbourg–Colmar ≈ 63 km, distance route estimée = × 1,3', () => {
    expect(volOiseau(STRASBOURG, COLMAR)).toBeGreaterThan(60)
    expect(volOiseau(STRASBOURG, COLMAR)).toBeLessThan(66)
    expect(distanceRoute(STRASBOURG, COLMAR)).toBe(Math.round(volOiseau(STRASBOURG, COLMAR) * COEF_DETOUR))
  })

  it('ne charge que les régions à portée ; toutes si « partout en France »', () => {
    const proches = regionsUtiles(STRASBOURG, 50)
    expect(proches).toContain('grand-est')
    expect(proches).not.toContain('bretagne')
    expect(regionsUtiles(STRASBOURG, null)).toHaveLength(INDEX.regions.length)
  })
})

describe('chances d’accès (fourchette prudente)', () => {
  it('non disponible sans statistiques ou avec trop peu de candidats techno : jamais de chiffre inventé', () => {
    expect(acces(f()).niveau).toBeNull()
    expect(acces(f({ s: { tx: 80, bt: 6, pc: 2, pbt: 6, cap: 30 } })).detail).toMatch(/Trop peu/)
  })

  it('fourchettes selon la part de candidats techno ayant reçu une proposition, avec la session', () => {
    const niveau = (pbt: number) => acces(f({ s: { tx: 50, bt: 100, pc: 0, pbt, cap: 30 } })).niveau
    expect([niveau(90), niveau(60), niveau(30), niveau(5)]).toEqual(['large', 'assez_large', 'selective', 'tres_selective'])
    expect(acces(f({ s: { tx: 50, bt: 100, pc: 0, pbt: 120, cap: 30 } })).niveau).toBe('large') // plafonné à 100 %
    expect(acces(f({ s: { tx: 50, bt: 100, pc: 0, pbt: 30, cap: 30 } })).detail).toContain(INDEX.session)
  })

  it('compte les candidats des deux phases : des propositions de phase complémentaire ne gonflent pas l’accès', () => {
    // 20 candidats en phase principale, 20 en complémentaire, 20 propositions : 1 sur 2, pas « accès large ».
    expect(acces(f({ s: { tx: 50, bt: 20, pc: 20, pbt: 20, cap: 30 } })).niveau).toBe('assez_large')
    expect(acces(f({ s: { tx: 50, bt: 20, pc: 20, pbt: 20, cap: 30 } })).detail).toContain('20 propositions pour 40 candidats')
    expect(acces(f({ s: { tx: 50, bt: 8, pc: 4, pbt: 6, cap: 30 } })).niveau).toBe('assez_large') // 12 candidats : assez pour une tendance
  })
})

describe('catégories et liens avec les pistes', () => {
  it('classe les formations par grande catégorie', () => {
    expect(categorie(f())).toBe('BTS')
    expect(categorie(f({ n: 'BUT - Business développement et management de la relation client', t: 'BUT' }))).toBe('BUT')
    expect(categorie(f({ n: 'L1 - Droit', t: 'Licence' }))).toBe('Licence')
    expect(categorie(f({ n: 'Formation des écoles de commerce et de management Bac + 3', t: 'Formations des écoles de commerce et de management' }))).toBe('Écoles')
    expect(categorie(f({ n: 'DCG - Diplôme de Comptabilité et de Gestion', t: 'DCG' }))).toBe('Autres')
  })

  it('relie les formations aux familles de métiers par leur intitulé', () => {
    expect(familles(f())).toEqual(expect.arrayContaining(['compta', 'paie_rh']))
    expect(familles(f({ n: 'BTS - Négociation et digitalisation de la Relation Client' }))).toContain('vente_b2b')
    expect(familles(f({ n: 'BTS - Electrotechnique' }))).toEqual([])
    // Un BUT à l'ancien nom est relié grâce à ses parcours (fl) : « BUT - Business développement… ».
    expect(familles(f({ n: 'BUT - Techniques de commercialisation', p: ['BUT - Business développement et management de la relation client'] }))).toContain('banque')
  })

  it('donne pour chaque famille des études lisibles (« BTS Banque », « Licence Droit »)', () => {
    expect(etudesPour('banque')).toContain('BTS Banque')
    expect(etudesPour('juridique')).toEqual(expect.arrayContaining(['BTS Collaborateur juriste notarial', 'Licence Droit']))
    for (const f of FAMILLES.familles) expect(etudesPour(f.id).length, f.id).toBeGreaterThan(0)
  })

  it('chaque famille de métiers a des formations liées, et seulement des familles connues', () => {
    const ids = FAMILLES.familles.map((x) => x.id).sort()
    expect(Object.keys(LIENS.familles).sort()).toEqual(ids)
    expect(LIENS.statut).toBe('A_VALIDER')
  })

  it('chaque famille trouve au moins une formation réelle dans le Grand Est', async () => {
    const ge = await chargerRegion('grand-est')
    for (const id of Object.keys(LIENS.familles)) expect(ge.some((x) => familles(x).includes(id)), id).toBe(true)
  })
})

describe('filtres', () => {
  const tout = { rayon: null, categories: ['BTS', 'BUT', 'Licence', 'Écoles', 'Autres'] as const, enLien: null, alternance: false, recherche: '' }
  const liste = [f({ i: 'loin', la: 43.6, lo: 1.44, v: 'Toulouse' }), f(), f({ i: 'app', a: true, n: 'BTS - Electrotechnique' })]

  it('trie de la plus proche à la plus lointaine et applique le rayon', () => {
    expect(filtrer(liste, STRASBOURG, { ...tout, categories: [...tout.categories] }).map((r) => r.f.i)).toEqual(['1', 'app', 'loin'])
    expect(filtrer(liste, STRASBOURG, { ...tout, categories: [...tout.categories], rayon: 100 }).map((r) => r.f.i)).toEqual(['1', 'app'])
  })

  it('filtre l’apprentissage, les pistes et la recherche texte', () => {
    const c = [...tout.categories]
    expect(filtrer(liste, STRASBOURG, { ...tout, categories: c, alternance: true }).map((r) => r.f.i)).toEqual(['app'])
    expect(filtrer(liste, STRASBOURG, { ...tout, categories: c, enLien: ['compta'] }).map((r) => r.f.i)).toEqual(['1', 'loin'])
    expect(filtrer(liste, STRASBOURG, { ...tout, categories: c, recherche: 'toulouse' }).map((r) => r.f.i)).toEqual(['loin'])
  })
})

describe('réseau', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('seules les sources de config/sources.json sont autorisées, en HTTPS', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    await expect(obtenirJson('https://exemple.com/x')).rejects.toThrow(/refusé/)
    await expect(obtenirJson('http://data.geopf.fr/x')).rejects.toThrow(/refusé/)
    expect(fetch).not.toHaveBeenCalled()
    // Sans VITE_PROXY_URL (tests), le proxy n'est ni autorisé ni affiché.
    expect(SOURCES.map((s) => s.hote)).toEqual(['data.geopf.fr', 'recherche-entreprises.api.gouv.fr'])
  })

  it('la recherche de commune n’envoie que le texte tapé, sans cookie ni référent', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [
      { geometry: { coordinates: [7.7224, 48.5247] }, properties: { name: 'Illkirch-Graffenstaden', citycode: '67218', postcode: '67400', context: '67, Bas-Rhin, Grand Est' } },
    ] }) })
    vi.stubGlobal('fetch', fetch)
    const [c] = await chercherCommunes(' Illkirch ')
    expect(c).toMatchObject({ nom: 'Illkirch-Graffenstaden', code: '67218', cp: '67400', lat: 48.5247, lon: 7.7224 })
    const [url, init] = fetch.mock.calls[0]
    expect([...new URL(url).searchParams.keys()].sort()).toEqual(['limit', 'q', 'type'])
    expect(new URL(url).searchParams.get('q')).toBe('Illkirch')
    expect(init).toMatchObject({ credentials: 'omit', referrerPolicy: 'no-referrer' })
  })

  it('accepte l’apostrophe typographique des téléphones (« L’Isle-Adam ») et envoie une apostrophe simple', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [] }) })
    vi.stubGlobal('fetch', fetch)
    await chercherCommunes('L’Isle-Adam')
    expect(new URL(fetch.mock.calls[0][0]).searchParams.get('q')).toBe("L'Isle-Adam")
  })

  it('refuse une recherche invalide sans rien envoyer', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    for (const q of ['a', '<script>', 'x'.repeat(61)]) await expect(chercherCommunes(q)).rejects.toThrow()
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('portes ouvertes (Onisep)', () => {
  it('seulement les dates à venir de l’établissement, au plus deux', async () => {
    const p = { source: 's', licence: 'ODbL', genere: '2026-11-10', jpo: { '0670001A': [
      { debut: '2026-10-01', fin: '2026-10-01', texte: 'passée', lien: null },
      { debut: '2026-11-28', fin: '2026-11-28', texte: 'le 28/11/2026', lien: null },
      { debut: '2027-01-12', fin: '2027-01-15', texte: 'du 12/01/2027 au 15/01/2027', lien: null },
      { debut: '2027-02-06', fin: '2027-02-06', texte: 'le 06/02/2027', lien: null },
    ] } }
    expect(portesAVenir(p, '0670001A', '2026-11-10').map((j) => j.texte)).toEqual(['le 28/11/2026', 'du 12/01/2027 au 15/01/2027'])
    expect(portesAVenir(p, '9999999Z', '2026-11-10')).toEqual([])
    expect(portesAVenir(p, null, '2026-11-10')).toEqual([])
    expect(Object.keys((await chargerPortes()).jpo).length).toBeGreaterThan(500) // données réelles validées par le schéma
  })
})
