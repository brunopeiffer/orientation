import type { Parcours } from './schema'

export type Etape = { id: string; titre: string; jalon: string }

const communes = (formations: string): Etape[] => [
  { id: 'accueil', titre: 'Bienvenue', jalon: 'M0' },
  { id: 'personnalite', titre: 'Ton profil de personnalité', jalon: 'M1' },
  { id: 'gouts', titre: 'Tes goûts, envies et refus', jalon: 'M2' },
  { id: 'resultats', titre: 'Tes résultats (estimations)', jalon: 'M2' },
  { id: 'metiers', titre: 'Pistes métiers et test de réalité', jalon: 'M3' },
  { id: 'formations', titre: formations, jalon: 'M4' },
  { id: 'alternance', titre: 'Entreprises et alternance', jalon: 'M6' },
  { id: 'synthese', titre: 'Ta synthèse et ton plan d’action', jalon: 'M7' },
]

export const ETAPES: Record<Parcours, Etape[]> = {
  lycee: communes('Formations près de chez toi'),
  bts: communes('Poursuites d’études après ton BTS'),
}
