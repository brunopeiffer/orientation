import { useEffect, useRef, useState } from 'react'
import Accueil from './components/Accueil'
import Confidentialite from './components/Confidentialite'
import Formations from './components/Formations'
import Gouts from './components/Gouts'
import Metiers from './components/Metiers'
import ResultatsScolaires from './components/ResultatsScolaires'
import Sauvegarde from './components/Sauvegarde'
import TestPersonnalite from './components/TestPersonnalite'
import { complet } from './personnalite'
import { Bouton } from './components/ui'
import { ETAPES } from './etapes'
import { parcoursDe } from './schema'
import { useEtat } from './store'

export default function App() {
  const { prenom, publicId, etape, personnalite, maj } = useEtat()
  const parcours = parcoursDe(publicId)
  const etapes = parcours ? ETAPES[parcours] : ETAPES.lycee
  const courante = parcours ? Math.min(etape, etapes.length - 1) : 0
  const [reprise] = useState(() => useEtat.getState().etape > 0)
  const main = useRef<HTMLElement>(null)

  // Au changement d'étape, on place le focus sur le titre (lecteurs d'écran, clavier).
  const premierRendu = useRef(true)
  useEffect(() => {
    if (premierRendu.current) return void (premierRendu.current = false)
    main.current?.querySelector<HTMLElement>('h1')?.focus()
    window.scrollTo({ top: 0 })
  }, [courante])

  const total = etapes.length - 1
  const e = etapes[courante]

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 px-4 py-4 sm:py-8">
      <header className="flex items-center justify-between gap-2">
        <p className="text-lg font-extrabold text-violet-800">
          <span aria-hidden="true">🧭</span> Mon orientation
        </p>
        {prenom && <p className="text-slate-700">Salut {prenom} <span aria-hidden="true">👋</span></p>}
      </header>

      {courante > 0 && (
        <nav aria-label="Progression">
          <p className="mb-1 text-sm font-semibold text-slate-700">Étape {courante} sur {total}</p>
          <div
            role="progressbar"
            aria-label="Progression dans le parcours"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={courante}
            aria-valuetext={`Étape ${courante} sur ${total} : ${e.titre}`}
            className="h-3 overflow-hidden rounded-full bg-white shadow-inner"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 transition-all"
              style={{ width: `${(courante / total) * 100}%` }}
            />
          </div>
        </nav>
      )}

      <main ref={main} className="flex-1 rounded-3xl bg-white/70 p-5 shadow-sm backdrop-blur sm:p-8">
        {reprise && courante > 0 && (
          <p role="status" className="mb-4 rounded-2xl bg-emerald-50 p-3 font-semibold text-emerald-900">
            Content de te revoir{prenom ? `, ${prenom}` : ''} ! Tu reprends là où tu t’étais arrêté(e).
          </p>
        )}
        {courante === 0 ? (
          <Accueil />
        ) : e.id === 'personnalite' ? (
          <TestPersonnalite key={courante} />
        ) : e.id === 'gouts' ? (
          <Gouts />
        ) : e.id === 'resultats' ? (
          <ResultatsScolaires />
        ) : e.id === 'metiers' ? (
          <Metiers />
        ) : e.id === 'formations' && parcours === 'lycee' ? (
          <Formations />
        ) : (
          <div className="space-y-6">
            <h1 tabIndex={-1} className="text-2xl font-extrabold text-violet-900 sm:text-3xl">{e.titre}</h1>
            <p className="rounded-2xl bg-violet-50 p-4 text-slate-700">
              <span aria-hidden="true">🚧</span> Cette étape arrive bientôt.
            </p>
          </div>
        )}
        {/* Pendant le questionnaire, ses propres boutons Retour / Continuer suffisent. */}
        {courante > 0 && (e.id !== 'personnalite' || complet(personnalite)) && (
          <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-violet-100 pt-4">
            <Bouton variante="secondaire" onClick={() => maj({ etape: courante - 1 })}>
              <span aria-hidden="true">←</span> Étape précédente
            </Bouton>
            {courante < total && (
              <Bouton onClick={() => maj({ etape: courante + 1 })}>
                Étape suivante <span aria-hidden="true">→</span>
              </Bouton>
            )}
          </div>
        )}
      </main>

      <Sauvegarde />
      <Confidentialite />
    </div>
  )
}
