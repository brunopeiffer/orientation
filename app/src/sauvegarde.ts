import { EtatSchema, FichierSchema, migrer, VERSION_ETAT, type Etat } from './schema'

const TAILLE_MAX = 1_000_000 // octets : une sauvegarde normale fait moins de 50 Ko

export function exporter(etat: Etat, maintenant = new Date()): string {
  return JSON.stringify({ app: 'orientation', version: VERSION_ETAT, exporteLe: maintenant.toISOString(), etat }, null, 2)
}

export type Lecture = { ok: true; etat: Etat } | { ok: false; erreur: string }

export function lireSauvegarde(texte: string): Lecture {
  if (texte.length > TAILLE_MAX) return { ok: false, erreur: 'Ce fichier est trop gros pour être une sauvegarde de l’app.' }
  let brut: unknown
  try {
    brut = JSON.parse(texte)
  } catch {
    return { ok: false, erreur: 'Ce fichier n’est pas une sauvegarde lisible (format JSON attendu).' }
  }
  const fichier = FichierSchema.safeParse(brut)
  const res = fichier.success ? EtatSchema.safeParse(migrer(fichier.data.etat, fichier.data.version)) : fichier
  if (!res.success) {
    const detail = res.error.issues[0]
    return { ok: false, erreur: `Ce fichier n’est pas une sauvegarde valide de l’app (${detail.path.join('.') || 'fichier'} : ${detail.message}).` }
  }
  return { ok: true, etat: res.data as Etat }
}

export function nomFichier(maintenant = new Date()): string {
  return `orientation-sauvegarde-${maintenant.toISOString().slice(0, 10)}.json`
}

export function telecharger(etat: Etat) {
  const url = URL.createObjectURL(new Blob([exporter(etat)], { type: 'application/json' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: nomFichier() })
  a.click()
  URL.revokeObjectURL(url)
}
