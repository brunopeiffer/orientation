import { z } from 'zod'
import config from '../../config/publics.json'
import handicap from '../../contenu/handicap.json'
import { apostrophes, CommuneSchema } from './geocodage'
import { GOUTS, GOUTS_VIDES, MATIERES, SCOLARITE_VIDE } from './gouts'
import { TEST } from './personnalite'

const ID_QUESTIONS = new Set(TEST.items.map((i) => i.id))
const ids = (liste: { id: string }[]) => new Set(liste.map((x) => x.id))
/** Liste sans doublon d'ids connus. */
const listeIds = (connus: Set<string>, max = connus.size) =>
  z.array(z.string()).max(max).refine((l) => new Set(l).size === l.length && l.every((x) => connus.has(x)), 'Choix inconnu ou en double.')
const ID_MATIERES = new Set(Object.values(MATIERES.publics).flatMap((p) => p.matieres.map((m) => m.id)))
const ID_OPTIONS = new Set(Object.values(MATIERES.publics).flatMap((p) => p.option?.choix.map((c) => c.id) ?? []))
const ID_TRANCHES = ids(MATIERES.tranches)
const ID_ACTIVITES = ids(GOUTS.activites)

export const GoutsSchema = z
  .object({
    activites: z
      .record(z.string(), z.number().int().min(0).max(2))
      .refine((r) => Object.keys(r).every((id) => ID_ACTIVITES.has(id)), 'Activité inconnue.'),
    environnements: listeIds(ids(GOUTS.environnements)),
    valeurs: listeIds(ids(GOUTS.valeurs), GOUTS.maxValeurs),
    refus: listeIds(ids(GOUTS.refus)),
  })
  .strict()

// Notes en tranches seulement (jamais de note exacte).
export const ScolariteSchema = z
  .object({
    option: z.string().refine((id) => ID_OPTIONS.has(id), 'Option inconnue.').nullable(),
    notes: z
      .record(z.string(), z.string())
      .refine((r) => Object.entries(r).every(([m, t]) => ID_MATIERES.has(m) && ID_TRANCHES.has(t)), 'Matière ou tranche inconnue.'),
    aimees: listeIds(ID_MATIERES),
  })
  .strict()

export type Parcours = 'lycee' | 'bts'
export const PUBLICS = config.publics as { id: string; libelle: string; parcours: Parcours; actif: boolean }[]
export const PUBLICS_ACTIFS = PUBLICS.filter((p) => p.actif)

export const PRENOM_MAX = 30

// Prénom seulement (jamais de nom de famille) : lettres, espace, tiret, apostrophe.
export const PrenomSchema = z.preprocess(apostrophes, z
  .string()
  .trim()
  .max(PRENOM_MAX, `Ton prénom doit faire ${PRENOM_MAX} caractères au maximum.`)
  .regex(/^(\p{L}[\p{L}' -]*)?$/u, 'Utilise seulement des lettres, des espaces, des tirets ou des apostrophes.'))

/** Rayons proposés en km ; null = partout en France. */
export const RAYONS = [10, 20, 50, 100, 200, null] as const

// Seule la commune est gardée (jamais d'adresse) : nom, code INSEE, code postal et coordonnées de son centre.
export const MobiliteSchema = z
  .object({
    commune: CommuneSchema.nullable(),
    rayon: z.number().refine((r) => (RAYONS as readonly (number | null)[]).includes(r), 'Rayon inconnu.').nullable(),
  })
  .strict()
export const MOBILITE_INITIALE = { commune: null, rayon: 50 }

const ID_SUJETS_HANDICAP = new Set(handicap.sujets.map((s) => s.id))
// Module handicap : facultatif, gardé dans ce navigateur seulement, jamais utilisé dans une requête réseau.
export const HandicapSchema = z
  .object({
    actif: z.boolean(),
    sujets: z.array(z.string()).refine((l) => new Set(l).size === l.length && l.every((x) => ID_SUJETS_HANDICAP.has(x)), 'Sujet inconnu ou en double.'),
  })
  .strict()
export const HANDICAP_INITIAL = { actif: false, sujets: [] as string[] }

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
    gouts: GoutsSchema,
    scolarite: ScolariteSchema,
    mobilite: MobiliteSchema,
    handicap: HandicapSchema,
  })
  .strict()

export type Etat = z.infer<typeof EtatSchema>

export const ETAT_INITIAL: Etat = { prenom: '', publicId: null, etape: 0, avertissementLu: false, personnalite: {},
  gouts: GOUTS_VIDES, scolarite: SCOLARITE_VIDE, mobilite: MOBILITE_INITIALE, handicap: HANDICAP_INITIAL }

export const VERSION_ETAT = 5

/** Fait passer un état d'une ancienne version à la version actuelle (stockage local ou sauvegarde importée). */
export function migrer(etat: unknown, version: number): unknown {
  let e = etat as Record<string, unknown>
  if (version < 2) e = { ...e, personnalite: {} }
  if (version < 3) e = { ...e, gouts: GOUTS_VIDES, scolarite: SCOLARITE_VIDE }
  if (version < 4) e = { ...e, mobilite: MOBILITE_INITIALE }
  if (version < 5) e = { ...e, handicap: HANDICAP_INITIAL }
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
