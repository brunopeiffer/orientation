import { useEffect, useRef, useState } from 'react'
import Accueil from './components/Accueil'
import Alternance from './components/Alternance'
import Confidentialite from './components/Confidentialite'
import Formations from './components/Formations'
import Gouts from './components/Gouts'
import Metiers from './components/Metiers'
import PostBts from './components/PostBts'
import ResultatsScolaires from './components/ResultatsScolaires'
import Sauvegarde from './components/Sauvegarde'
import Synthese from './components/Synthese'
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
  // On compare à l'étape précédente plutôt qu'à un « premier rendu » : robuste au double effet de StrictMode.
  const precedente = useRef(courante)
  useEffect(() => {
    if (precedente.current === courante) return
    precedente.current = courante
    main.current?.querySelector<HTMLElement>('h1')?.focus()
    window.scrollTo({ top: 0 })
  }, [courante])

  const total = etapes.length - 1
  const e = etapes[courante]

  // Un titre de page par étape (RGAA 8.6) : utile aux lecteurs d'écran et dans les onglets.
  useEffect(() => {
    document.title = courante === 0 ? 'Mon orientation' : `${e.titre} – étape ${courante} sur ${total} – Mon orientation`
  }, [courante, e.titre, total])

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 px-4 py-4 sm:py-8 print:max-w-none print:p-0">
      <a href="#contenu" className="sr-only rounded-full bg-violet-800 px-4 py-2 font-semibold text-white focus:not-sr-only focus:self-start">
        Aller au contenu
      </a>
      <header className="flex items-center justify-between gap-2 print:hidden">
        <p className="text-lg font-extrabold text-violet-800">
          <span aria-hidden="true">🧭</span> Mon orientation
        </p>
        {prenom && <p className="text-slate-700">Salut {prenom} <span aria-hidden="true">👋</span></p>}
      </header>

      {courante > 0 && (
        <nav aria-label="Progression" className="print:hidden">
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

      <main id="contenu" tabIndex={-1} ref={main} className="flex-1 rounded-3xl bg-white/70 p-5 shadow-sm backdrop-blur sm:p-8 print:rounded-none print:bg-white print:p-0 print:shadow-none">
        {reprise && courante > 0 && (
          <p role="status" className="mb-4 rounded-2xl bg-emerald-50 p-3 font-semibold text-emerald-900 print:hidden">
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
        ) : e.id === 'formations' && parcours === 'bts' ? (
          <PostBts />
        ) : e.id === 'alternance' ? (
          <Alternance />
        ) : (
          <Synthese />
        )}
        {/* Pendant le questionnaire, ses propres boutons Retour / Continuer suffisent. */}
        {courante > 0 && (e.id !== 'personnalite' || complet(personnalite)) && (
          <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-violet-100 pt-4 print:hidden">
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

      <div className="space-y-4 print:hidden">
        <Sauvegarde />
        <Confidentialite />
      </div>
    </div>
  )
}
