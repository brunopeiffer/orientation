import { describe, expect, it } from 'vitest'
import { chargerOffres, lienEtablissement, offresLocales, POURSUITES, sansAccent, voiesDe, type Offre } from './postbts'

const ILLKIRCH = { lat: 48.5247, lon: 7.7224 }

describe('voies de poursuite après BTS (contenu)', () => {
  it('chaque voie indique son canal de candidature, un lien officiel, une source, et si elle est hors Parcoursup', () => {
    for (const v of POURSUITES.voies) {
      expect(v.canal.length, v.id).toBeGreaterThan(20)
      expect(v.lien.url, v.id).toMatch(/^(https:\/\/|#offres-)/)
      expect(v.sources.length, v.id).toBeGreaterThan(0)
      expect(typeof v.parcoursup).toBe('boolean')
      if (!v.parcoursup) expect(v.canal, v.id).toMatch(/hors Parcoursup|directement/i)
    }
    expect(POURSUITES.statut).toBe('A_VALIDER')
  })

  it('le DCG est proposé au BTS CG, pas au NDRC ; les autres voies aux deux', () => {
    expect(voiesDe('BTS_CG').map((v) => v.id)).toContain('dcg')
    expect(voiesDe('BTS_NDRC').map((v) => v.id)).not.toContain('dcg')
    expect(voiesDe('BTS_NDRC').length).toBeGreaterThanOrEqual(6)
    expect(voiesDe('STMG')).toEqual([])
  })

  it('les mots-clés locaux sont en minuscules sans accents (comparés à des intitulés normalisés)', () => {
    for (const parType of Object.values(POURSUITES.local)) {
      for (const mots of Object.values(parType)) for (const m of mots) expect(m).toBe(sansAccent(m))
    }
  })
})

describe('offres locales', () => {
  const o = (p: Partial<Offre>): Offre => ({ k: 'LP', m: 'Commerce et distribution', p: '', e: 'Université', v: 'Strasbourg', d: 'Bas-Rhin', la: 48.5734, lo: 7.7521, w: 'abc', ...p })

  it('filtre par type, par lien avec le BTS et par rayon ; trie de la plus proche à la plus lointaine', () => {
    const offres = [
      o({ m: 'Commerce et distribution', la: 43.6, lo: 1.44, v: 'Toulouse' }),
      o({ m: 'Commerce et distribution' }),
      o({ m: 'Metiers de la gestion et de la comptabilite : comptabilite et paie' }),
      o({ k: 'DCG', m: 'Diplôme de Comptabilité et de Gestion', p: 'DCG - Diplôme de Comptabilité et de Gestion' }),
    ]
    expect(offresLocales(offres, 'LP', 'BTS_NDRC', ILLKIRCH, null).map((x) => x.o.v)).toEqual(['Strasbourg', 'Toulouse'])
    expect(offresLocales(offres, 'LP', 'BTS_NDRC', ILLKIRCH, 50)).toHaveLength(1)
    expect(offresLocales(offres, 'LP', 'BTS_CG', ILLKIRCH, 50).map((x) => x.o.m)).toEqual(['Metiers de la gestion et de la comptabilite : comptabilite et paie'])
    expect(offresLocales(offres, 'DCG', 'BTS_CG', ILLKIRCH, 50)).toHaveLength(1)
    expect(offresLocales(offres, 'DCG', 'BTS_NDRC', ILLKIRCH, null)).toEqual([])
  })

  it('les vraies données couvrent chaque type et trouvent des offres pour chaque BTS près de Strasbourg', async () => {
    const d = await chargerOffres()
    expect(d.licence).toMatch(/Licence Ouverte/)
    expect(d.sources.LP).toMatch(/\d{4}-\d{2}/)
    for (const id of ['BTS_CG', 'BTS_NDRC']) {
      expect(offresLocales(d.offres, 'LP', id, ILLKIRCH, 50).length, id).toBeGreaterThan(0)
      expect(offresLocales(d.offres, 'BUT', id, ILLKIRCH, 50).length, id).toBeGreaterThan(0)
    }
    expect(offresLocales(d.offres, 'DCG', 'BTS_CG', ILLKIRCH, 50).length).toBeGreaterThan(0)
  })

  it('chaque mot-clé local trouve au moins une offre réelle en France (pas de mot-clé mort)', async () => {
    const d = await chargerOffres()
    for (const [bts, parType] of Object.entries(POURSUITES.local)) {
      for (const [type, mots] of Object.entries(parType)) {
        for (const m of mots) {
          expect(d.offres.some((x) => x.k === type && sansAccent(`${x.m} | ${x.p}`).includes(m)), `${bts} ${type} « ${m} »`).toBe(true)
        }
      }
    }
  })

  it('le lien vers l’établissement pointe vers Paysage (ministère)', () => {
    expect(lienEtablissement('hlX1r')).toBe('https://paysage.enseignementsup-recherche.gouv.fr/structures/hlX1r')
  })
})
