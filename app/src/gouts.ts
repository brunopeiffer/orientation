import { z } from 'zod'
import brut from '../../contenu/gouts.json'
import brutMatieres from '../../config/matieres.json'

const Choix = z.array(z.object({ id: z.string(), libelle: z.string() }))

const GoutsSchema = z.object({
  statut: z.string(),
  niveaux: z.array(z.string()).length(3),
  types: z.array(z.object({ id: z.string(), nom: z.string(), description: z.string() })).length(6),
  activites: z.array(z.object({ id: z.string(), type: z.string(), texte: z.string() })),
  environnements: Choix,
  valeurs: Choix,
  maxValeurs: z.number().int().min(1),
  refus: Choix,
})

const MatieresSchema = z.object({
  statut: z.string(),
  tranches: z.array(z.object({ id: z.string(), libelle: z.string(), forte: z.boolean() })),
  publics: z.record(z.string(), z.object({
    option: z.object({ question: z.string(), choix: Choix }).optional(),
    matieres: Choix,
  })),
})

export const GOUTS = GoutsSchema.parse(brut)
export const MATIERES = MatieresSchema.parse(brutMatieres)

export type Gouts = { activites: Record<string, number>; environnements: string[]; valeurs: string[]; refus: string[] }
export type Scolarite = { option: string | null; notes: Record<string, string>; aimees: string[] }

export const GOUTS_VIDES: Gouts = { activites: {}, environnements: [], valeurs: [], refus: [] }
export const SCOLARITE_VIDE: Scolarite = { option: null, notes: {}, aimees: [] }

/** À partir de ce score (sur 100), un type d'intérêt est présenté comme dominant. */
export const SEUIL_DOMINANT = 50

export type ScoreInteret = { id: string; score: number }

/** Score de 0 à 100 par type d'intérêt (« Pas pour moi » = 0, « Pourquoi pas » = 1, « J’adore » = 2), du plus fort au plus faible. */
export function interets(activites: Record<string, number>, contenu = GOUTS): ScoreInteret[] {
  return contenu.types
    .map((t) => {
      const items = contenu.activites.filter((a) => a.type === t.id)
      const somme = items.reduce((s, a) => s + (activites[a.id] ?? 0), 0)
      return { id: t.id, score: Math.round((100 * somme) / (2 * items.length)) }
    })
    .sort((a, b) => b.score - a.score) // tri stable : à égalité, l'ordre du contenu est gardé
}

/** Les 3 types les plus forts au maximum, et seulement s'ils atteignent le seuil. */
export const dominants = (activites: Record<string, number>) =>
  interets(activites).filter((s) => s.score >= SEUIL_DOMINANT).slice(0, 3)

export const matieresDe = (publicId: string | null) => (publicId ? MATIERES.publics[publicId] : undefined)

/** Matières fortes du public courant : tranche à 12 ou plus, ou matière aimée. */
export function matieresFortes(scolarite: Scolarite, publicId: string | null): string[] {
  const fortes = new Set(MATIERES.tranches.filter((t) => t.forte).map((t) => t.id))
  return (matieresDe(publicId)?.matieres ?? [])
    .filter((m) => fortes.has(scolarite.notes[m.id]) || scolarite.aimees.includes(m.id))
    .map((m) => m.id)
}
