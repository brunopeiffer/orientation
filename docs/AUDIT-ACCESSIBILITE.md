# Audit d'accessibilité (RGAA 4 / WCAG 2.2 AA) — jalon M7

Date : 04/11/2026. Réalisé par Claude à l'aide de tests automatiques. **Ce n'est pas un audit RGAA complet** réalisé
par un auditeur certifié sur les 106 critères : voir « Limites » ci-dessous.

## Périmètre
Les 8 écrans des deux parcours (lycée STMG, BTS NDRC ; BTS CG partage les mêmes écrans), sur téléphone (Pixel 7)
et sur ordinateur, plus la synthèse imprimée.

## Ce qui est vérifié automatiquement, à chaque mise en ligne (`app/e2e/`)
| Vérification | Référence | Résultat |
|---|---|---|
| axe-core, règles WCAG 2.0, 2.1 et 2.2 niveaux A et AA, sur chaque écran des deux parcours | WCAG 2.2 AA | 0 violation |
| Affichage à 320 px de large sans défilement horizontal, sur chaque écran | WCAG 1.4.10, RGAA 10.11 | OK |
| Lien d'évitement « Aller au contenu », premier élément atteint au clavier | RGAA 12.7, WCAG 2.4.1 | OK |
| Accueil rempli et validé entièrement au clavier ; questionnaire utilisable au clavier | RGAA 12.11, WCAG 2.1.1 | OK |
| Focus visible (contour de 3 px) | RGAA 10.7, WCAG 2.4.7 | OK |
| Titre de page propre à chaque étape (« … – étape 3 sur 7 – Mon orientation ») | RGAA 8.6, WCAG 2.4.2 | OK |
| Focus placé sur le titre à chaque changement d'étape | RGAA 12.8 | OK |
| Langue de la page (`lang="fr"`) | RGAA 8.3 | OK |
| Synthèse imprimable en A4 : navigation masquée, texte ≥ 10 pt, 3 pages au plus | — | OK |

## Choix de conception (vérifiés à la relecture du code)
- Emojis décoratifs masqués aux lecteurs d'écran (`aria-hidden`) ; aucune image porteuse d'information.
- Aucune information donnée par la couleur seule : badges et niveaux d'accès ont toujours un texte.
- Formulaires : chaque champ a une étiquette ; groupes de choix dans des `fieldset`/`legend` ; erreurs annoncées
  (`role="alert"`) et reliées au champ (`aria-describedby`).
- Cibles tactiles : 44 px de haut pour les boutons, choix et liens d'action ; 24 px pour les titres dépliables
  (`summary`), soit le minimum de WCAG 2.5.8.
- Composants natifs (boutons, cases, listes déroulantes, `details`, `dialog`) plutôt que des composants recréés.
- Animations désactivées si l'utilisateur le demande (`prefers-reduced-motion`).

## Défauts trouvés par cet audit et corrigés en M7
1. Pas de lien d'évitement : ajouté.
2. Titre de page identique sur tous les écrans : un titre par étape.
3. Synthèse : de longues adresses débordaient de 38 px à 320 px de large ; elles passent maintenant à la ligne.
4. En développement, le focus partait sur le titre dès le chargement (double effet de React StrictMode), ce qui
   faisait sauter le lien d'évitement : la condition a été rendue robuste.

## Limites (à faire par un humain)
- **Aucun test avec un vrai lecteur d'écran** (NVDA, VoiceOver, TalkBack). À faire en priorité, idéalement avec un
  élève qui en utilise un.
- Les outils automatiques ne détectent qu'une partie des problèmes d'accessibilité : la pertinence des textes
  alternatifs, l'ordre de lecture ou la clarté des consignes demandent un jugement humain.
- Agrandissement du texte à 200 % : non testé automatiquement (le test à 320 px couvre une partie du besoin).
- Si l'application est publiée par un établissement public, une **déclaration d'accessibilité** est attendue ;
  ce document peut servir de point de départ, pas de déclaration de conformité.
