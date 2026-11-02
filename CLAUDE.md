# CLAUDE.md — conventions du projet orientation

App d'aide à l'orientation pour Terminale STMG, BTS CG et BTS NDRC. Le plan et les jalons sont dans `PLAN.md`.

## Règles non négociables
- Aucun compte. L'état reste dans le navigateur. Le prénom est facultatif et n'est jamais envoyé sur le réseau.
- Aucune donnée inventée : chaque chiffre affiché porte `{source, date}`, sinon « non disponible ».
- Tout appel réseau passe par `app/src/net.ts`, qui n'autorise que les hôtes de `config/sources.yaml`. On ne fait jamais de fetch direct ailleurs.
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
python3 -I etl/rome_candidats.py     # docs/METIERS-A-VALIDER.md depuis le ROME
python3 -I etl/poursuites_bt.py      # docs/POURSUITES-A-VALIDER.md depuis Parcoursup
```
Les commandes de l'app (`npm run dev|test|e2e|build`) et du proxy (`wrangler dev`) seront ajoutées en M0 et M6.

## Code
- TypeScript strict. Zod valide toute donnée qui entre (import JSON, réponses du proxy, JSON de l'ETL).
- ETL en Python 3, bibliothèque standard uniquement. Les sources brutes vont dans `data/sources/` (ignoré par git).
- Un commit par jalon, avec ses tests. Les messages de commit sont en français.
