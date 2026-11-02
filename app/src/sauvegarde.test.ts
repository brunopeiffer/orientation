import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exporter, lireSauvegarde, nomFichier } from './sauvegarde'
import { ETAT_INITIAL, type Etat } from './schema'

const etat: Etat = { prenom: 'Léa-Marie', publicId: 'BTS_NDRC', etape: 3, avertissementLu: true, personnalite: { e1: 4, o9: 2 } }

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

  it('refuse un public désactivé et un prénom invalide', () => {
    for (const modif of [{ publicId: 'STI2D' }, { prenom: '<script>' }, { prenom: 'x'.repeat(31) }]) {
      expect(lireSauvegarde(exporter({ ...etat, ...modif })).ok).toBe(false)
    }
  })

  it('migre une sauvegarde de la version 1 (avant le test de personnalité)', () => {
    const { personnalite: _, ...v1 } = etat
    const texte = JSON.stringify({ app: 'orientation', version: 1, exporteLe: '2026-11-02T10:00:00Z', etat: v1 })
    expect(lireSauvegarde(texte)).toEqual({ ok: true, etat: { ...v1, personnalite: {} } })
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
    localStorage.setItem('orientation-etat', JSON.stringify({ state: etat, version: 2 }))
    const { useEtat, etatSeul } = await import('./store')
    expect(etatSeul(useEtat.getState())).toEqual(etat)
  })

  it('migre un stockage de la version 1', async () => {
    const { personnalite: _, ...v1 } = etat
    localStorage.setItem('orientation-etat', JSON.stringify({ state: v1, version: 1 }))
    const { useEtat, etatSeul } = await import('./store')
    expect(etatSeul(useEtat.getState())).toEqual({ ...v1, personnalite: {} })
  })

  it('un stockage abîmé ne casse pas l’app', async () => {
    localStorage.setItem('orientation-etat', JSON.stringify({ state: { etape: 'oups' }, version: 1 }))
    const { useEtat, etatSeul } = await import('./store')
    expect(etatSeul(useEtat.getState())).toEqual(ETAT_INITIAL)
  })
})
