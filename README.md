# Orientation — pistes métiers et formations (STMG, BTS CG, BTS NDRC)

Application web d'aide à l'orientation, sans compte : toutes les réponses restent dans le navigateur.
Plan et jalons : [PLAN.md](PLAN.md). Listes à valider : [métiers](docs/METIERS-A-VALIDER.md), [poursuites d'études](docs/POURSUITES-A-VALIDER.md).
Contenus rédigés à relire : [CONTENU-A-VALIDER](docs/CONTENU-A-VALIDER.md). Audits : [accessibilité](docs/AUDIT-ACCESSIBILITE.md), [confidentialité](docs/CONFIDENTIALITE.md).

## Démarrer

```bash
git config core.hooksPath .githooks   # active le hook anti-secrets
cd app && npm install
npm run dev        # http://localhost:5173
npm test           # tests unitaires
npm run e2e        # tests navigateur mobile + ordinateur (après : npx playwright install chromium, ou PW_CHANNEL=chrome npm run e2e)
```

Publication : chaque push sur `main` lance les tests puis publie sur GitHub Pages
(une fois : Settings > Pages > Source = « GitHub Actions »).

## Proxy (offres en alternance)

Le dossier `proxy/` est un Cloudflare Worker qui appelle La bonne alternance avec la clé de l'app, sans jamais
l'exposer au navigateur. Sans proxy, l'app fonctionne quand même : elle propose des liens préremplis.

1. Créer la clé d'API sur https://api.apprentissage.beta.gouv.fr (compte, rubrique profil).
2. Dans `proxy/wrangler.toml`, `ALLOWED_ORIGINS` contient l'adresse GitHub Pages de l'app (https://brunopeiffer.github.io) : à adapter si le dépôt change de compte.
3. Déployer, puis saisir la clé (elle est demandée dans le terminal, jamais écrite dans un fichier) :
   ```bash
   cd proxy && npx wrangler@4 deploy
   npx wrangler@4 secret put LBA_TOKEN
   ```
4. Sur GitHub : Settings > Secrets and variables > Actions > Variables : `PROXY_URL` = l'adresse du Worker
   (ex. `https://orientation-proxy.<compte>.workers.dev`). C'est une adresse publique, pas un secret.

Tests du proxy : `cd proxy && npm install && npm test`.

Données : ROME (France Travail, Licence Ouverte), Parcoursup et diplômes (MESR, Licence Ouverte Etalab 2.0),
Recherche d'entreprises et La bonne alternance (Licence Ouverte Etalab 2.0).
