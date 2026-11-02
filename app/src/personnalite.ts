import { z } from 'zod'
import brut from '../../contenu/test-personnalite.json'

const Pole = z.object({
  libelle: z.string(),
  description: z.string(),
  forces: z.array(z.string()).min(1),
  vigilance: z.array(z.string()).min(1),
})

const ContenuSchema = z.object({
  statut: z.string(),
  echelle: z.array(z.string()).length(5),
  dimensions: z.array(z.object({ id: z.string(), nom: z.string(), question: z.string(), A: Pole, B: Pole })).length(4),
  equilibre: z.string(),
  items: z.array(z.object({
    id: z.string(),
    dimension: z.string(),
    pole: z.enum(['A', 'B']),
    texte: z.string(),
  })),
  paires: z.array(z.tuple([z.string(), z.string()])),
})

export type Contenu = z.infer<typeof ContenuSchema>
export type Reponses = Record<string, number> // id de question -> 1..5

export const TEST: Contenu = ContenuSchema.parse(brut)

/** En dessous de ce seuil (sur 100), on parle d'un profil « équilibré » plutôt que d'une préférence. */
export const SEUIL_EQUILIBRE = 20
/** Écart (échelle 1 à 5) entre deux questions jumelles à partir duquel les réponses sont jugées contradictoires. */
export const ECART_INCOHERENT = 3

export type ScoreDimension = {
  id: string
  score: number // -100 = pôle A, +100 = pôle B
  pole: 'A' | 'B' | null // null = équilibré
  intensite: 'equilibre' | 'legere' | 'marquee' | 'tres_marquee'
  nuance: boolean // réponses contradictoires sur les questions jumelles
}

export function complet(reponses: Reponses, contenu = TEST) {
  return contenu.items.every((i) => reponses[i.id] >= 1 && reponses[i.id] <= 5)
}

export function scorer(reponses: Reponses, contenu = TEST): ScoreDimension[] {
  return contenu.dimensions.map((d) => {
    const items = contenu.items.filter((i) => i.dimension === d.id && reponses[i.id])
    // Réponse centrée sur 0 (de -2 à +2), retournée pour les questions du pôle A.
    const somme = items.reduce((s, i) => s + (reponses[i.id] - 3) * (i.pole === 'B' ? 1 : -1), 0)
    const score = items.length ? Math.round((100 * somme) / (2 * items.length)) || 0 : 0 // `|| 0` évite -0
    const abs = Math.abs(score)
    const nuance = contenu.paires.some(([a, b]) =>
      contenu.items.find((i) => i.id === a)?.dimension === d.id &&
      !!reponses[a] && !!reponses[b] && Math.abs(reponses[a] - reponses[b]) >= ECART_INCOHERENT)
    const niveaux = ['legere', 'marquee', 'tres_marquee'] as const
    // Des réponses contradictoires rendent le résultat moins sûr : on baisse l'intensité affichée d'un cran.
    const niveau = Math.max(0, (abs < 50 ? 0 : abs < 80 ? 1 : 2) - (nuance ? 1 : 0))
    return {
      id: d.id,
      score,
      pole: abs < SEUIL_EQUILIBRE ? null : score < 0 ? 'A' : 'B',
      intensite: abs < SEUIL_EQUILIBRE ? 'equilibre' : niveaux[niveau],
      nuance,
    }
  })
}

/** Tendance à répondre « d'accord » à tout (de -2 à +2) : au-delà de 1, on le signale avec bienveillance. */
export function acquiescement(reponses: Reponses, contenu = TEST) {
  const v = contenu.items.map((i) => reponses[i.id]).filter(Boolean)
  return v.length ? v.reduce((s, x) => s + x - 3, 0) / v.length : 0
}
