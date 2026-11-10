import { useEffect, useId, useState } from 'react'
import { GOUTS } from '../gouts'
import { ETAPES } from '../etapes'
import { etudesPour } from '../formations'
import { chargerFiches, FAMILLES, lienFicheMetier, NIVEAUX, parcoursMetier, pistes, ROME, type Acces, type Fiches, type Composante, type IdComposante, type Piste } from '../metiers'
import { parcoursDe } from '../schema'
import { useEtat, useRetour } from '../store'
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
  const [fiches, setFiches] = useState<Fiches | null>(null)
  useEffect(() => { chargerFiches().then(setFiches).catch(() => setFiches(null)) }, [])
  // Retour depuis les formations : on revient sur la carte du métier, son « test de réalité » ouvert.
  useEffect(() => {
    const m = useRetour.getState().metier
    if (!m) return
    // Après le défilement en haut que fait App au changement d'étape. On n'oublie le métier qu'une fois revenu dessus
    // (en développement, React monte l'écran deux fois : l'oublier tout de suite ferait rater le retour).
    const t = setTimeout(() => {
      useRetour.setState({ metier: null })
      const carte = document.getElementById(`piste-${m.code}`)
      const realite = carte?.querySelector<HTMLDetailsElement>('details[data-realite]')
      if (realite) realite.open = true
      carte?.scrollIntoView({ block: 'start' })
      carte?.querySelector<HTMLElement>('h2')?.focus()
    }, 50)
    return () => clearTimeout(t)
  }, [])
  const manque = (Object.keys(LIBELLES) as IdComposante[]).filter((id) => liste.every((p) => p.composantes.find((c) => c.id === id)!.score === null))

  return (
    <div className="space-y-5">
      <div>
        <h1 tabIndex={-1} className="text-[length:var(--da-t-titre)] font-bold text-violet-900">Pistes métiers et test de réalité</h1>
        <p className="mt-1 text-slate-700">
          Voici {liste.length} pistes à explorer, pas un verdict. Le score montre à quel point chaque métier colle à tes réponses : ouvre le détail pour comprendre pourquoi.
          {parcoursDe(publicId) === 'bts' && ' Ce sont des métiers accessibles avec ton BTS ; sous chacun, tu vois vers quoi il peut mener plus tard.'}
        </p>
      </div>

      {manque.length > 0 && (
        <p role="note" className="rounded-2xl bg-amber-50 p-3 text-amber-950">
          Pour affiner tes pistes, complète les étapes précédentes. Il manque : {manque.map((id) => LIBELLES[id].toLowerCase()).join(', ')}.
        </p>
      )}

      <ol className="space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
        {liste.map((p, k) => <Carte key={p.metier.code} piste={p} rang={k + 1} fiches={fiches} />)}
      </ol>

      <p className="text-sm text-slate-600">
        Métiers : {ROME.source}, version {ROME.version}, {ROME.licence}. Niveaux d’accès : {NIVEAUX.source}, {NIVEAUX.licence}, extrait le {new Date(NIVEAUX.genere).toLocaleDateString('fr-FR')}. Fiches « réalité » : {FAMILLES.source} ({new Date(FAMILLES.date).toLocaleDateString('fr-FR')}), en cours de validation.
      </p>
    </div>
  )
}

function Carte({ piste, rang, fiches }: { piste: Piste; rang: number; fiches: Fiches | null }) {
  const id = useId()
  const { metier, famille, score, composantes, freins } = piste
  const bts = parcoursDe(useEtat((s) => s.publicId)) === 'bts'
  const refus = GOUTS.refus.filter((r) => freins.includes(r.id))
  return (
    <li id={`piste-${metier.code}`} aria-labelledby={id} className="scroll-mt-20 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-violet-100 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 basis-56 [overflow-wrap:break-word]">
          <p className="text-sm font-semibold text-fuchsia-700">Piste {rang} · {famille.nom}</p>
          <h2 id={id} tabIndex={-1} className="text-xl font-bold text-violet-900">{metier.libelle}</h2>
        </div>
        {/* Un libellé plutôt qu'une « note » : le score reste visible, sans effet de bulletin. */}
        <p className="shrink-0 rounded-2xl bg-violet-900 px-3 py-2 text-center text-sm font-semibold text-white">
          {proximite(score)}<span className="block text-xs font-medium">correspondance {score}/100</span>
        </p>
      </div>
      <div className="mt-2"><Favori metier={metier.code} nom={metier.libelle} /></div>
      {bts && <AccesBts acces={piste.acces} />}
      {bts && fiches?.fiches[metier.code] && <Parcours mobilites={fiches.fiches[metier.code].mobilites} code={metier.code} />}

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

      <details data-realite className="mt-2 rounded-2xl bg-sky-50 p-3">
        <summary className="min-h-6 cursor-pointer font-semibold text-sky-900">Test de réalité : le métier au quotidien</summary>
        {fiches?.fiches[metier.code] && <FicheRome f={fiches.fiches[metier.code]} source={`${fiches.source}, ${fiches.version}`} />}
        <p className="mt-4 font-semibold text-sky-950">Points communs aux métiers « {famille.nom} »</p>
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
        <EtudesPour famille={famille.id} code={metier.code} libelle={metier.libelle} />
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
        <div className="h-full rounded-full bg-violet-700" style={{ width: `${c.score ?? 0}%` }} />
      </div>
    </li>
  )
}

function EtudesPour({ famille, code, libelle }: { famille: string; code: string; libelle: string }) {
  const maj = useEtat((s) => s.maj)
  const parcours = parcoursDe(useEtat((s) => s.publicId))
  // En BTS, les exemples post-bac (BTS, BUT, L1, DCG…) ne s'appliquent pas : les poursuites adaptées au BTS sont à l'étape suivante.
  const etudes = parcours === 'bts' ? [] : etudesPour(famille)
  const onisep = NIVEAUX.niveaux[code]
  const etapeFormations = parcours ? ETAPES[parcours].findIndex((e) => e.id === 'formations') : -1
  return (
    <div className="mt-3 rounded-2xl bg-white p-3 text-sm">
      <p className="font-bold text-violet-900"><span aria-hidden="true">🎓 </span>Les études pour y arriver</p>
      {etudes.length > 0 && <p className="mt-1">Par exemple : {etudes.join(' ; ')}.</p>}
      {parcours === 'bts' && <p className="mt-1">Les poursuites possibles après ton BTS (licences pro, bachelors, écoles…) sont à l’étape « Poursuites d’études ».</p>}
      {FAMILLES.etudesLongues.includes(code) && <p className="mt-1 font-semibold text-orange-900">Ce métier demande souvent un bac+5 ou plus.</p>}
      {onisep && (
        <p className="mt-1">
          Niveau minimum d’accès selon l’Onisep : <strong>{onisep.niveau}</strong>{' '}
          (<a href={onisep.lien} target="_blank" rel="noopener noreferrer" className="font-semibold text-violet-800 underline">fiche « {onisep.nom} »<span className="sr-only"> (nouvel onglet)</span></a>).
        </p>
      )}
      {etapeFormations > 0 && (
        <Bouton variante="secondaire" className="mt-2" onClick={() => {
          useRetour.setState({ metier: { code, libelle, etape: useEtat.getState().etape } })
          maj({ etape: etapeFormations })
        }}>Voir les formations près de chez toi</Bouton>
      )}
    </div>
  )
}

/** Pour un étudiant de BTS : ce métier est-il accessible en arrêtant ses études après le BTS ? */
function AccesBts({ acces }: { acces: Acces }) {
  const [style, icone, texte] = {
    direct: ['bg-emerald-50 text-emerald-950', '✅', 'Accessible avec ton BTS'],
    experience: ['bg-amber-50 text-amber-950', '⏳', 'Poste à responsabilités : en général après quelques années d’expérience'],
    etudes: ['bg-orange-50 text-orange-950', '🎓', `Pas accessible avec le BTS seul : ${acces.detail}`],
  }[acces.type]
  return (
    <p className={`mt-3 rounded-2xl p-3 font-semibold ${style}`}>
      <span aria-hidden="true">{icone} </span>{texte}
      {acces.type === 'direct' && !acces.onisep && <span className="block text-sm font-normal">Pas de fiche Onisep équivalente : estimation à vérifier.</span>}
    </p>
  )
}

/** Ce qui est propre à ce métier, d'après sa fiche ROME (France Travail) : pas de texte commun à toute la famille. */
function FicheRome({ f, source }: { f: Fiches['fiches'][string]; source: string }) {
  return (
    <div className="mt-2 space-y-3">
      <div>
        <p className="font-bold text-sky-950"><span aria-hidden="true">🧰 </span>Ce que fait ce métier</p>
        <p className="mt-1">{f.definition}</p>
        {f.missions.length > 0 && <ul className="mt-1 list-disc pl-5">{f.missions.map((m) => <li key={m}>{m}</li>)}</ul>}
      </div>
      {Object.keys(f.contextes).length > 0 && (
        <div>
          <p className="font-bold text-sky-950"><span aria-hidden="true">🕒 </span>Conditions de travail</p>
          <ul className="mt-1 space-y-1">
            {Object.entries(f.contextes).map(([type, items]) => <li key={type}><strong>{type} :</strong> {items.join(' ; ')}</li>)}
          </ul>
        </div>
      )}
      <div>
        <p className="font-bold text-sky-950"><span aria-hidden="true">🎓 </span>Pour y accéder</p>
        <p className="mt-1">{f.acces}</p>
      </div>
      <p className="text-sm text-slate-600">Source : {source}.</p>
    </div>
  )
}

/** Sur l'étape des formations : revenir au métier d'où l'on vient (s'il y en a un). */
export function RetourMetier() {
  const metier = useRetour((s) => s.metier)
  const maj = useEtat((s) => s.maj)
  if (!metier) return null
  return (
    <Bouton variante="secondaire" className="print:hidden" onClick={() => maj({ etape: metier.etape })}>
      <span aria-hidden="true">←</span> Revenir au métier « {metier.libelle} »
    </Bouton>
  )
}

/** BTS : vers quels métiers celui-ci peut mener (mobilités officielles France Travail), sans laisser croire qu'on y accède tout de suite. */
function Parcours({ mobilites, code }: { mobilites: string[]; code: string }) {
  const publicId = useEtat((s) => s.publicId)!
  const { proches, plusTard } = parcoursMetier(mobilites, publicId, code)
  if (!proches.length && !plusTard.length) return null
  return (
    <div className="mt-3 rounded-2xl bg-violet-50 p-3 text-sm">
      {proches.length > 0 && (
        <p><strong>Métiers proches, accessibles aussi avec ton BTS :</strong> {proches.map((m) => m.libelle).join(' ; ')}.</p>
      )}
      {plusTard.length > 0 && (
        <>
          <p className={proches.length ? 'mt-2' : ''}><strong><span aria-hidden="true">📈 </span>Plus tard, avec de l’expérience ou des études :</strong></p>
          <ul className="mt-1 list-disc pl-5">
            {plusTard.map(({ metier, acces }) => (
              <li key={metier.code}>{metier.libelle} <span className="text-slate-600">({acces.type === 'experience' ? 'après quelques années d’expérience' : acces.detail})</span></li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-1 text-xs text-slate-600">D’après les évolutions possibles indiquées par France Travail (ROME).</p>
    </div>
  )
}
