import config from '../../config/sources.json'

/**
 * Politique de sécurité du contenu (CSP) injectée au build dans index.html : le navigateur lui-même refuse tout
 * appel vers un hôte absent de config/sources.json. La page Confidentialité et cette politique ont donc la même liste.
 * 'unsafe-inline' pour les styles seulement : React pose quelques attributs style (barres de progression).
 */
export function politique(proxyUrl = ''): string {
  const hotes = config.sources
    .map((s) => (s.id === 'proxy' ? (proxyUrl.startsWith('https://') ? new URL(proxyUrl).host : '') : s.hote))
    .filter(Boolean)
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self' ${hotes.map((h) => `https://${h}`).join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join('; ')
}
