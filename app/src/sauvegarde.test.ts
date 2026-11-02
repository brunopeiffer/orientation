import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exporter, lireSauvegarde, nomFichier } from './sauvegarde'
import { ETAT_INITIAL, type Etat } from './schema'

const etat: Etat = { prenom: 'Léa-Marie', publicId: 'BTS_NDRC', etape: 3, avertissementLu: true }

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
    localStorage.setItem('orientation-etat', JSON.stringify({ state: etat, version: 1 }))
    const { useEtat, etatSeul } = await import('./store')
    expect(etatSeul(useEtat.getState())).toEqual(etat)
  })

  it('un stockage abîmé ne casse pas l’app', async () => {
    localStorage.setItem('orientation-etat', JSON.stringify({ state: { etape: 'oups' }, version: 1 }))
    const { useEtat, etatSeul } = await import('./store')
    expect(etatSeul(useEtat.getState())).toEqual(ETAT_INITIAL)
  })
})
