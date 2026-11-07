import type { ReactNode } from 'react'
import { lienFicheMetier } from '../metiers'
import { synthese } from '../synthese'
import { etatSeul, useEtat } from '../store'
import { telecharger } from '../sauvegarde'
import { Bouton } from './ui'

/** Synthèse imprimable (A4) : le profil d'orientation, les pistes et le plan d'action. Jamais la donnée handicap. */
export default function Synthese() {
  const etat = useEtat()
  const s = synthese(etat)

  return (
    <div className="space-y-5 print:space-y-3">
      <div>
        <h1 tabIndex={-1} className="text-2xl font-extrabold text-violet-900 sm:text-3xl print:text-xl">
          Ma synthèse d’orientation{s.prenom && ` – ${s.prenom}`}
        </h1>
        <p className="mt-1 text-slate-700">{s.public ?? 'Parcours non choisi'} · {s.date}</p>
        <p className="mt-2 rounded-2xl bg-sky-50 p-3 text-sm text-sky-950 print:bg-white print:p-0">
          Ces résultats sont des pistes à explorer, pas un verdict. Ils sont à discuter avec un professeur principal,
          un psychologue de l’Éducation nationale ou un conseiller d’orientation.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        <Bouton onClick={() => window.print()}><span aria-hidden="true">🖨️</span> Imprimer ou enregistrer en PDF</Bouton>
        <Bouton variante="secondaire" onClick={() => telecharger(etatSeul(useEtat.getState()))}><span aria-hidden="true">💾</span> Sauvegarder mes réponses</Bouton>
      </div>
      <p className="text-sm text-slate-600 print:hidden">
        Pour un PDF, choisis « Enregistrer au format PDF » comme imprimante. Les informations facultatives sur le handicap ne figurent jamais dans cette synthèse.
      </p>

      <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2 print:gap-3">
        <Bloc titre="Ma personnalité">
          {s.personnalite ? (
            <ul className="space-y-1">{s.personnalite.map((p) => <li key={p.dimension}><strong>{p.dimension} :</strong> {p.resume}</li>)}</ul>
          ) : <Vide>Test de personnalité pas encore terminé.</Vide>}
        </Bloc>
        <Bloc titre="Mes goûts">
          <Ligne nom="Intérêts qui ressortent" valeurs={s.interets} />
          <Ligne nom="Où je me vois travailler" valeurs={s.environnements} />
          <Ligne nom="Ce qui compte pour moi" valeurs={s.valeurs} />
          <Ligne nom="Ce que je ne veux pas" valeurs={s.refus} />
        </Bloc>
        <Bloc titre="Mes points d’appui">
          {s.matieresFortes.length ? <ul className="list-disc pl-5">{s.matieresFortes.map((m) => <li key={m}>{m}</li>)}</ul>
            : <Vide>Pas encore renseignés.</Vide>}
        </Bloc>
        <Bloc titre="Ma mobilité">
          {s.mobilite ? <p>Autour de {s.mobilite.commune}, {s.mobilite.rayon === null ? 'partout en France' : `jusqu’à ${s.mobilite.rayon} km`}.</p>
            : <Vide>Commune pas encore choisie.</Vide>}
        </Bloc>
      </div>

      <Bloc titre="Mes 5 premières pistes métiers">
        {s.pistes.length ? (
          <ol className="list-decimal space-y-1 pl-5">
            {s.pistes.map((p) => (
              <li key={p.code}>
                <strong>{p.metier}</strong> ({p.famille}) : correspondance {p.score}/100
                {p.freins.length > 0 && <span className="text-orange-900"> · à vérifier : {p.freins.join(', ').toLowerCase()}</span>}
                <span className="block text-xs text-slate-600">Fiche métier France Travail : {lienFicheMetier(p.code)}</span>
              </li>
            ))}
          </ol>
        ) : <Vide>Réponds à l’étape « Tes goûts » pour obtenir tes pistes.</Vide>}
      </Bloc>

      <Bloc titre="Mes favoris">
        {s.favoris.metiers.length + s.favoris.formations.length === 0 ? (
          <Vide>Aucun favori pour l’instant : utilise le bouton « Garder » sur les métiers et les formations qui t’intéressent.</Vide>
        ) : (
          <>
            {s.favoris.metiers.length > 0 && <p><strong>Métiers :</strong> {s.favoris.metiers.map((m) => m.metier).join(' ; ')}</p>}
            {s.favoris.formations.length > 0 && (
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {s.favoris.formations.map((f) => (
                  <li key={f.id}><strong>{f.intitule}</strong> · {f.etablissement}{f.ville && ` (${f.ville})`}
                    {f.lien && <span className="block text-xs text-slate-600">{f.lien}</span>}</li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-sm text-slate-600">Appuie-toi sur ces favoris pour rédiger ton projet de formation motivé : pourquoi cette formation, ce qui t’y prépare, ce que tu veux en faire.</p>
          </>
        )}
      </Bloc>

      <Bloc titre="Mon plan d’action">
        <ol className="space-y-2">
          {s.plan.map((e, k) => (
            <li key={e.texte} className="flex gap-2">
              <span aria-hidden="true" className="mt-0.5 inline-block size-5 shrink-0 rounded border-2 border-violet-700 print:border-black" />
              <span><span className="sr-only">Action {k + 1} : </span>{e.texte}{e.lien && <> ({e.lien.texte} : {e.lien.url})</>}</span>
            </li>
          ))}
        </ol>
      </Bloc>

      <p className="text-xs text-slate-600">
        Synthèse produite par l’application « Mon orientation » à partir de tes réponses, enregistrées uniquement sur ton appareil.
        Sources : ROME (France Travail), Parcoursup et ministère de l’Enseignement supérieur (Licence Ouverte Etalab 2.0).
      </p>
    </div>
  )
}

function Bloc({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="break-inside-avoid rounded-3xl bg-white p-4 shadow-sm ring-1 ring-violet-100 [overflow-wrap:anywhere] print:rounded-none print:p-2 print:shadow-none print:ring-1 print:ring-slate-400">
      <h2 className="mb-2 text-lg font-extrabold text-fuchsia-800 print:text-base print:text-black">{titre}</h2>
      {children}
    </section>
  )
}

function Ligne({ nom, valeurs }: { nom: string; valeurs: string[] }) {
  return <p><strong>{nom} :</strong> {valeurs.length ? valeurs.join(', ') : <Vide>non renseigné</Vide>}</p>
}

const Vide = ({ children }: { children: ReactNode }) => <span className="text-slate-600 italic">{children}</span>
