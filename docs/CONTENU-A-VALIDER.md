# Contenu À VALIDER PAR UN HUMAIN

Généré par `etl/contenu_a_valider.py` depuis les fichiers de `contenu/`. Pour corriger : modifier le JSON, puis relancer le script et `npm test` (les tests vérifient l'équilibre et la lisibilité du test).

## 1. Profil de personnalité en 4 dimensions (`contenu/test-personnalite.json`)

Statut : **A_VALIDER**. Échelle : Pas du tout d’accord / Plutôt pas d’accord / Entre les deux / Plutôt d’accord / Tout à fait d’accord.

### Méthode (vérifiée automatiquement par `app/src/personnalite.test.ts`)
- 36 questions originales, 9 par dimension, présentées en alternant les dimensions.
- Dans chaque dimension, 4 ou 5 questions vont vers chaque pôle : répondre « d'accord » à tout donne un profil équilibré (et l'app le signale), au lieu d'un profil artificiellement marqué.
- Score de -100 (pôle A) à +100 (pôle B). Moins de 20 en valeur absolue = « équilibré » ; 20-49 légère ; 50-79 marquée ; 80 et plus très marquée.
- 4 paires de questions jumelles (marquées ⧉) : un écart de 3 points ou plus signale des réponses nuancées et baisse l'intensité affichée d'un cran.
- Phrases de 25 mots maximum, sans négation (évite les doubles négations avec « Pas du tout d'accord »).

### Limites à garder en tête
- Pas d'étalonnage sur une population d'élèves ni de mesure de fidélité (test-retest) : le résultat est présenté comme une photo indicative, jamais comme une étiquette.
- Les seuils (20, 50, 80) sont des choix de lisibilité, pas des normes statistiques.

### Questions à relire

| # | Dimension | Pôle visé | Question |
|---|---|---|---|
| 1 (e1 ⧉) | Énergie | B : Avec les autres, dans l’action | Après une longue journée de cours, retrouver des amis me redonne de l’énergie. |
| 2 (p1 ⧉) | Perception | A : Le concret, les faits | Pour apprendre une notion de gestion, je préfère partir d’un exemple concret d’entreprise. |
| 3 (d1) | Décision | A : Avec la logique | Pour choisir entre deux options, je compare surtout les avantages et les inconvénients de façon objective. |
| 4 (o1) | Organisation | A : Avec un plan | Je note mes devoirs et mes échéances dans un agenda ou une application. |
| 5 (e2) | Énergie | A : Au calme, en petit comité | Pendant une pause, j’aime m’isoler quelques minutes avec mes écouteurs pour souffler. |
| 6 (p2) | Perception | B : Les idées, les possibilités | J’aime imaginer comment une entreprise pourrait fonctionner autrement dans dix ans. |
| 7 (d2 ⧉) | Décision | B : Avec tes valeurs et les personnes | Avant de décider, je pense d’abord aux conséquences pour les personnes concernées. |
| 8 (o2) | Organisation | B : Avec souplesse | J’aime garder mon week-end libre pour décider au dernier moment de ce que je fais. |
| 9 (e3) | Énergie | B : Avec les autres, dans l’action | En travail de groupe, je prends facilement la parole pour lancer la discussion. |
| 10 (p3) | Perception | A : Le concret, les faits | Dans un exercice, je suis très attentif(ve) aux détails et aux chiffres précis. |
| 11 (d3) | Décision | A : Avec la logique | Quand un camarade fait une erreur dans un projet commun, je le lui dis franchement. |
| 12 (o3 ⧉) | Organisation | A : Avec un plan | Je commence mes dossiers longtemps avant la date de rendu. |
| 13 (e4) | Énergie | A : Au calme, en petit comité | Je préfère réfléchir seul(e) à une question avant d’en parler devant la classe. |
| 14 (p4) | Perception | B : Les idées, les possibilités | En lisant un sujet, plusieurs idées originales pour y répondre me viennent vite. |
| 15 (d4) | Décision | B : Avec tes valeurs et les personnes | Dans un groupe, je veille à ce que chacun se sente bien et écouté. |
| 16 (o4) | Organisation | B : Avec souplesse | Je travaille souvent mieux sous la pression d’une échéance proche. |
| 17 (e5) | Énergie | B : Avec les autres, dans l’action | Lors d’une journée portes ouvertes, aller parler à des inconnus me semble facile. |
| 18 (p5) | Perception | A : Le concret, les faits | Je fais davantage confiance à ce que j’ai déjà testé qu’à une idée nouvelle. |
| 19 (d5) | Décision | A : Avec la logique | Pour moi, une décision juste applique la même règle à tout le monde. |
| 20 (o5) | Organisation | A : Avec un plan | Avant une période d’examens, je prépare un planning de révisions. |
| 21 (e6) | Énergie | A : Au calme, en petit comité | Un week-end calme à la maison me recharge mieux qu’une grosse soirée. |
| 22 (p6) | Perception | B : Les idées, les possibilités | Les cours où l’on discute de tendances et d’innovations me passionnent. |
| 23 (d6) | Décision | B : Avec tes valeurs et les personnes | Je peux changer d’avis si une décision risque de blesser quelqu’un. |
| 24 (o6) | Organisation | B : Avec souplesse | Un changement de programme imprévu me paraît plutôt stimulant. |
| 25 (e7) | Énergie | B : Avec les autres, dans l’action | En stage, j’aime les journées remplies de rencontres avec des clients ou des collègues. |
| 26 (p7) | Perception | A : Le concret, les faits | Je préfère des consignes claires, étape par étape, à un sujet très ouvert. |
| 27 (d7) | Décision | A : Avec la logique | Face à un désaccord, je cherche l’argument le plus logique, même s’il déplaît. |
| 28 (o7) | Organisation | A : Avec un plan | J’aime terminer une tâche complètement avant d’en commencer une autre. |
| 29 (e8) | Énergie | A : Au calme, en petit comité | Je suis plus à l’aise pour échanger avec une ou deux personnes qu’avec un grand groupe. |
| 30 (p8) | Perception | B : Les idées, les possibilités | J’aime relier des idées venant de matières différentes pour comprendre un sujet. |
| 31 (d8) | Décision | B : Avec tes valeurs et les personnes | Quand je conseille un ami, ce qu’il ressent compte davantage pour moi que les faits. |
| 32 (o8) | Organisation | B : Avec souplesse | Je préfère explorer plusieurs pistes en même temps plutôt que suivre un plan fixe. |
| 33 (e9 ⧉) | Énergie | B : Avec les autres, dans l’action | Quand je suis fatigué(e), passer du temps avec d’autres personnes me remet en forme. |
| 34 (p9 ⧉) | Perception | A : Le concret, les faits | Un cas pratique réel m’aide davantage à comprendre qu’une explication théorique. |
| 35 (d9 ⧉) | Décision | B : Avec tes valeurs et les personnes | Pour prendre une décision, l’effet sur les gens autour de moi passe en premier. |
| 36 (o9 ⧉) | Organisation | A : Avec un plan | J’organise mon travail à l’avance pour éviter de tout faire à la dernière minute. |

### Textes de résultats

**Énergie** (Où recharges-tu tes batteries ?)
- Pôle A, *Au calme, en petit comité* : Tu te ressources plutôt au calme, seul(e) ou avec peu de personnes.
  - Forces : Tu sais te concentrer longtemps. / Tu écoutes avant de parler.
  - Vigilance : Ose prendre la parole quand ton idée est utile. / Un métier très relationnel peut te fatiguer si tu n’as pas de pauses au calme.
- Pôle B, *Avec les autres, dans l’action* : Tu te ressources plutôt au contact des autres.
  - Forces : Tu crées facilement le contact. / Tu donnes de l’énergie à un groupe.
  - Vigilance : Garde des moments pour travailler seul(e) au calme. / Laisse aussi de la place aux autres pour s’exprimer.

**Perception** (Sur quoi t’appuies-tu pour comprendre ?)
- Pôle A, *Le concret, les faits* : Tu t’appuies plutôt sur le concret, les faits et l’expérience.
  - Forces : Tu es précis(e) et attentif(ve) aux détails. / Tu apprends bien par la pratique.
  - Vigilance : Les sujets très ouverts peuvent te déstabiliser au début. / Prends parfois du recul pour voir la situation d’ensemble.
- Pôle B, *Les idées, les possibilités* : Tu t’appuies plutôt sur les idées, l’imagination et les possibilités.
  - Forces : Tu as de l’imagination et des idées neuves. / Tu fais des liens entre des sujets différents.
  - Vigilance : Pense à vérifier les détails et les chiffres. / Transforme tes idées en étapes concrètes.

**Décision** (Comment prends-tu tes décisions ?)
- Pôle A, *Avec la logique* : Tu décides plutôt avec la logique et des critères objectifs.
  - Forces : Tu analyses une situation de façon objective. / Tu sais défendre un choix avec des arguments.
  - Vigilance : Pense à l’effet de tes mots sur les autres. / Les émotions font aussi partie d’une bonne décision.
- Pôle B, *Avec tes valeurs et les personnes* : Tu décides plutôt en pensant à tes valeurs et aux personnes concernées.
  - Forces : Tu es attentif(ve) aux autres. / Tu crées une bonne ambiance d’équipe.
  - Vigilance : Ose dire ton désaccord, même si c’est inconfortable. / Appuie aussi tes choix sur des faits.

**Organisation** (Comment t’organises-tu ?)
- Pôle A, *Avec un plan* : Tu fonctionnes plutôt avec un plan et de l’anticipation.
  - Forces : Tu es fiable et tu tiens les délais. / Tu sais organiser ton travail.
  - Vigilance : Les imprévus peuvent te stresser : garde une marge. / Accepte qu’un plan change en cours de route.
- Pôle B, *Avec souplesse* : Tu fonctionnes plutôt avec souplesse et spontanéité.
  - Forces : Tu t’adaptes vite aux changements. / Tu restes ouvert(e) aux nouvelles options.
  - Vigilance : Note tes échéances pour éviter le rush final. / Termine une tâche avant d’en lancer trop d’autres.

Profil équilibré : Tu es entre les deux : tu sais t’adapter selon la situation.

### Grille de relecture suggérée
- Chaque question est-elle compréhensible par un élève de 15 à 20 ans, sans aide ?
- Mesure-t-elle bien la dimension indiquée, et seulement elle ?
- Une réponse est-elle socialement « mieux vue » qu'une autre (biais de désirabilité) ?
- Les textes de résultats sont-ils bienveillants et sans jugement ?

## 2. Goûts, envies et refus (`contenu/gouts.json`)

Statut : **A_VALIDER**. Échelle : Pas pour moi / Pourquoi pas / J’adore.

### Méthode (vérifiée par `app/src/gouts.test.ts`)
- 6 types d'intérêts inspirés du modèle RIASEC de Holland, 3 activités par type, présentées en alternant les types.
- Score de 0 à 100 par type. Un type est « dominant » à partir de 50, 3 au maximum. Si aucun ne ressort, l'app le dit sans juger.
- Valeurs : 3 au maximum, pour obliger à hiérarchiser. Refus : ne masquent aucune piste, ils produiront un avertissement « Ce qui pourrait te freiner » (M3).

### Types d'intérêts

| Type | Nom affiché | Description |
|---|---|---|
| R | Faire | Manipuler, fabriquer, utiliser des outils, être dans le concret et le mouvement. |
| I | Comprendre | Analyser, chercher, résoudre des problèmes, comprendre comment ça marche. |
| A | Créer | Imaginer, dessiner, écrire, concevoir des visuels ou des contenus. |
| S | Aider | Accueillir, conseiller, expliquer, prendre soin des autres. |
| E | Convaincre | Vendre, négocier, entreprendre, prendre des responsabilités. |
| C | Organiser | Classer, compter, vérifier, suivre des procédures avec précision. |

### Activités à relire

| # | Type | Activité |
|---|---|---|
| r1 | Faire | Monter un meuble ou réparer un objet |
| i1 | Comprendre | Analyser des chiffres pour comprendre pourquoi les ventes baissent |
| a1 | Créer | Créer une affiche ou une vidéo pour un réseau social |
| s1 | Aider | Accueillir des personnes et répondre à leurs questions |
| e1 | Convaincre | Convaincre un client de choisir ton produit |
| c1 | Organiser | Tenir un budget ou des comptes à jour |
| r2 | Faire | Préparer et expédier des commandes dans un entrepôt |
| i2 | Comprendre | Mener une enquête pour trouver la cause d’un problème |
| a2 | Créer | Imaginer la décoration d’une vitrine ou d’un stand |
| s2 | Aider | Aider quelqu’un à se sortir d’une difficulté |
| e2 | Convaincre | Diriger une équipe sur un projet |
| c2 | Organiser | Classer et vérifier des documents ou des données |
| r3 | Faire | Utiliser des outils ou des machines |
| i3 | Comprendre | Comprendre comment fonctionne une loi ou un marché |
| a3 | Créer | Écrire des textes, des articles ou des scripts |
| s3 | Aider | Expliquer une tâche à quelqu’un ou le former |
| e3 | Convaincre | Lancer ta propre activité ou ton entreprise |
| c3 | Organiser | Remplir un tableau de suivi avec précision |

### Environnements

- `bureau` : Dans un bureau
- `boutique` : En magasin, en agence, face aux clients
- `deplacements` : En déplacement, sur la route
- `exterieur` : En extérieur
- `teletravail` : Avec du télétravail possible
- `grande_structure` : Dans une grande entreprise
- `petite_structure` : Dans une petite structure
- `service_public` : Dans le service public
- `association` : Dans une association
- `international` : Avec de l’international

### Valeurs (3 au maximum)

- `salaire` : Bien gagner ma vie
- `stabilite` : Avoir un emploi stable
- `utilite` : Être utile aux autres
- `autonomie` : Être autonome
- `creativite` : Être créatif(ve)
- `equipe` : Travailler en équipe
- `evolution` : Évoluer, prendre des responsabilités
- `equilibre` : Avoir du temps pour ma vie perso
- `defi` : Relever des défis, atteindre des objectifs
- `contact` : Rencontrer beaucoup de monde

### Refus

- `horaires_decales` : Travailler le soir, le week-end ou en horaires décalés
- `debout` : Rester debout toute la journée
- `chiffres` : Manipuler des chiffres toute la journée
- `objectifs_vente` : Avoir des objectifs de vente à atteindre
- `telephone` : Passer la journée au téléphone
- `deplacements` : Me déplacer souvent
- `seul` : Travailler souvent seul(e)
- `ecran` : Rester devant un écran toute la journée
- `etudes_longues` : Faire plus de 3 ans d’études après le bac
- `demenager` : Déménager loin de chez moi

## 3. Matières par public (`config/matieres.json`)

Statut : **A_VALIDER**. Tranches : Moins de 8 / 8 à 10 / 10 à 12 / 12 à 14 / 14 à 16 / 16 et plus. Une matière est un « point d'appui » à partir de 12 ou si l'élève l'aime.

**STMG**
- Ton enseignement spécifique de Terminale : Gestion et finance / Mercatique (marketing) / Ressources humaines et communication / Systèmes d’information de gestion
- `mgn` : Management, sciences de gestion et numérique
- `droit_eco` : Droit et économie
- `maths` : Mathématiques
- `philo` : Philosophie
- `francais` : Français (épreuves de Première)
- `histoire_geo` : Histoire-géographie
- `lva` : Langue vivante A (souvent l’anglais)
- `lvb` : Langue vivante B
- `eps` : Éducation physique et sportive

**BTS_CG**
- `cg_compta` : Comptabilité : opérations courantes et inventaire
- `cg_fiscal` : Fiscalité
- `cg_social` : Gestion sociale et paie
- `cg_prevision` : Analyse et prévision de l’activité (contrôle de gestion)
- `cg_financier` : Analyse de la situation financière
- `cg_si` : Systèmes d’information comptables (tableur, PGI)
- `cejm` : Culture économique, juridique et managériale (CEJM)
- `maths` : Mathématiques appliquées
- `cge` : Culture générale et expression
- `lva` : Langue vivante (anglais)

**BTS_NDRC**
- `ndrc_vente` : Relation client et négociation-vente
- `ndrc_digital` : Relation client à distance et digitalisation
- `ndrc_reseau` : Relation client et animation de réseaux
- `cejm` : Culture économique, juridique et managériale (CEJM)
- `cge` : Culture générale et expression
- `lva` : Langue vivante (anglais)

Grille : les libellés correspondent-ils au référentiel en vigueur et au vocabulaire des élèves ?

## 4. Familles de métiers et fiches « réalité » (`contenu/metiers-familles.json`)

Statut : **A_VALIDER** (2026-11-03). Source affichée : Rédaction à partir des fiches ROME de chaque famille (France Travail, octobre 2026). À relire par un professionnel de l’orientation.

### Méthode du matching (vérifiée par `app/src/metiers.test.ts`)
- Score sur 100 = intérêts 40 %, cadre de travail et valeurs 25 %, personnalité 15 %, matières fortes 20 %. Une partie sans réponse est marquée « pas assez d'infos » et son poids est réparti sur les autres.
- Intérêts : centres d'intérêt OFFICIELS du ROME de chaque fiche, traduits en types ci-dessous.
- Les refus ne changent pas le score : ils s'affichent en « Ce qui pourrait te freiner ».
- 10 pistes, 3 au maximum par famille ; un étudiant de BTS ne voit que les fiches de son BTS.

### Correspondance centres d'intérêt ROME → types

- J'ai envie de créer, construire, rénover → R
- J'ai l'âme d'un chef / d'une cheffe → E
- J'ai le sens des affaires → E
- J'ai le sens du contact → S
- J'ai le sens du service public → S
- J'ai le souci du détail → C
- J'ai un bon coup de crayon → A
- J'aime communiquer, convaincre → E
- J'aime faire des découvertes → I
- J'aime faire respecter la loi, les règles → C
- J'aime jouer avec les mots → A
- J'aime l'activité physique → R
- J'aime le travail manuel → R
- J'aime m'occuper des animaux → R
- J'aime manier les chiffres → C
- J'aime me déplacer et voyager → aucun type (non utilisé)
- J'aime organiser, planifier → C
- J'aime piloter, conduire → R
- J'aime être au contact de la nature → R
- Je souhaite contribuer à la protection de l'environnement → aucun type (non utilisé)
- Je souhaite m'occuper d'enfants → S
- Je souhaite prendre soin des autres → S
- Je souhaite protéger et secourir → S
- Je souhaite transmettre → S
- Je suis amateur / amatrice de sensations fortes → R
- Je suis attiré / attirée par l'envers du décor → I
- Je suis passionné / passionnée par la cuisine → A
- Je suis passionné / passionnée par les autres cultures → aucun type (non utilisé)
- Je suis passionné / passionnée par les nouvelles technologies → I
- Je suis un / une artiste → A

Métiers où « plus de 3 ans d'études » est signalé comme frein : M1211, M1210, M1205, M1201, M1202, M1207, M1204, M1223, M1206, C1401, C1214, M1503, M1705, M1707.

### Comptabilité, gestion, finance (`compta`)
- Types par défaut : C, I · Personnalité : perception A, organisation A
- Environnements : bureau, petite_structure, grande_structure, teletravail · Valeurs : stabilite, autonomie, salaire, evolution
- Matières : mgn, maths, cg_compta, cg_fiscal, cg_prevision, cg_financier, cg_si · Freins : chiffres, ecran
- Contraintes :
  - Des périodes chargées (clôture des comptes, déclarations) avec des journées plus longues.
  - Beaucoup de temps sur écran, avec des logiciels comptables et le tableur.
  - Une grande rigueur : une erreur peut coûter cher à l’entreprise.
  - Des règles fiscales et sociales qui changent : il faut se former souvent.
- Avantages :
  - Toutes les entreprises doivent tenir leurs comptes : ces métiers existent partout.
  - Des horaires de bureau la plupart de l’année.
  - Des évolutions possibles vers le contrôle de gestion, l’audit ou l’expertise comptable.

### Paie et ressources humaines (`paie_rh`)
- Types par défaut : S, C · Personnalité : decision B, organisation A
- Environnements : bureau, grande_structure, petite_structure, service_public · Valeurs : stabilite, utilite, equipe, contact
- Matières : mgn, droit_eco, cg_social, cejm · Freins : chiffres, ecran
- Contraintes :
  - La paie ne tolère pas d’erreur ni de retard : les échéances sont fixes chaque mois.
  - Le droit du travail est complexe et évolue souvent.
  - Il faut parfois annoncer des décisions difficiles aux salariés.
- Avantages :
  - Un métier utile, au service des salariés.
  - Des postes dans tous les secteurs, privé comme public.
  - Des évolutions vers le recrutement, la formation ou la gestion des carrières.

### Assistanat, administration, secteur public (`admin`)
- Types par défaut : C, S · Personnalité : organisation A
- Environnements : bureau, service_public, petite_structure, association · Valeurs : stabilite, equipe, equilibre, utilite
- Matières : mgn, francais, droit_eco, cejm, cge, cg_si · Freins : ecran, telephone
- Contraintes :
  - Beaucoup de tâches menées en parallèle, souvent avec des interruptions.
  - Une grande partie du travail se fait sur écran et au téléphone.
  - Dans le public, l’accès à de nombreux postes passe par un concours.
- Avantages :
  - Des horaires souvent réguliers.
  - Des postes dans tous les types de structures.
  - Une porte d’entrée vers la fonction publique et ses possibilités d’évolution par concours.

### Banque (`banque`)
- Types par défaut : E, C · Personnalité : energie B, decision A
- Environnements : boutique, bureau, grande_structure · Valeurs : salaire, stabilite, defi, contact, evolution
- Matières : mgn, droit_eco, maths, ndrc_vente, cejm, cg_financier · Freins : objectifs_vente, chiffres
- Contraintes :
  - Des objectifs commerciaux à atteindre sur les produits bancaires et d’assurance.
  - Une réglementation stricte (conformité, lutte contre le blanchiment).
  - En agence, l’ouverture le samedi est fréquente.
- Avantages :
  - Des parcours d’évolution balisés : conseiller particuliers, professionnels, patrimonial, banque privée.
  - Beaucoup de recrutements en alternance après un bac+2.
  - Un relationnel suivi dans la durée avec ses clients.

### Assurance et protection sociale (`assurance`)
- Types par défaut : E, S · Personnalité : energie B, organisation A
- Environnements : bureau, boutique, deplacements, grande_structure, teletravail · Valeurs : stabilite, salaire, contact, utilite
- Matières : droit_eco, cejm, ndrc_vente, ndrc_digital, mgn · Freins : objectifs_vente, telephone
- Contraintes :
  - Gérer des clients parfois inquiets ou mécontents après un sinistre.
  - Des objectifs commerciaux dans les postes de vente.
  - Des contrats et des garanties techniques à bien maîtriser.
- Avantages :
  - Un rôle utile : protéger les personnes et les entreprises.
  - Des postes au siège, en agence ou à distance.
  - Des évolutions vers l’expertise, la souscription ou le management.

### Immobilier (`immobilier`)
- Types par défaut : E, S · Personnalité : energie B, organisation B
- Environnements : deplacements, boutique, petite_structure · Valeurs : salaire, autonomie, defi, contact
- Matières : droit_eco, cejm, ndrc_vente, ndrc_reseau, cg_compta · Freins : horaires_decales, deplacements, objectifs_vente
- Contraintes :
  - Des visites le soir et le samedi, selon les disponibilités des clients.
  - Une rémunération souvent liée aux ventes, donc variable.
  - Beaucoup de déplacements en voiture.
- Avantages :
  - Une grande autonomie dans l’organisation de ses journées.
  - Des rencontres variées et un métier de terrain.
  - Des revenus qui peuvent progresser vite quand l’activité marche.

### Vente et relation client entre entreprises (`vente_b2b`)
- Types par défaut : E · Personnalité : energie B, decision A
- Environnements : deplacements, petite_structure, grande_structure, international · Valeurs : salaire, autonomie, defi, contact, evolution
- Matières : mgn, droit_eco, lva, ndrc_vente, ndrc_reseau, cejm · Freins : deplacements, objectifs_vente, telephone
- Contraintes :
  - Des objectifs chiffrés et une part de salaire variable.
  - Beaucoup de route et parfois des nuits à l’hôtel.
  - La prospection : savoir encaisser les refus.
- Avantages :
  - Une grande autonomie sur le terrain.
  - Des revenus qui récompensent les résultats.
  - Des évolutions vers la gestion de grands comptes ou le management d’équipe.

### Vente et relation client à distance (`vente_distance`)
- Types par défaut : E, S · Personnalité : energie B
- Environnements : bureau, teletravail, grande_structure · Valeurs : contact, equipe, defi
- Matières : ndrc_digital, ndrc_vente, lva, mgn · Freins : telephone, ecran, objectifs_vente, horaires_decales
- Contraintes :
  - Beaucoup de temps au téléphone ou sur écran.
  - Des indicateurs suivis de près (nombre d’appels, satisfaction, ventes).
  - Des horaires qui peuvent être décalés (soirée, samedi) selon le service.
- Avantages :
  - Du télétravail souvent possible.
  - Un travail en équipe, avec des formations internes.
  - Des évolutions vers le management d’équipe, la qualité ou le marketing digital.

### Distribution et management de magasin (`magasin`)
- Types par défaut : E, S · Personnalité : energie B, organisation A
- Environnements : boutique, grande_structure, petite_structure · Valeurs : evolution, equipe, defi, contact
- Matières : mgn, ndrc_reseau, ndrc_vente, cejm · Freins : horaires_decales, debout, objectifs_vente
- Contraintes :
  - Travail le samedi et pendant les périodes de fêtes et de soldes.
  - Beaucoup de temps debout et en mouvement.
  - Des objectifs de chiffre d’affaires pour le magasin.
- Avantages :
  - Des responsabilités rapides : on peut encadrer une équipe jeune.
  - Un métier concret et vivant, au contact des clients.
  - Des parcours internes dans les enseignes.

### Marketing, achats, études (`marketing`)
- Types par défaut : E, I, A · Personnalité : perception B
- Environnements : bureau, teletravail, grande_structure, international · Valeurs : creativite, evolution, salaire, defi
- Matières : mgn, lva, maths, ndrc_digital, cejm · Freins : ecran, chiffres
- Contraintes :
  - Beaucoup d’analyse de chiffres et de tableaux de bord.
  - Des projets avec des délais serrés.
  - Les postes de chef de produit ou d’acheteur sont souvent accessibles après un bac+5.
- Avantages :
  - Des missions variées et créatives.
  - Un travail avec de nombreux services (vente, communication, production).
  - Des ouvertures à l’international.

### Communication et digital (`communication`)
- Types par défaut : A, E · Personnalité : perception B, energie B
- Environnements : bureau, teletravail, petite_structure, association · Valeurs : creativite, autonomie, equipe
- Matières : francais, mgn, lva, ndrc_digital, cge · Freins : ecran, horaires_decales
- Contraintes :
  - Beaucoup de candidats pour peu de postes : un portfolio fait la différence.
  - Des urgences et parfois des événements le soir ou le week-end.
  - Des outils numériques qui changent vite.
- Avantages :
  - Un métier créatif, où l’on voit le résultat de son travail.
  - Du télétravail souvent possible.
  - Des structures variées : agences, entreprises, associations, collectivités.

### Logistique et transport (`logistique`)
- Types par défaut : C, R · Personnalité : organisation A, perception A
- Environnements : bureau, deplacements, grande_structure, international · Valeurs : stabilite, equipe, defi
- Matières : mgn, maths, lva · Freins : horaires_decales, debout, telephone
- Contraintes :
  - Des horaires décalés possibles dans les entrepôts (nuit, très tôt).
  - La gestion des imprévus : retards, ruptures, pannes.
  - Une partie du travail se fait sur le terrain, debout.
- Avantages :
  - Un secteur présent partout, avec de nombreux postes.
  - Un travail concret et des résultats visibles.
  - Des évolutions vers le pilotage de flux ou le management d’équipe.

Grille : chaque contrainte et avantage est-il exact pour TOUS les métiers de la famille ? Rien d'invérifiable (salaire, taux d'emploi) n'est-il affirmé ?

## 5. Formations en lien avec les familles de métiers (`contenu/formations-familles.json`)

Statut : **A_VALIDER** (2026-11-03). Une formation Parcoursup est « en lien » avec une famille si son intitulé ou un de ses parcours contient un des mots-clés (majuscules ignorées). Vérifié par `app/src/formations.test.ts` : chaque famille trouve au moins une formation réelle dans le Grand Est.

- **Comptabilité, gestion, finance** : « BTS - Comptabilité et gestion » ; « DCG -  » ; « BUT - Gestion, entrepreneuriat et management » ; « BUT - Contrôle de gestion » ; « BTS - Gestion de la PME » ; « L1 - Economie et gestion » ; « L1 - Gestion » ; « Gestionnaire comptable » ; « Assistant de gestion et d'administration » ; « Assistant administratif commercial et comptable » ; « écoles de commerce » ; « CPGE - ECT » ; « CUPGE »
- **Paie et ressources humaines** : « ressources humaines » ; « Gestionnaire de Paie » ; « Gestionnaire paie » ; « BTS - Support à l'action managériale » ; « BTS - Comptabilité et gestion » ; « BUT - Gestion, entrepreneuriat et management » ; « L1 - Administration économique et sociale » ; « L1 - Droit »
- **Assistanat, administration, secteur public** : « BTS - Support à l'action managériale » ; « BTS - Gestion de la PME » ; « BTS - Collaborateur juriste notarial » ; « L1 - Administration » ; « L1 - Droit » ; « Assistant de direction » ; « Assistant juridique » ; « BUT - Management des fonctions supports » ; « BUT - Entreprise et Association » ; « Assistant de gestion et d'administration »
- **Banque** : « BTS - Banque » ; « BTS - Négociation et digitalisation » ; « BUT - Business développement » ; « BUT - Gestion, entrepreneuriat et management » ; « L1 - Economie et gestion » ; « L1 - Economie » ; « écoles de commerce »
- **Assurance et protection sociale** : « BTS - Assurance » ; « BTS - Négociation et digitalisation » ; « BUT - Business développement » ; « L1 - Droit » ; « L1 - Administration économique et sociale »
- **Immobilier** : « BTS - Professions immobilières » ; « immobili » ; « BTS - Négociation et digitalisation » ; « L1 - Droit »
- **Vente et relation client entre entreprises** : « BTS - Négociation et digitalisation » ; « BTS - Conseil et commercialisation de solutions techniques » ; « BTS - Commerce International » ; « BUT - Business » ; « Attaché commercial » ; « affaires commerciales » ; « développement commercial » ; « écoles de commerce » ; « L1 - Langues étrangères appliquées »
- **Vente et relation client à distance** : « BTS - Négociation et digitalisation » ; « BTS - Management Commercial Opérationnel » ; « BUT - Business développement » ; « BUT - Marketing digital » ; « vente à distance » ; « Assistant commercial »
- **Distribution et management de magasin** : « BTS - Management Commercial Opérationnel » ; « BUT - Marketing et management du point de vente » ; « BUT - Management commercial et marketing omnicanal » ; « Gestionnaire d'unité commerciale » ; « commercial retail » ; « BUT - Business développement »
- **Marketing, achats, études** : « BUT - Business » ; « BUT - Marketing » ; « BUT - Stratégie de marque » ; « BTS - Commerce International » ; « marketing » ; « écoles de commerce » ; « L1 - Economie et gestion » ; « L1 - Langues étrangères appliquées » ; « CPGE - ECT » ; « CUPGE »
- **Communication et digital** : « BTS - Communication » ; « BUT - Information communication » ; « BUT - Stratégie de marque et événementiel » ; « L1 - Information et communication » ; « Chargé de communication » ; « Responsable communication » ; « projet communication » ; « BUT - Création numérique » ; « BUT - Développement web et dispositifs interactifs »
- **Logistique et transport** : « BTS - Gestion des transports et logistique associée » ; « BUT - Organisation et Supply Chain » ; « supply chain » ; « transport et de logistique » ; « BTS - Commerce International »

Grille : manque-t-il une formation importante pour une famille ? Un mot-clé attrape-t-il des formations hors sujet ?

## 6. À venir
- Liens et dispositifs handicap (M6).
