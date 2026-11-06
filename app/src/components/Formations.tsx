import { useEffect, useId, useState, type FormEvent } from 'react'
import {
  acces, CATEGORIES, chargerRegion, COEF_DETOUR, filtrer, INDEX, regionsUtiles, type Categorie, type Formation, type Resultat,
} from '../formations'
import { chercherCommunes, RechercheSchema, type Commune } from '../geocodage'
import { FAMILLES, pistes } from '../metiers'
import { RAYONS } from '../schema'
import { useEtat } from '../store'
import { Carte } from './Gouts'
import { Bouton, PUCE } from './ui'

const PAR_PAGE = 20
const NOM_FAMILLE = Object.fromEntries(FAMILLES.familles.map((f) => [f.id, f.nom]))

export default function Formations() {
  const { mobilite, maj, publicId, personnalite, gouts, scolarite } = useEtat()
  const id = useId()
  const { commune, rayon } = mobilite
  // Les familles des pistes métiers de l'élève, seulement s'il a répondu aux goûts (sinon les pistes ne veulent rien dire).
  const mesFamilles = Object.keys(gouts.activites).length
    ? [...new Set(pistes({ publicId, personnalite, gouts, scolarite }).map((p) => p.famille.id))]
    : []
  const [categories, setCategories] = useState<Categorie[]>([...CATEGORIES])
  const [enLien, setEnLien] = useState(mesFamilles.length > 0)
  const [alternance, setAlternance] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [nb, setNb] = useState(PAR_PAGE)
  const [formations, setFormations] = useState<Formation[] | null>(null)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    if (!commune) return
    let actif = true
    setFormations(null)
    setErreur('')
    Promise.all(regionsUtiles(commune, rayon).map(chargerRegion))
      .then((l) => actif && setFormations(l.flat()))
      .catch(() => actif && setErreur('Impossible de charger les formations. Recharge la page pour réessayer.'))
    return () => { actif = false }
  }, [commune, rayon])

  const resultats: Resultat[] = commune && formations
    ? filtrer(formations, commune, { rayon, categories, enLien: enLien ? mesFamilles : null, alternance, recherche })
    : []
  const changer = <T,>(f: (v: T) => void) => (v: T) => { f(v); setNb(PAR_PAGE) }

  return (
    <div className="space-y-5">
      <div>
        <h1 tabIndex={-1} className="text-2xl font-extrabold text-violet-900 sm:text-3xl">Formations près de chez toi</h1>
        <p className="mt-1 text-slate-700">
          Toutes les formations de Parcoursup ouvertes aux bacheliers technologiques, autour de chez toi. Les chances d’accès sont des tendances, pas des promesses.
        </p>
      </div>

      <ChoixCommune commune={commune} onChoix={(c) => maj({ mobilite: { ...mobilite, commune: c } })} />

      {commune && (
        <>
          <ChoixRayon rayon={rayon} onChoix={(r) => { maj({ mobilite: { ...mobilite, rayon: r } }); setNb(PAR_PAGE) }} />

          <Carte titre="Affiner" emoji="🎛️">
            <fieldset className="mt-3">
              <legend className="font-semibold">Types de formation</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <label key={c} className={PUCE}>
                    <input type="checkbox" checked={categories.includes(c)} className="size-5 shrink-0 accent-white"
                      onChange={() => changer(setCategories)(categories.includes(c) ? categories.filter((x) => x !== c) : [...categories, c])} />
                    {c}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className={PUCE}>
                <input type="checkbox" checked={enLien} disabled={!mesFamilles.length} onChange={() => changer(setEnLien)(!enLien)}
                  className="size-5 shrink-0 accent-white" />
                En lien avec mes pistes métiers
              </label>
              <label className={PUCE}>
                <input type="checkbox" checked={alternance} onChange={() => changer(setAlternance)(!alternance)} className="size-5 shrink-0 accent-white" />
                En apprentissage (alternance) seulement
              </label>
            </div>
            {!mesFamilles.length && <p className="mt-2 text-sm text-slate-600">Réponds à l’étape « Tes goûts » pour voir les formations en lien avec tes pistes.</p>}
            <label htmlFor={`${id}-q`} className="mt-3 block font-semibold">Chercher une formation, un établissement ou une ville</label>
            <input id={`${id}-q`} type="search" value={recherche} onChange={(e) => changer(setRecherche)(e.target.value)} maxLength={60}
              className="mt-1 w-full rounded-2xl border-2 border-slate-300 px-4 py-3 focus:border-violet-600" />
          </Carte>

          {erreur ? <p role="alert" className="font-semibold text-rose-700">{erreur}</p> : !formations ? (
            <p role="status" className="rounded-2xl bg-violet-50 p-4">Chargement des formations…</p>
          ) : (
            <section aria-labelledby={`${id}-res`} className="space-y-3">
              <h2 id={`${id}-res`} className="text-xl font-extrabold text-violet-900" aria-live="polite">
                {resultats.length} formation{resultats.length > 1 ? 's' : ''} trouvée{resultats.length > 1 ? 's' : ''}
              </h2>
              {resultats.length === 0 && <p>Élargis la distance ou décoche des filtres pour voir plus de formations.</p>}
              <ul className="space-y-3">
                {resultats.slice(0, nb).map((r) => <CarteFormation key={r.f.i} r={r} mesFamilles={mesFamilles} />)}
              </ul>
              {resultats.length > nb && (
                <Bouton variante="secondaire" onClick={() => setNb(nb + PAR_PAGE)}>Voir {Math.min(PAR_PAGE, resultats.length - nb)} formations de plus</Bouton>
              )}
            </section>
          )}
        </>
      )}

      <p className="text-sm text-slate-600">
        Source : {INDEX.source}, formations {INDEX.annee}, chances d’accès d’après la session {INDEX.session}, {INDEX.licence}.
        Distances : à vol d’oiseau × {String(COEF_DETOUR).replace('.', ',')} pour tenir compte des routes, donc approximatives.
      </p>
    </div>
  )
}

export function ChoixRayon({ rayon, onChoix }: { rayon: number | null; onChoix: (r: number | null) => void }) {
  const id = useId()
  return (
    <Carte titre="Jusqu’où es-tu prêt(e) à aller ?" emoji="🚆">
      <fieldset className="mt-3">
        <legend className="sr-only">Distance maximale</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {RAYONS.map((r) => (
            <label key={String(r)} className={`${PUCE} justify-center text-center`}>
              <input type="radio" name={`${id}-rayon`} checked={rayon === r} className="sr-only" onChange={() => onChoix(r)} />
              {r === null ? 'Partout en France' : `${r} km`}
            </label>
          ))}
        </div>
      </fieldset>
    </Carte>
  )
}

export function ChoixCommune({ commune, onChoix }: { commune: Commune | null; onChoix: (c: Commune) => void }) {
  const id = useId()
  const [saisie, setSaisie] = useState('')
  const [choix, setChoix] = useState<(Commune & { contexte: string })[] | null>(null)
  const [etat, setEtat] = useState<'' | 'recherche' | 'erreur'>('')
  const [message, setMessage] = useState('')
  const [ouvert, setOuvert] = useState(!commune)

  async function chercher(e: FormEvent) {
    e.preventDefault()
    const v = RechercheSchema.safeParse(saisie)
    if (!v.success) return void (setEtat('erreur'), setMessage(v.error.issues[0].message))
    setEtat('recherche')
    try {
      const l = await chercherCommunes(v.data)
      setChoix(l)
      setEtat('')
      setMessage(l.length ? '' : 'Aucune commune trouvée. Vérifie l’orthographe ou essaie ton code postal.')
    } catch {
      setEtat('erreur')
      setMessage('La recherche de commune ne répond pas. Vérifie ta connexion et réessaie.')
    }
  }

  if (commune && !ouvert) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-3xl bg-white/80 p-4 shadow-sm">
        <p><span aria-hidden="true">📍 </span>Ta commune : <strong>{commune.nom}</strong>{commune.cp && ` (${commune.cp})`}</p>
        <Bouton variante="secondaire" onClick={() => setOuvert(true)}>Changer de commune</Bouton>
      </div>
    )
  }
  return (
    <Carte titre="Où habites-tu ?" emoji="📍" aide="Ta commune ou ton code postal suffit, jamais ton adresse.">
      <form onSubmit={chercher} className="mt-3 flex flex-wrap gap-2" role="search">
        <label htmlFor={`${id}-c`} className="sr-only">Commune ou code postal</label>
        <input id={`${id}-c`} value={saisie} onChange={(e) => setSaisie(e.target.value)} maxLength={60} autoComplete="off"
          placeholder="Ex. Illkirch ou 67400" aria-describedby={`${id}-info${message ? ` ${id}-msg` : ''}`}
          className="min-w-0 flex-1 rounded-2xl border-2 border-slate-300 px-4 py-3 focus:border-violet-600" />
        <Bouton type="submit" disabled={etat === 'recherche'}>{etat === 'recherche' ? 'Recherche…' : 'Chercher'}</Bouton>
      </form>
      <p id={`${id}-info`} className="mt-2 text-sm text-slate-600">
        Seul ce que tu tapes ici est envoyé au service de géocodage de l’IGN, pour trouver ta commune.
      </p>
      {message && <p id={`${id}-msg`} role={etat === 'erreur' ? 'alert' : 'status'} className="mt-2 font-semibold text-rose-700">{message}</p>}
      {choix && choix.length > 0 && (
        <ul className="mt-3 grid gap-2" aria-label="Communes trouvées">
          {choix.map(({ contexte, ...c }) => (
            <li key={c.code}>
              <Bouton variante="secondaire" className="w-full justify-start text-left" onClick={() => { onChoix(c); setOuvert(false); setChoix(null) }}>
                {c.nom}{c.cp && ` (${c.cp})`}<span className="font-normal text-slate-600"> · {contexte}</span>
              </Bouton>
            </li>
          ))}
        </ul>
      )}
    </Carte>
  )
}

function CarteFormation({ r, mesFamilles }: { r: Resultat; mesFamilles: string[] }) {
  const id = useId()
  const { f, km } = r
  const a = acces(f)
  const liees = r.familles.filter((x) => mesFamilles.includes(x))
  return (
    <li aria-labelledby={id} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-violet-100">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 [overflow-wrap:anywhere]">
          <h3 id={id} className="font-extrabold text-violet-900">{f.n}</h3>
          <p className="text-slate-700">{f.e}{f.v && ` · ${f.v}`}{f.d && ` (${f.d})`}</p>
          {f.p.length > 0 && <p className="text-sm text-slate-600">Parcours : {f.p.map((x) => x.replace(/^[^-]+- /, '')).join(' ; ')}</p>}
        </div>
        <p className="shrink-0 rounded-2xl bg-teal-50 px-3 py-1 text-center text-sm font-bold text-teal-900">
          ≈ {km} km<span className="block text-xs font-medium">estimation</span>
        </p>
      </div>
      <ul className="mt-2 flex flex-wrap gap-2 text-sm" aria-label="Caractéristiques">
        <li className="rounded-full bg-slate-100 px-3 py-1">{f.pu ? 'Public' : 'Privé'}</li>
        {f.a && <li className="rounded-full bg-orange-100 px-3 py-1 font-semibold text-orange-900">En apprentissage</li>}
        {f.h && <li className="rounded-full bg-sky-100 px-3 py-1 text-sky-900">Internat</li>}
      </ul>
      <p className="mt-2 font-semibold">{a.texte}</p>
      <p className="text-sm text-slate-600">{a.detail}</p>
      {liees.length > 0 && (
        <p className="mt-1 text-sm"><span aria-hidden="true">🎯 </span>En lien avec tes pistes : {liees.map((x) => NOM_FAMILLE[x]).join(', ')}</p>
      )}
      {f.f && (
        <a href={f.f} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center font-semibold text-violet-800 underline underline-offset-4">
          Voir la fiche sur Parcoursup<span className="sr-only"> : {f.n}, {f.e} (s’ouvre dans un nouvel onglet)</span>
        </a>
      )}
    </li>
  )
}
