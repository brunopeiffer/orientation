import { SOURCES } from '../net'

/** Généré depuis config/sources.json : la liste exacte des services que l'app peut contacter. */
export default function Confidentialite() {
  return (
    <details className="rounded-3xl bg-white/70 p-4 text-sm shadow-sm">
      <summary className="min-h-6 cursor-pointer font-semibold text-violet-900">Confidentialité : ce qui sort de ton appareil</summary>
      <p className="mt-2">
        Pas de compte, pas de cookie, pas de mesure d’audience. Ton prénom et tes réponses restent dans ce navigateur. L’app ne peut contacter que ces services :
      </p>
      <ul className="mt-2 space-y-2">
        {SOURCES.map((s) => (
          <li key={s.id} className="rounded-2xl bg-violet-50 p-3">
            <strong>{s.nom}</strong> ({s.hote}) : {s.usage}
            <br />Ce qui est envoyé : {s.envoye}
          </li>
        ))}
      </ul>
    </details>
  )
}
