import { z } from 'zod'
import brut from '../../contenu/poursuites-bts.json'
import { distanceRoute, type Point } from './formations'

const Lien = z.object({ texte: z.string(), url: z.string().regex(/^(https:\/\/|#offres-)/) })
const TypeOffre = z.enum(['LP', 'DCG', 'BUT', 'ECOLE'])

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
    // Onisep : fiche du diplôme (o), page de la formation chez l'établissement (a) ; écoles : niveau, reconnaissance, durée, coût.
    o: z.string().url().nullable().optional(), a: z.string().url().nullable().optional(),
    n: z.string().optional(), r: z.string().nullable().optional(), du: z.string().nullable().optional(), c: z.string().nullable().optional(),
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


/** Ce que vaut le diplôme, en clair (« nature du certificat » de l'Onisep). reconnu = délivré ou reconnu par l'État. */
export function reconnaissance(nature: string | null | undefined): { texte: string; reconnu: boolean | null } {
  switch (nature) {
    case "Diplôme national ou diplôme d'État": return { texte: 'Diplôme national, délivré par l’État', reconnu: true }
    case 'Diplôme conférant le grade de licence': return { texte: 'Reconnu par l’État : grade de licence', reconnu: true }
    case 'Diplôme conférant le grade de master': return { texte: 'Reconnu par l’État : grade de master', reconnu: true }
    case "Diplôme d'école revêtu d'un visa officiel": return { texte: 'Diplôme visé par l’État', reconnu: true }
    case 'Formation inscrite au RNCP': return { texte: 'Titre inscrit au RNCP : certification reconnue par l’État (ce n’est pas un diplôme national)', reconnu: true }
    case 'Label de la Conférence des grandes écoles (CGE)': return { texte: 'Label d’une association d’écoles (CGE) : pas un diplôme reconnu par l’État', reconnu: false }
    case "Certificat délivré par l'école": return { texte: 'Non reconnu par l’État : certificat délivré par l’école seule', reconnu: false }
    default: return { texte: nature ? `Reconnaissance : ${nature}` : 'Reconnaissance : non disponible', reconnu: null }
  }
}
