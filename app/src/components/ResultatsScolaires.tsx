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
          Pas besoin de ta note exacte : choisis une tranche, ou laisse « Je ne sais pas ». Coche aussi les matières que tu aimes, même si tes notes sont moyennes.
        </p>
      </div>

      {!config ? (
        <p className="rounded-2xl bg-violet-50 p-4">Les matières de ta formation ne sont pas encore disponibles.</p>
      ) : (
        <>
          {config.option && (
            <Carte titre={config.option.question} emoji="🧩">
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

          <Carte titre="Tes matières" emoji="📚" aide="Moyenne de l’année en cours, approximative.">
            <ul className="mt-3 space-y-3">
              {config.matieres.map((m) => (
                <li key={m.id} className="rounded-2xl bg-white p-3 ring-1 ring-violet-100 sm:flex sm:items-center sm:gap-3">
                  <label htmlFor={`${id}-${m.id}`} className="block font-semibold sm:flex-1">{m.libelle}</label>
                  <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-0">
                    <select id={`${id}-${m.id}`} value={scolarite.notes[m.id] ?? ''} onChange={(e) => noter(m.id, e.target.value)}
                      className="min-h-11 rounded-2xl border-2 border-slate-300 bg-white px-3 focus:border-violet-600">
                      <option value="">Je ne sais pas</option>
                      {MATIERES.tranches.map((t) => <option key={t.id} value={t.id}>{t.libelle}</option>)}
                    </select>
                    <label className={PUCE}>
                      <input type="checkbox" checked={scolarite.aimees.includes(m.id)} onChange={() => aimer(m.id)}
                        className="size-5 shrink-0 accent-white" />
                      J’aime<span className="sr-only"> : {m.libelle}</span>
                    </label>
                  </div>
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
