import { z } from 'zod'
import brutNaf from '../../contenu/entreprises-naf.json'
import { distanceRoute, type Point } from './formations'
import { obtenirJson, PROXY_URL } from './net'

const NafSchema = z.object({
  statut: z.string(),
  date: z.string(),
  familles: z.record(z.string(), z.array(z.string().regex(/^\d{2}\.\d{2}[A-Z]$/)).min(1)),
  libelles: z.record(z.string(), z.string()),
})
export const NAF = NafSchema.parse(brutNaf)

/** Arrondi à 0,01° (≈ 1 km) : on ne transmet que le voisinage du centre de la commune. */
const arrondi = (x: number) => Math.round(x * 100) / 100

export const RAYON_MAX_ENTREPRISES = 50 // limite de l'API Recherche d'entreprises
export const RAYON_MAX_OFFRES = 100 // limite du proxy

// --- Recherche d'entreprises (API publique de l'État, sans clé ; champs vérifiés sur une réponse réelle) ---

const EntreprisesSchema = z.object({
  results: z.array(z.object({
    nom_complet: z.string(),
    tranche_effectif_salarie: z.string().nullable().optional(),
    matching_etablissements: z.array(z.object({
      siret: z.string(),
      adresse: z.string().nullable().optional(),
      latitude: z.coerce.number().nullable().optional(),
      longitude: z.coerce.number().nullable().optional(),
      activite_principale: z.string().nullable().optional(),
      etat_administratif: z.string().nullable().optional(),
      libelle_commune: z.string().nullable().optional(),
      nom_commercial: z.string().nullable().optional(),
      liste_enseignes: z.array(z.string()).nullable().optional(),
    })),
  })),
})

export type Entreprise = {
  siret: string; nom: string; adresse: string | null; lat: number | null; lon: number | null
  activite: string | null; recrute: boolean; url: string | null
}

export const codesNaf = (familles: string[]) => [...new Set(familles.flatMap((f) => NAF.familles[f] ?? []))].sort()

export async function chercherEntreprises(depuis: Point, rayon: number, familles: string[], signal?: AbortSignal): Promise<Entreprise[]> {
  const naf = codesNaf(familles)
  if (!naf.length) return []
  const q = new URLSearchParams({
    lat: String(arrondi(depuis.lat)), long: String(arrondi(depuis.lon)),
    radius: String(Math.min(rayon, RAYON_MAX_ENTREPRISES)), activite_principale: naf.join(','), per_page: '25',
  })
  const r = EntreprisesSchema.parse(await obtenirJson(`https://recherche-entreprises.api.gouv.fr/near_point?${q}`, signal))
  return r.results.flatMap((e) => e.matching_etablissements
    // Établissements ouverts, et dont l'activité est bien celle cherchée (l'API compare aussi l'activité du siège).
    .filter((x) => x.etat_administratif === 'A' && (!x.activite_principale || naf.includes(x.activite_principale)))
    .map((x) => ({
      siret: x.siret,
      nom: x.liste_enseignes?.[0] ?? x.nom_commercial ?? e.nom_complet,
      adresse: x.adresse ?? null,
      lat: x.latitude ?? null, lon: x.longitude ?? null,
      activite: (x.activite_principale && NAF.libelles[x.activite_principale]) ?? x.activite_principale ?? null,
      recrute: false, url: null,
    })))
}

// --- Offres en alternance (La bonne alternance, via le proxy qui garde la clé secrète) ---

const OffresSchema = z.object({
  source: z.string(),
  date: z.string(),
  offres: z.array(z.object({
    id: z.string(), titre: z.string(), entreprise: z.string(), siret: z.string().nullable(), adresse: z.string().nullable(),
    lat: z.number().nullable(), lon: z.number().nullable(), contrats: z.array(z.string()), debut: z.string().nullable(),
    niveau: z.string().nullable(), url: z.string().url().nullable(), partenaire: z.string().nullable(),
  })),
  recruteurs: z.array(z.object({
    siret: z.string(), nom: z.string(), adresse: z.string().nullable(), lat: z.number().nullable(), lon: z.number().nullable(),
    activite: z.string().nullable(), url: z.string().url().nullable(),
  })),
})
export type ReponseOffres = z.infer<typeof OffresSchema>

export const proxyConfigure = () => PROXY_URL.startsWith('https://')

export async function chercherOffres(depuis: Point, rayon: number, romes: string[], signal?: AbortSignal): Promise<ReponseOffres> {
  if (!proxyConfigure()) throw new Error('proxy non configuré')
  const q = new URLSearchParams({
    lat: String(arrondi(depuis.lat)), lon: String(arrondi(depuis.lon)),
    radius: String(Math.min(rayon, RAYON_MAX_OFFRES)), romes: romes.slice(0, 10).join(','),
  })
  return OffresSchema.parse(await obtenirJson(`${PROXY_URL}/alternance?${q}`, signal))
}

const FormationsSchema = z.object({
  source: z.string(),
  date: z.string(),
  formations: z.array(z.object({
    id: z.string(), titre: z.string(), organisme: z.string(), ville: z.string().nullable(), lat: z.number().nullable(), lon: z.number().nullable(),
    distanciel: z.boolean(), qualiopi: z.boolean().nullable(), onisep: z.string().url().nullable(), debut: z.string().nullable(),
  })),
})
export type ReponseFormations = z.infer<typeof FormationsSchema>

/**
 * Après un BTS, on ne propose que des formations ouvertes à ce BTS : le DCG (et le DSCG, le DGC de l'Intec) sont réservés
 * au parcours comptable (BTS CG). Avant le bac (STMG), tout reste ouvert.
 */
export const formationsPourPublic = (formations: ReponseFormations['formations'], publicId: string | null) =>
  publicId?.startsWith('BTS_') && publicId !== 'BTS_CG'
    ? formations.filter((f) => !/\b(DCG|DSCG|DGC)\b|comptabilit[ée] et (de )?gestion \(dipl[ôo]me de\)|dipl[ôo]me (sup[ée]rieur )?de comptabilit[ée] et de gestion/i.test(f.titre))
    : formations

/** Formations en apprentissage (catalogue des Carif-Oref via La bonne alternance) : niveau 5 = bac+2, 6 = bac+3. */
export async function chercherFormationsApprentissage(depuis: Point, rayon: number, romes: string[], niveau: '5' | '6', signal?: AbortSignal): Promise<ReponseFormations> {
  if (!proxyConfigure()) throw new Error('proxy non configuré')
  const q = new URLSearchParams({
    lat: String(arrondi(depuis.lat)), lon: String(arrondi(depuis.lon)),
    radius: String(Math.min(rayon, RAYON_MAX_OFFRES)), romes: romes.slice(0, 10).join(','), niveau,
  })
  return FormationsSchema.parse(await obtenirJson(`${PROXY_URL}/formations?${q}`, signal))
}

/** Entreprises proches + recruteurs de La bonne alternance, sans doublon (même SIRET) ; les recruteurs passent devant. */
export function fusionnerEntreprises(entreprises: Entreprise[], recruteurs: ReponseOffres['recruteurs'], depuis: Point) {
  const vus = new Set<string>()
  return [...recruteurs.map((r) => ({ ...r, recrute: true })), ...entreprises]
    .filter((e) => !vus.has(e.siret) && vus.add(e.siret))
    .map((e) => ({ e, km: e.lat !== null && e.lon !== null ? distanceRoute(depuis, { lat: e.lat, lon: e.lon }) : null }))
    .sort((a, b) => Number(b.e.recrute) - Number(a.e.recrute) || (a.km ?? 1e9) - (b.km ?? 1e9))
}

// --- Liens (mode dégradé et fiches officielles) ---

/** Recherche préremplie sur le site La bonne alternance (paramètres lus dans son code source officiel). */
export function lienLBA(metier: string, commune: { nom: string; cp: string } & Point, rayon: number) {
  const q = new URLSearchParams({
    q: metier, latitude: String(arrondi(commune.lat)), longitude: String(arrondi(commune.lon)),
    radius: String(Math.min(rayon, RAYON_MAX_OFFRES)), lieu_label: `${commune.nom}${commune.cp ? ` ${commune.cp}` : ''}`, mode: 'emplois',
  })
  return `https://labonnealternance.apprentissage.beta.gouv.fr/recherche?${q}`
}

export const lienAnnuaire = (siret: string) => `https://annuaire-entreprises.data.gouv.fr/etablissement/${encodeURIComponent(siret)}`

/**
 * Stage : une recherche par famille (l'API ne renvoie que 25 entreprises, les plus proches : une seule famille dense,
 * comme les banques en centre-ville, prendrait toute la place), puis on alterne les familles. Requêtes l'une après l'autre
 * pour rester sous la limite de débit de l'API.
 */
export async function chercherEntreprisesVariees(depuis: Point, rayon: number, familles: string[]): Promise<Entreprise[]> {
  const listes: Entreprise[][] = []
  for (const f of familles) listes.push(await chercherEntreprises(depuis, rayon, [f]))
  const vus = new Set<string>()
  const sortie: Entreprise[] = []
  for (let k = 0; listes.some((l) => k < l.length); k++) {
    for (const l of listes) if (l[k] && !vus.has(l[k].siret)) { vus.add(l[k].siret); sortie.push(l[k]) }
  }
  return sortie
}

// Atouts de chaque formation, d'après les contenus décrits par l'Onisep (blocs professionnels des BTS). À VALIDER.
const ATOUTS: Record<string, string> = {
  BTS_CG: 'à tenir la comptabilité courante (saisie, factures, rapprochements bancaires), à préparer les déclarations de TVA et les éléments de paie, et à travailler sur tableur et logiciel de gestion',
  BTS_NDRC: 'à prospecter et à suivre une clientèle, de l’accueil jusqu’à la fidélisation, à vendre en face à face comme à distance, et à animer un site ou des réseaux sociaux',
  BTS_SAM: 'à organiser et suivre des dossiers, à gérer agendas, réunions et déplacements, à appuyer la gestion du personnel (recrutement, intégration) et à conduire de petits projets',
}
const ATOUTS_LYCEE = 'en gestion, en marketing, en droit et sur les outils numériques, avec la rigueur que demande la série STMG'

/**
 * Demande de stage rédigée comme le conseillerait un recruteur : objet précis, accroche sur l'entreprise (« vous »),
 * atouts concrets de la formation (« moi »), une réussite personnelle, puis une proposition d'échange (« nous »).
 * Remplie dans le navigateur, jamais envoyée par l'app ; les crochets sont à remplacer par l'élève.
 */
export function lettreStage({ prenom, formation, publicId, metiers }: { prenom: string; formation: string; publicId: string | null; metiers: string[] }) {
  const bts = !!publicId && publicId in ATOUTS
  const poste = metiers[0]
  return [
    `Objet : Demande de stage – ${formation} – du [date de début] au [date de fin]`,
    '',
    'Madame, Monsieur,',
    '',
    '[Nom de l’entreprise] retient mon attention pour [un fait précis : un produit, un service, une actualité, un avis client, une rencontre…]. C’est pourquoi je souhaite y effectuer mon stage de [durée] semaines, du [date de début] au [date de fin].',
    '',
    `${bts ? 'Étudiant(e) en' : 'Élève de'} ${formation}, j’apprends ${bts ? ATOUTS[publicId!] : ATOUTS_LYCEE}.${poste ? ` Je serais heureux(se) de mettre ces compétences au service de votre équipe, notamment auprès de votre ${poste.split(' / ')[0].toLowerCase()}.` : ''}`,
    'Lors de [mon dernier stage, un job d’été, un projet de classe], j’ai [une réussite concrète : un résultat, une responsabilité confiée, un retour positif reçu].',
    '',
    '[Deux qualités qu’on t’a déjà reconnues, par exemple : sérieux(se) et souriant(e)], je m’adapte vite et j’apprends en observant.',
    '',
    'Je me permettrai de vous appeler la semaine prochaine pour convenir d’un court échange, à votre convenance. Mon établissement vous fournira la convention de stage ; vous trouverez mon CV ci-joint.',
    '',
    'Je vous prie d’agréer, Madame, Monsieur, l’expression de mes salutations distinguées.',
    '',
    `${prenom || '[Prénom]'} [Nom]`,
    '[Téléphone] · [Adresse mail]',
  ].join('\n')
}
