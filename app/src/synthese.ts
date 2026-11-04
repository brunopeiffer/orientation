import { z } from 'zod'
import brutPlan from '../../contenu/plan-action.json'
import { dominants, GOUTS, matieresDe, matieresFortes } from './gouts'
import { pistes } from './metiers'
import { complet, scorer, TEST } from './personnalite'
import { parcoursDe, PUBLICS, type Etat } from './schema'

const Etape = z.object({ texte: z.string(), lien: z.object({ texte: z.string(), url: z.string().url() }).optional() })
export const PLAN = z.object({ statut: z.string(), date: z.string(), lycee: z.array(Etape).min(3), bts: z.array(Etape).min(3) }).parse(brutPlan)

const INTENSITE = { legere: 'préférence légère', marquee: 'préférence marquée', tres_marquee: 'préférence très marquée' } as const
const libelles = (ids: string[], liste: { id: string; libelle: string }[]) => liste.filter((x) => ids.includes(x.id)).map((x) => x.libelle)

/**
 * Contenu de la synthèse imprimable. N'utilise QUE le profil d'orientation : la donnée handicap n'y figure jamais
 * (la synthèse peut être montrée à un enseignant ou imprimée).
 */
export function synthese(e: Omit<Etat, 'handicap'>, aujourdhui = new Date()) {
  const parcours = parcoursDe(e.publicId)
  const matieres = matieresDe(e.publicId)?.matieres ?? []
  return {
    prenom: e.prenom,
    public: PUBLICS.find((p) => p.id === e.publicId)?.libelle ?? null,
    date: aujourdhui.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    personnalite: complet(e.personnalite)
      ? scorer(e.personnalite).map((s) => {
          const d = TEST.dimensions.find((x) => x.id === s.id)!
          return { dimension: d.nom, resume: s.pole ? `${d[s.pole].libelle} (${INTENSITE[s.intensite as keyof typeof INTENSITE]})` : 'Équilibré' }
        })
      : null,
    interets: dominants(e.gouts.activites).map((s) => GOUTS.types.find((t) => t.id === s.id)!.nom),
    environnements: libelles(e.gouts.environnements, GOUTS.environnements),
    valeurs: libelles(e.gouts.valeurs, GOUTS.valeurs),
    refus: libelles(e.gouts.refus, GOUTS.refus),
    matieresFortes: libelles(matieresFortes(e.scolarite, e.publicId), matieres),
    pistes: Object.keys(e.gouts.activites).length
      ? pistes(e).slice(0, 5).map((p) => ({ code: p.metier.code, metier: p.metier.libelle, famille: p.famille.nom, score: p.score,
          freins: libelles(p.freins, GOUTS.refus) }))
      : [],
    mobilite: e.mobilite.commune ? { commune: e.mobilite.commune.nom, rayon: e.mobilite.rayon } : null,
    plan: parcours ? PLAN[parcours] : [],
  }
}
export type Synthese = ReturnType<typeof synthese>
