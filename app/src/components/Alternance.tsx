import { useId, useState } from 'react'
import {
  chercherEntreprises, chercherOffres, fusionnerEntreprises, lienAnnuaire, lienLBA, proxyConfigure, RAYON_MAX_ENTREPRISES, RAYON_MAX_OFFRES,
  type Entreprise, type ReponseOffres,
} from '../alternance'
import { distanceRoute } from '../formations'
import { pistes } from '../metiers'
import { useEtat } from '../store'
import { ChoixCommune, ChoixRayon } from './Formations'
import Handicap from './Handicap'
import { Bouton, PUCE } from './ui'

const PAR_PAGE = 10

export default function Alternance() {
  const { publicId, personnalite, gouts, scolarite, mobilite, maj } = useEtat()
  const id = useId()
  const mesPistes = pistes({ publicId, personnalite, gouts, scolarite })
  const [choisis, setChoisis] = useState(() => mesPistes.slice(0, 5).map((p) => p.metier.code))
  const [etat, setEtat] = useState<'' | 'recherche' | 'fini'>('')
  const [offres, setOffres] = useState<ReponseOffres | null>(null)
  const [erreurOffres, setErreurOffres] = useState(false)
  const [entreprises, setEntreprises] = useState<Entreprise[] | null>(null)
  const [erreurEntreprises, setErreurEntreprises] = useState(false)
  const commune = mobilite.commune
  const rayon = mobilite.rayon ?? RAYON_MAX_OFFRES
  const selection = mesPistes.filter((p) => choisis.includes(p.metier.code))

  async function chercher() {
    if (!commune || !selection.length) return
    setEtat('recherche')
    const familles = [...new Set(selection.map((p) => p.famille.id))]
    const [o, e] = await Promise.allSettled([
      proxyConfigure() ? chercherOffres(commune, rayon, selection.map((p) => p.metier.code)) : Promise.reject(new Error('non configuré')),
      chercherEntreprises(commune, rayon, familles),
    ])
    setOffres(o.status === 'fulfilled' ? o.value : null)
    setErreurOffres(o.status === 'rejected')
    setEntreprises(e.status === 'fulfilled' ? e.value : null)
    setErreurEntreprises(e.status === 'rejected')
    setEtat('fini')
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 tabIndex={-1} className="text-2xl font-extrabold text-violet-900 sm:text-3xl">Entreprises et alternance</h1>
        <p className="mt-1 text-slate-700">
          Trouve des offres en alternance et des entreprises près de chez toi pour tes pistes métiers. Rien n’est envoyé sur Internet tant que tu n’as pas cliqué sur « Chercher ».
        </p>
      </div>

      <ChoixCommune commune={commune} onChoix={(c) => maj({ mobilite: { ...mobilite, commune: c } })} />
      {commune && (
        <>
          <ChoixRayon rayon={mobilite.rayon} onChoix={(r) => maj({ mobilite: { ...mobilite, rayon: r } })} />
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

          <div aria-live="polite">
            {etat === 'fini' && (
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
