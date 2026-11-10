import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { ETAT_INITIAL, EtatSchema, migrer, VERSION_ETAT, type Etat } from './schema'

export const CLE_STOCKAGE = 'orientation-etat'

type Actions = {
  maj: (partiel: Partial<Etat>) => void
  remplacer: (etat: Etat) => void
  effacer: () => void
}

export const useEtat = create<Etat & Actions>()(
  persist(
    (set) => ({
      ...ETAT_INITIAL,
      maj: (partiel) => set(partiel),
      remplacer: (etat) => set(etat),
      effacer: () => {
        set(ETAT_INITIAL)
        useEtat.persist.clearStorage()
      },
    }),
    {
      name: CLE_STOCKAGE,
      version: VERSION_ETAT,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => etatBrut(s),
      migrate: (ancien, version) => migrer(ancien, version) as Etat,
      // Un stockage abîmé ou modifié à la main ne doit pas casser l'app : on repart de zéro.
      // Champ par champ : une donnée abîmée remet seulement ce champ à zéro, pas toutes les réponses.
      merge: (persiste, actuel) => {
        const p = (persiste ?? {}) as Record<string, unknown>
        const sain = Object.fromEntries(Object.entries(EtatSchema.shape).map(([k, schema]) => {
          const r = schema.safeParse(p[k])
          return [k, r.success ? r.data : ETAT_INITIAL[k as keyof Etat]]
        }))
        return { ...actuel, ...sain }
      },
    },
  ),
)

const etatBrut = ({ prenom, publicId, etape, avertissementLu, personnalite, gouts, scolarite, mobilite, handicap, favoris }: Etat & Actions): Etat =>
  ({ prenom, publicId, etape, avertissementLu, personnalite, gouts, scolarite, mobilite, handicap, favoris })

export const etatSeul = (s: Etat & Actions): Etat => EtatSchema.parse(etatBrut(s))

/** Métier d'où l'élève est parti voir les formations (non sauvegardé) : pour y revenir en un clic. */
export const useRetour = create<{ metier: { code: string; libelle: string; etape: number } | null }>(() => ({ metier: null }))
