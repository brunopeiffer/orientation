import { useId } from 'react'
import { MATIERES, matieresDe, matieresFortes, type Scolarite } from '../gouts'
import { useEtat } from '../store'
import { Carte } from './Gouts'
import { PUCE } from './ui'

export default function ResultatsScolaires() {
  const { scolarite, publicId, maj } = useEtat()
  const id = useId()
  const config = matieresDe(publicId)
  const changer = (partiel: Partial<Scolarite>) => maj({ scolarite: { ...useEtat.getState().scolarite, ...partiel } })
  const fortes = matieresFortes(scolarite, publicId)

  function noter(matiere: string, tranche: string) {
    const { [matiere]: _, ...notes } = useEtat.getState().scolarite.notes
    changer({ notes: tranche ? { ...notes, [matiere]: tranche } : notes })
  }
  function aimer(matiere: string) {
    const a = useEtat.getState().scolarite.aimees
    changer({ aimees: a.includes(matiere) ? a.filter((x) => x !== matiere) : [...a, matiere] })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 tabIndex={-1} className="text-[length:var(--da-t-titre)] font-bold text-violet-900">Tes résultats (estimations)</h1>
        <p className="mt-1 text-slate-700">
          Pour chaque matière, touche la case qui correspond à ta moyenne de l’année (à peu près). Pas besoin de la note exacte, et « Je ne sais pas » convient aussi. Coche « J’aime » pour les matières qui te plaisent, même si tes notes sont moyennes.
        </p>
      </div>

      {!config ? (
        <p className="rounded-2xl bg-violet-50 p-4">Les matières de ta formation ne sont pas encore disponibles.</p>
      ) : (
        <>
          {config.option && (
            <Carte titre={config.option.question} emoji="🧩" aide="Ce choix compte peu dans tes pistes : quelle que soit ta spécialité, toutes les études restent ouvertes.">
              <fieldset className="mt-3">
                <legend className="sr-only">{config.option.question}</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {config.option.choix.map((c) => (
                    <label key={c.id} className={PUCE}>
                      <input type="radio" name={`${id}-option`} checked={scolarite.option === c.id}
                        onChange={() => changer({ option: c.id })} className="size-5 shrink-0 accent-white" />
                      {c.libelle}
                    </label>
                  ))}
                </div>
              </fieldset>
            </Carte>
          )}

          <Carte titre="Tes matières" emoji="📚" aide="Ta moyenne de l’année en cours, à peu près.">
            <p aria-live="polite" className="mt-1 text-sm font-semibold text-violet-800">
              {config.matieres.filter((m) => scolarite.notes[m.id]).length} matière(s) renseignée(s) sur {config.matieres.length}
            </p>
            <ul className="mt-3 space-y-3">
              {config.matieres.map((m) => (
                <li key={m.id} className="rounded-2xl bg-white p-3 ring-1 ring-violet-100">
                  {/* Des cases à toucher plutôt qu'une liste déroulante : on voit tout de suite où répondre. */}
                  <fieldset>
                    <legend className="font-semibold">{m.libelle}</legend>
                    <p className="text-sm text-slate-600">Ma moyenne :</p>
                    <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-7">
                      {[{ id: '', libelle: 'Je ne sais pas' }, ...MATIERES.tranches].map((t) => (
                        <label key={t.id} className={`${PUCE} justify-center text-center`}>
                          <input type="radio" name={`${id}-${m.id}`} checked={(scolarite.notes[m.id] ?? '') === t.id}
                            onChange={() => noter(m.id, t.id)} className="sr-only" />
                          {t.libelle}<span className="sr-only"> en {m.libelle}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <label className={`${PUCE} mt-2 w-fit`}>
                    <input type="checkbox" checked={scolarite.aimees.includes(m.id)} onChange={() => aimer(m.id)}
                      className="size-5 shrink-0 accent-white" />
                    J’aime cette matière<span className="sr-only"> : {m.libelle}</span>
                  </label>
                </li>
              ))}
            </ul>
          </Carte>

          <section aria-labelledby={`${id}-fortes`} className="rounded-3xl bg-[var(--da-nuit)] p-6 text-white">
            <h2 id={`${id}-fortes`} className="text-lg font-extrabold"><span aria-hidden="true">💪 </span>Tes points d’appui</h2>
            {fortes.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {fortes.map((f) => <li key={f}>{config.matieres.find((m) => m.id === f)!.libelle}</li>)}
              </ul>
            ) : (
              <p className="mt-2">Indique une tranche à 12 ou plus, ou coche « J’aime », pour voir tes points d’appui.</p>
            )}
          </section>
        </>
      )}
    </div>
  )
}
