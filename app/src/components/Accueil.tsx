import { useId, useState } from 'react'
import { PrenomSchema, PRENOM_MAX, PUBLICS_ACTIFS, type Parcours } from '../schema'
import { useEtat } from '../store'
import { Bouton } from './ui'

export const AVERTISSEMENT =
  'Tes réponses sont enregistrées uniquement sur cet appareil et ce navigateur. Si tu vides l’historique, utilises la navigation privée ou changes d’appareil, tu les perds. Utilise le bouton Sauvegarder pour garder une copie.'

const GROUPES: { parcours: Parcours; titre: string; emoji: string; couleur: string }[] = [
  { parcours: 'lycee', titre: 'Je suis au lycée', emoji: '🎒', couleur: 'from-violet-700 to-fuchsia-700' },
  { parcours: 'bts', titre: 'Je termine mon BTS', emoji: '🎓', couleur: 'from-teal-700 to-cyan-800' },
]

export default function Accueil() {
  const { prenom, publicId, maj } = useEtat()
  const [saisie, setSaisie] = useState(prenom)
  const [choix, setChoix] = useState(publicId)
  const [erreurPrenom, setErreurPrenom] = useState('')
  const [erreurPublic, setErreurPublic] = useState('')
  const id = useId()

  function commencer() {
    const p = PrenomSchema.safeParse(saisie)
    setErreurPrenom(p.success ? '' : p.error.issues[0].message)
    setErreurPublic(choix ? '' : 'Choisis où tu en es pour continuer.')
    if (p.success && choix) maj({ prenom: p.data, publicId: choix, avertissementLu: true, etape: 1 })
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h1 tabIndex={-1} className="bg-gradient-to-r from-violet-700 via-fuchsia-700 to-orange-700 bg-clip-text text-2xl font-extrabold text-transparent sm:text-4xl">
          Trouve ta voie, à ton rythme
        </h1>
        <p className="mt-2 text-slate-700">
          Quelques étapes pour découvrir des pistes de métiers, de formations et d’alternance. Ce sont des idées à explorer, pas un verdict.
        </p>
      </div>

      <div role="note" aria-labelledby={`${id}-av`} className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-3 text-sm sm:p-4">
        <h2 id={`${id}-av`} className="flex items-center gap-2 font-bold text-amber-900">
          <span aria-hidden="true">💾</span> Important : où sont gardées tes réponses ?
        </h2>
        <p className="mt-1 text-amber-950" data-testid="avertissement">{AVERTISSEMENT}</p>
        <p className="mt-1 text-amber-900">Aucun compte, aucun email. Rien ne part sur Internet sans ton action : seulement ta commune et les métiers que tu cherches, quand tu lances une recherche (détails en bas de page, « Confidentialité »).</p>
      </div>

      <fieldset aria-describedby={erreurPublic ? `${id}-public-err` : undefined} className="space-y-4">
        <legend className="mb-2 text-xl font-bold">Où en es-tu ?</legend>
        <div className="grid gap-4 md:grid-cols-2">
        {GROUPES.map((g) => (
          <div key={g.parcours} className={`rounded-3xl bg-gradient-to-br ${g.couleur} p-4 text-white shadow-lg`}>
            <p className="flex items-center gap-2 text-lg font-bold">
              <span aria-hidden="true" className="text-2xl">{g.emoji}</span> {g.titre}
            </p>
            <div className="mt-3 grid gap-2">
              {PUBLICS_ACTIFS.filter((p) => p.parcours === g.parcours).map((p) => (
                <label
                  key={p.id}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl bg-white/15 p-3 ring-2 ring-white/30 has-[:checked]:bg-white has-[:checked]:text-slate-900 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-white"
                >
                  <input
                    type="radio"
                    name="public"
                    value={p.id}
                    checked={choix === p.id}
                    onChange={() => setChoix(p.id)}
                    className="size-5 shrink-0 accent-violet-700"
                  />
                  <span className="font-semibold">{p.libelle}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        </div>
        {erreurPublic && <p id={`${id}-public-err`} className="font-semibold text-rose-700">{erreurPublic}</p>}
      </fieldset>

      <div className="rounded-3xl bg-white p-4 shadow-sm">
        <label htmlFor={`${id}-prenom`} className="font-bold">
          Ton prénom <span className="font-normal text-slate-600">(facultatif)</span>
        </label>
        <p id={`${id}-prenom-aide`} className="text-sm text-slate-600">Juste pour te saluer. Pas de nom de famille.</p>
        <input
          id={`${id}-prenom`}
          value={saisie}
          maxLength={PRENOM_MAX}
          autoComplete="off"
          onChange={(e) => setSaisie(e.target.value)}
          aria-invalid={!!erreurPrenom}
          aria-describedby={`${id}-prenom-aide${erreurPrenom ? ` ${id}-prenom-err` : ''}`}
          className="mt-2 w-full rounded-2xl border-2 border-slate-300 px-4 py-3 text-lg focus:border-violet-600"
        />
        {erreurPrenom && <p id={`${id}-prenom-err`} className="mt-1 font-semibold text-rose-700">{erreurPrenom}</p>}
      </div>

      <div className="text-center">
        <Bouton onClick={commencer} className="px-8 text-lg">C’est parti <span aria-hidden="true">→</span></Bouton>
      </div>
    </div>
  )
}
