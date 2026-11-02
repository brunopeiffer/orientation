# Orientation — pistes métiers et formations (STMG, BTS CG, BTS NDRC)

Application web d'aide à l'orientation, sans compte : toutes les réponses restent dans le navigateur.
Plan et jalons : [PLAN.md](PLAN.md). Listes à valider : [métiers](docs/METIERS-A-VALIDER.md), [poursuites d'études](docs/POURSUITES-A-VALIDER.md).

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

Données : ROME (France Travail, Licence Ouverte), Parcoursup (MESR, Licence Ouverte Etalab 2.0).
