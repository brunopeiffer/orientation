import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  chercherEntreprises, chercherOffres, codesNaf, fusionnerEntreprises, lienAnnuaire, lienLBA, NAF, proxyConfigure, type Entreprise,
} from './alternance'
import { FAMILLES } from './metiers'

const ILLKIRCH = { nom: 'Illkirch-Graffenstaden', cp: '67400', lat: 48.524658, lon: 7.722443 }

afterEach(() => vi.unstubAllGlobals())

describe('codes d’activité (NAF)', () => {
  it('chaque famille de métiers a des codes NAF au bon format, avec un libellé', () => {
    expect(Object.keys(NAF.familles).sort()).toEqual(FAMILLES.familles.map((f) => f.id).sort())
    for (const codes of Object.values(NAF.familles)) for (const c of codes) expect(NAF.libelles[c], c).toBeTruthy()
    expect(NAF.statut).toBe('A_VALIDER')
  })

  it('réunit les codes de plusieurs familles sans doublon', () => {
    expect(codesNaf(['compta', 'paie_rh'])).toEqual(['69.20Z', '70.22Z', '78.10Z', '78.20Z'])
    expect(codesNaf([])).toEqual([])
  })
})

describe('Recherche d’entreprises', () => {
  const reponse = { results: [{ nom_complet: 'SADEC', tranche_effectif_salarie: '32', matching_etablissements: [
    { siret: '1', adresse: '1 RUE SAGLIO 67100 STRASBOURG', latitude: '48.5546', longitude: '7.7443', activite_principale: '69.20Z', etat_administratif: 'A', liste_enseignes: ['SADEC Strasbourg'] },
    { siret: '2', adresse: 'x', latitude: '48.5', longitude: '7.7', activite_principale: '69.20Z', etat_administratif: 'F' },
  ] }] }

  it('envoie seulement la commune arrondie (≈ 1 km), le rayon (50 km max) et les codes NAF', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => reponse })
    vi.stubGlobal('fetch', fetch)
    const l = await chercherEntreprises(ILLKIRCH, 100, ['compta'])
    const u = new URL(fetch.mock.calls[0][0])
    expect(u.host).toBe('recherche-entreprises.api.gouv.fr')
    expect(Object.fromEntries(u.searchParams)).toEqual({ lat: '48.52', long: '7.72', radius: '50', activite_principale: '69.20Z,70.22Z', per_page: '25' })
    expect(fetch.mock.calls[0][1]).toMatchObject({ credentials: 'omit', referrerPolicy: 'no-referrer' })
    // Établissement fermé (F) écarté ; enseigne préférée au nom légal ; libellé NAF lisible.
    expect(l).toEqual([{ siret: '1', nom: 'SADEC Strasbourg', adresse: '1 RUE SAGLIO 67100 STRASBOURG', lat: 48.5546, lon: 7.7443, activite: 'Activités comptables', recrute: false, url: null }])
  })

  it('échoue proprement si la réponse change de forme', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ resultats: [] }) }))
    await expect(chercherEntreprises(ILLKIRCH, 20, ['compta'])).rejects.toThrow()
  })
})

describe('offres en alternance et mode dégradé', () => {
  it('sans proxy configuré, aucune requête : l’app propose des liens préremplis', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    expect(proxyConfigure()).toBe(false)
    await expect(chercherOffres(ILLKIRCH, 30, ['M1203'])).rejects.toThrow(/non configuré/)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('le lien La bonne alternance est prérempli (métier, commune arrondie, rayon) et ne contient jamais de critère handicap', () => {
    const u = new URL(lienLBA('Comptable', ILLKIRCH, 150))
    expect(`${u.origin}${u.pathname}`).toBe('https://labonnealternance.apprentissage.beta.gouv.fr/recherche')
    expect(Object.fromEntries(u.searchParams)).toEqual({ q: 'Comptable', latitude: '48.52', longitude: '7.72', radius: '100', lieu_label: 'Illkirch-Graffenstaden 67400', mode: 'emplois' })
    expect(u.searchParams.has('handi')).toBe(false)
  })

  it('lien vers la fiche officielle de l’entreprise', () => {
    expect(lienAnnuaire('35146169400363')).toBe('https://annuaire-entreprises.data.gouv.fr/etablissement/35146169400363')
  })
})

describe('fusion entreprises + recruteurs', () => {
  const e = (siret: string, lat: number | null = 48.55): Entreprise => ({ siret, nom: siret, adresse: null, lat, lon: 7.74, activite: null, recrute: false, url: null })
  it('pas de doublon (même SIRET) ; les recruteurs La bonne alternance d’abord, puis par distance', () => {
    const r = fusionnerEntreprises([e('A', 48.9), e('B', 48.53), e('R')], [{ ...e('R'), url: 'https://exemple.fr' }], ILLKIRCH)
    expect(r.map((x) => [x.e.siret, x.e.recrute])).toEqual([['R', true], ['B', false], ['A', false]])
  })
  it('une entreprise sans coordonnées est gardée, en fin de liste, sans distance', () => {
    const r = fusionnerEntreprises([e('X', null), e('B')], [], ILLKIRCH)
    expect(r.map((x) => [x.e.siret, x.km])).toEqual([['B', expect.any(Number)], ['X', null]])
  })
})
