import { z } from 'zod'
import brut from '../../contenu/poursuites-bts.json'
import { distanceRoute, type Point } from './formations'

const Lien = z.object({ texte: z.string(), url: z.string().regex(/^(https:\/\/|#offres-)/) })
const TypeOffre = z.enum(['LP', 'DCG', 'BUT'])

const ContenuSchema = z.object({
  statut: z.string(),
  date: z.string(),
  voies: z.array(z.object({
    id: z.string(),
    titre: z.string(),
    publics: z.array(z.string()).min(1),
    niveau: z.string(),
    duree: z.string(),
    description: z.string(),
    parcoursup: z.boolean(),
    canal: z.string().min(1),
    lien: Lien,
    lien2: Lien.optional(),
    alternance: z.string(),
    offres: TypeOffre.nullable(),
    sources: z.array(z.object({ nom: z.string(), url: z.string().url() })).min(1),
  })),
  local: z.record(z.string(), z.record(TypeOffre, z.array(z.string()))),
})

const OffresSchema = z.object({
  sources: z.record(TypeOffre, z.string()),
  licence: z.string(),
  offres: z.array(z.object({
    k: TypeOffre, m: z.string(), p: z.string(), e: z.string(), w: z.string().nullable().optional(),
    v: z.string().nullable(), d: z.string().nullable(), la: z.number(), lo: z.number(), f: z.string().url().nullable().optional(),
  })),
  sites: z.record(z.string(), z.string().regex(/^https:\/\//)),
})

export const POURSUITES = ContenuSchema.parse(brut)
export type TypeOffre = z.infer<typeof TypeOffre>
export type Donnees = z.infer<typeof OffresSchema>
export type Offre = Donnees['offres'][number]
export type OffreLocale = { o: Offre; km: number }

export const voiesDe = (publicId: string | null) => POURSUITES.voies.filter((v) => publicId !== null && v.publics.includes(publicId))

let cache: Promise<Donnees> | null = null
/** Données nationales (fichier statique de l'app, chargé à la demande, aucun appel externe). */
export function chargerOffres(): Promise<Donnees> {
  cache ??= import('../../data/post-bts.json').then((m) => OffresSchema.parse(m.default))
  return cache
}

export const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’]/g, "'").toLowerCase()

/** Offres du type demandé, en lien avec le BTS (mots-clés de contenu/poursuites-bts.json), dans le rayon, de la plus proche à la plus lointaine. */
export function offresLocales(offres: Offre[], type: TypeOffre, publicId: string | null, depuis: Point, rayon: number | null): OffreLocale[] {
  const mots = (publicId && POURSUITES.local[publicId]?.[type]) || []
  if (!mots.length) return []
  return offres
    .filter((o) => o.k === type && mots.some((m) => sansAccent(`${o.m} | ${o.p}`).includes(m)))
    .map((o) => ({ o, km: distanceRoute(depuis, { lat: o.la, lon: o.lo }) }))
    .filter((x) => rayon === null || x.km <= rayon)
    .sort((a, b) => a.km - b.km || a.o.m.localeCompare(b.o.m))
}

