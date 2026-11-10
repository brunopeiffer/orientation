import { useId, useState } from 'react'
import {
  chercherEntreprises, chercherEntreprisesVariees, chercherFormationsApprentissage, formationsPourPublic, lettreStage, chercherOffres, fusionnerEntreprises, lienAnnuaire, lienLBA, proxyConfigure, RAYON_MAX_ENTREPRISES, RAYON_MAX_OFFRES,
  type Entreprise, type ReponseFormations, type ReponseOffres,
} from '../alternance'
import { distanceRoute } from '../formations'
import { famillesStage, pistes } from '../metiers'
import { parcoursDe, PUBLICS } from '../schema'
import { useEtat } from '../store'
import { ChoixCommune, ChoixRayon } from './Formations'
import Handicap from './Handicap'
import { Bouton, PUCE } from './ui'

const PAR_PAGE = 10

export default function Alternance() {
  const { prenom, publicId, personnalite, gouts, scolarite, mobilite, maj } = useEtat()
  const id = useId()
  const mesPistes = pistes({ publicId, personnalite, gouts, scolarite })
  const [choisis, setChoisis] = useState(() => mesPistes.slice(0, 5).map((p) => p.metier.code))
  const [etat, setEtat] = useState<'' | 'recherche' | 'fini'>('')
  const [offres, setOffres] = useState<ReponseOffres | null>(null)
  const [erreurOffres, setErreurOffres] = useState(false)
  const [entreprises, setEntreprises] = useState<Entreprise[] | null>(null)
  const [erreurEntreprises, setErreurEntreprises] = useState(false)
  const [formations, setFormations] = useState<ReponseFormations | null>(null)
  const niveau = parcoursDe(publicId) === 'bts' ? '6' : '5'
  const commune = mobilite.commune
  const rayon = mobilite.rayon ?? RAYON_MAX_OFFRES
  const selection = mesPistes.filter((p) => choisis.includes(p.metier.code))
  // Alternance : offres, formations et entreprises pour les métiers cochés. Stage : entreprises en lien avec le BTS (ou les pistes).
  const [mode, setMode] = useState<'alternance' | 'stage'>('alternance')

  function changerMode(m: 'alternance' | 'stage') {
    setMode(m)
    setEtat('')
  }

  async function chercherStage() {
    if (!commune) return
    setEtat('recherche')
    setOffres(null)
    setFormations(null)
    try {
      // Ordre d'affichage = celui de la recherche (familles alternées), pas un tri par distance.
      setEntreprises(await chercherEntreprisesVariees(commune, rayon, famillesStage(publicId, mesPistes)))
      setErreurEntreprises(false)
    } catch {
      setEntreprises(null)
      setErreurEntreprises(true)
    }
    setEtat('fini')
  }

  async function chercher() {
    if (!commune || !selection.length) return
    setEtat('recherche')
    const familles = [...new Set(selection.map((p) => p.famille.id))]
    const romes = selection.map((p) => p.metier.code)
    const [o, e, f] = await Promise.allSettled([
      proxyConfigure() ? chercherOffres(commune, rayon, romes) : Promise.reject(new Error('non configuré')),
      chercherEntreprises(commune, rayon, familles),
      proxyConfigure() ? chercherFormationsApprentissage(commune, rayon, romes, niveau) : Promise.reject(new Error('non configuré')),
    ])
    setFormations(f.status === 'fulfilled' ? { ...f.value, formations: formationsPourPublic(f.value.formations, publicId) } : null)
    setOffres(o.status === 'fulfilled' ? o.value : null)
    setErreurOffres(o.status === 'rejected')
    setEntreprises(e.status === 'fulfilled' ? e.value : null)
    setErreurEntreprises(e.status === 'rejected')
    setEtat('fini')
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 tabIndex={-1} className="text-[length:var(--da-t-titre)] font-bold text-violet-900">Entreprises et alternance</h1>
        <p className="mt-1 text-slate-700">
          Trouve des offres en alternance, ou des entreprises où demander un stage, près de chez toi. Rien n’est envoyé sur Internet tant que tu n’as pas cliqué sur « Chercher ».
        </p>
      </div>

      <ChoixCommune commune={commune} onChoix={(c) => maj({ mobilite: { ...mobilite, commune: c } })} />
      {commune && (
        <>
          <ChoixRayon rayon={mobilite.rayon} onChoix={(r) => maj({ mobilite: { ...mobilite, rayon: r } })} />
          <fieldset className="rounded-3xl bg-white/80 p-4 shadow-sm sm:p-5">
            <legend className="sr-only">Ce que tu cherches</legend>
            <p aria-hidden="true" className="text-lg font-extrabold text-fuchsia-800"><span>🔎 </span>Je cherche…</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className={PUCE}><input type="radio" name={`${id}-mode`} checked={mode === 'alternance'} onChange={() => changerMode('alternance')} className="size-5 shrink-0 accent-white" />une alternance (contrat en entreprise + formation)</label>
              <label className={PUCE}><input type="radio" name={`${id}-mode`} checked={mode === 'stage'} onChange={() => changerMode('stage')} className="size-5 shrink-0 accent-white" />un stage (des entreprises où envoyer ma demande)</label>
            </div>
          </fieldset>
          {/* Même règle que les formations et la synthèse : sans goûts, pas de pistes à chercher. */}
          {mode === 'stage' ? (
            <section aria-labelledby={`${id}-s`} className="rounded-3xl bg-white/80 p-4 shadow-sm sm:p-5">
              <h2 id={`${id}-s`} className="text-lg font-extrabold text-fuchsia-800"><span aria-hidden="true">🏢 </span>Entreprises pour ton stage</h2>
              <p className="text-sm text-slate-700">
                {parcoursDe(publicId) === 'bts'
                  ? 'On cherche les entreprises proches dont l’activité correspond aux métiers de ton BTS (rayon de 50 km au plus).'
                  : 'On cherche les entreprises proches dont l’activité correspond à tes pistes métiers (rayon de 50 km au plus).'}
                {' '}Elles n’ont pas forcément de stage à proposer : c’est une candidature spontanée.
              </p>
              <Bouton className="mt-3" onClick={chercherStage} disabled={etat === 'recherche' || (parcoursDe(publicId) !== 'bts' && !mesPistes.length)}>
                {etat === 'recherche' ? 'Recherche en cours…' : 'Chercher des entreprises'}
              </Bouton>
            </section>
          ) : !Object.keys(gouts.activites).length ? (
            <p role="note" className="rounded-2xl bg-amber-50 p-4 text-amber-950">
              Réponds d’abord à l’étape « Tes goûts » : les recherches d’offres et d’entreprises partent de tes pistes métiers.{' '}
              <Bouton variante="secondaire" className="mt-2" onClick={() => maj({ etape: 1 })}>Aller à « Tes goûts »</Bouton>
            </p>
          ) : (
          <section aria-labelledby={`${id}-m`} className="rounded-3xl bg-white/80 p-4 shadow-sm sm:p-5">
            <h2 id={`${id}-m`} className="text-lg font-extrabold text-fuchsia-800"><span aria-hidden="true">🎯 </span>Métiers à chercher</h2>
            <p className="text-sm text-slate-600">Tes pistes métiers ; coche jusqu’à 5 métiers. Les entreprises sont cherchées dans un rayon de {RAYON_MAX_ENTREPRISES} km au plus.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {mesPistes.map((p) => {
                const coche = choisis.includes(p.metier.code)
                return (
                  <label key={p.metier.code} className={PUCE}>
                    <input type="checkbox" checked={coche} disabled={!coche && choisis.length >= 5} className="size-5 shrink-0 accent-white"
                      onChange={() => setChoisis(coche ? choisis.filter((c) => c !== p.metier.code) : [...choisis, p.metier.code])} />
                    {p.metier.libelle}
                  </label>
                )
              })}
            </div>
            <Bouton className="mt-3" onClick={chercher} disabled={!selection.length || etat === 'recherche'}>
              {etat === 'recherche' ? 'Recherche en cours…' : 'Chercher'}
            </Bouton>
          </section>
          )}

          <div aria-live="polite">
            {etat === 'fini' && mode === 'stage' && (
              <div className="space-y-5">
                {erreurEntreprises ? (
                  <p role="alert" className="font-semibold text-rose-700">La recherche d’entreprises ne répond pas. Réessaie dans quelques instants.</p>
                ) : entreprises && <Entreprises liste={entreprises.map((e) => ({ e, km: e.lat !== null && e.lon !== null ? distanceRoute(commune, { lat: e.lat, lon: e.lon }) : null }))} />}
                <Lettre texte={lettreStage({ prenom, publicId, formation: PUBLICS.find((p) => p.id === publicId)?.libelle ?? 'formation', metiers: mesPistes.map((p) => p.metier.libelle) })} />
              </div>
            )}
            {etat === 'fini' && mode === 'alternance' && (
              <div className="space-y-5">
                {offres ? <Offres r={offres} depuis={commune} /> : (
                  <section aria-labelledby={`${id}-deg`} className="rounded-3xl bg-amber-50 p-4 text-amber-950">
                    <h2 id={`${id}-deg`} className="text-lg font-extrabold">Offres en alternance</h2>
                    <p className="mt-1">
                      {erreurOffres && proxyConfigure() ? 'La recherche d’offres ne répond pas pour l’instant.' : 'La recherche d’offres directement dans l’app n’est pas encore activée.'}
                      {' '}Ces liens ouvrent La bonne alternance (qui regroupe les offres de France Travail et d’autres sites), déjà réglée pour toi :
                    </p>
                    <ul className="mt-2">
                      {selection.map((p) => (
                        <li key={p.metier.code}>
                          <a href={lienLBA(p.metier.libelle, commune, rayon)} target="_blank" rel="noopener noreferrer"
                            className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
                            Offres « {p.metier.libelle} » près de {commune.nom}<span className="sr-only"> (s’ouvre dans un nouvel onglet)</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {formations && <FormationsApprentissage r={formations} depuis={commune} niveau={niveau} />}
                {erreurEntreprises ? (
                  <p role="alert" className="font-semibold text-rose-700">La recherche d’entreprises ne répond pas. Réessaie dans quelques instants.</p>
                ) : entreprises && <Entreprises liste={fusionnerEntreprises(entreprises, offres?.recruteurs ?? [], commune)} />}
              </div>
            )}
          </div>
        </>
      )}

      <Handicap />
    </div>
  )
}

function Offres({ r, depuis }: { r: ReponseOffres; depuis: { lat: number; lon: number } }) {
  const id = useId()
  const [nb, setNb] = useState(PAR_PAGE)
  const liste = r.offres
    .map((o) => ({ o, km: o.lat !== null && o.lon !== null ? distanceRoute(depuis, { lat: o.lat, lon: o.lon }) : null }))
    .sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9))
  return (
    <section aria-labelledby={id} className="space-y-2">
      <h2 id={id} className="text-xl font-extrabold text-violet-900">{liste.length} offre{liste.length > 1 ? 's' : ''} en alternance</h2>
      {liste.length === 0 && <p>Aucune offre pour ces métiers dans ce rayon : élargis la distance ou essaie d’autres métiers.</p>}
      <ul className="space-y-2">
        {liste.slice(0, nb).map(({ o, km }) => (
          <li key={o.id} className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-violet-100">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 [overflow-wrap:anywhere]">
                <h3 className="font-bold text-violet-900">{o.titre}</h3>
                <p className="text-slate-700">{o.entreprise}{o.adresse && ` · ${o.adresse}`}</p>
                <p className="text-sm text-slate-600">
                  {[o.contrats.join(' ou '), o.niveau && `Niveau visé : ${o.niveau}`, o.debut && `Début : ${new Date(o.debut).toLocaleDateString('fr-FR')}`, o.partenaire && `Publiée via ${o.partenaire}`].filter(Boolean).join(' · ')}
                </p>
              </div>
              {km !== null && <p className="shrink-0 rounded-2xl bg-teal-50 px-3 py-1 text-center text-sm font-bold text-teal-900">≈ {km} km<span className="block text-xs font-medium">estimation</span></p>}
            </div>
            {o.url && (
              <a href={o.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-semibold text-violet-800 underline underline-offset-4">
                Voir l’offre et postuler<span className="sr-only"> : {o.titre} (s’ouvre dans un nouvel onglet)</span>
              </a>
            )}
          </li>
        ))}
      </ul>
      {liste.length > nb && <Bouton variante="secondaire" onClick={() => setNb(nb + PAR_PAGE)}>Voir {Math.min(PAR_PAGE, liste.length - nb)} offres de plus</Bouton>}
      <p className="text-sm text-slate-600">Source : {r.source}, consultée le {new Date(r.date).toLocaleDateString('fr-FR')}.</p>
    </section>
  )
}

/** Le catalogue écrit souvent les intitulés en majuscules, difficiles à lire : on les remet en minuscules. */
const casse = (t: string) => (t === t.toUpperCase() ? t.charAt(0) + t.slice(1).toLowerCase() : t)

function FormationsApprentissage({ r, depuis, niveau }: { r: ReponseFormations; depuis: { lat: number; lon: number }; niveau: '5' | '6' }) {
  const id = useId()
  const [nb, setNb] = useState(PAR_PAGE)
  const liste = r.formations
    .map((f) => ({ f, km: f.lat !== null && f.lon !== null ? distanceRoute(depuis, { lat: f.lat, lon: f.lon }) : null }))
    .sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9))
  return (
    <section aria-labelledby={id} className="space-y-2">
      <h2 id={id} className="text-xl font-extrabold text-violet-900">
        {liste.length} formation{liste.length > 1 ? 's' : ''} en apprentissage ({niveau === '6' ? 'bac+3, après ton BTS' : 'bac+2, après le bac'})
      </h2>
      <p className="text-sm text-slate-700">Écoles, CFA, universités, Cnam… Pour y entrer, il faut aussi trouver une entreprise : commence les deux démarches en même temps.</p>
      {liste.length === 0 && <p>Aucune formation pour ces métiers dans ce rayon : élargis la distance ou essaie d’autres métiers.</p>}
      <ul className="space-y-2">
        {liste.slice(0, nb).map(({ f, km }) => (
          <li key={f.id} className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-violet-100">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 [overflow-wrap:anywhere]">
                <h3 className="font-bold text-violet-900">{casse(f.titre)}</h3>
                <p className="text-slate-700">{f.organisme}{f.ville && ` · ${f.ville}`}</p>
                <p className="text-sm text-slate-600">
                  {[f.distanciel && 'Entièrement à distance', f.qualiopi === true && 'Organisme certifié Qualiopi', f.qualiopi === false && 'Pas de certification Qualiopi indiquée',
                    f.debut && `Prochaine rentrée : ${new Date(f.debut).toLocaleDateString('fr-FR')}`].filter(Boolean).join(' · ')}
                </p>
              </div>
              {km !== null && <p className="shrink-0 rounded-2xl bg-teal-50 px-3 py-1 text-center text-sm font-bold text-teal-900">≈ {km} km<span className="block text-xs font-medium">estimation</span></p>}
            </div>
            {f.onisep && (
              <a href={f.onisep} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-semibold text-violet-800 underline underline-offset-4">
                Fiche de la formation (Onisep)<span className="sr-only"> : {f.titre} (s’ouvre dans un nouvel onglet)</span>
              </a>
            )}
          </li>
        ))}
      </ul>
      {liste.length > nb && <Bouton variante="secondaire" onClick={() => setNb(nb + PAR_PAGE)}>Voir {Math.min(PAR_PAGE, liste.length - nb)} formations de plus</Bouton>}
      <p className="text-sm text-slate-600">Source : {r.source}, consultée le {new Date(r.date).toLocaleDateString('fr-FR')}.</p>
    </section>
  )
}

function Entreprises({ liste }: { liste: ReturnType<typeof fusionnerEntreprises> }) {
  const id = useId()
  const [nb, setNb] = useState(PAR_PAGE)
  return (
    <section aria-labelledby={id} className="space-y-2">
      <h2 id={id} className="text-xl font-extrabold text-violet-900">{liste.length} entreprise{liste.length > 1 ? 's' : ''} proche{liste.length > 1 ? 's' : ''}</h2>
      <p className="text-sm text-slate-700">
        Les entreprises sans badge ne recrutent pas forcément : propose-leur une candidature spontanée. Beaucoup de métiers existent aussi dans d’autres secteurs que ceux cherchés ici.
      </p>
      <ul className="space-y-2">
        {liste.slice(0, nb).map(({ e, km }) => (
          <li key={e.siret} className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-violet-100">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 [overflow-wrap:anywhere]">
                <h3 className="font-bold text-violet-900">{e.nom}</h3>
                {e.activite && <p className="text-sm text-slate-700">{e.activite}</p>}
                {e.adresse && <p className="text-sm text-slate-600">{e.adresse}</p>}
                {e.recrute && <p className="mt-1 inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-900">Susceptible de recruter en alternance (La bonne alternance)</p>}
              </div>
              {km !== null && <p className="shrink-0 rounded-2xl bg-teal-50 px-3 py-1 text-center text-sm font-bold text-teal-900">≈ {km} km<span className="block text-xs font-medium">estimation</span></p>}
            </div>
            <a href={e.url ?? lienAnnuaire(e.siret)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-semibold text-violet-800 underline underline-offset-4">
              {e.url ? 'Contacter l’entreprise' : 'Fiche officielle de l’entreprise'}<span className="sr-only"> : {e.nom} (s’ouvre dans un nouvel onglet)</span>
            </a>
          </li>
        ))}
      </ul>
      {liste.length > nb && <Bouton variante="secondaire" onClick={() => setNb(nb + PAR_PAGE)}>Voir {Math.min(PAR_PAGE, liste.length - nb)} entreprises de plus</Bouton>}
      <p className="text-sm text-slate-600">Source : Recherche d’entreprises (annuaire-entreprises.data.gouv.fr), Licence Ouverte Etalab 2.0 ; établissements ouverts uniquement.</p>
    </section>
  )
}

/** Modèle de demande de stage à copier : rien n'est envoyé, l'élève l'adapte et l'envoie lui-même. */
function Lettre({ texte }: { texte: string }) {
  const id = useId()
  const [valeur, setValeur] = useState(texte)
  const [copie, setCopie] = useState('')
  return (
    <section aria-labelledby={id} className="space-y-2 rounded-3xl bg-white/80 p-4 shadow-sm sm:p-5">
      <h2 id={id} className="text-lg font-extrabold text-fuchsia-800"><span aria-hidden="true">✉️ </span>Ta demande de stage (modèle à adapter)</h2>
      <p className="text-sm text-slate-700">Remplace tous les passages entre crochets, puis copie le texte dans un mail ou une lettre, avec ton CV. Rien n’est envoyé par l’app.</p>
      <ul className="list-disc pl-5 text-sm text-slate-700">
        <li><strong>Change la première phrase pour chaque entreprise</strong> : un fait précis montre que tu t’es renseigné(e). C’est ce qui fait la différence.</li>
        <li>Une réussite concrète vaut mieux qu’une liste de qualités.</li>
        <li>Si tu peux, envoie-la à une personne nommée (responsable, gérant(e)), et rappelle vraiment la semaine suivante.</li>
        <li>Fais-la relire : zéro faute.</li>
      </ul>
      <label htmlFor={`${id}-t`} className="sr-only">Texte de ta demande de stage</label>
      <textarea id={`${id}-t`} value={valeur} onChange={(e) => setValeur(e.target.value)} rows={14}
        className="w-full rounded-2xl border border-violet-200 bg-white p-3 text-base" />
      <div className="flex flex-wrap items-center gap-3">
        <Bouton variante="secondaire" onClick={() => navigator.clipboard.writeText(valeur).then(() => setCopie('Texte copié.'), () => setCopie('Copie impossible : sélectionne le texte et copie-le.'))}>
          <span aria-hidden="true">📋</span> Copier le texte
        </Bouton>
        <p role="status" className="text-sm font-semibold text-emerald-800">{copie}</p>
      </div>
    </section>
  )
}
