import { z } from 'zod'
import config from '../../config/publics.json'

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
  })
  .strict()

export type Etat = z.infer<typeof EtatSchema>

export const ETAT_INITIAL: Etat = { prenom: '', publicId: null, etape: 0, avertissementLu: false }

export const VERSION_ETAT = 1

export const FichierSchema = z
  .object({
    app: z.literal('orientation'),
    version: z.literal(VERSION_ETAT),
    exporteLe: z.string(),
    etat: EtatSchema,
  })
  .strict()

export const parcoursDe = (publicId: string | null): Parcours | null =>
  PUBLICS.find((p) => p.id === publicId)?.parcours ?? null
