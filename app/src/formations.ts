import { z } from 'zod'
import brutIndex from '../../data/formations-index.json'
import brutLiens from '../../contenu/formations-familles.json'

const IndexSchema = z.object({
  source: z.string(),
  licence: z.string(),
  annee: z.string(),
  session: z.string(),
  regions: z.array(z.object({ slug: z.string(), nom: z.string(), n: z.number(), bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]) })),
})

const FormationSchema = z.object({
  i: z.string(), n: z.string(), p: z.array(z.string()), t: z.string(), e: z.string(), v: z.string().nullable(), d: z.string().nullable(),
  la: z.number(), lo: z.number(), pu: z.boolean(), a: z.boolean(), h: z.boolean(), f: z.string().url().nullable(),
  s: z.object({ tx: z.number().nullable(), bt: z.number().nullable(), pc: z.number().nullable(), pbt: z.number().nullable(), cap: z.number().nullable() }).optional(),
})

const LiensSchema = z.object({ statut: z.string(), date: z.string(), familles: z.record(z.string(), z.array(z.string()).min(1)) })

export const INDEX = IndexSchema.parse(brutIndex)
export const LIENS = LiensSchema.parse(brutLiens)
export type Formation = z.infer<typeof FormationSchema>
export type Point = { lat: number; lon: number }

/** Les routes font en moyenne un détour par rapport à la ligne droite : distance affichée = vol d'oiseau × 1,3, présentée comme approximative. */
export const COEF_DETOUR = 1.3

export function volOiseau(a: Point, b: Point): number {
  const rad = Math.PI / 180
  const h = Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lon - a.lon) * rad) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

export const distanceRoute = (a: Point, b: Point) => Math.round(volOiseau(a, b) * COEF_DETOUR)

/** Régions dont au moins une formation peut être dans le rayon (rayon null = toute la France). */
export function regionsUtiles(depuis: Point, rayon: number | null): string[] {
  return INDEX.regions
    .filter((r) => {
      if (rayon === null) return true
      const [laMin, loMin, laMax, loMax] = r.bbox
      const proche = { lat: Math.min(Math.max(depuis.lat, laMin), laMax), lon: Math.min(Math.max(depuis.lon, loMin), loMax) }
      return volOiseau(depuis, proche) * COEF_DETOUR <= rayon
    })
    .map((r) => r.slug)
}

const fichiers = import.meta.glob<{ default: unknown }>('../../data/formations/*.json')
const cache = new Map<string, Formation[]>()

/** Charge les formations d'une région à la demande (fichier statique de l'app, aucun appel externe). */
export async function chargerRegion(slug: string): Promise<Formation[]> {
  if (!cache.has(slug)) {
    const charger = fichiers[`../../data/formations/${slug}.json`]
    if (!charger) throw new Error(`Région inconnue : ${slug}`)
    cache.set(slug, z.array(FormationSchema).parse((await charger()).default))
  }
  return cache.get(slug)!
}

export type Acces = { niveau: 'large' | 'assez_large' | 'selective' | 'tres_selective' | null; texte: string; detail: string }

/** Fourchette prudente d'après les propositions faites aux bacheliers techno (toutes séries confondues). */
export function acces(f: Formation, session = INDEX.session): Acces {
  const s = f.s
  if (!s || s.bt === null || s.pbt === null) {
    return { niveau: null, texte: 'Chances d’accès : non disponible', detail: `Pas de statistiques Parcoursup ${session} pour cette formation (nouvelle formation ou données absentes).` }
  }
  // Les propositions (pbt) couvrent les phases principale et complémentaire : les candidats aussi, sinon on surestime l'accès.
  const candidats = s.bt + (s.pc ?? 0)
  if (candidats < 10) {
    return { niveau: null, texte: 'Chances d’accès : non disponible', detail: `Trop peu de candidats bac techno en ${session} (${candidats}) pour donner une tendance fiable.` }
  }
  const r = Math.min(1, s.pbt / candidats)
  const detail = `En ${session} : ${s.pbt} propositions pour ${candidats} candidats bac techno, phases principale et complémentaire (toutes séries techno confondues).`
  if (r >= 0.8) return { niveau: 'large', texte: 'Accès large : 8 candidats bac techno sur 10 ou plus ont reçu une proposition', detail }
  if (r >= 0.5) return { niveau: 'assez_large', texte: 'Accès assez large : entre 5 et 8 candidats bac techno sur 10 ont reçu une proposition', detail }
  if (r >= 0.2) return { niveau: 'selective', texte: 'Formation sélective : entre 2 et 5 candidats bac techno sur 10 ont reçu une proposition', detail }
  return { niveau: 'tres_selective', texte: 'Formation très sélective : moins de 2 candidats bac techno sur 10 ont reçu une proposition', detail }
}

/** Formations qui mènent à la famille, d'après les intitulés Parcoursup de contenu/formations-familles.json (mots-clés lisibles seulement). */
export const etudesPour = (famille: string) => (LIENS.familles[famille] ?? [])
  .filter((m) => /^(BTS|BUT|DCG|L1|CPGE|D\.E) /.test(m))
  .map((m) => m.replace(/^L1 - /, 'Licence ').replace(/ - $/, '').replace(' - ', ' '))

export const CATEGORIES = ['BTS', 'BUT', 'Licence', 'Écoles', 'Autres'] as const
export type Categorie = (typeof CATEGORIES)[number]

export function categorie(f: Formation): Categorie {
  if (f.n.startsWith('BTS')) return 'BTS'
  if (f.n.startsWith('BUT')) return 'BUT'
  if (/^(L1|Licence)/.test(f.n) || f.t.startsWith('Licence')) return 'Licence'
  if (/écoles? (de commerce|d'ingénieurs)|I\.A\.E|Sciences Po/i.test(f.t)) return 'Écoles'
  return 'Autres'
}

/** Familles de métiers (ids) avec lesquelles la formation est en lien, d'après son intitulé. */
export function familles(f: Formation): string[] {
  const n = [f.n, ...f.p].join(' | ').toLowerCase()
  return Object.entries(LIENS.familles).filter(([, mots]) => mots.some((m) => n.includes(m.toLowerCase()))).map(([id]) => id)
}

export type Filtres = { rayon: number | null; categories: Categorie[]; enLien: string[] | null; alternance: boolean; recherche: string }
export type Resultat = { f: Formation; km: number; familles: string[] }

/** Formations filtrées, de la plus proche à la plus lointaine. enLien = familles des pistes de l'élève (null = pas de filtre). */
export function filtrer(formations: Formation[], depuis: Point, filtres: Filtres): Resultat[] {
  return filtrerPrepares(preparer(formations, depuis), filtres)
}

/** Le calcul coûteux (distance, familles), à faire une seule fois par liste et par commune. */
export const preparer = (formations: Formation[], depuis: Point): Resultat[] =>
  formations.map((f) => ({ f, km: distanceRoute(depuis, { lat: f.la, lon: f.lo }), familles: familles(f) }))

export function filtrerPrepares(prepares: Resultat[], filtres: Filtres): Resultat[] {
  const q = filtres.recherche.trim().toLowerCase()
  return prepares
    .filter(({ f, km, familles }) =>
      (filtres.rayon === null || km <= filtres.rayon) &&
      filtres.categories.includes(categorie(f)) &&
      (!filtres.alternance || f.a) &&
      (filtres.enLien === null || familles.some((x) => filtres.enLien!.includes(x))) &&
      (!q || `${f.n} ${f.p.join(' ')} ${f.e} ${f.v}`.toLowerCase().includes(q)))
    .sort((a, b) => a.km - b.km || a.f.n.localeCompare(b.f.n))
}
