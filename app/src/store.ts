import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { ETAT_INITIAL, EtatSchema, VERSION_ETAT, type Etat } from './schema'

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
      partialize: ({ prenom, publicId, etape, avertissementLu }) => ({ prenom, publicId, etape, avertissementLu }),
      // Ajouter ici les migrations quand VERSION_ETAT augmente.
      migrate: (ancien) => ancien as Etat,
      // Un stockage abîmé ou modifié à la main ne doit pas casser l'app : on repart de zéro.
      merge: (persiste, actuel) => {
        const ok = EtatSchema.safeParse(persiste)
        return ok.success ? { ...actuel, ...ok.data } : actuel
      },
    },
  ),
)

export const etatSeul = (s: Etat & Actions): Etat => EtatSchema.parse({
  prenom: s.prenom,
  publicId: s.publicId,
  etape: s.etape,
  avertissementLu: s.avertissementLu,
})
