import contenu from '../../../contenu/pratique.json'

/** Aides pratiques (bourses, logement, accompagnement) : liens officiels, aucun montant ni date inventés. */
export default function Pratique() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {contenu.blocs.map((b) => (
        <section key={b.titre} className="break-inside-avoid rounded-3xl bg-emerald-50 p-4 text-emerald-950 print:bg-white print:p-2 print:ring-1 print:ring-slate-400">
          <h2 className="text-lg font-extrabold">{b.titre}</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            {b.points.map((p) => (
              <li key={p.texte}>
                {p.texte}
                {'lien' in p && p.lien && (
                  <> <a href={p.lien.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
                    {p.lien.texte}<span className="sr-only"> (s’ouvre dans un nouvel onglet)</span>
                  </a></>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
