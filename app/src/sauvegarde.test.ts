import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exporter, lireSauvegarde, nomFichier } from './sauvegarde'
import { GOUTS_VIDES, SCOLARITE_VIDE } from './gouts'
import { ETAT_INITIAL, FAVORIS_VIDES, HANDICAP_INITIAL, MOBILITE_INITIALE, PrenomSchema, type Etat } from './schema'

const etat: Etat = {
  prenom: 'Léa-Marie', publicId: 'BTS_NDRC', etape: 4, avertissementLu: true, personnalite: { e1: 4, o9: 2 },
  gouts: { activites: { r1: 0, e1: 2 }, environnements: ['bureau'], valeurs: ['salaire', 'equipe'], refus: ['debout'] },
  scolarite: { option: null, notes: { ndrc_vente: '14a16', lva: '8a10' }, aimees: ['ndrc_digital'] },
  mobilite: { commune: { nom: 'Illkirch-Graffenstaden', code: '67218', cp: '67400', lat: 48.5247, lon: 7.7224 }, rayon: 20 },
  handicap: { actif: true, sujets: ['etudes'] },
  favoris: { metiers: ['D1402'], formations: [{ id: '7969', intitule: 'BUT - Techniques de commercialisation', etablissement: 'IUT', ville: 'Illkirch', lien: 'https://dossier.parcoursup.fr/x' }] },
}
const NOUVEAU_V3 = { gouts: GOUTS_VIDES, scolarite: SCOLARITE_VIDE, mobilite: MOBILITE_INITIALE, handicap: HANDICAP_INITIAL, favoris: FAVORIS_VIDES }

describe('export / import', () => {
  it('un export relu redonne exactement le même état', () => {
    expect(lireSauvegarde(exporter(etat))).toEqual({ ok: true, etat })
  })

  it('refuse un fichier qui n’est pas du JSON', () => {
    const r = lireSauvegarde('pas du json')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.erreur).toMatch(/JSON/)
  })

  it('refuse un JSON qui n’est pas une sauvegarde de l’app', () => {
    expect(lireSauvegarde('{"a":1}').ok).toBe(false)
  })

  it('refuse un champ en trop (ex. nom de famille)', () => {
    const f = JSON.parse(exporter(etat))
    f.etat.nom = 'Dupont'
    expect(lireSauvegarde(JSON.stringify(f)).ok).toBe(false)
  })

  it('accepte l’apostrophe typographique des téléphones dans le prénom (« N’Golo »)', () => {
    expect(PrenomSchema.parse('N’Golo')).toBe("N'Golo")
    expect(lireSauvegarde(exporter({ ...etat, prenom: 'N’Golo' }))).toEqual({ ok: true, etat: { ...etat, prenom: "N'Golo" } })
  })

  it('refuse un public désactivé et un prénom invalide', () => {
    for (const modif of [{ publicId: 'STI2D' }, { prenom: '<script>' }, { prenom: 'x'.repeat(31) }]) {
      expect(lireSauvegarde(exporter({ ...etat, ...modif })).ok).toBe(false)
    }
  })

  it('migre une sauvegarde de la version 1 (avant le test de personnalité)', () => {
    const { personnalite: _, gouts: __, scolarite: ___, mobilite: ____, handicap: _____, favoris: ______, ...v1 } = etat
    const texte = JSON.stringify({ app: 'orientation', version: 1, exporteLe: '2026-11-02T10:00:00Z', etat: v1 })
    expect(lireSauvegarde(texte)).toEqual({ ok: true, etat: { ...v1, personnalite: {}, ...NOUVEAU_V3 } })
  })

  it('migre une sauvegarde de la version 2 (avant les goûts et les notes)', () => {
    const { gouts: _, scolarite: __, mobilite: ___, handicap: ____, favoris: _____, ...v2 } = etat
    const texte = JSON.stringify({ app: 'orientation', version: 2, exporteLe: '2026-11-02T10:00:00Z', etat: v2 })
    expect(lireSauvegarde(texte)).toEqual({ ok: true, etat: { ...v2, ...NOUVEAU_V3 } })
  })

  it('migre une sauvegarde de la version 3 (avant la mobilité)', () => {
    const { mobilite: _, handicap: __, favoris: ___, ...v3 } = etat
    const texte = JSON.stringify({ app: 'orientation', version: 3, exporteLe: '2026-11-03T10:00:00Z', etat: v3 })
    expect(lireSauvegarde(texte)).toEqual({ ok: true, etat: { ...v3, mobilite: MOBILITE_INITIALE, handicap: HANDICAP_INITIAL, favoris: FAVORIS_VIDES } })
  })

  it('migre une sauvegarde de la version 4 (avant le module handicap, désactivé par défaut)', () => {
    const { handicap: _, favoris: __, ...v4 } = etat
    const texte = JSON.stringify({ app: 'orientation', version: 4, exporteLe: '2026-11-03T10:00:00Z', etat: v4 })
    expect(lireSauvegarde(texte)).toEqual({ ok: true, etat: { ...v4, handicap: { actif: false, sujets: [] }, favoris: FAVORIS_VIDES } })
  })

  it('migre la version 5 : goûts et résultats passent avant la personnalité, favoris vides', () => {
    const { favoris: _, ...v5 } = etat
    for (const [avant, apres] of [[0, 0], [1, 3], [2, 1], [3, 2], [7, 7]]) {
      const texte = JSON.stringify({ app: 'orientation', version: 5, exporteLe: '2026-11-07T10:00:00Z', etat: { ...v5, etape: avant } })
      expect(lireSauvegarde(texte), `étape ${avant}`).toEqual({ ok: true, etat: { ...v5, etape: apres, favoris: FAVORIS_VIDES } })
    }
  })

  it('refuse des favoris invalides (code ROME faux, doublon, lien non https)', () => {
    const f = etat.favoris.formations[0]
    for (const favoris of [{ metiers: ['XX'], formations: [] }, { metiers: ['D1402', 'D1402'], formations: [] }, { metiers: [], formations: [{ ...f, lien: 'javascript:alert(1)' }] }]) {
      expect(lireSauvegarde(exporter({ ...etat, favoris } as Etat)).ok).toBe(false)
    }
  })

  it('refuse un sujet handicap inconnu ou un champ libre (aucune donnée de santé en texte libre)', () => {
    for (const handicap of [{ actif: true, sujets: ['diagnostic'] }, { actif: true, sujets: [], details: 'x' }]) {
      expect(lireSauvegarde(exporter({ ...etat, handicap } as Etat)).ok).toBe(false)
    }
  })

  it('refuse une adresse précise ou un rayon inconnu : seule la commune est gardée', () => {
    const m = etat.mobilite
    for (const mobilite of [
      { ...m, commune: { ...m.commune!, adresse: '3 rue des Lilas' } },
      { ...m, rayon: 37 },
    ]) expect(lireSauvegarde(exporter({ ...etat, mobilite } as Etat)).ok).toBe(false)
  })

  it('refuse une note exacte, une tranche ou une matière inconnue', () => {
    for (const notes of [{ lva: '13.5' }, { lva: 'plus20' }, { physique: '12a14' }] as Record<string, string>[]) {
      expect(lireSauvegarde(exporter({ ...etat, scolarite: { ...etat.scolarite, notes } })).ok).toBe(false)
    }
  })

  it('refuse plus de 3 valeurs, un choix en double ou inconnu, un niveau d’intérêt hors échelle', () => {
    const g = etat.gouts
    for (const gouts of [
      { ...g, valeurs: ['salaire', 'equipe', 'utilite', 'defi'] },
      { ...g, refus: ['debout', 'debout'] },
      { ...g, environnements: ['lune'] },
      { ...g, activites: { r1: 3 } },
    ]) expect(lireSauvegarde(exporter({ ...etat, gouts })).ok).toBe(false)
  })

  it('refuse une réponse hors échelle ou une question inconnue', () => {
    for (const personnalite of [{ e1: 6 }, { zz: 3 }] as Record<string, number>[]) {
      expect(lireSauvegarde(exporter({ ...etat, personnalite })).ok).toBe(false)
    }
  })

  it('refuse un fichier trop gros', () => {
    expect(lireSauvegarde(' '.repeat(1_000_001)).ok).toBe(false)
  })

  it('nomme le fichier avec la date', () => {
    expect(nomFichier(new Date('2026-11-02T10:00:00Z'))).toBe('orientation-sauvegarde-2026-11-02.json')
  })
})

describe('stockage local', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('Tout effacer vide le stockage', async () => {
    const { useEtat, CLE_STOCKAGE } = await import('./store')
    useEtat.getState().maj(etat)
    expect(localStorage.getItem(CLE_STOCKAGE)).toContain('Léa-Marie')
    useEtat.getState().effacer()
    expect(localStorage.getItem(CLE_STOCKAGE)).toBeNull()
    expect(useEtat.getState().prenom).toBe('')
  })

  it('reprend l’état enregistré au rechargement', async () => {
    localStorage.setItem('orientation-etat', JSON.stringify({ state: etat, version: 6 }))
    const { useEtat, etatSeul } = await import('./store')
    expect(etatSeul(useEtat.getState())).toEqual(etat)
  })

  it('migre un stockage de la version 1', async () => {
    const { personnalite: _, gouts: __, scolarite: ___, mobilite: ____, handicap: _____, favoris: ______, ...v1 } = etat
    localStorage.setItem('orientation-etat', JSON.stringify({ state: v1, version: 1 }))
    const { useEtat, etatSeul } = await import('./store')
    expect(etatSeul(useEtat.getState())).toEqual({ ...v1, personnalite: {}, ...NOUVEAU_V3 })
  })

  it('un stockage abîmé ne casse pas l’app', async () => {
    localStorage.setItem('orientation-etat', JSON.stringify({ state: { etape: 'oups' }, version: 1 }))
    const { useEtat, etatSeul } = await import('./store')
    expect(etatSeul(useEtat.getState())).toEqual(ETAT_INITIAL)
  })
})
