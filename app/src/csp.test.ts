import { describe, expect, it } from 'vitest'
import doc from '../../docs/CONFIDENTIALITE.md?raw'
import html from '../index.html?raw'
import config from '../../config/sources.json'
import { politique } from './csp'

const directive = (csp: string, nom: string) => csp.split('; ').find((d) => d.startsWith(`${nom} `))!.split(' ').slice(1)
const fixes = config.sources.filter((s) => s.hote).map((s) => s.hote)

describe('politique de sécurité du contenu (CSP)', () => {
  it('n’autorise en connexion que l’app et les hôtes de config/sources.json', () => {
    expect(directive(politique(), 'connect-src')).toEqual(["'self'", ...fixes.map((h) => `https://${h}`)])
    expect(directive(politique('https://orientation-proxy.exemple.workers.dev/'), 'connect-src'))
      .toEqual(["'self'", ...fixes.map((h) => `https://${h}`), 'https://orientation-proxy.exemple.workers.dev'])
  })

  it('refuse un proxy non https, tout script, police, cadre ou formulaire externe', () => {
    expect(politique('http://proxy.exemple')).not.toContain('proxy.exemple')
    const csp = politique()
    for (const [nom, attendu] of [['default-src', ["'self'"]], ['script-src', ["'self'"]], ['font-src', ["'self'"]], ['object-src', ["'none'"]], ['form-action', ["'none'"]]] as const) {
      expect(directive(csp, nom), nom).toEqual(attendu)
    }
  })
})

describe('audit confidentialité (statique)', () => {
  it('docs/CONFIDENTIALITE.md cite chaque service de config/sources.json', () => {
    for (const h of fixes) expect(doc, h).toContain(h)
    expect(doc).toMatch(/proxy/i)
    expect(doc).toMatch(/handicap/i)
  })

  it('seul net.ts appelle fetch (aucun appel réseau caché ailleurs)', () => {
    const sources = import.meta.glob<string>(['./**/*.{ts,tsx}', '!./**/*.test.ts', '!./**/*.d.ts'], { query: '?raw', import: 'default', eager: true })
    expect(Object.keys(sources).length).toBeGreaterThan(20)
    const appelants = Object.entries(sources).filter(([, code]) => /\bfetch\(|XMLHttpRequest|sendBeacon|WebSocket\(/.test(code)).map(([f]) => f)
    expect(appelants).toEqual(['./net.ts'])
  })

  it('index.html : aucune ressource externe, langue française, aucun référent envoyé', () => {
    expect(html).toMatch(/<html lang="fr">/)
    expect(html).toMatch(/name="referrer" content="no-referrer"/)
    expect(html).not.toMatch(/(src|href)="https?:\/\//)
  })
})
