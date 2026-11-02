// Node ≥ 25 expose son propre `localStorage` (vide sans --localstorage-file) qui masque celui de jsdom.
const jsdomStorage = (globalThis as { jsdom?: { window: Window } }).jsdom?.window.localStorage
if (jsdomStorage) Object.defineProperty(globalThis, 'localStorage', { value: jsdomStorage, configurable: true })
