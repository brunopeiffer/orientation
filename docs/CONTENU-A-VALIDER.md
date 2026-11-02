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

## 2. À venir
- Fiches « réalité du métier » (M3), liens et dispositifs handicap (M6).
