import type { Etat } from '../schema'
import { useEtat } from '../store'

type FormationFavorite = Etat['favoris']['formations'][number]

/** Bouton « Garder » : ajoute ou retire un métier (code ROME) ou une formation des favoris, repris dans la synthèse. */
export default function Favori({ metier, formation, nom }: { metier?: string; formation?: FormationFavorite; nom: string }) {
  const favoris = useEtat((s) => s.favoris)
  const maj = useEtat((s) => s.maj)
  const actif = metier ? favoris.metiers.includes(metier) : favoris.formations.some((f) => f.id === formation!.id)

  function basculer() {
    const f = useEtat.getState().favoris
    maj({
      favoris: metier
        ? { ...f, metiers: actif ? f.metiers.filter((m) => m !== metier) : [...f.metiers, metier].slice(-30) }
        : { ...f, formations: actif ? f.formations.filter((x) => x.id !== formation!.id) : [...f.formations, formation!].slice(-30) },
    })
  }

  return (
    <button type="button" onClick={basculer} aria-pressed={actif}
      className={`inline-flex min-h-11 items-center gap-1 rounded-full px-4 text-sm font-semibold ring-2 print:hidden ${actif ? 'bg-amber-100 text-amber-900 ring-amber-300' : 'bg-white text-violet-800 ring-violet-200 hover:ring-violet-400'}`}>
      <span aria-hidden="true">{actif ? '★' : '☆'}</span> {actif ? 'Gardé' : 'Garder'}<span className="sr-only"> : {nom} {actif ? '(dans tes favoris, cliquer pour retirer)' : '(ajouter à tes favoris)'}</span>
    </button>
  )
}
