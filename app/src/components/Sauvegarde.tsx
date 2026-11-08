import { useId, useRef, useState } from 'react'
import { lireSauvegarde, telecharger } from '../sauvegarde'
import { etatSeul, useEtat } from '../store'
import { Bouton } from './ui'

/** Barre Sauvegarder / Reprendre / Tout effacer, présente sur tous les écrans. */
export default function Sauvegarde() {
  const remplacer = useEtat((s) => s.remplacer)
  const effacer = useEtat((s) => s.effacer)
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null)
  const dialogue = useRef<HTMLDialogElement>(null)
  const id = useId()

  async function importer(fichier: File | undefined) {
    if (!fichier) return
    const res = lireSauvegarde(await fichier.text())
    if (res.ok) {
      remplacer(res.etat)
      setMessage({ texte: 'Ta sauvegarde a bien été rechargée.', erreur: false })
    } else {
      setMessage({ texte: res.erreur, erreur: true })
    }
  }

  return (
    <section aria-label="Sauvegarde de tes réponses" className="rounded-3xl bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-wrap justify-center gap-2">
        <Bouton variante="secondaire" onClick={() => telecharger(etatSeul(useEtat.getState()))}>
          <span aria-hidden="true">💾</span> Sauvegarder
        </Bouton>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-white px-5 py-2 font-medium text-violet-800 ring-1 ring-violet-800 transition-colors duration-300 hover:bg-violet-50 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-violet-700">
          <span aria-hidden="true">📂</span> Reprendre une sauvegarde
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              importer(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </label>
        <Bouton variante="danger" onClick={() => dialogue.current?.showModal()}>
          <span aria-hidden="true">🗑️</span> Tout effacer
        </Bouton>
      </div>
      <p role="status" className={`mt-2 text-center text-sm font-semibold ${message?.erreur ? 'text-rose-700' : 'text-emerald-800'}`}>
        {message?.texte}
      </p>

      <dialog ref={dialogue} aria-labelledby={`${id}-titre`} className="m-auto max-w-sm rounded-3xl p-6 backdrop:bg-slate-900/50">
        <h2 id={`${id}-titre`} className="text-lg font-bold">Tout effacer ?</h2>
        <p className="mt-2 text-slate-700">
          Toutes tes réponses seront supprimées de ce navigateur. Si tu n’as pas de sauvegarde, tu ne pourras pas les récupérer.
        </p>
        <form method="dialog" className="mt-4 flex flex-wrap justify-end gap-2">
          <Bouton type="submit" variante="secondaire">Annuler</Bouton>
          <Bouton
            type="submit"
            variante="danger"
            onClick={() => {
              effacer()
              setMessage({ texte: 'Tout a été effacé.', erreur: false })
            }}
          >
            Oui, tout effacer
          </Bouton>
        </form>
      </dialog>
    </section>
  )
}
