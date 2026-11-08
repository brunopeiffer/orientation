import { describe, expect, it } from 'vitest'
import { GOUTS, GOUTS_VIDES, MATIERES, SCOLARITE_VIDE } from './gouts'
import { evaluer, FAMILLES, pistes, POIDS, ROME, typesDe, type Profil } from './metiers'
import { TEST } from './personnalite'
import { PUBLICS_ACTIFS } from './schema'

const neutre = Object.fromEntries(TEST.items.map((i) => [i.id, 3]))
const activites = (adore: string[]) => Object.fromEntries(GOUTS.activites.map((a) => [a.id, adore.includes(a.type) ? 2 : 0]))
const profil = (publicId: string, p: Partial<Profil> = {}): Profil =>
  ({ publicId, personnalite: neutre, gouts: GOUTS_VIDES, scolarite: SCOLARITE_VIDE, ...p })
const complet = (publicId: string) => profil(publicId, {
  gouts: { activites: activites(['E', 'S']), environnements: ['boutique', 'deplacements'], valeurs: ['salaire', 'contact'], refus: [] },
})

describe('données métiers', () => {
  it('viennent du ROME avec source, version et licence', () => {
    expect(ROME.source).toMatch(/ROME/)
    expect(ROME.version).toBeTruthy()
    expect(ROME.licence).toMatch(/Licence Ouverte/)
    expect(ROME.metiers.length).toBeGreaterThan(100)
  })

  it('chaque métier a une famille décrite et des centres d’intérêt connus', () => {
    const familles = new Set(FAMILLES.familles.map((f) => f.id))
    for (const m of ROME.metiers) {
      expect(familles.has(m.famille), m.code).toBe(true)
      for (const c of m.centres) expect(c in FAMILLES.centresVersTypes, c).toBe(true)
    }
  })

  it('les familles n’utilisent que des ids existants (types, environnements, valeurs, refus, matières)', () => {
    const ids = (l: { id: string }[]) => new Set(l.map((x) => x.id))
    const [types, env, val, refus] = [GOUTS.types, GOUTS.environnements, GOUTS.valeurs, GOUTS.refus].map(ids)
    const matieres = new Set(Object.values(MATIERES.publics).flatMap((p) => p.matieres.map((m) => m.id)))
    const dims = new Set(TEST.dimensions.map((d) => d.id))
    for (const f of FAMILLES.familles) {
      f.types.forEach((x) => expect(types.has(x), `${f.id} ${x}`).toBe(true))
      f.environnements.forEach((x) => expect(env.has(x), `${f.id} ${x}`).toBe(true))
      f.valeurs.forEach((x) => expect(val.has(x), `${f.id} ${x}`).toBe(true))
      f.freins.forEach((x) => expect(refus.has(x), `${f.id} ${x}`).toBe(true))
      f.matieres.forEach((x) => expect(matieres.has(x), `${f.id} ${x}`).toBe(true))
      Object.keys(f.personnalite).forEach((x) => expect(dims.has(x), `${f.id} ${x}`).toBe(true))
    }
    Object.values(FAMILLES.centresVersTypes).forEach((t) => t && expect(types.has(t)).toBe(true))
  })

  it('fiches réalité : au moins 3 contraintes et 3 avantages, source, date, à valider', () => {
    expect(FAMILLES.statut).toBe('A_VALIDER')
    expect(FAMILLES.source).toBeTruthy()
    expect(FAMILLES.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    for (const f of FAMILLES.familles) {
      expect(f.realite.contraintes.length, f.id).toBeGreaterThanOrEqual(3)
      expect(f.realite.avantages.length, f.id).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('matching', () => {
  it('jamais de métier réservé CG pour un NDRC, ni l’inverse ; STMG voit tout', () => {
    expect(pistes(complet('BTS_NDRC'), 999).every((p) => p.metier.publics.includes('BTS_NDRC'))).toBe(true)
    expect(pistes(complet('BTS_NDRC'), 999).some((p) => p.famille.id === 'compta')).toBe(false)
    expect(pistes(complet('BTS_CG'), 999).every((p) => p.metier.publics.includes('BTS_CG'))).toBe(true)
    const sam = pistes(complet('BTS_SAM'), 999)
    expect(sam.length).toBeGreaterThan(0)
    expect(sam.every((p) => p.metier.publics.includes('BTS_SAM'))).toBe(true)
    expect(sam.some((p) => p.famille.id === 'compta')).toBe(false)
    expect(ROME.metiers.every((m) => m.publics.includes('STMG'))).toBe(true)
  })

  it('propose 8 à 12 pistes, 3 au maximum par famille, pour chaque public', () => {
    for (const { id } of PUBLICS_ACTIFS) {
      const l = pistes(complet(id))
      expect(l.length, id).toBeGreaterThanOrEqual(8)
      expect(l.length, id).toBeLessThanOrEqual(12)
      const n = new Map<string, number>()
      l.forEach((p) => n.set(p.famille.id, (n.get(p.famille.id) ?? 0) + 1))
      expect(Math.max(...n.values())).toBeLessThanOrEqual(3)
    }
  })

  it('chaque score est décomposé et égal à la moyenne pondérée des composantes connues', () => {
    for (const p of pistes(complet('STMG'))) {
      expect(p.composantes.map((c) => c.poids)).toEqual(Object.values(POIDS))
      const connues = p.composantes.filter((c) => c.score !== null)
      const attendu = connues.reduce((s, c) => s + c.poids * c.score!, 0) / connues.reduce((s, c) => s + c.poids, 0)
      expect(Math.abs(p.score - attendu)).toBeLessThanOrEqual(0.5)
    }
  })

  it('une composante sans réponse est marquée « pas assez d’infos » sans pénaliser', () => {
    const p = evaluer(ROME.metiers[0], profil('STMG', { personnalite: {} }))
    expect(p.composantes.every((c) => c.score === null)).toBe(true)
    expect(p.score).toBe(0)
  })

  it('les premières pistes correspondent au type d’intérêt dominant de l’élève', () => {
    const chiffres = pistes(profil('STMG', { gouts: { ...GOUTS_VIDES, activites: activites(['C']), environnements: ['bureau'], valeurs: ['stabilite'] } }))
    const meilleurs = chiffres.filter((p) => p.score === chiffres[0].score)
    expect(meilleurs.every((p) => typesDe(p.metier).includes('C'))).toBe(true)
    expect(meilleurs.some((p) => p.famille.id === 'compta')).toBe(true)
    const vente = pistes(profil('BTS_NDRC', { gouts: { ...GOUTS_VIDES, activites: activites(['E']), environnements: ['deplacements'], valeurs: ['salaire', 'defi'] } }))
    expect(typesDe(vente[0].metier)).toContain('E')
    expect(vente.some((p) => p.famille.id === 'vente_b2b')).toBe(true)
  })

  it('les refus ne cachent rien et ne changent pas le score : ils deviennent des freins', () => {
    const sans = complet('BTS_NDRC')
    const avec = { ...sans, gouts: { ...sans.gouts, refus: ['objectifs_vente', 'etudes_longues'] } }
    // Mêmes pistes, mêmes scores (rien n'est caché)…
    const tri = (l: ReturnType<typeof pistes>) => l.map((p) => `${p.metier.code}:${p.score}`).sort()
    expect(tri(pistes(avec))).toEqual(tri(pistes(sans)))
    // …mais celles qui touchent un refus passent après les autres.
    const freins = pistes(avec).map((p) => p.freins.length > 0)
    expect(freins.indexOf(true)).toBeGreaterThan(-1)
    expect(freins.slice(freins.indexOf(true)).every(Boolean)).toBe(true)
    const vente = pistes(avec).find((p) => p.famille.freins.includes('objectifs_vente'))!
    expect(vente.freins).toContain('objectifs_vente')
  })

  it('« études longues » n’est un frein que pour les métiers qui en demandent', () => {
    const p = profil('STMG', { gouts: { ...GOUTS_VIDES, refus: ['etudes_longues'] } })
    const expert = ROME.metiers.find((m) => m.code === 'M1211')!
    const aide = ROME.metiers.find((m) => m.code === 'M1225')!
    expect(evaluer(expert, p).freins).toEqual(['etudes_longues'])
    expect(evaluer(aide, p).freins).toEqual([])
  })

  it('la spécialité STMG compte : Mercatique fait monter le marketing, Gestion et finance la comptabilité', () => {
    const base = profil('STMG', { gouts: { ...GOUTS_VIDES, activites: activites(['E', 'C']) } })
    const marketing = ROME.metiers.find((m) => m.famille === 'marketing')!
    const compta = ROME.metiers.find((m) => m.famille === 'compta')!
    const avec = (option: string) => ({ ...base, scolarite: { ...SCOLARITE_VIDE, option } })
    expect(evaluer(marketing, avec('MER')).score).toBeGreaterThan(evaluer(marketing, avec('GF')).score)
    expect(evaluer(compta, avec('GF')).score).toBeGreaterThan(evaluer(compta, avec('MER')).score)
    expect(evaluer(compta, avec('GF')).composantes.find((c) => c.id === 'matieres')!.score).toBe(100)
    expect(evaluer(compta, base).composantes.find((c) => c.id === 'matieres')!.score).toBeNull() // rien de renseigné
  })

  it('chaque spécialité STMG renvoie à des familles qui existent', () => {
    const ids = new Set(FAMILLES.familles.map((f) => f.id))
    for (const c of MATIERES.publics.STMG.option!.choix) for (const f of c.familles) expect(ids.has(f), `${c.id} ${f}`).toBe(true)
  })

  it('sans public, aucune piste', () => {
    expect(pistes({ ...complet('STMG'), publicId: null })).toEqual([])
  })
})
