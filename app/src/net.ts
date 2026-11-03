import config from '../../config/sources.json'

export type Source = (typeof config.sources)[number]
export const SOURCES: Source[] = config.sources

/** Seul point de sortie réseau de l'app : refuse tout hôte absent de config/sources.json, n'envoie ni cookie ni référent. */
export async function obtenirJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const u = new URL(url)
  if (u.protocol !== 'https:' || !SOURCES.some((s) => s.hote === u.host)) {
    throw new Error(`Appel réseau refusé : ${u.host} n’est pas dans config/sources.json`)
  }
  const r = await fetch(u, { credentials: 'omit', referrerPolicy: 'no-referrer', signal })
  if (!r.ok) throw new Error(`Le service ${u.host} a répondu ${r.status}`)
  return r.json()
}
