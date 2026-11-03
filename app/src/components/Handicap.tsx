import { useId } from 'react'
import contenu from '../../../contenu/handicap.json'
import { HANDICAP_INITIAL } from '../schema'
import { useEtat } from '../store'
import { Bouton, PUCE } from './ui'

/**
 * Module handicap, facultatif (opt-in). Ce que l'élève coche reste dans ce navigateur :
 * ce composant ne fait aucun appel réseau et ses données ne sont lues par aucune recherche.
 */
export default function Handicap() {
  const handicap = useEtat((s) => s.handicap)
  const maj = useEtat((s) => s.maj)
  const id = useId()
  const sujets = handicap.sujets.length ? contenu.sujets.filter((s) => handicap.sujets.includes(s.id)) : contenu.sujets
  const basculer = (sid: string) => {
    const l = useEtat.getState().handicap.sujets
    maj({ handicap: { actif: true, sujets: l.includes(sid) ? l.filter((x) => x !== sid) : [...l, sid] } })
  }

  return (
    <section aria-labelledby={id} className="rounded-3xl border-2 border-teal-200 bg-teal-50/60 p-4 sm:p-5">
      <h2 id={id} className="text-lg font-extrabold text-teal-900"><span aria-hidden="true">🤝 </span>Besoin d’aménagements ? (facultatif)</h2>
      <p className="mt-1 text-teal-950">
        Si tu as un handicap ou un trouble de santé, des aides existent pour tes études et ton alternance. Ce que tu coches ici reste
        uniquement sur cet appareil : ce n’est jamais envoyé sur Internet ni utilisé dans une recherche.
      </p>
      <label className={`${PUCE} mt-3`}>
        <input type="checkbox" checked={handicap.actif} className="size-5 shrink-0 accent-white"
          onChange={() => maj({ handicap: handicap.actif ? HANDICAP_INITIAL : { actif: true, sujets: [] } })} />
        Afficher les informations sur le handicap
      </label>

      {handicap.actif && (
        <div className="mt-4 space-y-4">
          <fieldset>
            <legend className="font-semibold">Ce qui t’intéresse (facultatif)</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {contenu.sujets.map((s) => (
                <label key={s.id} className={PUCE}>
                  <input type="checkbox" checked={handicap.sujets.includes(s.id)} onChange={() => basculer(s.id)} className="size-5 shrink-0 accent-white" />
                  {s.titre}
                </label>
              ))}
            </div>
          </fieldset>
          {sujets.map((s) => (
            <div key={s.id} className="rounded-2xl bg-white p-4">
              <h3 className="font-bold text-teal-900">{s.titre}</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5">{s.points.map((p) => <li key={p}>{p}</li>)}</ul>
              <ul className="mt-2">
                {s.liens.map((l) => (
                  <li key={l.url}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-semibold text-teal-900 underline underline-offset-4">
                      {l.texte}<span className="sr-only"> (s’ouvre dans un nouvel onglet)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-sm text-teal-950">
            Attention : si tu utilises « Sauvegarder », ces choix seront dans ton fichier de sauvegarde. Garde-le pour toi.
          </p>
          <Bouton variante="secondaire" onClick={() => maj({ handicap: HANDICAP_INITIAL })}>Effacer ces informations</Bouton>
          <p className="text-xs text-slate-600">Informations rédigées le {new Date(contenu.date).toLocaleDateString('fr-FR')} à partir des sites officiels cités, en cours de validation.</p>
        </div>
      )}
    </section>
  )
}
