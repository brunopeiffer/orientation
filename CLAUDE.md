# CLAUDE.md — conventions du projet orientation

App d'aide à l'orientation pour Terminale STMG, BTS CG et BTS NDRC. Le plan et les jalons sont dans `PLAN.md`.

## Règles non négociables
- Aucun compte. L'état reste dans le navigateur. Le prénom est facultatif et n'est jamais envoyé sur le réseau.
- Aucune donnée inventée : chaque chiffre affiché porte `{source, date}`, sinon « non disponible ».
- Tout appel réseau passe par `app/src/net.ts`, qui n'autorise que les hôtes de `config/sources.json`. On ne fait jamais de fetch direct ailleurs.
- La donnée handicap ne sort jamais du navigateur : pas de requête, pas de proxy, pas de log.
- Secrets (`LBA_TOKEN`, identifiants France Travail) : uniquement en variables d'environnement du Worker. Ils ne vont jamais dans le code, les commits, les logs ou le chat.
- Interdit de scraper. On n'utilise que les API et téléchargements officiels, en respectant leurs CGU.
- Ne jamais deviner un nom de champ : on télécharge un échantillon, on liste les champs, et l'ETL vérifie le schéma puis échoue avec un message clair.
- Le contenu à faire relire (questions du test, fiches réalité, liens handicap) porte `statut: A_VALIDER` et est recensé dans `docs/CONTENU-A-VALIDER.md`.

## Ton et interface
- Tutoiement, phrases courtes, niveau 15-20 ans. On propose des pistes, jamais un verdict.
- Mobile first ; doit être beau sur ordinateur. Interface colorée et moderne, couleurs en tokens Tailwind, contraste AA vérifié par axe.
- RGAA / WCAG 2.2 AA : labels, focus visible, cibles ≥ 24 px, rien ne repose sur la couleur seule.

## Commandes
```bash
python3 -I etl/rome_candidats.py     # data/metiers.json (lu par l'app) + docs/METIERS-A-VALIDER.md depuis le ROME
python3 -I etl/poursuites_bt.py      # docs/POURSUITES-A-VALIDER.md depuis Parcoursup
python3 -I etl/formations.py         # data/formations/<région>.json + index, depuis Parcoursup (offre + statistiques)
python3 -I etl/offres_post_bts.py    # data/post-bts.json : licences pro (MESR), DCG et BUT (Parcoursup) localisés
python3 -I etl/contenu_a_valider.py  # docs/CONTENU-A-VALIDER.md depuis contenu/*.json (à relancer après toute modif)
python3 -I -m unittest discover etl  # tests de l'ETL (échec propre si le ROME change de structure)
```
```bash
git config core.hooksPath .githooks  # une fois après le clone : active le hook anti-secrets (gitleaks si installé)
cd app && npm install                # puis : npm run dev | npm test | npm run e2e | npm run build
npx playwright install chromium      # une fois, pour npm run e2e (ou PW_CHANNEL=chrome npm run e2e avec le Chrome installé)
```
Proxy : `cd proxy && npm install && npm test` (tests) ; déploiement et clé : voir README.md (`wrangler secret put LBA_TOKEN`, jamais de clé dans un fichier).

## Structure
- `config/publics.json` : les publics (et `actif`). Config en JSON plutôt qu'en YAML : lisible par l'app et par l'ETL Python sans dépendance.
- `app/src/schema.ts` : schémas Zod (état, fichier de sauvegarde). `store.ts` : état Zustand persisté (`orientation-etat`, versionné ; migrations dans `migrate`). `sauvegarde.ts` : export, import, téléchargement. `etapes.ts` : étapes de chaque parcours.
- M2 : `contenu/gouts.json` (intérêts RIASEC, environnements, valeurs, refus) et `config/matieres.json` (matières par public, notes en tranches) ; logique dans `app/src/gouts.ts`.
- M3 : `data/metiers.json` est GÉNÉRÉ par l'ETL (ne pas l'éditer à la main) ; profils de familles et fiches réalité dans `contenu/metiers-familles.json` ; matching dans `app/src/metiers.ts` (poids dans `POIDS`).
- M4 : `data/formations/` GÉNÉRÉ par l'ETL (un fichier par région, chargé à la demande via `import.meta.glob`) ; liens formations ↔ familles dans `contenu/formations-familles.json` ; logique dans `app/src/formations.ts`. Réseau : `app/src/net.ts` + `config/sources.json` (géocodage IGN, commune seulement, `app/src/geocodage.ts`).
- M5 : parcours BTS. Voies et canaux de candidature dans `contenu/poursuites-bts.json` (À VALIDER chaque année) ; offres localisées `data/post-bts.json` GÉNÉRÉ par l'ETL ; logique `app/src/postbts.ts`, écran `components/PostBts.tsx`.
- M6 : `proxy/` (Cloudflare Worker : CORS, limite de débit, cache 1 h, aucun journal ; seule source à clé : La bonne alternance, qui inclut les offres France Travail). Recherche d'entreprises appelée directement par le navigateur (API publique, limite par IP). `app/src/alternance.ts`, écrans `Alternance.tsx` et `Handicap.tsx`. La donnée handicap ne sort JAMAIS du navigateur (test `e2e/m6.spec.ts`).
- Toute nouvelle donnée de l'élève : l'ajouter à `EtatSchema`, augmenter `VERSION_ETAT`, écrire la migration et le test.

## Code
- TypeScript strict. Zod valide toute donnée qui entre (import JSON, réponses du proxy, JSON de l'ETL).
- ETL en Python 3, bibliothèque standard uniquement. Les sources brutes vont dans `data/sources/` (ignoré par git).
- Un commit par jalon, avec ses tests. Les messages de commit sont en français.
