import { useId } from 'react'
import { GOUTS } from '../gouts'
import { ETAPES } from '../etapes'
import { etudesPour } from '../formations'
import { FAMILLES, lienFicheMetier, pistes, ROME, type Composante, type IdComposante, type Piste } from '../metiers'
import { parcoursDe } from '../schema'
import { useEtat } from '../store'
import Favori from './Favori'
import { Bouton } from './ui'

const LIBELLES: Record<IdComposante, string> = {
  interets: 'Tes intérêts',
  cadre: 'Cadre de travail et valeurs',
  personnalite: 'Ta personnalité',
  matieres: 'Tes matières fortes',
}

export default function Metiers() {
  const { publicId, personnalite, gouts, scolarite } = useEtat()
  const liste = pistes({ publicId, personnalite, gouts, scolarite })
  const manque = (Object.keys(LIBELLES) as IdComposante[]).filter((id) => liste.every((p) => p.composantes.find((c) => c.id === id)!.score === null))

  return (
    <div className="space-y-5">
      <div>
        <h1 tabIndex={-1} className="text-2xl font-extrabold text-violet-900 sm:text-3xl">Pistes métiers et test de réalité</h1>
        <p className="mt-1 text-slate-700">
          Voici {liste.length} pistes à explorer, pas un verdict. Le score montre à quel point chaque métier colle à tes réponses : ouvre le détail pour comprendre pourquoi.
        </p>
      </div>

      {manque.length > 0 && (
        <p role="note" className="rounded-2xl bg-amber-50 p-3 text-amber-950">
          Pour affiner tes pistes, complète les étapes précédentes. Il manque : {manque.map((id) => LIBELLES[id].toLowerCase()).join(', ')}.
        </p>
      )}

      <ol className="space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
        {liste.map((p, k) => <Carte key={p.metier.code} piste={p} rang={k + 1} />)}
      </ol>

      <p className="text-sm text-slate-600">
        Métiers : {ROME.source}, version {ROME.version}, {ROME.licence}. Fiches « réalité » : {FAMILLES.source} ({new Date(FAMILLES.date).toLocaleDateString('fr-FR')}), en cours de validation.
      </p>
    </div>
  )
}

function Carte({ piste, rang }: { piste: Piste; rang: number }) {
  const id = useId()
  const { metier, famille, score, composantes, freins } = piste
  const refus = GOUTS.refus.filter((r) => freins.includes(r.id))
  return (
    <li aria-labelledby={id} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-violet-100 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 [overflow-wrap:anywhere]">
          <p className="text-sm font-semibold text-fuchsia-700">Piste {rang} · {famille.nom}</p>
          <h2 id={id} className="text-lg font-extrabold text-violet-900">{metier.libelle}</h2>
        </div>
        {/* Un libellé plutôt qu'une « note » : le score reste visible, sans effet de bulletin. */}
        <p className="shrink-0 rounded-2xl bg-gradient-to-br from-violet-700 to-fuchsia-700 px-3 py-2 text-center text-sm font-bold text-white">
          {proximite(score)}<span className="block text-xs font-medium">correspondance {score}/100</span>
        </p>
      </div>
      <div className="mt-2"><Favori metier={metier.code} nom={metier.libelle} /></div>

      {refus.length > 0 && (
        <div className="mt-3 rounded-2xl bg-orange-50 p-3 text-orange-950">
          <p className="font-bold"><span aria-hidden="true">⚠️ </span>Ce qui pourrait te freiner</p>
          <ul className="mt-1 list-disc pl-5">
            {refus.map((r) => <li key={r.id}>Tu as indiqué ne pas vouloir : {r.libelle.toLowerCase()}.</li>)}
          </ul>
        </div>
      )}

      <details className="mt-3 rounded-2xl bg-violet-50 p-3">
        <summary className="min-h-6 cursor-pointer font-semibold text-violet-900">Pourquoi ce score ?</summary>
        <ul className="mt-2 space-y-2">
          {composantes.map((c) => <Barre key={c.id} c={c} />)}
        </ul>
        <p className="mt-2 text-sm text-slate-600">Quand une partie manque d’infos, son poids est réparti sur les autres.</p>
      </details>

      <details className="mt-2 rounded-2xl bg-sky-50 p-3">
        <summary className="min-h-6 cursor-pointer font-semibold text-sky-900">Test de réalité : le métier au quotidien</summary>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <div>
            <p className="font-bold text-emerald-900"><span aria-hidden="true">👍 </span>Les avantages</p>
            <ul className="list-disc pl-5">{famille.realite.avantages.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
          <div>
            <p className="font-bold text-orange-900"><span aria-hidden="true">✋ </span>Les contraintes</p>
            <ul className="list-disc pl-5">{famille.realite.contraintes.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </div>
        <EtudesPour famille={famille.id} code={metier.code} />
        {metier.appellations.length > 0 && (
          <p className="mt-3 text-sm"><strong>Autres intitulés de poste :</strong> {metier.appellations.slice(0, 6).join(' ; ')}{metier.appellations.length > 6 ? '…' : ''}</p>
        )}
        <a href={lienFicheMetier(metier.code)} target="_blank" rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-11 items-center font-semibold text-sky-900 underline underline-offset-4">
          Fiche complète sur France Travail (code {metier.code})<span className="sr-only"> (s’ouvre dans un nouvel onglet)</span>
        </a>
      </details>
    </li>
  )
}

export const proximite = (score: number) =>
  score >= 75 ? 'Très proche de toi' : score >= 55 ? 'Proche de toi' : score >= 35 ? 'À explorer' : 'Plus éloigné'

function Barre({ c }: { c: Composante }) {
  return (
    <li>
      <div className="flex justify-between gap-2 text-sm">
        <span>{LIBELLES[c.id]} <span className="text-slate-600">(compte pour {c.poids} %)</span></span>
        <strong>{c.score === null ? 'pas assez d’infos' : `${c.score} / 100`}</strong>
      </div>
      <div aria-hidden="true" className="mt-1 h-2 rounded-full bg-white">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600" style={{ width: `${c.score ?? 0}%` }} />
      </div>
    </li>
  )
}

function EtudesPour({ famille, code }: { famille: string; code: string }) {
  const maj = useEtat((s) => s.maj)
  const parcours = parcoursDe(useEtat((s) => s.publicId))
  const etudes = etudesPour(famille)
  const etapeFormations = parcours ? ETAPES[parcours].findIndex((e) => e.id === 'formations') : -1
  return (
    <div className="mt-3 rounded-2xl bg-white p-3 text-sm">
      <p className="font-bold text-violet-900"><span aria-hidden="true">🎓 </span>Les études pour y arriver</p>
      {etudes.length > 0 && <p className="mt-1">Par exemple : {etudes.join(' ; ')}.</p>}
      {FAMILLES.etudesLongues.includes(code) && <p className="mt-1 font-semibold text-orange-900">Ce métier demande souvent un bac+5 ou plus.</p>}
      {etapeFormations > 0 && (
        <Bouton variante="secondaire" className="mt-2" onClick={() => maj({ etape: etapeFormations })}>Voir les formations près de chez toi</Bouton>
      )}
    </div>
  )
}
