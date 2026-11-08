# Direction artistique — « Mon orientation »

Inspirée de l'esprit d'apple.com/fr (captures du 08/11/2026) **sans rien en copier** : ni logo, ni police SF Pro,
ni textes, ni images. On reprend des principes (sobriété, grands titres, beaucoup d'air, un seul bleu d'action),
pas des éléments.

## 1. Ce que montrent les captures

| Aspect | Observation | Ce qu'on en garde |
|---|---|---|
| Palette | Fond blanc ou gris très clair, sections noires pour les temps forts, texte presque noir, gris moyen pour le texte secondaire, **un seul bleu** pour les actions et les liens. Couleur vive réservée à de petites touches (dégradé d'un sous-titre, cartes pastel). | Fond gris clair, cartes blanches, encre presque noire, bleu d'action unique ; pastels pour donner un sens (pas pour décorer). |
| Typographie | Titres très grands et très gras, interlignage serré, lettres légèrement resserrées ; corps de texte ~17 px, interligne aéré ; petits libellés (menus, « NOUVEAU ») en 12 px. | Inter (fichiers servis par le site, aucun appel externe), titres 700, lettres resserrées ; corps 17 px. |
| Espacements | Beaucoup d'air : grandes marges verticales entre sections, contenu centré, largeur de texte limitée. | Échelle sur une base de 4 px, sections espacées de 48 à 96 px, texte limité à ~70 caractères. |
| Arrondis | Boutons en pilule ; cartes très arrondies (~28 px) ; vignettes arrondies. | Boutons pilule, cartes 28 px, éléments internes 16 px. |
| Menu | Barre du haut fine, translucide (flou d'arrière-plan), libellés courts ; sous-menu horizontal en icônes + libellés, défilant sur mobile. | En-tête collant translucide ; étapes du parcours en rangée horizontale défilante. |
| Animations | Discrètes : fondu et léger glissement à l'apparition, survol des cartes, transitions ~0,3 s. | Mêmes effets, **désactivés** si l'utilisateur demande moins d'animations (`prefers-reduced-motion`). |

## 2. Variables (définies dans `app/src/index.css`)

```css
:root {
  /* Couleurs */
  --da-fond: #f5f5f7;          /* fond de page, gris très clair */
  --da-surface: #ffffff;       /* cartes */
  --da-encre: #1d1d1f;         /* texte principal (16,8:1 sur blanc) */
  --da-encre-2: #424245;       /* texte secondaire (10:1) */
  --da-encre-3: #5e5e63;       /* notes, sources (6,4:1 sur blanc, 5,9:1 sur le fond) */
  --da-trait: #d2d2d7;         /* bordures, séparateurs */
  --da-trait-doux: #e8e8ed;    /* contours de cartes et de puces */
  --da-action: #0071e3;        /* boutons (texte blanc : 4,7:1) */
  --da-action-fonce: #0066cc;  /* liens et survol (5,6:1 sur blanc) */
  --da-nuit: #000000;          /* section sombre de l'accueil */
  --da-nuit-texte: #f5f5f7;

  /* Typographie */
  --da-police: "Inter Variable", Inter, system-ui, "Segoe UI", Roboto, Arial, sans-serif;
  --da-t-titre-xl: clamp(2.5rem, 7vw, 4.5rem);  /* titre d'accueil */
  --da-t-titre: clamp(2rem, 4.5vw, 3rem);       /* titre d'étape (h1) */
  --da-t-sous-titre: 1.5rem;                    /* h2 */
  --da-t-corps: 1.0625rem;                      /* 17 px */
  --da-t-petit: 0.875rem;
  --da-interligne-titre: 1.08;
  --da-interligne: 1.47;
  --da-resserre: -0.022em;                      /* lettres des titres */

  /* Espacements (base 4 px) */
  --da-e-1: 0.25rem; --da-e-2: 0.5rem; --da-e-3: 0.75rem; --da-e-4: 1rem;
  --da-e-6: 1.5rem; --da-e-8: 2rem; --da-e-12: 3rem; --da-e-16: 4rem; --da-e-24: 6rem;

  /* Arrondis */
  --da-r-carte: 28px;
  --da-r-element: 16px;
  --da-r-pilule: 980px;

  /* Animations */
  --da-duree: 0.3s;
  --da-courbe: cubic-bezier(0.25, 0.1, 0.25, 1);
}
```

## 3. Règles

- **Un seul bleu d'action** (`--da-action`) : boutons principaux, cases cochées, focus, liens. Plus de dégradé violet/rose.
- **Titres** : `h1` à `--da-t-titre`, poids 700, lettres resserrées ; un seul `h1` par étape. Accueil : `--da-t-titre-xl`, sur une section sombre.
- **Cartes** : fond blanc, arrondi 28 px, pas d'ombre forte (légère ombre au survol seulement).
- **Pastels** (vert, ambre, orange, ciel, sarcelle) : uniquement pour un sens (accès au métier, alerte, Parcoursup…), jamais seuls : toujours avec un texte ou une icône.
- **Accessibilité** : contraste AA vérifié par axe dans les tests ; corps 17 px ; cibles ≥ 44 px ; focus bleu épais toujours visible ; animations coupées avec `prefers-reduced-motion`.
- **Mise en œuvre** : Tailwind v4. Les nuances `violet-*` et `fuchsia-*` déjà utilisées dans les composants sont **redéfinies** dans `@theme` vers cette palette (encre, gris, bleu) : les composants gardent leurs classes, la DA se règle en un seul endroit.
