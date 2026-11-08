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
| r4 | Faire | Installer ou dépanner du matériel informatique |
| i4 | Comprendre | Comparer des offres pour trouver la meilleure solution |
| a4 | Créer | Imaginer un nom ou un logo pour une marque |
| s4 | Aider | Écouter quelqu’un qui a un problème et le conseiller |
| e4 | Convaincre | Négocier un prix ou un accord |
| c4 | Organiser | Préparer une facture ou un bulletin de paie |
| r5 | Faire | Mettre en rayon et organiser l’espace d’un magasin |
| i5 | Comprendre | Faire des recherches pour préparer un dossier complet |
| a5 | Créer | Prendre et retoucher des photos ou des vidéos |
| s5 | Aider | Accompagner des enfants ou des personnes âgées |
| e5 | Convaincre | Organiser un événement et le faire connaître |
| c5 | Organiser | Vérifier qu’une règle ou une procédure est bien respectée |
| r6 | Faire | Travailler dehors, en mouvement |
| i6 | Comprendre | Étudier les résultats d’un sondage ou d’un marché |
| a6 | Créer | Animer un compte de réseau social avec tes idées |
| s6 | Aider | Faire visiter un lieu à un groupe |
| e6 | Convaincre | Prendre la parole devant un groupe pour défendre une idée |
| c6 | Organiser | Mettre à jour un fichier clients ou un stock |

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

**BTS_SAM**
- `sam_processus` : Optimisation des processus administratifs
- `sam_projet` : Gestion de projet
- `sam_rh` : Contribution à la gestion des ressources humaines
- `cejm` : Culture économique, juridique et managériale (CEJM)
- `cge` : Culture générale et expression
- `lva` : Langue vivante A (anglais)
- `lvb` : Langue vivante B

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

Métiers où « plus de 3 ans d'études » est signalé comme frein : M1211, M1210, M1205, M1201, M1202, M1207, M1204, M1223, M1206, C1401, C1214, M1503, M1705, M1707, K1901, K1904, K1403, K1703.

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
- Matières : mgn, droit_eco, cg_social, cejm, sam_rh · Freins : chiffres, ecran
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
- Matières : mgn, francais, droit_eco, cejm, cge, cg_si, sam_processus, sam_projet · Freins : ecran, telephone
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
- Matières : francais, mgn, lva, ndrc_digital, cge, sam_projet · Freins : ecran, horaires_decales
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

### Social, insertion et éducation (`social`)
- Types par défaut : S · Personnalité : decision B, energie B
- Environnements : service_public, association, bureau, deplacements · Valeurs : utilite, contact, equipe, stabilite
- Matières : mgn, droit_eco, francais, philo, histoire_geo, cejm, cge, sam_rh · Freins : horaires_decales, deplacements
- Contraintes :
  - Des situations humaines parfois difficiles, qu’il faut savoir mettre à distance.
  - Une part importante de paperasse et de dossiers administratifs.
  - La plupart de ces métiers demandent un diplôme d’État spécifique, souvent après une formation sélective.
- Avantages :
  - Un métier utile, au service des personnes et des familles.
  - Des postes dans les collectivités, les associations et les établissements publics.
  - Un travail en équipe avec d’autres professionnels (santé, éducation, justice).

### Tourisme et hôtellerie (`tourisme`)
- Types par défaut : S, E · Personnalité : energie B, organisation B
- Environnements : boutique, exterieur, international, deplacements · Valeurs : contact, defi, equipe, creativite
- Matières : lva, lvb, mgn, histoire_geo, ndrc_vente, ndrc_digital, cejm · Freins : horaires_decales, debout, demenager
- Contraintes :
  - Travail le week-end, les jours fériés et pendant les vacances scolaires.
  - Une activité souvent saisonnière, avec des contrats parfois courts.
  - Les langues étrangères sont très demandées, l’anglais au minimum.
- Avantages :
  - Des rencontres variées, en France et à l’étranger.
  - Des métiers vivants, où l’on fait découvrir des lieux et des cultures.
  - Des possibilités de travailler à l’étranger ou dans de grands groupes.

### Droit et notariat (`juridique`)
- Types par défaut : C, I · Personnalité : perception A, decision A
- Environnements : bureau, petite_structure, service_public · Valeurs : stabilite, utilite, autonomie, evolution
- Matières : droit_eco, francais, philo, mgn, cejm, cge, cg_social, cg_fiscal, sam_processus · Freins : ecran, etudes_longues
- Contraintes :
  - Beaucoup de lecture et de rédaction, avec une grande précision dans les mots.
  - Des textes de loi qui changent souvent : il faut se tenir à jour.
  - Les métiers de notaire, d’avocat ou de juge demandent de longues études (bac+5 et plus).
- Avantages :
  - Des postes accessibles dès bac+2 en office notarial (BTS Collaborateur juriste notarial).
  - Un métier de conseil, utile aux familles et aux entreprises.
  - Des évolutions possibles par la formation continue.

### Informatique et numérique (`numerique`)
- Types par défaut : I, C · Personnalité : perception A, decision A
- Environnements : bureau, teletravail, grande_structure, petite_structure · Valeurs : evolution, salaire, autonomie, defi
- Matières : mgn, maths, lva, cg_si, ndrc_digital · Freins : ecran, seul
- Contraintes :
  - Beaucoup de temps devant un écran.
  - Des technologies qui changent très vite : il faut apprendre en permanence.
  - Des pannes ou des urgences à gérer, parfois en dehors des horaires habituels.
- Avantages :
  - Des besoins dans tous les secteurs, publics comme privés.
  - Du télétravail souvent possible.
  - Après un bac STMG (spécialité SIG), des formations comme le BTS SIO sont accessibles.

### Sécurité, défense et secours (`securite`)
- Types par défaut : R, S · Personnalité : organisation A, energie B
- Environnements : exterieur, service_public, deplacements · Valeurs : utilite, equipe, stabilite, defi
- Matières : eps, droit_eco, francais, histoire_geo, cejm · Freins : horaires_decales, debout, demenager
- Contraintes :
  - Horaires de nuit, de week-end et astreintes.
  - Des situations de tension ou de danger.
  - Une condition physique exigée, et souvent un concours d’entrée.
- Avantages :
  - Un métier utile, au service de la population.
  - Des recrutements réguliers par concours dans la fonction publique ou l’armée.
  - Des possibilités de promotion interne tout au long de la carrière.

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
- **Social, insertion et éducation** : « BTS - Economie sociale familiale » ; « BTS - Services et prestations des secteurs sanitaire et social » ; « BUT - Carrières sociales » ; « D.E Assistant de Service Social » ; « D.E Educateur » ; « L1 - Administration économique et sociale »
- **Tourisme et hôtellerie** : « BTS - Tourisme » ; « Management en hôtellerie restauration » ; « hôtellerie restauration » ; « L1 - Tourisme » ; « L1 - Langues étrangères appliquées »
- **Droit et notariat** : « BTS - Collaborateur juriste notarial » ; « L1 - Droit » ; « Assistant juridique » ; « L1 - Administration publique »
- **Informatique et numérique** : « BTS - Services informatiques aux organisations » ; « BTS - Cybersécurité, Informatique et réseaux » ; « BUT - Informatique » ; « BUT - Réalisation d'applications » ; « BUT - Réseaux » ; « Administrateur systèmes »
- **Sécurité, défense et secours** : « BTS - Management opérationnel de la sécurité » ; « L1 - Droit » ; « Science du danger »

Grille : manque-t-il une formation importante pour une famille ? Un mot-clé attrape-t-il des formations hors sujet ?

## 6. Poursuites d'études après le BTS (`contenu/poursuites-bts.json`)

Statut : **A_VALIDER** (2026-11-08). Les canaux et calendriers changent chaque année : à revérifier avant chaque rentrée. Vérifié par `app/src/postbts.test.ts` : chaque voie a un canal, un lien officiel et une source ; chaque mot-clé local trouve au moins une offre réelle.

### Travailler tout de suite après le BTS (BTS_CG)
- HORS Parcoursup · Bac+2 (ton BTS) · Dès l’obtention du BTS
- Le BTS CG est conçu pour travailler : assistant(e) comptable ou collaborateur, collaboratrice en cabinet d’expertise comptable, en entreprise ou en centre de gestion. Dans les faits, 6 mois après ce BTS (voie scolaire), 22 % des diplômés sont en emploi et 59 % poursuivent des études (InserJeunes 2024). Tu pourras évoluer plus tard (chef comptable, contrôle de gestion) et reprendre des études en formation continue.
- Canal : Hors Parcoursup : candidature directement auprès des employeurs : offres d’emploi, cabinets comptables, entreprises où tu as fait tes stages.
- Alternance : Non concerné : c’est un emploi salarié.
- Lien : Les débouchés du BTS CG (Onisep) (https://www.onisep.fr/ressources/univers-formation/formations/post-bac/bts-comptabilite-et-gestion)
- Sources : [Onisep, fiche « BTS Comptabilité et gestion » (débouchés, poursuites, devenir des diplômés InserJeunes 2024)](https://www.onisep.fr/ressources/univers-formation/formations/post-bac/bts-comptabilite-et-gestion)

### Travailler tout de suite après le BTS (BTS_NDRC)
- HORS Parcoursup · Bac+2 (ton BTS) · Dès l’obtention du BTS
- Le BTS NDRC forme des commerciaux qui gèrent la relation client, de la prospection à la fidélisation : commercial(e), chargé(e) de clientèle, conseiller ou conseillère de vente, téléconseiller… 6 mois après ce BTS (voie scolaire), 29 % des diplômés sont en emploi et 49 % poursuivent des études (InserJeunes 2024). Dans la vente, l’expérience et les résultats comptent beaucoup pour évoluer.
- Canal : Hors Parcoursup : candidature directement auprès des employeurs : offres d’emploi, cabinets comptables, entreprises où tu as fait tes stages.
- Alternance : Non concerné : c’est un emploi salarié.
- Lien : Les débouchés du BTS NDRC (Onisep) (https://www.onisep.fr/ressources/univers-formation/formations/post-bac/bts-negociation-et-digitalisation-de-la-relation-client)
- Sources : [Onisep, fiche « BTS Négociation et digitalisation de la relation client » (débouchés, poursuites, devenir des diplômés InserJeunes 2024)](https://www.onisep.fr/ressources/univers-formation/formations/post-bac/bts-negociation-et-digitalisation-de-la-relation-client)

### Travailler tout de suite après le BTS (BTS_SAM)
- HORS Parcoursup · Bac+2 (ton BTS) · Dès l’obtention du BTS
- Le BTS SAM mène à des postes d’assistant(e) : de manager, de gestion en PME, en ressources humaines, commercial(e), office manager, secrétaire juridique, dans des entreprises, des associations ou des administrations. 6 mois après ce BTS (voie scolaire), 30 % des diplômés sont en emploi et 45 % poursuivent des études (InserJeunes 2024).
- Canal : Hors Parcoursup : candidature directement auprès des employeurs : offres d’emploi, cabinets comptables, entreprises où tu as fait tes stages.
- Alternance : Non concerné : c’est un emploi salarié.
- Lien : Les débouchés du BTS SAM (Onisep) (https://www.onisep.fr/ressources/univers-formation/formations/post-bac/bts-support-a-l-action-manageriale)
- Sources : [Onisep, fiche « BTS Support à l’action managériale » (débouchés, poursuites, devenir des diplômés InserJeunes 2024)](https://www.onisep.fr/ressources/univers-formation/formations/post-bac/bts-support-a-l-action-manageriale)

### Licence professionnelle (BTS_CG, BTS_NDRC, BTS_SAM)
- HORS Parcoursup · Bac+3 · 1 an
- Une année pour te spécialiser dans un métier précis, avec un stage long ou en alternance. Conçue pour entrer ensuite dans la vie active.
- Canal : Candidature directement auprès de l’université ou de l’IUT, souvent sur sa plateforme eCandidat, au printemps. Une candidature par licence.
- Alternance : Souvent possible.
- Lien : Voir les licences pro près de chez toi (lien vers chaque établissement) (#offres-LP)
- Sources : [Académie de Nancy-Metz, information orientation](https://sites.ac-nancy-metz.fr/lio/qr_est_republicain/qr_181214.html)

### Diplôme de comptabilité et de gestion (DCG) (BTS_CG)
- Sur Parcoursup · Bac+3 · 3 ans, souvent moins avec ton BTS
- Première marche vers l’expertise comptable. Avec un BTS CG obtenu depuis 2017, tu peux être dispensé(e) des épreuves 1, 5, 8, 9, 12 et 13 du DCG, ce qui permet souvent d’entrer en 2e année.
- Canal : La 1re année se demande sur Parcoursup. Pour une entrée directe en 2e année grâce aux dispenses, contacte l’établissement qui prépare le DCG.
- Alternance : Possible dans de nombreux établissements.
- Lien : Parcoursup (https://www.parcoursup.gouv.fr/)
- Sources : [Arrêté du 22 mai 2020 sur les dispenses du DCG, Bulletin officiel de l’enseignement supérieur n° 24](https://www.enseignementsup-recherche.gouv.fr/fr/bo/20/Hebdo24/ESRS2012706A.htm)

### Filière comptabilité-contrôle-audit (CCA) à l’université (BTS_CG)
- HORS Parcoursup · Bac+3, puis Bac+5 · 1 an de L3, puis 2 ans de master
- La L3 CCA, souvent dans un IAE, mène au master CCA : l’autre grande route vers l’expertise comptable, à côté du DCG. Un master CCA peut dispenser de toutes les épreuves du DCG et de 5 épreuves sur 7 du DSCG (exemple de l’IAE Lyon 3 : vérifie pour chaque master). L’entrée est sélective.
- Canal : Hors Parcoursup : la L3 se demande directement à l’université (souvent eCandidat), au printemps. Le master se demande ensuite sur la plateforme Mon Master.
- Alternance : Possible dans certaines universités, surtout en master.
- Lien : Mon Master (plateforme des masters) (https://www.monmaster.gouv.fr/)
- Sources : [iaelyon (Université Jean Moulin Lyon 3), « Master CCA »](https://iae.univ-lyon3.fr/master-cca-comptabilite-controle-audit-4)

### BUT en admission parallèle (2e année, parfois 3e) (BTS_CG, BTS_NDRC, BTS_SAM)
- HORS Parcoursup · Bac+3 · 1 à 2 ans
- Rejoindre un BUT de gestion ou de commerce en cours de cursus, selon ton dossier et les places disponibles.
- Canal : Hors Parcoursup : candidature directement auprès de l’IUT (souvent sur eCandidat). La fiche Parcoursup de chaque BUT donne les contacts de l’IUT.
- Alternance : Possible, surtout en 3e année.
- Lien : Voir les BUT près de chez toi (#offres-BUT)
- Sources : [Onisep, « Que faire après un BTS »](https://www.onisep.fr/formation/apres-le-bac-les-etudes-superieures/les-principales-filieres-d-etudes-superieures/les-bts-brevet-de-technicien-superieur/que-faire-apres-un-bts)

### Licence générale (L2 ou L3) : gestion, économie, AES, droit (BTS_CG, BTS_NDRC, BTS_SAM)
- HORS Parcoursup · Bac+3, puis master possible · 1 à 2 ans
- Pour viser un master ensuite. L’université décide du niveau d’entrée (L2 ou L3) selon ton dossier.
- Canal : Hors Parcoursup : candidature directement auprès de l’université (souvent eCandidat), au printemps.
- Alternance : Rare en licence générale.
- Lien : Trouver l’université et son site (Paysage, ministère) (https://paysage.enseignementsup-recherche.gouv.fr/)
- Sources : [Onisep, « Que faire après un BTS »](https://www.onisep.fr/formation/apres-le-bac-les-etudes-superieures/les-principales-filieres-d-etudes-superieures/les-bts-brevet-de-technicien-superieur/que-faire-apres-un-bts)

### Prépa ATS économie-gestion (BTS_CG, BTS_NDRC, BTS_SAM)
- Sur Parcoursup · Bac+3 (prépare aux concours) · 1 an
- Une année de prépa réservée aux bac+2 pour réussir les concours d’admission parallèle des écoles de commerce.
- Canal : Candidature sur Parcoursup, comme les autres classes prépas.
- Alternance : Non.
- Lien : Parcoursup (https://www.parcoursup.gouv.fr/)
- Sources : [Onisep, « La prépa ATS économie-gestion »](https://www.onisep.fr/formation/apres-le-bac-les-etudes-superieures/les-principales-filieres-d-etudes-superieures/les-classes-preparatoires-aux-grandes-ecoles-cpge/les-prepas-economiques-et-commerciales/la-prepa-ats-economie-gestion)

### École de commerce en admission parallèle (BTS_CG, BTS_NDRC, BTS_SAM)
- HORS Parcoursup · Bac+5 (programme grande école) · 3 ans
- Entrer en 1re année du programme grande école d’une école de commerce après un bac+2. Les frais de scolarité sont souvent élevés : l’alternance peut les prendre en charge.
- Canal : Hors Parcoursup : par concours communs (Passerelle, Ecricome Tremplin) ou directement auprès de l’école.
- Alternance : Souvent possible après la 1re année.
- Lien : Concours Passerelle (https://grande-ecole.passerelle-esc.com/)
- Sources : [Sites officiels des concours Passerelle et Ecricome](https://www.ecricome.org/)

### Bachelor ou titre professionnel bac+3 (souvent en alternance) (BTS_CG, BTS_NDRC, BTS_SAM)
- HORS Parcoursup · Bac+3 · 1 an
- Proposés par des écoles, des CCI ou des CFA. Avant de t’inscrire, vérifie 4 points : le titre est enregistré au RNCP (niveau 6) et tu sais qui le délivre ; l’établissement est certifié Qualiopi ; il publie ses taux de réussite et d’insertion (InserJeunes pour les CFA) ; en apprentissage, la formation est gratuite pour toi.
- Canal : Hors Parcoursup : candidature directement auprès de l’école ou du CFA.
- Alternance : Très souvent.
- Lien : Vérifier un titre sur France compétences (RNCP) (https://www.francecompetences.fr/recherche-resultats/?types=certification&search=bachelor)
- Sources : [France compétences, répertoire national des certifications professionnelles](https://www.francecompetences.fr/) ; [Ministère du Travail, « Qualiopi, marque de certification qualité des prestataires de formation »](https://travail-emploi.gouv.fr/qualiopi-marque-de-certification-qualite-des-prestataires-de-formation) ; [InserJeunes, taux d’insertion des formations](https://www.inserjeunes.education.gouv.fr/diffusion/accueil) ; [Code du travail, article L6211-1 (formation gratuite pour l’apprenti)](https://code.travail.gouv.fr/code-du-travail/l6211-1)

### Étudier en travaillant : le Cnam et l’Intec (BTS_CG)
- HORS Parcoursup · Bac+3 à Bac+5 · À ton rythme
- Le Cnam et son institut Intec préparent les diplômes de la comptabilité : DCG et DSCG de l’État, leurs équivalents Intec (DGC, DSGC), licence et master comptabilité-contrôle-audit, licences pro (dont Comptabilité et paie). Les cours de l’Intec sont à distance : tu peux avoir un emploi et continuer à te former.
- Canal : Selon la formation : certaines sont sur Parcoursup, les autres se demandent directement au Cnam ou à l’Intec. Regarde les dates sur leur site.
- Alternance : Possible (formation initiale, alternance ou formation continue).
- Lien : Site de l’Intec (https://intec.cnam.fr/)
- Sources : [Cnam, « Intec : le premier institut de formation aux métiers du chiffre »](https://www.cnam.fr/actualites/intec-le-premier-institut-de-formation-aux-metiers-du-chiffre) ; [Cnam, fiche « Diplôme de gestion et de comptabilité (DGC) »](https://www.cnam.fr/formation/economie-droit-science-politique/droit/diplome-detablissement-diplome-de-gestion-et-de-comptabilite-dgc)

### Spécialisation courte : gestionnaire de paie (BTS_CG)
- HORS Parcoursup · Bac+2 (titre de niveau 5, comme ton BTS) · Quelques mois à 1 an
- Le titre professionnel Gestionnaire de paie, du ministère du Travail, est enregistré au RNCP. Il te spécialise dans la paie, un métier des cabinets comptables et des services RH, sans changer de niveau d’études.
- Canal : Hors Parcoursup : candidature auprès d’un organisme de formation (Greta, Afpa, CFA, écoles). Vérifie qu’il prépare bien au titre RNCP 37948.
- Alternance : Souvent possible.
- Lien : Fiche RNCP 37948 (France compétences) (https://www.francecompetences.fr/recherche/rncp/37948/)
- Sources : [France compétences, fiche RNCP 37948 « TP Gestionnaire de paie »](https://www.francecompetences.fr/recherche/rncp/37948/)

### Concours de la fonction publique (BTS_CG, BTS_SAM)
- HORS Parcoursup · Catégorie B (concours ouverts avec le bac) · Selon le concours
- Ton profil intéresse l’administration. Avec un BTS CG : par exemple contrôleur ou contrôleuse des finances publiques (impôts, comptabilité publique). Avec un BTS SAM : par exemple secrétaire administratif ou administrative dans un ministère, une collectivité ou un hôpital. Ces concours de catégorie B demandent le bac ; ton BTS t’aide à les préparer.
- Canal : Hors Parcoursup : inscription au concours directement sur le site de l’administration qui recrute, aux dates du calendrier officiel. Les offres et concours sont aussi sur choisirleservicepublic.gouv.fr.
- Alternance : Non concerné : on entre par concours.
- Lien : Calendrier du concours de contrôleur des finances publiques (https://www.fonction-publique.gouv.fr/devenir-agent-public/calendrier-general-concours/controleurs-des-finances-publiques)
- Sources : [fonction-publique.gouv.fr, calendrier des concours (contrôleurs des finances publiques)](https://www.fonction-publique.gouv.fr/devenir-agent-public/calendrier-general-concours/controleurs-des-finances-publiques) ; [economie.gouv.fr, « Secrétaire administratif de classe normale, concours externe »](https://www.economie.gouv.fr/recrutement/secretaire-administratif-classe-normale-externe)

### Mots-clés des offres locales (licences pro, BUT, DCG)

- **BTS_CG · LP** : « metiers de la gestion et de la comptabilite » ; « metiers de la grh » ; « management et gestion des organisations » ; « metiers de l'entrepreneuriat » ; « assurance, banque, finance » ; « gestion des organisations de l'economie sociale » ; « metiers des administrations et collectivites territoriales » ; « activites juridiques » ; « metiers du notariat » ; « metiers de l'immobilier : gestion » ; « gestion des achats » ; « metiers du decisionnel »
- **BTS_CG · BUT** : « gestion des entreprises et des administrations » ; « gestion, entrepreneuriat et management » ; « controle de gestion » ; « gestion et pilotage des ressources humaines »
- **BTS_CG · DCG** : « dcg » ; « comptabilite et de gestion »
- **BTS_NDRC · LP** : « commerce et distribution » ; « technico-commercial » ; « e-commerce et marketing numerique » ; « commercialisation de produits et services » ; « management des activites commerciales » ; « metiers du marketing operationnel » ; « metiers du commerce international » ; « assurance, banque, finance : charge de clientele » ; « metiers de l'immobilier : transaction » ; « metiers de l'entrepreneuriat » ; « management et gestion des organisations » ; « commercialisation des produits alimentaires » ; « metiers du tourisme : commercialisation » ; « gestion des achats »
- **BTS_NDRC · BUT** : « techniques de commercialisation » ; « business » ; « marketing » ; « strategie de marque »
- **BTS_NDRC · DCG** : aucun (non proposé)
- **BTS_SAM · LP** : « metiers de la grh » ; « management et gestion des organisations » ; « activites juridiques » ; « metiers des administrations et collectivites territoriales » ; « metiers de la communication : charge de communication » ; « metiers de la communication : chef de projet communication » ; « gestion des organisations de l'economie sociale » ; « metiers de l'entrepreneuriat »
- **BTS_SAM · BUT** : « gestion des entreprises et des administrations » ; « gestion administrative et commerciale des organisations » ; « carrieres juridiques » ; « information communication parcours communication des organisations »
- **BTS_SAM · DCG** : aucun (non proposé)

Grille : chaque canal est-il exact cette année ? Manque-t-il une poursuite fréquente pour tes étudiants ?

## 7. Entreprises : codes d'activité par famille (`contenu/entreprises-naf.json`)

Statut : **A_VALIDER** (2026-11-03). Ces codes NAF servent à chercher des entreprises proches (API Recherche d'entreprises). Beaucoup de métiers existent aussi dans d'autres secteurs : l'app le dit.

- **Comptabilité, gestion, finance** : 69.20Z Activités comptables ; 70.22Z Conseil pour les affaires et autres conseils de gestion
- **Paie et ressources humaines** : 69.20Z Activités comptables ; 78.10Z Activités des agences de placement de main-d’œuvre ; 78.20Z Activités des agences de travail temporaire ; 70.22Z Conseil pour les affaires et autres conseils de gestion
- **Assistanat, administration, secteur public** : 84.11Z Administration publique générale ; 82.11Z Services administratifs combinés de bureau ; 70.10Z Activités des sièges sociaux
- **Banque** : 64.19Z Autres intermédiations monétaires (banques) ; 66.19B Autres activités auxiliaires de services financiers
- **Assurance et protection sociale** : 65.11Z Assurance vie ; 65.12Z Autres assurances ; 66.21Z Évaluation des risques et dommages ; 66.22Z Activités des agents et courtiers d’assurances
- **Immobilier** : 68.31Z Agences immobilières ; 68.32A Administration d’immeubles et autres biens immobiliers
- **Vente et relation client entre entreprises** : 46.18Z Intermédiaires spécialisés du commerce de gros ; 46.19A Centrales d’achat alimentaires ; 46.19B Autres intermédiaires du commerce en produits divers ; 46.69B Commerce de gros de fournitures et équipements industriels divers ; 46.90Z Commerce de gros non spécialisé
- **Vente et relation client à distance** : 47.91A Vente à distance sur catalogue général ; 47.91B Vente à distance sur catalogue spécialisé ; 82.20Z Activités de centres d’appels
- **Distribution et management de magasin** : 47.11D Supermarchés ; 47.11F Hypermarchés ; 47.19B Autres commerces de détail en magasin non spécialisé ; 47.71Z Commerce de détail d’habillement en magasin spécialisé ; 47.54Z Commerce de détail d’appareils électroménagers en magasin spécialisé
- **Marketing, achats, études** : 73.11Z Activités des agences de publicité ; 73.20Z Études de marché et sondages ; 70.21Z Conseil en relations publiques et communication
- **Communication et digital** : 73.11Z Activités des agences de publicité ; 73.12Z Régie publicitaire de médias ; 70.21Z Conseil en relations publiques et communication
- **Logistique et transport** : 52.10B Entreposage et stockage non frigorifique ; 52.29A Messagerie, fret express ; 52.29B Affrètement et organisation des transports ; 49.41A Transports routiers de fret interurbains
- **Social, insertion et éducation** : 88.99B Action sociale sans hébergement ; 88.10C Aide par le travail ; 84.12Z Administration publique des secteurs sociaux et de la santé
- **Tourisme et hôtellerie** : 79.11Z Activités des agences de voyage ; 79.12Z Activités des voyagistes ; 79.90Z Autres services de réservation et activités liées ; 55.10Z Hôtels et hébergement similaire
- **Droit et notariat** : 69.10Z Activités juridiques
- **Informatique et numérique** : 62.01Z Programmation informatique ; 62.02A Conseil en systèmes et logiciels informatiques ; 62.03Z Gestion d’installations informatiques ; 62.09Z Autres activités informatiques
- **Sécurité, défense et secours** : 80.10Z Activités de sécurité privée ; 84.24Z Activités d’ordre public et de sécurité ; 84.25Z Services du feu et de secours

## 8. Module handicap (`contenu/handicap.json`)

Statut : **A_VALIDER** (2026-11-03). Facultatif, gardé dans le navigateur, absent de toute requête réseau (vérifié par `app/e2e/m6.spec.ts`). Relecture conseillée par un référent handicap.

### Mes études et Parcoursup
- Chaque formation sur Parcoursup indique un référent handicap : tu peux le contacter avant de faire tes vœux pour parler accessibilité et aménagements.
- Sur Parcoursup, une fiche de liaison handicap (facultative) te permet de décrire les aménagements dont tu as besoin. Déclarer ton handicap n’est pas obligatoire.
- Aucun établissement ne peut refuser ton inscription en raison de ton handicap. Sans proposition d’admission, tu peux demander un réexamen à la commission d’accès à l’enseignement supérieur (CAES) de ton académie.
- Liens : [S’inscrire sur Parcoursup avec un handicap (Mon Parcours Handicap)](https://www.monparcourshandicap.gouv.fr/etudes-superieures/comment-sinscrire-parcoursup-avec-un-handicap)

### Aménagements pendant les études et aux examens
- Dans l’enseignement supérieur, adresse-toi au service ou référent handicap de ton établissement pour les aménagements d’études et d’examens.
- Liens : [Interlocuteurs et démarches pour les aménagements (Mon Parcours Handicap)](https://www.monparcourshandicap.gouv.fr/etudes-superieures/quels-interlocuteurs-et-procedures-pour-beneficier-damenagements-dans-0) ; [Aménagements aux concours et examens (Mon Parcours Handicap)](https://www.monparcourshandicap.gouv.fr/etudes-superieures/quels-sont-les-amenagements-possibles-pour-les-concours-et-examens)

### La RQTH (reconnaissance de la qualité de travailleur handicapé)
- La RQTH se demande à la MDPH de ton département, à partir de 16 ans (15 ans si tu commences un apprentissage). C’est une démarche personnelle : un employeur ne peut pas la faire à ta place.
- Elle donne accès à des aménagements de poste et à des dispositifs d’insertion. Tu n’es pas obligé(e) d’en informer ton employeur.
- Liens : [La RQTH (Service-Public)](https://www.service-public.gouv.fr/particuliers/vosdroits/F1650)

### L’alternance
- L’Agefiph peut verser une aide à l’employeur qui t’embauche en contrat d’apprentissage (jusqu’à 3 000 € selon la durée du contrat) : c’est un argument à donner aux entreprises.
- Pour les questions de poste et d’emploi, Mon Parcours Handicap regroupe les démarches et les contacts.
- Liens : [Aide à l’embauche en contrat d’apprentissage (Agefiph)](https://www.agefiph.fr/aides-handicap/aide-lembauche-en-contrat-dapprentissage) ; [Emploi et vie professionnelle (Mon Parcours Handicap)](https://www.monparcourshandicap.gouv.fr/emploi)

## 9. Plan d'action de la synthèse imprimable (`contenu/plan-action.json`)

Statut : **A_VALIDER** (2026-11-04). Aucune date précise : les calendriers changent chaque année. La synthèse ne contient jamais la donnée handicap (testé).

**Lycée (STMG)**
1. Choisis 2 ou 3 pistes métiers et lis leur fiche complète sur France Travail.
2. Rencontre des professionnels de ces métiers : stage, entretien, salon, journée portes ouvertes.
3. Note les formations qui t’intéressent et lis leur fiche Parcoursup (attendus, critères d’examen des vœux).
4. Vérifie le calendrier de Parcoursup de cette année sur le site officiel. (https://www.parcoursup.gouv.fr/)
5. Rédige un projet de formation motivé pour chaque vœu, à partir de tes pistes et de ta synthèse.
6. Si l’alternance t’intéresse, commence tôt à chercher une entreprise : la plupart des formations en apprentissage demandent un contrat.
7. Parle de cette synthèse avec ton professeur principal et le psychologue de l’Éducation nationale de ton lycée.

**Fin de BTS**
1. Choisis les voies qui t’intéressent et note, pour chaque établissement, la date limite de candidature (souvent au printemps, hors Parcoursup).
2. Prépare ton CV, une lettre de motivation par formation et tes relevés de notes de BTS.
3. Pour une école de commerce, inscris-toi aux concours d’admission parallèle avant leur clôture. (https://grande-ecole.passerelle-esc.com/)
4. Pour l’alternance, contacte dès maintenant les entreprises de ta liste : sans contrat, pas d’entrée en formation en apprentissage dans la plupart des cas.
5. Demande conseil à tes enseignants de BTS et à ton tuteur de stage sur la poursuite la plus adaptée à ton projet.

## 10. Aides pratiques (`contenu/pratique.json`)

Statut : **A_VALIDER** (2026-11-07). Aucun montant ni date : ils changent chaque année.

**Financer tes études et te loger**
- Bourse sur critères sociaux et logement en résidence Crous : une seule demande en ligne, le Dossier social étudiant (DSE), à faire chaque année dès le printemps, même avant d’avoir tes résultats Parcoursup. (https://messervices.etudiant.gouv.fr/)
- Aide à la mobilité Parcoursup : une aide existe, sous conditions, si tu acceptes une formation hors de ton académie. La demande se fait sur le même site. (https://messervices.etudiant.gouv.fr/)
- Logements étudiants du Crous près de ta future formation. (https://trouverunlogement.lescrous.fr/)
- Toutes les aides de l’État pour les jeunes (logement, transport, santé…) : un simulateur te dit à quoi tu as droit. (https://www.1jeune1solution.gouv.fr/mes-aides)
- En apprentissage, ta formation est prise en charge et tu es salarié(e) : une piste à regarder si le coût des études te freine.

**Te faire accompagner**
- Au lycée ou en BTS : ton professeur principal ou tes enseignants, et le psychologue de l’Éducation nationale de l’établissement.
- Le CIO (centre d’information et d’orientation) de ton secteur : rendez-vous gratuit avec un psychologue de l’Éducation nationale. (https://eduscol.education.gouv.fr/5388/les-centres-d-information-et-d-orientation)
- Journées portes ouvertes et salons : les dates sont sur le site de chaque établissement et sur sa fiche Parcoursup. Y aller est le meilleur moyen de vérifier qu’une formation te plaît.
