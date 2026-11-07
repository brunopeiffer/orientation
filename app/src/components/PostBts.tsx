import { useEffect, useId, useState } from 'react'
import { COEF_DETOUR } from '../formations'
import {
  chargerOffres, lienEtablissement, offresLocales, POURSUITES, voiesDe, type Donnees, type OffreLocale, type TypeOffre,
} from '../postbts'
import { useEtat } from '../store'
import { ChoixCommune, ChoixRayon } from './Formations'
import Favori from './Favori'
import Pratique from './Pratique'
import { Bouton } from './ui'

const TITRES: Record<TypeOffre, string> = {
  LP: 'Licences professionnelles en lien avec ton BTS',
  DCG: 'DCG (diplôme de comptabilité et de gestion)',
  BUT: 'BUT en lien avec ton BTS (admission en 2e ou 3e année)',
}
const CANAL: Record<TypeOffre, string> = {
  LP: 'Hors Parcoursup : candidature directement auprès de l’établissement (souvent eCandidat).',
  DCG: '1re année sur Parcoursup ; entrée en 2e année avec dispenses : contacte l’établissement.',
  BUT: 'Hors Parcoursup pour la 2e ou 3e année : candidature directement auprès de l’IUT.',
}
const PAR_PAGE = 10

export default function PostBts() {
  const { publicId, mobilite, maj } = useEtat()
  const voies = voiesDe(publicId)
  const types = [...new Set(voies.map((v) => v.offres).filter((x): x is TypeOffre => !!x))]
  const [donnees, setDonnees] = useState<Donnees | null>(null)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    if (!mobilite.commune) return
    chargerOffres().then(setDonnees).catch(() => setErreur('Impossible de charger les formations. Recharge la page pour réessayer.'))
  }, [mobilite.commune])

  return (
    <div className="space-y-5">
      <div>
        <h1 tabIndex={-1} className="text-2xl font-extrabold text-violet-900 sm:text-3xl">Poursuites d’études après ton BTS</h1>
        <p className="mt-1 text-slate-700">
          Après un BTS, la plupart des poursuites se demandent <strong>hors Parcoursup</strong>, directement auprès des établissements, souvent dès le printemps. Note bien le canal de chaque voie.
        </p>
      </div>

      <section aria-labelledby="voies" className="space-y-3">
        <h2 id="voies" className="text-xl font-extrabold text-violet-900">Les voies possibles</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {voies.map((v) => (
            <li key={v.id} className="flex flex-col rounded-3xl bg-white p-4 shadow-sm ring-1 ring-violet-100">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-violet-900">{v.titre}</h3>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${v.parcoursup ? 'bg-sky-100 text-sky-900' : 'bg-orange-100 text-orange-900'}`}>
                  {v.parcoursup ? 'Sur Parcoursup' : 'Hors Parcoursup'}
                </span>
              </div>
              <p className="text-sm font-semibold text-fuchsia-800">{v.niveau} · {v.duree}</p>
              <p className="mt-1">{v.description}</p>
              <p className="mt-2"><strong>Comment candidater :</strong> {v.canal}</p>
              <p className="text-sm"><strong>Alternance :</strong> {v.alternance}</p>
              <p className="mt-auto flex flex-wrap gap-x-4 pt-2">
                {[v.lien, v.lien2].filter((l) => !!l).map((l) => <Lien key={l!.url} {...l!} />)}
              </p>
              <p className="text-xs text-slate-600">Source : {v.sources.map((s) => <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="underline">{s.nom}<span className="sr-only"> (nouvel onglet)</span></a>)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="pres" className="space-y-3">
        <h2 id="pres" className="text-xl font-extrabold text-violet-900">Près de chez toi</h2>
        <ChoixCommune commune={mobilite.commune} onChoix={(c) => maj({ mobilite: { ...mobilite, commune: c } })} />
        {mobilite.commune && (
          <>
            <ChoixRayon rayon={mobilite.rayon} onChoix={(r) => maj({ mobilite: { ...mobilite, rayon: r } })} />
            {erreur ? <p role="alert" className="font-semibold text-rose-700">{erreur}</p> : !donnees ? (
              <p role="status" className="rounded-2xl bg-violet-50 p-4">Chargement des formations…</p>
            ) : types.map((t) => (
              <ListeOffres key={t} type={t} source={donnees.sources[t] ?? 'non disponible'}
                offres={offresLocales(donnees.offres, t, publicId, mobilite.commune!, mobilite.rayon)} />
            ))}
            <p className="text-sm text-slate-600">
              Distances : à vol d’oiseau × {String(COEF_DETOUR).replace('.', ',')}, donc approximatives. Licences pro : celles qui avaient des inscrits l’année indiquée ; vérifie l’ouverture sur le site de l’établissement. Données {donnees?.licence ?? 'Licence Ouverte Etalab 2.0'}.
            </p>
          </>
        )}
      </section>
      <Pratique />
      <p className="text-xs text-slate-600">Contenu rédigé le {new Date(POURSUITES.date).toLocaleDateString('fr-FR')} à partir des sources citées, en cours de validation.</p>
    </div>
  )
}

function ListeOffres({ type, offres, source }: { type: TypeOffre; offres: OffreLocale[]; source: string }) {
  const id = useId()
  const [nb, setNb] = useState(PAR_PAGE)
  return (
    <section id={`offres-${type}`} aria-labelledby={id} className="space-y-2 rounded-3xl bg-white/80 p-4 shadow-sm">
      <h3 id={id} className="text-lg font-extrabold text-fuchsia-800">{TITRES[type]} ({offres.length})</h3>
      <p className="text-sm"><strong>Canal :</strong> {CANAL[type]} <span className="text-slate-600">Source : {source}.</span></p>
      {offres.length === 0 && <p>Aucune dans ce rayon : élargis la distance.</p>}
      <ul className="space-y-2">
        {offres.slice(0, nb).map(({ o, km }, k) => (
          <li key={`${o.k}-${o.e}-${o.v}-${o.m}-${o.p}-${k}`} className="rounded-2xl bg-white p-3 ring-1 ring-violet-100">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 [overflow-wrap:anywhere]">
                <p className="font-bold text-violet-900">{o.m}</p>
                {o.p && <p className="text-sm text-slate-700">{type === 'LP' ? 'Parcours : ' : ''}{o.p}</p>}
                <p className="text-slate-700">{o.e}{o.v && ` · ${o.v}`}{o.d && ` (${o.d})`}</p>
              </div>
              <p className="shrink-0 rounded-2xl bg-teal-50 px-3 py-1 text-center text-sm font-bold text-teal-900">
                ≈ {km} km<span className="block text-xs font-medium">estimation</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4">
              <Favori nom={`${o.m}, ${o.e}`} formation={{ id: `${o.k}-${o.e}-${o.v}-${o.m}-${o.p}`.slice(0, 400), intitule: o.p && type === 'LP' ? `${o.m} (${o.p})` : o.m,
                etablissement: o.e, ville: o.v ?? '', lien: o.f ?? (o.w ? lienEtablissement(o.w) : null) }} />
              {o.f ? <Lien texte="Fiche Parcoursup (contacts de l’établissement)" url={o.f} />
                : o.w ? <Lien texte="Fiche de l’établissement (site, candidature)" url={lienEtablissement(o.w)} /> : null}
            </div>
          </li>
        ))}
      </ul>
      {offres.length > nb && <Bouton variante="secondaire" onClick={() => setNb(nb + PAR_PAGE)}>Voir {Math.min(PAR_PAGE, offres.length - nb)} de plus</Bouton>}
    </section>
  )
}

function Lien({ texte, url }: { texte: string; url: string }) {
  const externe = url.startsWith('https://')
  return (
    <a href={url} {...(externe ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="inline-flex min-h-11 items-center font-semibold text-violet-800 underline underline-offset-4">
      {texte}{externe && <span className="sr-only"> (s’ouvre dans un nouvel onglet)</span>}
    </a>
  )
}
