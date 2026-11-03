# PLAN — Application d'aide à l'orientation (STMG, BTS CG, BTS NDRC)

Dernière mise à jour : 02/11/2026. Terrain de test : académie de Strasbourg (Grand Est par défaut, France métropolitaine).

## 1. Décisions prises avec l'enseignant

| Sujet | Décision |
|---|---|
| Hébergement | GitHub Pages (comme Quinquennat) pour l'app ; Cloudflare Workers (offre gratuite) pour l'unique proxy. |
| Identité | **Prénom seulement**, facultatif, stocké uniquement dans le navigateur, jamais envoyé sur le réseau. Aucun nom de famille, email, adresse. |
| DPO | Pas de validation requise (aucune donnée personnelle ne quitte l'appareil). `docs/CONFIDENTIALITE.md` documente quand même les flux. |
| Relecture psy | Pas de psychologue EN disponible : Claude conçoit le test selon les règles de psychométrie et le **vérifie automatiquement** (section 5). La relecture humaine reste recommandée et listée dans `docs/CONTENU-A-VALIDER.md`. |
| Onisep | Open data en maintenance (403 au 02/11/2026). On avance sans ; intégration dès son retour. |
| Métiers | Liste exhaustive tirée du **ROME** (France Travail), filtrée par public : un STMG voit tout, un BTS ne voit que les métiers cohérents avec son BTS (pas de « comptable » pour un NDRC). |
| Poursuites | Liste exhaustive calculée depuis l'open data Parcoursup (toute formation ayant admis des bacheliers techno), pas une liste écrite à la main. |
| Visuel | Mobile et ordinateur, très simple, moderne et coloré. |

## 2. Architecture

```
orientation/
  app/            Vite + React + TypeScript + Tailwind + Zustand(persist) + Zod
  app/public/data JSON statiques produits par l'ETL, chargés à la demande (découpés par région)
  config/         publics.json, matieres.json, calendrier-parcoursup.json, sources.json (appels sortants autorisés)
  contenu/        test-personnalite.yaml, interets.yaml, realite-metiers/*.yaml (À VALIDER)
  etl/            scripts Python 3 (bibliothèque standard seule), échouent proprement si un schéma change
  proxy/          Cloudflare Worker (LBA, France Travail, Recherche d'entreprises), secrets en variables d'env.
  docs/           DONNEES.md, CONFIDENTIALITE.md, CONTENU-A-VALIDER.md, METIERS-A-VALIDER.md, POURSUITES-A-VALIDER.md
```

Pourquoi l'ETL en Python stdlib plutôt qu'en Node : zéro dépendance, lit déjà les .xlsx du ROME
(`etl/xlsx.py`), tourne sur le Mac de l'enseignant sans installation. L'app reste en TypeScript.

Pas de DSFR ni de police Marianne : réservées aux sites de l'État (cf. licence de monprojetsup).
monprojetsup (MIT) sert de référence de modélisation (formations ↔ métiers ↔ intérêts) ; aucun code copié sans attribution.

## 3. Sources vérifiées (02/11/2026)

| Source | Accès | Licence | Constat |
|---|---|---|---|
| Parcoursup open data `fr-esr-parcoursup` | API publique Opendatasoft | Etalab 2.0 | Session 2025. `taux_acces_ens`, `part_acces_tec`, `pct_ab/b/tb`, GPS, `lien_form_psup`. **Pas de détail par série techno.** |
| Cartographie Parcoursup | idem | Etalab 2.0 | 2020→2026 ; `app` (apprentissage), `int` (internat), `code_formation`. DCG présent, licences pro quasi absentes (29). |
| ROME (France Travail) | xlsx en téléchargement libre | Licence Ouverte | Octobre 2026 ; codes, fiches, appellations, arborescence par centres d'intérêt. |
| Géocodage IGN `data.geopf.fr/geocodage` | public, sans clé | Etalab 2.0 | Remplace `api-adresse.data.gouv.fr` (dépréciée, fin 31/01/2026). Recherche `type=municipality` seulement. |
| Recherche d'entreprises | public, sans clé, CORS ouvert | Licence Ouverte Etalab 2.0 | `near_point` : rayon ≤ 50 km, 25 résultats par page, plusieurs codes NAF séparés par des virgules (vérifié 03/11/2026). Appelée **directement par le navigateur** : la limite de débit est par IP, un proxy unique la saturerait. |
| La bonne alternance | clé API (compte développeur) | contenu Etalab 2.0 | Route vérifiée dans le code source officiel : `GET /api/job/v1/search` (latitude, longitude, radius, romes), `Authorization: Bearer`, 60 appels/min. Centralise les offres France Travail, Indeed, Monster… → via le proxy (clé secrète, cache 1 h). |
| France Travail Offres d'emploi | OAuth2 via francetravail.io | — | **Non branché en M6** : ses offres en alternance sont déjà dans La bonne alternance, et ses noms de paramètres ne sont pas vérifiables sans compte. À ajouter au proxy si besoin, après lecture du référentiel. |
| Onisep (Idéo-*) | **indisponible** | ODbL | Fiches métiers, actions de formation du sup. Intégration différée. |
| InserJeunes | à vérifier (M5) | — | Insertion BTS ; données parfois incomplètes, à signaler. |

## 4. Parcours et règles transverses

- Deux parcours dès l'accueil : A) lycée (STMG) ; B) fin de BTS (CG ou NDRC). Autres publics présents dans `config/publics.json`, `actif: false`.
- Barre de progression, retour arrière, reprise automatique (état Zustand persisté en localStorage, versionné, migré).
- Écran 1 : avertissement de stockage local (texte exact du cahier des charges), boutons Sauvegarder (export JSON), Reprendre (import validé par Zod), Tout effacer (avec confirmation).
- Aucun analytics, cookie, police ou script tiers. Les appels sortants passent par **un seul module** `net.ts` qui refuse toute URL absente de `config/sources.json` ; la page Confidentialité est générée depuis ce fichier.
- Tout chiffre affiché porte sa source et sa date, sinon « non disponible ».
- Tous les résultats sont formulés comme des pistes indicatives.

## 5. Test de personnalité : méthode et contrôles automatiques

- 36 items originaux (9 par dimension : énergie, perception, décision, organisation), échelle de 5 niveaux, scénarios de lycée ou de BTS.
- Équilibrage : dans chaque dimension, 4 ou 5 items orientés vers chaque pôle (contrôle de l'acquiescement).
- 4 paires d'items quasi équivalents pour un **indice de cohérence** : si les réponses divergent, on affiche « tes réponses sont nuancées sur ce point » plutôt qu'un résultat tranché.
- Score continu par dimension (de -100 à +100). Au centre (±20), on affiche « équilibré ». Pas de type en 4 lettres.
- Tests automatisés (Vitest) : répondre « neutre » partout donne un profil centré ; les profils extrêmes simulés retrouvent les bons pôles ; chaque item compte dans une seule dimension ; l'inversion des items est correcte ; lisibilité (phrases ≤ 25 mots, pas de double négation) ; aucune référence à une marque commerciale.
- Limites dites honnêtement dans l'app et dans CONTENU-A-VALIDER.md : pas d'étalonnage sur population, pas de fidélité test-retest mesurée.

## 6. Matching métiers (étape 4)

Score transparent = somme pondérée affichée à l'élève : intérêts (arborescence du ROME par centres d'intérêt + RIASEC) 40 %,
environnement et valeurs 25 %, personnalité 15 %, matières fortes 20 %. Les refus (« ce que je ne veux pas ») ne cachent
rien : ils produisent un avertissement « Ce qui pourrait te freiner ». Chaque piste affiche le détail de son score.
Fiches « réalité du métier » en YAML : au moins 3 contraintes et 3 avantages, source et date, statut `A_VALIDER`.

## 7. Poursuites après BTS (hors Parcoursup en majorité)

À vérifier dans les sources lors de M5, avec le bon canal pour chacune (Parcoursup, eCandidat, site de l'établissement ou de l'école) :
- BTS CG : DCG (1re année sur Parcoursup ; dispenses d'UE pour titulaires du BTS à vérifier au texte officiel), licences pro mention « Métiers de la gestion et de la comptabilité » (parcours comptabilité-paie, contrôle de gestion, révision, fiscalité), L3 (gestion, CCA, AES), BUT GEA par passerelle, prépa ATS économie-gestion, écoles de commerce en admission parallèle (concours Passerelle, Tremplin…), bachelors en alternance (titres RNCP).
- BTS NDRC : licences pro commerce (commerce et distribution, technico-commercial, e-commerce et marketing numérique, commerce international, assurance-banque-finance, immobilier), BUT TC par passerelle, L3 gestion/AES, prépa ATS, écoles en admission parallèle, bachelors en alternance.
- Alternance mise en avant partout où `app` (cartographie) ou La bonne alternance l'indique.

## 8. Jalons et critères d'acceptation

| Jalon | Contenu | Critères vérifiables |
|---|---|---|
| **M0** | Squelette Vite/React/TS/Tailwind, design system coloré, routing par étapes, store persistant versionné, avertissement, export/import/effacer, prénom facultatif, CI GitHub Pages, hook pré-commit de détection de secrets (gitleaks) | Vitest : export puis import donne un état identique ; JSON invalide refusé avec message clair ; effacer vide le stockage. Playwright mobile et desktop : avertissement visible, reprise après rechargement. axe : 0 violation. |
| **M1** | Test de personnalité | Contrôles du §5 au vert ; résultats en curseurs + forces + vigilance + encadré « photo d'aujourd'hui ». |
| **M2** | Intérêts, environnements, valeurs, refus, notes estimées (matières pilotées par `config/matieres.json`) | Pas de note exacte (tranches) ; changer de série change les matières sans code. |
| **M3** | ETL ROME + matching + fiches réalité | ETL : échec propre sur un schéma modifié (test avec fixture). Matching : 8 à 12 pistes, chaque score décomposé ; jamais de métier CG pour un NDRC (test). |
| **M4** | ETL Parcoursup + cartographie, mobilité, distances | Fourchette d'accès prudente, avec source et année ; distance à vol d'oiseau × coefficient de détour, libellée « approximative » ; seule la commune est géocodée. |
| **M5** | Parcours BTS | Chaque poursuite indique son canal de candidature (lien officiel) ; « hors Parcoursup » affiché. |
| **M6** | Proxy + La bonne alternance + France Travail + Recherche d'entreprises + module Handicap | CORS limité, rate limit, cache, aucun log de paramètres (test) ; dédoublonnage testé ; mode dégradé avec liens préremplis ; la donnée handicap n'apparaît dans aucune requête (test réseau Playwright). |
| **M7** | Synthèse imprimable PDF + export, audit RGAA/WCAG 2.2 AA, audit confidentialité | Impression lisible en A4 ; axe + navigation clavier ; liste des requêtes réseau = liste de la page Confidentialité. |

Chaque jalon : un commit, des tests, et un compte rendu (fait / reste à faire / risques).

## 9. Risques

- Onisep indisponible : fiches métiers limitées au ROME et au YAML curaté ; actions de formation du supérieur hors Parcoursup manquantes.
- Accès France Travail soumis à inscription (délai possible) : l'app fonctionne sans, avec des liens préremplis.
- Parcoursup ne distingue pas STMG des autres bacs techno : les fourchettes d'accès restent larges et sont présentées comme telles.
- Test de personnalité non étalonné : formulé comme une photo indicative.
- Certaines appellations du ROME sont hors sujet (ex. « caissier de casino » sous M1203) : liste d'exclusions d'appellations à valider en M3.
