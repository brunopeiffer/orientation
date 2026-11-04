# Confidentialité — ce que fait l'application de tes données

Document de référence (vérifié par les tests `app/src/csp.test.ts` et `app/e2e/m7.spec.ts`). Dernière mise à jour : 04/11/2026.

## En bref
- **Aucun compte, aucune inscription, aucun cookie, aucune mesure d'audience, aucune police ni script externe.**
- Tes réponses restent **dans ton navigateur**, sur cet appareil (stockage local, clé `orientation-etat`).
  Elles disparaissent si tu cliques sur « Tout effacer », si tu vides les données du site ou en navigation privée.
- Seul le **prénom** est demandé, et il est facultatif. Jamais de nom de famille, d'email ou d'adresse.
- Le bouton « Sauvegarder » crée un fichier sur ton appareil ; personne d'autre ne le reçoit.

## Ce qui est gardé dans ton navigateur
Prénom (facultatif), parcours (STMG, BTS CG ou BTS NDRC), réponses au test de personnalité, goûts, valeurs et refus,
tranches de notes (jamais de note exacte), commune choisie et distance, et, seulement si tu l'actives, les sujets
du module handicap.

## Les seuls services contactés, et seulement quand tu le demandes
La liste fait foi dans `config/sources.json`. L'application refuse techniquement tout autre service (module `net.ts`
et politique de sécurité du contenu du navigateur).

| Service | Quand | Ce qui est envoyé |
|---|---|---|
| Géocodage de l'IGN (`data.geopf.fr`) | Quand tu cherches ta commune | Ce que tu tapes : nom de commune ou code postal |
| Recherche d'entreprises de l'État (`recherche-entreprises.api.gouv.fr`) | Quand tu cliques sur « Chercher » à l'étape alternance | Coordonnées du centre de ta commune arrondies à environ 1 km, distance, codes d'activité |
| Relais de l'app pour La bonne alternance (proxy Cloudflare, adresse fixée au déploiement) | Quand tu cliques sur « Chercher » à l'étape alternance | Coordonnées arrondies à environ 1 km, distance, codes ROME des métiers choisis |

**Jamais envoyés** : ton prénom, tes réponses aux tests, tes notes, et les informations du module handicap.
Les liens vers des sites officiels (Parcoursup, France Travail, etc.) ne sont suivis que si tu cliques dessus.

## Le relais (proxy)
Il garde secrète la clé d'accès à La bonne alternance. Il n'enregistre aucun journal (ni commune, ni coordonnées,
ni paramètres), n'accepte que les appels venant de l'application et garde chaque résultat en cache une heure pour
limiter les appels. Code : `proxy/src/index.ts`.

## Module handicap
Facultatif. Les choix restent dans ton navigateur. Ils ne figurent dans aucune requête réseau ni dans la synthèse
imprimable. Ils sont en revanche dans le fichier « Sauvegarder » si tu l'utilises : garde ce fichier pour toi.

## Comment c'est vérifié (audit M7)
- `app/e2e/m7.spec.ts` parcourt l'application en déclenchant toutes les fonctions qui peuvent contacter un service :
  les services réellement contactés sont exactement ceux listés dans la section Confidentialité de l'app ;
  aucun cookie ; un seul élément de stockage (`orientation-etat`).
- `app/e2e/m6.spec.ts` : la donnée handicap n'apparaît dans aucune requête, et les requêtes sont identiques que le
  module soit activé ou non.
- `app/src/csp.test.ts` : seul `app/src/net.ts` appelle le réseau ; la politique de sécurité du contenu (CSP) injectée
  au build n'autorise que les hôtes de `config/sources.json` ; ce document cite chacun d'eux.
- `proxy/src/index.test.ts` : le relais n'écrit aucun journal et ne renvoie jamais sa clé.

## Effacer tes données
Bouton « Tout effacer » en bas de chaque écran (avec confirmation), ou suppression des données du site dans les
réglages de ton navigateur.
