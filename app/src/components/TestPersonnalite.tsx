import { useEffect, useRef, useState, type RefObject } from 'react'
import { acquiescement, complet, scorer, TEST, type ScoreDimension } from '../personnalite'
import { useEtat } from '../store'
import { Bouton, PUCE } from './ui'

const PAR_PAGE = 6
const NB_PAGES = Math.ceil(TEST.items.length / PAR_PAGE)
const INTENSITE = { legere: 'Préférence légère', marquee: 'Préférence marquée', tres_marquee: 'Préférence très marquée' }

export const PHOTO = 'Ce test donne une photo de tes préférences aujourd’hui, pas une étiquette définitive.'

export default function TestPersonnalite() {
  const reponses = useEtat((s) => s.personnalite)
  const maj = useEtat((s) => s.maj)
  // Reprise : on rouvre la page de la première question sans réponse, ou les résultats.
  const [page, setPage] = useState(() => {
    const k = TEST.items.findIndex((i) => !reponses[i.id])
    return k < 0 ? NB_PAGES : Math.floor(k / PAR_PAGE)
  })
  const [manquantes, setManquantes] = useState<number[]>([])
  const titre = useRef<HTMLHeadingElement>(null)
  const precedente = useRef(page) // comparaison robuste au double effet de StrictMode

  useEffect(() => {
    if (precedente.current === page) return
    precedente.current = page
    titre.current?.focus()
    window.scrollTo({ top: 0 })
  }, [page])

  if (page >= NB_PAGES && complet(reponses)) {
    return <Resultats titre={titre} onRevoir={() => setPage(0)} />
  }

  const debut = page * PAR_PAGE
  const items = TEST.items.slice(debut, debut + PAR_PAGE)
  const nbRepondues = TEST.items.filter((i) => reponses[i.id]).length

  function continuer() {
    const vides = items.map((i, k) => (reponses[i.id] ? 0 : debut + k + 1)).filter(Boolean)
    setManquantes(vides)
    if (!vides.length) setPage(page + 1)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 ref={titre} tabIndex={-1} className="text-2xl font-extrabold text-violet-900 sm:text-3xl">
          Ton profil de personnalité
        </h1>
        <p className="mt-1 text-slate-700">
          Réponds spontanément : il n’y a ni bonne ni mauvaise réponse. Page {page + 1} sur {NB_PAGES} · {nbRepondues} réponses sur {TEST.items.length}.
        </p>
      </div>

      {items.map((item, k) => {
        const n = debut + k + 1
        const manque = manquantes.includes(n)
        return (
          <fieldset key={item.id} className={`rounded-3xl bg-white p-4 shadow-sm ring-2 ${manque ? 'ring-rose-400' : 'ring-transparent'}`}>
            <legend className="sr-only">Question {n} : {item.texte}</legend>
            <p aria-hidden="true" className="text-sm font-bold text-fuchsia-700">Question {n}</p>
            <p aria-hidden="true" className="mt-1 text-lg font-semibold">{item.texte}</p>
            {manque && <p className="mt-1 font-semibold text-rose-700">Il manque ta réponse ici.</p>}
            <div className="mt-3 grid gap-2 sm:grid-cols-5">
              {TEST.echelle.map((libelle, v) => (
                <label
                  key={libelle}
                  className={`${PUCE} sm:flex-col sm:justify-center sm:text-center`}
                >
                  <input
                    type="radio"
                    name={item.id}
                    checked={reponses[item.id] === v + 1}
                    onChange={() => {
                      maj({ personnalite: { ...useEtat.getState().personnalite, [item.id]: v + 1 } })
                      setManquantes((m) => m.filter((x) => x !== n))
                    }}
                    className="size-5 shrink-0 accent-white"
                  />
                  {libelle}
                </label>
              ))}
            </div>
          </fieldset>
        )
      })}

      {manquantes.length > 0 && (
        <p role="alert" className="font-semibold text-rose-700">
          Réponds à {manquantes.length > 1 ? `toutes les questions (il en manque ${manquantes.length})` : 'la question qui manque'} pour continuer.
        </p>
      )}

      <div className="flex flex-wrap justify-between gap-2">
        <Bouton variante="secondaire" onClick={() => (page === 0 ? maj({ etape: 0 }) : setPage(page - 1))}>
          <span aria-hidden="true">←</span> Retour
        </Bouton>
        <Bouton onClick={continuer}>
          {page === NB_PAGES - 1 ? 'Voir mon profil' : 'Continuer'} <span aria-hidden="true">→</span>
        </Bouton>
      </div>
    </div>
  )
}

function Resultats({ titre, onRevoir }: { titre: RefObject<HTMLHeadingElement>; onRevoir: () => void }) {
  const reponses = useEtat((s) => s.personnalite)
  const scores = scorer(reponses)
  const preferes = scores.filter((s) => s.pole)

  return (
    <div className="space-y-5">
      <h1 ref={titre} tabIndex={-1} className="text-2xl font-extrabold text-violet-900 sm:text-3xl">
        Ton profil de personnalité en 4 dimensions
      </h1>

      <div role="note" className="rounded-3xl border-2 border-sky-300 bg-sky-50 p-4 text-sky-950">
        <p className="font-bold"><span aria-hidden="true">📸 </span>{PHOTO}</p>
        <p className="mt-1 text-sm">
          Tes préférences peuvent évoluer avec tes expériences. Ce résultat est indicatif : il ne remplace pas un échange avec ton professeur principal ou un(e) psychologue de l’Éducation nationale.
        </p>
      </div>

      {acquiescement(reponses) > 1 && (
        <p className="rounded-2xl bg-amber-50 p-3 text-amber-950">
          Tu as souvent répondu « d’accord ». Ton profil paraît donc plus équilibré qu’il ne l’est peut-être : tu peux revoir tes réponses en pensant à des situations précises.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {scores.map((s) => <Dimension key={s.id} s={s} />)}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Liste titre="Tes points forts" emoji="💪" couleur="bg-emerald-50 text-emerald-950"
          items={preferes.flatMap((s) => pole(s).forces).concat(preferes.length < 4 ? [TEST.equilibre] : [])} />
        <Liste titre="Tes points de vigilance" emoji="🔎" couleur="bg-orange-50 text-orange-950"
          items={preferes.length ? preferes.flatMap((s) => pole(s).vigilance) : ['Aucune préférence nette : observe dans quelles situations tu te sens le mieux.']} />
      </div>

      <Bouton variante="secondaire" onClick={onRevoir}>Revoir mes réponses</Bouton>
    </div>
  )
}

const dim = (s: ScoreDimension) => TEST.dimensions.find((d) => d.id === s.id)!
const pole = (s: ScoreDimension) => dim(s)[s.pole!]

function Dimension({ s }: { s: ScoreDimension }) {
  const d = dim(s)
  const resume = s.pole ? `${INTENSITE[s.intensite as keyof typeof INTENSITE]} : ${d[s.pole].libelle.toLowerCase()}` : 'Équilibré'
  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm">
      <h2 className="text-lg font-extrabold text-fuchsia-800">{d.nom}</h2>
      <p className="text-sm text-slate-600">{d.question}</p>
      <div aria-hidden="true" className="mt-4">
        <div className="relative h-3 rounded-full bg-gradient-to-r from-sky-400 via-violet-300 to-orange-400">
          <span
            className="absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-violet-800 shadow"
            style={{ left: `${(s.score + 100) / 2}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between gap-4 text-xs font-semibold text-slate-700">
          <span>{d.A.libelle}</span>
          <span className="text-right">{d.B.libelle}</span>
        </div>
      </div>
      <p className="mt-3 font-bold">{resume}</p>
      <p className="text-slate-700">{s.pole ? d[s.pole].description : TEST.equilibre}</p>
      {s.nuance && (
        <p className="mt-2 text-sm text-slate-600">
          Tes réponses sont nuancées sur ce point : tu réagis peut-être différemment selon les situations.
        </p>
      )}
    </section>
  )
}

function Liste({ titre, emoji, couleur, items }: { titre: string; emoji: string; couleur: string; items: string[] }) {
  return (
    <section className={`rounded-3xl p-4 ${couleur}`}>
      <h2 className="text-lg font-extrabold"><span aria-hidden="true">{emoji} </span>{titre}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {items.map((t) => <li key={t}>{t}</li>)}
      </ul>
    </section>
  )
}
