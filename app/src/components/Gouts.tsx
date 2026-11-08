import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { dominants, GOUTS, type Gouts as TGouts } from '../gouts'
import { useEtat } from '../store'
import { Bouton, PUCE } from './ui'

type Liste = 'environnements' | 'valeurs' | 'refus'

// Quatre parties courtes plutôt qu'une page de 8 écrans sur téléphone.
const PARTIES = ['Activités (1/2)', 'Activités (2/2)', 'Lieux et valeurs', 'Ce que tu ne veux pas'] as const
const MOITIE = Math.ceil(GOUTS.activites.length / 2)

export default function Gouts() {
  const gouts = useEtat((s) => s.gouts)
  const maj = useEtat((s) => s.maj)
  const id = useId()
  const [partie, setPartie] = useState(0)
  const titre = useRef<HTMLHeadingElement>(null)
  const precedente = useRef(partie)
  useEffect(() => {
    if (precedente.current === partie) return
    precedente.current = partie
    titre.current?.focus()
    window.scrollTo({ top: 0 })
  }, [partie])
  const changer = (partiel: Partial<TGouts>) => maj({ gouts: { ...useEtat.getState().gouts, ...partiel } })
  const basculer = (liste: Liste, x: string) => {
    const l = useEtat.getState().gouts[liste]
    changer({ [liste]: l.includes(x) ? l.filter((y) => y !== x) : [...l, x] })
  }

  const sansReponse = GOUTS.activites.filter((a) => gouts.activites[a.id] === undefined).length
  const top = dominants(gouts.activites)
  const pleines = gouts.valeurs.length >= GOUTS.maxValeurs

  const cases = (liste: Liste, choix: { id: string; libelle: string }[], desactiver = false) => (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {choix.map((c) => {
        const coche = gouts[liste].includes(c.id)
        return (
          <label key={c.id} className={PUCE}>
            <input type="checkbox" checked={coche} disabled={desactiver && !coche}
              onChange={() => basculer(liste, c.id)} className="size-5 shrink-0 accent-white" />
            {c.libelle}
          </label>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 ref={titre} tabIndex={-1} className="text-[length:var(--da-t-titre)] font-bold text-violet-900">Tes goûts, envies et refus</h1>
        <p className="mt-1 text-slate-700">Pense à ce que tu as aimé en cours, en stage, dans tes loisirs. Tu peux changer tes réponses quand tu veux.</p>
        <p className="mt-1 text-sm font-semibold text-fuchsia-800">Partie {partie + 1} sur {PARTIES.length} : {PARTIES[partie]}</p>
      </div>

      {partie <= 1 && <Carte titre="Qu’est-ce qui te plairait ?" emoji="✨">
        <div className="mt-3 space-y-3">
          {GOUTS.activites.slice(partie * MOITIE, (partie + 1) * MOITIE).map((a) => (
            <fieldset key={a.id} className="rounded-2xl bg-white p-3 ring-1 ring-violet-100">
              <legend className="mb-2 font-semibold">{a.texte}</legend>
              <div className="grid grid-cols-3 gap-2">
                {GOUTS.niveaux.map((n, v) => (
                  <label key={n} className={`${PUCE} justify-center text-center`}>
                    <input type="radio" name={`${id}-${a.id}`} checked={gouts.activites[a.id] === v}
                      onChange={() => changer({ activites: { ...useEtat.getState().gouts.activites, [a.id]: v } })}
                      className="sr-only" />
                    {n}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </Carte>}

      {partie === 1 && <section aria-labelledby={`${id}-top`} className="rounded-3xl bg-[var(--da-nuit)] p-6 text-white">
        <h2 id={`${id}-top`} className="text-lg font-extrabold"><span aria-hidden="true">🎯 </span>Tes intérêts qui ressortent</h2>
        {sansReponse > 0 ? (
          <p className="mt-2">Encore {sansReponse} activité{sansReponse > 1 ? 's' : ''} sans réponse (parties 1 et 2).</p>
        ) : top.length ? (
          <ul className="mt-2 space-y-2">
            {top.map((s) => {
              const t = GOUTS.types.find((x) => x.id === s.id)!
              return <li key={s.id}><strong>{t.nom}</strong> ({s.score} / 100) : {t.description}</li>
            })}
          </ul>
        ) : (
          <p className="mt-2">Aucun type d’activité ne ressort nettement pour l’instant : c’est fréquent, les stages t’aideront à y voir plus clair.</p>
        )}
      </section>}

      {partie === 2 && <>
      <Carte titre="Où te verrais-tu travailler ?" emoji="🏢" aide="Plusieurs choix possibles.">
        {cases('environnements', GOUTS.environnements)}
      </Carte>

      <Carte titre="Ce qui compte le plus pour toi" emoji="💎" aide={`Choisis ${GOUTS.maxValeurs} réponses au maximum.`}>
        <p aria-live="polite" className="mt-1 text-sm font-semibold text-violet-800">{gouts.valeurs.length} sur {GOUTS.maxValeurs} choisie{gouts.valeurs.length > 1 ? 's' : ''}</p>
        {cases('valeurs', GOUTS.valeurs, pleines)}
      </Carte>
      </>}

      {partie === 3 && <Carte titre="Ce que tu ne veux pas" emoji="🚫" aide="Ces refus ne cachent aucune piste : les métiers concernés passent en fin de liste, avec une alerte « Ce qui pourrait te freiner ».">
        {cases('refus', GOUTS.refus)}
      </Carte>}

      <div className="flex flex-wrap justify-between gap-2">
        {partie > 0 ? <Bouton variante="secondaire" onClick={() => setPartie(partie - 1)}><span aria-hidden="true">←</span> Partie précédente</Bouton> : <span />}
        {partie < PARTIES.length - 1 && <Bouton onClick={() => setPartie(partie + 1)}>Partie suivante <span aria-hidden="true">→</span></Bouton>}
      </div>
    </div>
  )
}

export function Carte({ titre, emoji, aide, children }: { titre: string; emoji: string; aide?: string; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="rounded-3xl bg-white/80 p-4 shadow-sm sm:p-5">
      <h2 id={id} className="text-lg font-extrabold text-fuchsia-800"><span aria-hidden="true">{emoji} </span>{titre}</h2>
      {aide && <p className="text-sm text-slate-600">{aide}</p>}
      {children}
    </section>
  )
}
