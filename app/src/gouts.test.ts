import { describe, expect, it } from 'vitest'
import { dominants, GOUTS, interets, MATIERES, matieresDe, matieresFortes, SCOLARITE_VIDE } from './gouts'
import { PUBLICS_ACTIFS } from './schema'

const toutes = (f: (type: string) => number) => Object.fromEntries(GOUTS.activites.map((a) => [a.id, f(a.type)]))

describe('contenu des goûts', () => {
  it('6 activités par type d’intérêt (fiabilité), ids uniques, types alternés', () => {
    for (const t of GOUTS.types) expect(GOUTS.activites.filter((a) => a.type === t.id)).toHaveLength(6)
    expect(new Set(GOUTS.activites.map((a) => a.id)).size).toBe(GOUTS.activites.length)
    GOUTS.activites.slice(1).forEach((a, k) => expect(a.type).not.toBe(GOUTS.activites[k].type))
  })

  it('ids uniques dans chaque liste de choix', () => {
    for (const l of [GOUTS.environnements, GOUTS.valeurs, GOUTS.refus]) expect(new Set(l.map((x) => x.id)).size).toBe(l.length)
  })

  it('reste lisible : 15 mots maximum par libellé', () => {
    const textes = [...GOUTS.activites.map((a) => a.texte), ...[GOUTS.environnements, GOUTS.valeurs, GOUTS.refus].flat().map((x) => x.libelle)]
    for (const t of textes) expect(t.split(/\s+/).length, t).toBeLessThanOrEqual(15)
  })

  it('contenu et matières marqués à valider par un humain', () => {
    expect(GOUTS.statut).toBe('A_VALIDER')
    expect(MATIERES.statut).toBe('A_VALIDER')
  })
})

describe('matières par public', () => {
  it('chaque public actif a sa liste de matières', () => {
    for (const p of PUBLICS_ACTIFS) expect(matieresDe(p.id)?.matieres.length, p.id).toBeGreaterThan(0)
  })

  it('pas de comptabilité proposée en NDRC, ni de négociation en CG', () => {
    expect(matieresDe('BTS_NDRC')!.matieres.some((m) => m.id.startsWith('cg_'))).toBe(false)
    expect(matieresDe('BTS_CG')!.matieres.some((m) => m.id.startsWith('ndrc_'))).toBe(false)
  })

  it('matières fortes : tranche à 12 ou plus, ou matière aimée, limitées au public courant', () => {
    const s = { ...SCOLARITE_VIDE, notes: { cg_compta: '14a16', lva: '10a12', ndrc_vente: 'plus16' }, aimees: ['cge'] }
    expect(matieresFortes(s, 'BTS_CG')).toEqual(['cg_compta', 'cge'])
    // Changer de public change les matières prises en compte, sans code.
    expect(matieresFortes(s, 'BTS_NDRC')).toEqual(['ndrc_vente', 'cge'])
    expect(matieresFortes(s, null)).toEqual([])
  })
})

describe('calcul des intérêts', () => {
  it('aucune réponse : tout à 0, aucun dominant', () => {
    expect(interets({}).every((s) => s.score === 0)).toBe(true)
    expect(dominants({})).toEqual([])
  })

  it('« J’adore » partout sur un type donne 100 à ce type seulement', () => {
    const s = interets(toutes((t) => (t === 'E' ? 2 : 0)))
    expect(s[0]).toEqual({ id: 'E', score: 100 })
    expect(s.slice(1).every((x) => x.score === 0)).toBe(true)
  })

  it('« Pourquoi pas » partout : 50 partout, ordre du contenu gardé, 3 dominants au maximum', () => {
    const r = toutes(() => 1)
    expect(interets(r).map((s) => s.score)).toEqual([50, 50, 50, 50, 50, 50])
    expect(dominants(r).map((s) => s.id)).toEqual(['R', 'I', 'A'])
  })

  it('un type sous le seuil n’est jamais présenté comme dominant', () => {
    const r = toutes((t) => (t === 'S' ? 2 : 0))
    r.c1 = 2 // C à 33
    expect(dominants(r).map((s) => s.id)).toEqual(['S'])
  })
})
