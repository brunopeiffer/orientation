import { useId, useState } from 'react'
import { PrenomSchema, PRENOM_MAX, PUBLICS_ACTIFS, type Parcours } from '../schema'
import { useEtat } from '../store'
import { Bouton } from './ui'

export const AVERTISSEMENT =
  'Tes réponses sont enregistrées uniquement sur cet appareil et ce navigateur. Si tu vides l’historique, utilises la navigation privée ou changes d’appareil, tu les perds. Utilise le bouton Sauvegarder pour garder une copie.'

const GROUPES: { parcours: Parcours; titre: string; emoji: string; couleur: string }[] = [
  { parcours: 'lycee', titre: 'Je suis au lycée', emoji: '🎒', couleur: 'from-violet-900 to-[#3a3a3c]' },
  { parcours: 'bts', titre: 'Je termine mon BTS', emoji: '🎓', couleur: 'from-violet-700 to-violet-800' },
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
    <div className="space-y-8">
      {/* Grande section sombre d'ouverture (DESIGN.md : temps fort sur fond nuit, titre très grand). */}
      <div className="-mx-5 -mt-5 rounded-t-3xl bg-[var(--da-nuit)] px-6 py-16 text-center sm:-mx-10 sm:-mt-10 sm:py-24">
        <h1 tabIndex={-1} className="da-hero text-[length:var(--da-t-titre-xl)] font-bold text-[var(--da-nuit-texte)]">
          Trouve ta voie, <span className="bg-gradient-to-r from-[#5ac8fa] via-[#a3e3ff] to-[#ffd479] bg-clip-text text-transparent">à ton rythme</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-[#d2d2d7] sm:text-xl">
          Quelques étapes pour découvrir des pistes de métiers, de formations et d’alternance. Ce sont des idées à explorer, pas un verdict.
        </p>
      </div>

      <div role="note" aria-labelledby={`${id}-av`} className="rounded-3xl bg-violet-50 p-5 text-base sm:p-6">
        <h2 id={`${id}-av`} className="flex items-center gap-2 font-semibold">
          <span aria-hidden="true">💾</span> Important : où sont gardées tes réponses ?
        </h2>
        <p className="mt-2 text-slate-700" data-testid="avertissement">{AVERTISSEMENT}</p>
        <p className="mt-2 text-slate-700">Aucun compte, aucun email. Rien ne part sur Internet sans ton action : seulement ta commune et les métiers que tu cherches, quand tu lances une recherche (détails en bas de page, « Confidentialité »).</p>
      </div>

      <fieldset aria-describedby={erreurPublic ? `${id}-public-err` : undefined} className="space-y-4">
        <legend className="mb-2 text-[length:var(--da-t-sous-titre)] font-bold">Où en es-tu ?</legend>
        <div className="grid gap-4 md:grid-cols-2">
        {GROUPES.map((g) => (
          <div key={g.parcours} className={`rounded-3xl bg-gradient-to-br ${g.couleur} p-5 text-white transition-transform duration-300 hover:scale-[1.01] sm:p-6`}>
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

      <div className="rounded-3xl bg-violet-50 p-5 sm:p-6">
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
          className="mt-2 w-full rounded-2xl border border-violet-200 bg-white px-4 py-3 text-lg focus:border-violet-600"
        />
        {erreurPrenom && <p id={`${id}-prenom-err`} className="mt-1 font-semibold text-rose-700">{erreurPrenom}</p>}
      </div>

      <div className="text-center">
        <Bouton onClick={commencer} className="px-8 text-lg">C’est parti <span aria-hidden="true">→</span></Bouton>
      </div>
    </div>
  )
}
