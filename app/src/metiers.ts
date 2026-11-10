import { z } from 'zod'
import brutMetiers from '../../data/metiers.json'
import brutFamilles from '../../contenu/metiers-familles.json'
import brutNiveaux from '../../data/niveaux-onisep.json'
import { interets, matieresDe, matieresFortes, type Gouts, type Scolarite } from './gouts'
import { complet, scorer, type Reponses } from './personnalite'
import { parcoursDe } from './schema'

const MetiersSchema = z.object({
  source: z.string(),
  version: z.string(),
  licence: z.string(),
  genere: z.string(),
  metiers: z.array(z.object({
    code: z.string().regex(/^[A-N]\d{4}$/),
    libelle: z.string(),
    famille: z.string(),
    publics: z.array(z.string()).min(1),
    appellations: z.array(z.string()),
    centres: z.array(z.string()),
  })),
})

const FamillesSchema = z.object({
  statut: z.string(),
  date: z.string(),
  source: z.string(),
  centresVersTypes: z.record(z.string(), z.string().nullable()),
  etudesLongues: z.array(z.string()),
  apresBts: z.object({ experience: z.array(z.string()), etudes: z.record(z.string(), z.string().min(10)) }),
  familles: z.array(z.object({
    id: z.string(),
    nom: z.string(),
    types: z.array(z.string()).min(1),
    environnements: z.array(z.string()),
    valeurs: z.array(z.string()),
    personnalite: z.record(z.string(), z.enum(['A', 'B'])),
    matieres: z.array(z.string()),
    freins: z.array(z.string()),
    realite: z.object({ contraintes: z.array(z.string()).min(3), avantages: z.array(z.string()).min(3) }),
  })),
})

export const ROME = MetiersSchema.parse(brutMetiers)
export const FAMILLES = FamillesSchema.parse(brutFamilles)
export const NIVEAUX = z.object({
  source: z.string(), licence: z.string(), genere: z.string(),
  niveaux: z.record(z.string(), z.object({ id: z.string(), nom: z.string(), niveau: z.string(), lien: z.string().url() })),
}).parse(brutNiveaux)

/** Après un BTS : accessible tout de suite, après de l'expérience (encadrement), ou avec des études en plus. */
export type Acces = { type: 'direct' | 'experience' | 'etudes'; detail: string | null; onisep: (typeof NIVEAUX.niveaux)[string] | null }
const BAC_PLUS = /^bac \+ (\d+)/
export function acces(code: string): Acces {
  const onisep = NIVEAUX.niveaux[code] ?? null
  const plus = Number(onisep?.niveau.match(BAC_PLUS)?.[1] ?? 0)
  const etudes = FAMILLES.apresBts.etudes[code]
  if (etudes || plus >= 3) return { type: 'etudes', detail: etudes ?? `niveau minimum ${onisep!.niveau} selon l’Onisep`, onisep }
  if (FAMILLES.apresBts.experience.includes(code)) return { type: 'experience', detail: null, onisep }
  return { type: 'direct', detail: null, onisep }
}
export type Metier = (typeof ROME.metiers)[number]
export type Famille = (typeof FAMILLES.familles)[number]

/** Poids affichés à l'élève (PLAN.md §6). */
export const POIDS = { interets: 40, cadre: 25, personnalite: 15, matieres: 20 } as const
export type IdComposante = keyof typeof POIDS
export type Composante = { id: IdComposante; poids: number; score: number | null } // null = pas assez d'infos
export type Piste = { metier: Metier; famille: Famille; score: number; composantes: Composante[]; freins: string[]; acces: Acces }

export const NB_PISTES = 10
export const MAX_PAR_FAMILLE = 3

export type Profil = { publicId: string | null; personnalite: Reponses; gouts: Gouts; scolarite: Scolarite }

export const familleDe = (m: Metier) => FAMILLES.familles.find((f) => f.id === m.famille)!

/** Types d'intérêts du métier d'après ses centres d'intérêt ROME ; ceux de la famille à défaut. */
export function typesDe(m: Metier): string[] {
  const t = [...new Set(m.centres.map((c) => FAMILLES.centresVersTypes[c]).filter((x): x is string => !!x))]
  return t.length ? t : familleDe(m).types
}

const moyenne = (l: number[]) => (l.length ? l.reduce((s, x) => s + x, 0) / l.length : null)
const part = (choix: string[], attendus: string[]) =>
  choix.length ? (100 * choix.filter((x) => attendus.includes(x)).length) / choix.length : null

export function evaluer(m: Metier, p: Profil): Piste {
  const f = familleDe(m)
  const sInt = new Map(interets(p.gouts.activites).map((s) => [s.id, s.score]))
  const aRepondu = Object.keys(p.gouts.activites).length > 0
  const env = part(p.gouts.environnements, f.environnements)
  const val = part(p.gouts.valeurs, f.valeurs)
  const dims = Object.entries(f.personnalite)
  const perso = complet(p.personnalite) ? scorer(p.personnalite) : []
  const leurs = new Set(matieresDe(p.publicId)?.matieres.map((x) => x.id) ?? [])
  const utiles = f.matieres.filter((x) => leurs.has(x))
  const specialite = matieresDe(p.publicId)?.option?.choix.find((c) => c.id === p.scolarite.option)
  const renseignees = Object.keys(p.scolarite.notes).some((x) => leurs.has(x)) || p.scolarite.aimees.some((x) => leurs.has(x))
  const fortes = matieresFortes(p.scolarite, p.publicId)

  const brut: Record<IdComposante, number | null> = {
    interets: aRepondu ? moyenne(typesDe(m).map((t) => sInt.get(t) ?? 0)) : null,
    cadre: moyenne([env, val].filter((x): x is number => x !== null)),
    // 100 = préférence au maximum du pôle attendu, 50 = profil équilibré, 0 = pôle opposé.
    personnalite: perso.length ? moyenne(dims.map(([d, pole]) =>
      50 + ((pole === 'B' ? 1 : -1) * (perso.find((s) => s.id === d)?.score ?? 0)) / 2)) : null,
    // Matières fortes du public, et spécialité choisie (STMG) : 100 si elle prépare à cette famille, 0 sinon.
    matieres: moyenne([
      ...(utiles.length && renseignees ? [(100 * utiles.filter((x) => fortes.includes(x)).length) / utiles.length] : []),
      ...(specialite ? [specialite.familles.includes(f.id) ? 100 : 0] : []),
    ]),
  }
  const composantes = (Object.keys(POIDS) as IdComposante[]).map((id) => ({
    id, poids: POIDS[id], score: brut[id] === null ? null : Math.round(brut[id]!),
  }))
  // Une composante sans réponse ne pénalise pas : on répartit son poids sur les autres.
  const connues = composantes.filter((c) => c.score !== null)
  const poids = connues.reduce((s, c) => s + c.poids, 0)
  const score = poids ? Math.round(connues.reduce((s, c) => s + c.poids * c.score!, 0) / poids) : 0

  const freins = p.gouts.refus.filter((r) => f.freins.includes(r) || (r === 'etudes_longues' && FAMILLES.etudesLongues.includes(m.code)))
  return { metier: m, famille: f, score, composantes, freins, acces: acces(m.code) }
}

/**
 * Les pistes du public : les n mieux classées (3 métiers au plus par famille, pour la variété).
 * Les refus ne cachent rien (cahier des charges) : une piste qui touche un refus reste dans la liste, mais passe après les autres.
 */
export function pistes(p: Profil, n = NB_PISTES): Piste[] {
  const parFamille = new Map<string, number>()
  const bts = parcoursDe(p.publicId) === 'bts'
  return ROME.metiers
    // En BTS, seulement les métiers accessibles avec le diplôme ; les autres apparaissent comme évolutions (« Plus tard »).
    .filter((m) => p.publicId !== null && m.publics.includes(p.publicId) && (!bts || acces(m.code).type === 'direct'))
    .map((m) => evaluer(m, p))
    .sort((a, b) => b.score - a.score || a.metier.code.localeCompare(b.metier.code))
    .filter((x) => {
      const k = parFamille.get(x.famille.id) ?? 0
      parFamille.set(x.famille.id, k + 1)
      return k < MAX_PAR_FAMILLE
    })
    .slice(0, n)
    .sort((a, b) => Number(a.freins.length > 0) - Number(b.freins.length > 0)) // tri stable : l'ordre des scores est gardé
}

const FichesSchema = z.object({
  source: z.string(), version: z.string(), licence: z.string(), genere: z.string(),
  fiches: z.record(z.string(), z.object({
    definition: z.string(), missions: z.array(z.string()), acces: z.string(), contextes: z.record(z.string(), z.array(z.string())),
    mobilites: z.array(z.string().regex(/^[A-N]\d{4}$/)),
  })),
})
export type Fiches = z.infer<typeof FichesSchema>
let fiches: Promise<Fiches> | null = null
/** Fiches ROME propres à chaque métier (définition, missions, accès, conditions), chargées à la demande. */
export function chargerFiches(): Promise<Fiches> {
  fiches ??= import('../../data/fiches-metiers.json').then((m) => FichesSchema.parse(m.default))
  return fiches
}

export const lienFicheMetier = (code: string) => `https://candidat.francetravail.fr/metierscope/fiche-metier/${code}`

/**
 * Le chemin d'un métier, d'après ses mobilités officielles (ROME), limité aux métiers que l'app connaît pour ce public :
 * « proches » = accessibles aussi avec le BTS ; « plusTard » = après de l'expérience ou des études.
 */
export function parcoursMetier(mobilites: string[], publicId: string, code: string) {
  const connus = mobilites.filter((c) => c !== code).map((c) => ROME.metiers.find((m) => m.code === c && m.publics.includes(publicId)))
    .filter((m): m is Metier => !!m)
  return {
    proches: connus.filter((m) => acces(m.code).type === 'direct').slice(0, 3),
    plusTard: connus.filter((m) => acces(m.code).type !== 'direct').slice(0, 4).map((m) => ({ metier: m, acces: acces(m.code) })),
  }
}
