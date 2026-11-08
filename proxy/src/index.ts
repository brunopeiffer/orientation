/**
 * Proxy de l'app d'orientation (Cloudflare Worker). Seul rôle : appeler La bonne alternance avec le jeton
 * secret LBA_TOKEN (variable d'environnement du Worker), sans jamais l'exposer au navigateur.
 *
 * Règles : CORS limité aux origines de l'app, limite de débit par appareil, cache d'une heure,
 * AUCUN journal (ni commune, ni coordonnées, ni paramètres) : ce fichier n'écrit jamais dans les journaux (testé).
 * Route La bonne alternance vérifiée dans le code source officiel (mission-apprentissage/api-apprentissage) :
 * GET /api/job/v1/search?latitude&longitude&radius&romes, en-tête « Authorization: Bearer <clé> ».
 */

export interface Env {
  LBA_TOKEN?: string
  ALLOWED_ORIGINS?: string
  LIMITEUR?: { limit(o: { key: string }): Promise<{ success: boolean }> }
}

type Cache = { match(r: Request): Promise<Response | undefined>; put(r: Request, res: Response): Promise<void> }
export type Deps = { fetch: typeof fetch; cache: Cache | null; attendre?: (p: Promise<unknown>) => void }

export const LBA = 'https://api.apprentissage.beta.gouv.fr/api/job/v1/search'
export const TTL = 3600
const SOURCE = 'La bonne alternance (offres de France Travail, Indeed, Monster et d’autres partenaires)'

export type Params = { lat: number; lon: number; radius: number; romes: string[] }

/** Valide la requête de l'app ; les coordonnées sont arrondies (≈ 1 km) : on ne cherche qu'autour d'une commune. */
export function lireParams(url: URL): Params | string {
  const lat = Number(url.searchParams.get('lat'))
  const lon = Number(url.searchParams.get('lon'))
  const radius = Number(url.searchParams.get('radius'))
  const romes = (url.searchParams.get('romes') ?? '').split(',').filter(Boolean)
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) return 'coordonnées invalides'
  if (!Number.isInteger(radius) || radius < 1 || radius > 100) return 'rayon invalide (1 à 100 km)'
  if (!romes.length || romes.length > 10 || !romes.every((r) => /^[A-N]\d{4}$/.test(r))) return 'codes ROME invalides (1 à 10)'
  return { lat: Math.round(lat * 100) / 100, lon: Math.round(lon * 100) / 100, radius, romes: [...new Set(romes)].sort() }
}

export type Offre = {
  id: string; titre: string; entreprise: string; siret: string | null; adresse: string | null
  lat: number | null; lon: number | null; contrats: string[]; debut: string | null; niveau: string | null
  url: string | null; partenaire: string | null
}
export type Recruteur = { siret: string; nom: string; adresse: string | null; lat: number | null; lon: number | null; activite: string | null; url: string | null }

type Brut = Record<string, unknown>
const obj = (x: unknown): Brut => (x && typeof x === 'object' ? (x as Brut) : {})
const txt = (x: unknown): string | null => (typeof x === 'string' && x.trim() ? x.trim() : null)
const point = (x: unknown): [number, number] | [null, null] => {
  const c = obj(x).coordinates
  return Array.isArray(c) && typeof c[0] === 'number' && typeof c[1] === 'number' ? [c[1], c[0]] : [null, null]
}
const https = (x: unknown) => { const u = txt(x); return u && u.startsWith('https://') ? u : null }

/** Ne garde que ce dont l'app a besoin. Renvoie null si la réponse n'a pas la forme attendue (échec propre). */
export function convertir(json: unknown): { offres: Offre[]; recruteurs: Recruteur[] } | null {
  const j = obj(json)
  if (!Array.isArray(j.jobs) || !Array.isArray(j.recruiters)) return null
  const offres = j.jobs.map((x): Offre | null => {
    const id = obj(obj(x).identifier), w = obj(obj(x).workplace), o = obj(obj(x).offer), c = obj(obj(x).contract)
    const titre = txt(o.title)
    if (!titre || !txt(id.id)) return null
    const [lat, lon] = point(obj(w.location).geopoint)
    return {
      id: txt(id.id)!, titre, entreprise: txt(w.brand) ?? txt(w.legal_name) ?? txt(w.name) ?? 'Entreprise non précisée',
      siret: txt(w.siret), adresse: txt(obj(w.location).address), lat, lon,
      contrats: Array.isArray(c.type) ? c.type.filter((t): t is string => typeof t === 'string') : [],
      debut: txt(c.start), niveau: txt(obj(o.target_diploma).label), url: https(obj(obj(x).apply).url), partenaire: txt(id.partner_label),
    }
  }).filter((x): x is Offre => x !== null)
  const recruteurs = j.recruiters.map((x): Recruteur | null => {
    const w = obj(obj(x).workplace)
    const siret = txt(w.siret)
    if (!siret) return null
    const [lat, lon] = point(obj(w.location).geopoint)
    return {
      siret, nom: txt(w.brand) ?? txt(w.legal_name) ?? txt(w.name) ?? 'Entreprise', adresse: txt(obj(w.location).address), lat, lon,
      activite: txt(obj(obj(w.domain).naf).label), url: https(obj(obj(x).apply).url),
    }
  }).filter((x): x is Recruteur => x !== null)
  return { offres, recruteurs }
}

/** « Commercial(e) H/F en alternance » et « commercial en alternance (F/H) » : même offre. */
export const normaliserTitre = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/\b[hf]\s*\/\s*[hf]\b|\(e\)|\be\b/g, ' ').replace(/en (alternance|apprentissage)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim()

/**
 * Une même offre peut arriver par plusieurs partenaires (France Travail, Indeed…) : on la garde une fois.
 * Une entreprise qui a déjà une offre n'est pas répétée dans les « entreprises qui recrutent ».
 */
export function dedoublonner(offres: Offre[], recruteurs: Recruteur[]) {
  const vus = new Set<string>()
  const uniques = offres.filter((o) => {
    const cle = `${o.siret ?? normaliserTitre(o.entreprise)}|${normaliserTitre(o.titre)}`
    if (vus.has(cle)) return false
    vus.add(cle)
    return true
  })
  const avecOffre = new Set(uniques.map((o) => o.siret).filter(Boolean))
  const sirets = new Set<string>()
  const recr = recruteurs.filter((r) => !avecOffre.has(r.siret) && !sirets.has(r.siret) && sirets.add(r.siret))
  return { offres: uniques, recruteurs: recr }
}

function origineAutorisee(req: Request, env: Env): string | null {
  const o = req.headers.get('Origin')
  const ok = (env.ALLOWED_ORIGINS ?? '').split(',').map((x) => x.trim()).filter(Boolean)
  return o && ok.includes(o) ? o : null
}

const json = (corps: unknown, statut: number, origine: string | null, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(corps), {
    status: statut,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      ...(origine ? { 'Access-Control-Allow-Origin': origine, Vary: 'Origin' } : {}),
      ...extra,
    },
  })

export async function traiter(req: Request, env: Env, deps: Deps): Promise<Response> {
  const origine = origineAutorisee(req, env)
  if (!origine) return json({ erreur: 'origine_refusee' }, 403, null)
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': origine, 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Max-Age': '86400', Vary: 'Origin' } })
  }
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.pathname !== '/alternance') return json({ erreur: 'introuvable' }, 404, origine)
  const p = lireParams(url)
  if (typeof p === 'string') return json({ erreur: 'parametres', detail: p }, 400, origine)
  if (!env.LBA_TOKEN) return json({ erreur: 'non_configure' }, 503, origine)

  const cle = new Request(`https://cache.orientation.invalid/alternance?lat=${p.lat}&lon=${p.lon}&radius=${p.radius}&romes=${p.romes.join(',')}`)
  const enCache = await deps.cache?.match(cle)
  if (enCache) return json(await enCache.json(), 200, origine, { 'Cache-Control': 'private, max-age=600', 'X-Cache': 'HIT' })

  if (env.LIMITEUR) {
    const { success } = await env.LIMITEUR.limit({ key: req.headers.get('CF-Connecting-IP') ?? 'inconnu' })
    if (!success) return json({ erreur: 'trop_de_requetes' }, 429, origine, { 'Retry-After': '60' })
  }

  const q = new URLSearchParams({ latitude: String(p.lat), longitude: String(p.lon), radius: String(p.radius), romes: p.romes.join(',') })
  let reponse: Response
  try {
    reponse = await deps.fetch(`${LBA}?${q}`, { headers: { Authorization: `Bearer ${env.LBA_TOKEN.trim()}`, Accept: 'application/json' }, signal: AbortSignal.timeout(8000) })
  } catch (e) {
    // Seulement le type d'erreur (TimeoutError, TypeError…), jamais son message qui pourrait contenir la clé.
    return json({ erreur: 'indisponible', statut: e instanceof Error ? e.name : 'inconnu' }, 503, origine)
  }
  // Le code HTTP de la source (jamais la clé ni les paramètres) aide à diagnostiquer sans journal.
  if (reponse.status === 429 || reponse.status >= 500) return json({ erreur: 'indisponible', statut: reponse.status }, 503, origine)
  if (!reponse.ok) return json({ erreur: 'refus_source', statut: reponse.status }, 502, origine)
  const donnees = convertir(await reponse.json().catch(() => null))
  if (!donnees) return json({ erreur: 'reponse_inattendue' }, 502, origine)

  const corps = { source: SOURCE, date: new Date().toISOString().slice(0, 10), ...dedoublonner(donnees.offres, donnees.recruteurs) }
  const mise = deps.cache?.put(cle, new Response(JSON.stringify(corps), { headers: { 'Content-Type': 'application/json', 'Cache-Control': `s-maxage=${TTL}` } }))
  if (mise) deps.attendre ? deps.attendre(mise) : await mise
  return json(corps, 200, origine, { 'Cache-Control': 'private, max-age=600', 'X-Cache': 'MISS' })
}

export default {
  fetch(req: Request, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }): Promise<Response> {
    const cache = (caches as unknown as { default: Cache }).default
    // fetch doit garder son « this » global : appelé comme deps.fetch(), Workers lève « Illegal invocation ».
    return traiter(req, env, { fetch: (u, i) => fetch(u, i), cache, attendre: (p) => ctx.waitUntil(p) })
  },
}
