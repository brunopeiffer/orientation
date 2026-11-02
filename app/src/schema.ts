import { z } from 'zod'
import config from '../../config/publics.json'
import { TEST } from './personnalite'

const ID_QUESTIONS = new Set(TEST.items.map((i) => i.id))

export type Parcours = 'lycee' | 'bts'
export const PUBLICS = config.publics as { id: string; libelle: string; parcours: Parcours; actif: boolean }[]
export const PUBLICS_ACTIFS = PUBLICS.filter((p) => p.actif)

export const PRENOM_MAX = 30

// Prénom seulement (jamais de nom de famille) : lettres, espace, tiret, apostrophe.
export const PrenomSchema = z
  .string()
  .trim()
  .max(PRENOM_MAX, `Ton prénom doit faire ${PRENOM_MAX} caractères au maximum.`)
  .regex(/^(\p{L}[\p{L}' -]*)?$/u, 'Utilise seulement des lettres, des espaces, des tirets ou des apostrophes.')

export const EtatSchema = z
  .object({
    prenom: PrenomSchema,
    publicId: z
      .string()
      .refine((id) => PUBLICS_ACTIFS.some((p) => p.id === id), 'Public inconnu ou non activé.')
      .nullable(),
    etape: z.number().int().min(0).max(20),
    avertissementLu: z.boolean(),
    personnalite: z
      .record(z.string(), z.number().int().min(1).max(5))
      .refine((r) => Object.keys(r).every((id) => ID_QUESTIONS.has(id)), 'Question de personnalité inconnue.'),
  })
  .strict()

export type Etat = z.infer<typeof EtatSchema>

export const ETAT_INITIAL: Etat = { prenom: '', publicId: null, etape: 0, avertissementLu: false, personnalite: {} }

export const VERSION_ETAT = 2

/** Fait passer un état d'une ancienne version à la version actuelle (stockage local ou sauvegarde importée). */
export function migrer(etat: unknown, version: number): unknown {
  let e = etat as Record<string, unknown>
  if (version < 2) e = { ...e, personnalite: {} }
  return e
}

export const FichierSchema = z
  .object({
    app: z.literal('orientation'),
    version: z.number().int().min(1).max(VERSION_ETAT),
    exporteLe: z.string(),
    etat: z.unknown(),
  })
  .strict()

export const parcoursDe = (publicId: string | null): Parcours | null =>
  PUBLICS.find((p) => p.id === publicId)?.parcours ?? null
