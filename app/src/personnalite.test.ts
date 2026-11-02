import { describe, expect, it } from 'vitest'
import { acquiescement, complet, ECART_INCOHERENT, scorer, TEST, type Reponses } from './personnalite'

const tout = (f: (i: (typeof TEST.items)[number]) => number): Reponses =>
  Object.fromEntries(TEST.items.map((i) => [i.id, f(i)]))

describe('construction du questionnaire', () => {
  it('compte 36 questions, 9 par dimension, chacune dans une seule dimension connue', () => {
    expect(TEST.items).toHaveLength(36)
    expect(new Set(TEST.items.map((i) => i.id)).size).toBe(36)
    for (const d of TEST.dimensions) expect(TEST.items.filter((i) => i.dimension === d.id)).toHaveLength(9)
    expect(TEST.items.every((i) => TEST.dimensions.some((d) => d.id === i.dimension))).toBe(true)
  })

  it('équilibre les pôles (4 ou 5 questions de chaque côté) pour neutraliser le « oui à tout »', () => {
    for (const d of TEST.dimensions) {
      const a = TEST.items.filter((i) => i.dimension === d.id && i.pole === 'A').length
      expect([4, 5]).toContain(a)
    }
  })

  it('a 4 paires jumelles : même dimension, même pôle, une paire par dimension', () => {
    expect(TEST.paires).toHaveLength(4)
    const dims = TEST.paires.map(([a, b]) => {
      const [x, y] = [a, b].map((id) => TEST.items.find((i) => i.id === id)!)
      expect(x.dimension).toBe(y.dimension)
      expect(x.pole).toBe(y.pole)
      return x.dimension
    })
    expect(new Set(dims).size).toBe(4)
  })

  it('ne mélange pas les dimensions dans l’ordre de passage (pas deux questions de suite sur la même)', () => {
    TEST.items.slice(1).forEach((i, k) => expect(i.dimension).not.toBe(TEST.items[k].dimension))
  })

  it('reste lisible : 25 mots maximum, aucune négation (évite les doubles négations avec l’échelle)', () => {
    for (const i of TEST.items) {
      expect(i.texte.split(/\s+/).length, i.id).toBeLessThanOrEqual(25)
      expect(i.texte, i.id).not.toMatch(/\b(ne|n['’]|pas|jamais|aucun|aucune|rien|personne)\b/i)
    }
  })

  it('ne reprend aucune marque de test commercial', () => {
    expect(JSON.stringify(TEST)).not.toMatch(/MBTI|Myers|Briggs|16 ?personalit|ennéagramme|enneagram|\bDISC\b|\b[IE][SN][TF][JP]\b/i)
  })

  it('est marqué à valider par un humain', () => {
    expect(TEST.statut).toBe('A_VALIDER')
  })
})

describe('calcul du profil', () => {
  it('répondre « entre les deux » partout donne un profil centré (équilibré)', () => {
    for (const s of scorer(tout(() => 3))) expect(s).toMatchObject({ score: 0, pole: null, intensite: 'equilibre' })
  })

  it('un profil extrême simulé retrouve les bons pôles', () => {
    expect(scorer(tout((i) => (i.pole === 'B' ? 5 : 1))).map((s) => s.score)).toEqual([100, 100, 100, 100])
    expect(scorer(tout((i) => (i.pole === 'A' ? 5 : 1))).map((s) => s.pole)).toEqual(['A', 'A', 'A', 'A'])
  })

  it('les questions du pôle A sont bien inversées', () => {
    const r = tout(() => 3)
    const qA = TEST.items.find((i) => i.dimension === 'energie' && i.pole === 'A')!
    r[qA.id] = 5
    expect(scorer(r)[0].score).toBeLessThan(0)
  })

  it('répondre « d’accord » à tout donne un profil équilibré et un indice d’acquiescement élevé', () => {
    const r = tout(() => 5)
    for (const s of scorer(r)) expect(Math.abs(s.score)).toBeLessThan(20)
    expect(acquiescement(r)).toBe(2)
  })

  it('chaque dimension ne dépend que de ses questions', () => {
    const base = scorer(tout(() => 3))
    const r = tout((i) => (i.dimension === 'decision' ? (i.pole === 'B' ? 5 : 1) : 3))
    const s = scorer(r)
    expect(s.filter((x) => x.id !== 'decision')).toEqual(base.filter((x) => x.id !== 'decision'))
  })

  it('repère des réponses contradictoires sur des questions jumelles', () => {
    const r = tout(() => 3)
    const [a, b] = TEST.paires[0]
    r[a] = 5
    r[b] = 5 - ECART_INCOHERENT
    const dim = TEST.items.find((i) => i.id === a)!.dimension
    expect(scorer(r).find((s) => s.id === dim)!.nuance).toBe(true)
    expect(scorer(tout(() => 3)).some((s) => s.nuance)).toBe(false)
  })

  it('des réponses contradictoires baissent l’intensité affichée d’un cran', () => {
    const r = tout((i) => (i.pole === 'B' ? 5 : 1))
    const [a, b] = TEST.paires[0]
    r[b] = r[a] === 5 ? 2 : 4
    const s = scorer(r)[0]
    expect(s.score).toBeGreaterThanOrEqual(80)
    expect(s).toMatchObject({ nuance: true, intensite: 'marquee' })
  })

  it('les intensités suivent les seuils', () => {
    const intensites = [3, 4, 5].map((v) => scorer(tout((i) => (i.pole === 'B' ? v : 6 - v)))[0].intensite)
    expect(intensites).toEqual(['equilibre', 'marquee', 'tres_marquee'])
  })

  it('le test est complet seulement quand les 36 questions ont une réponse', () => {
    const r = tout(() => 3)
    expect(complet(r)).toBe(true)
    delete r.o9
    expect(complet(r)).toBe(false)
  })
})
