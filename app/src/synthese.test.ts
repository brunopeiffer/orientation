import { describe, expect, it } from 'vitest'
import { GOUTS, MATIERES } from './gouts'
import { ETAT_INITIAL, type Etat } from './schema'
import { PLAN, synthese } from './synthese'
import { TEST } from './personnalite'

const complet: Etat = {
  ...ETAT_INITIAL,
  prenom: 'Léa', publicId: 'STMG', etape: 7, avertissementLu: true,
  personnalite: Object.fromEntries(TEST.items.map((i) => [i.id, i.dimension === 'energie' ? (i.pole === 'B' ? 5 : 1) : 3])),
  gouts: { activites: Object.fromEntries(GOUTS.activites.map((a) => [a.id, a.type === 'C' ? 2 : 0])), environnements: ['bureau'], valeurs: ['salaire'], refus: ['objectifs_vente'] },
  scolarite: { option: 'MER', notes: { droit_eco: '14a16' }, aimees: ['lva'] },
  mobilite: { commune: { nom: 'Illkirch-Graffenstaden', code: '67218', cp: '67400', lat: 48.52, lon: 7.72 }, rayon: 20 },
  handicap: { actif: true, sujets: ['rqth', 'alternance'] },
}

describe('synthèse imprimable', () => {
  it('ne contient JAMAIS la donnée handicap, même quand le module est activé', () => {
    const texte = JSON.stringify(synthese(complet))
    expect(texte).not.toMatch(/handi|rqth|mdph|agefiph|aménagement/i)
    expect(Object.keys(synthese(complet))).not.toContain('handicap')
  })

  it('reprend le profil avec des libellés lisibles, pas des identifiants', () => {
    const s = synthese(complet, new Date('2026-11-04T12:00:00Z'))
    expect(s).toMatchObject({ prenom: 'Léa', public: 'Terminale STMG', date: '4 novembre 2026' })
    expect(s.personnalite!.find((p) => p.dimension === 'Énergie')!.resume).toMatch(/Avec les autres.*très marquée/)
    expect(s.interets).toEqual(['Organiser'])
    expect(s.environnements).toEqual(['Dans un bureau'])
    expect(s.refus).toEqual(['Avoir des objectifs de vente à atteindre'])
    expect(s.matieresFortes).toEqual(expect.arrayContaining(['Droit et économie', MATIERES.publics.STMG.matieres.find((m) => m.id === 'lva')!.libelle]))
    expect(s.mobilite).toEqual({ commune: 'Illkirch-Graffenstaden', rayon: 20 })
  })

  it('5 pistes métiers au plus, avec leurs freins, et le plan d’action du parcours', () => {
    const s = synthese(complet)
    expect(s.pistes.length).toBeGreaterThan(0)
    expect(s.pistes.length).toBeLessThanOrEqual(5)
    expect(s.pistes.every((p) => /^[A-N]\d{4}$/.test(p.code) && p.score >= 0 && p.score <= 100)).toBe(true)
    expect(s.plan).toEqual(PLAN.lycee)
    expect(synthese({ ...complet, publicId: 'BTS_NDRC' }).plan).toEqual(PLAN.bts)
  })

  it('profil incomplet : rien n’est inventé', () => {
    const s = synthese({ ...ETAT_INITIAL, publicId: 'BTS_CG' })
    expect(s.personnalite).toBeNull()
    expect(s.pistes).toEqual([])
    expect([s.interets, s.environnements, s.valeurs, s.refus, s.matieresFortes]).toEqual([[], [], [], [], []])
    expect(s.mobilite).toBeNull()
  })

  it('le plan d’action est à valider et ne contient que des liens https', () => {
    expect(PLAN.statut).toBe('A_VALIDER')
    for (const e of [...PLAN.lycee, ...PLAN.bts]) if (e.lien) expect(e.lien.url).toMatch(/^https:\/\//)
  })
})
