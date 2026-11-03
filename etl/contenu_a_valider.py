"""Génère docs/CONTENU-A-VALIDER.md : tout le contenu rédigé qu'un humain doit relire, dans un format lisible.

Usage : python3 -I etl/contenu_a_valider.py
"""
import collections
import json
import pathlib

RACINE = pathlib.Path(__file__).resolve().parent.parent
TEST = json.loads((RACINE / "contenu/test-personnalite.json").read_text(encoding="utf-8"))
GOUTS = json.loads((RACINE / "contenu/gouts.json").read_text(encoding="utf-8"))
MATIERES = json.loads((RACINE / "config/matieres.json").read_text(encoding="utf-8"))
FAMILLES = json.loads((RACINE / "contenu/metiers-familles.json").read_text(encoding="utf-8"))
LIENS = json.loads((RACINE / "contenu/formations-familles.json").read_text(encoding="utf-8"))


def section_liens():
    noms = {f["id"]: f["nom"] for f in FAMILLES["familles"]}
    out = ["## 5. Formations en lien avec les familles de métiers (`contenu/formations-familles.json`)", "",
           f"Statut : **{LIENS['statut']}** ({LIENS['date']}). Une formation Parcoursup est « en lien » avec une famille "
           "si son intitulé ou un de ses parcours contient un des mots-clés (majuscules ignorées). "
           "Vérifié par `app/src/formations.test.ts` : chaque famille trouve au moins une formation réelle dans le Grand Est.",
           ""]
    for fid, mots in LIENS["familles"].items():
        out.append(f"- **{noms.get(fid, fid)}** : " + " ; ".join(f"« {m} »" for m in mots))
    out += ["", "Grille : manque-t-il une formation importante pour une famille ? Un mot-clé attrape-t-il des formations "
            "hors sujet ?", ""]
    return out


def section_familles():
    out = [
        "## 4. Familles de métiers et fiches « réalité » (`contenu/metiers-familles.json`)",
        "",
        f"Statut : **{FAMILLES['statut']}** ({FAMILLES['date']}). Source affichée : {FAMILLES['source']}",
        "",
        "### Méthode du matching (vérifiée par `app/src/metiers.test.ts`)",
        "- Score sur 100 = intérêts 40 %, cadre de travail et valeurs 25 %, personnalité 15 %, matières fortes 20 %. "
        "Une partie sans réponse est marquée « pas assez d'infos » et son poids est réparti sur les autres.",
        "- Intérêts : centres d'intérêt OFFICIELS du ROME de chaque fiche, traduits en types ci-dessous.",
        "- Les refus ne changent pas le score : ils s'affichent en « Ce qui pourrait te freiner ».",
        "- 10 pistes, 3 au maximum par famille ; un étudiant de BTS ne voit que les fiches de son BTS.",
        "",
        "### Correspondance centres d'intérêt ROME → types",
        "",
    ]
    out += [f"- {c} → {t or 'aucun type (non utilisé)'}" for c, t in FAMILLES["centresVersTypes"].items()]
    out += ["", f"Métiers où « plus de 3 ans d'études » est signalé comme frein : {', '.join(FAMILLES['etudesLongues'])}.",
            ""]
    for f in FAMILLES["familles"]:
        perso = ", ".join(f"{d} {p}" for d, p in f["personnalite"].items()) or "—"
        out += [f"### {f['nom']} (`{f['id']}`)",
                f"- Types par défaut : {', '.join(f['types'])} · Personnalité : {perso}",
                f"- Environnements : {', '.join(f['environnements'])} · Valeurs : {', '.join(f['valeurs'])}",
                f"- Matières : {', '.join(f['matieres'])} · Freins : {', '.join(f['freins'])}",
                "- Contraintes :", *[f"  - {t}" for t in f["realite"]["contraintes"]],
                "- Avantages :", *[f"  - {t}" for t in f["realite"]["avantages"]], ""]
    out += ["Grille : chaque contrainte et avantage est-il exact pour TOUS les métiers de la famille ? "
            "Rien d'invérifiable (salaire, taux d'emploi) n'est-il affirmé ?", ""]
    return out


def section_gouts():
    types = {t["id"]: t for t in GOUTS["types"]}
    out = [
        "## 2. Goûts, envies et refus (`contenu/gouts.json`)",
        "",
        f"Statut : **{GOUTS['statut']}**. Échelle : " + " / ".join(GOUTS["niveaux"]) + ".",
        "",
        "### Méthode (vérifiée par `app/src/gouts.test.ts`)",
        "- 6 types d'intérêts inspirés du modèle RIASEC de Holland, 3 activités par type, présentées en alternant les types.",
        "- Score de 0 à 100 par type. Un type est « dominant » à partir de 50, 3 au maximum. Si aucun ne ressort, "
        "l'app le dit sans juger.",
        "- Valeurs : 3 au maximum, pour obliger à hiérarchiser. Refus : ne masquent aucune piste, ils produiront un "
        "avertissement « Ce qui pourrait te freiner » (M3).",
        "",
        "### Types d'intérêts",
        "",
        "| Type | Nom affiché | Description |",
        "|---|---|---|",
    ]
    out += [f"| {t['id']} | {t['nom']} | {t['description']} |" for t in GOUTS["types"]]
    out += ["", "### Activités à relire", "", "| # | Type | Activité |", "|---|---|---|"]
    out += [f"| {a['id']} | {types[a['type']]['nom']} | {a['texte']} |" for a in GOUTS["activites"]]
    for cle, titre in [("environnements", "Environnements"), ("valeurs", f"Valeurs ({GOUTS['maxValeurs']} au maximum)"),
                       ("refus", "Refus")]:
        out += ["", f"### {titre}", ""] + [f"- `{x['id']}` : {x['libelle']}" for x in GOUTS[cle]]
    out += ["", "## 3. Matières par public (`config/matieres.json`)", "",
            f"Statut : **{MATIERES['statut']}**. Tranches : " + " / ".join(t["libelle"] for t in MATIERES["tranches"])
            + ". Une matière est un « point d'appui » à partir de 12 ou si l'élève l'aime.", ""]
    for pid, pub in MATIERES["publics"].items():
        out.append(f"**{pid}**")
        if "option" in pub:
            out.append(f"- {pub['option']['question']} : " + " / ".join(c["libelle"] for c in pub["option"]["choix"]))
        out += [f"- `{m['id']}` : {m['libelle']}" for m in pub["matieres"]]
        out.append("")
    out += ["Grille : les libellés correspondent-ils au référentiel en vigueur et au vocabulaire des élèves ?", ""]
    return out


def main():
    dims = {d["id"]: d for d in TEST["dimensions"]}
    jumelles = {i for p in TEST["paires"] for i in p}
    out = [
        "# Contenu À VALIDER PAR UN HUMAIN",
        "",
        "Généré par `etl/contenu_a_valider.py` depuis les fichiers de `contenu/`. Pour corriger : modifier le JSON, "
        "puis relancer le script et `npm test` (les tests vérifient l'équilibre et la lisibilité du test).",
        "",
        "## 1. Profil de personnalité en 4 dimensions (`contenu/test-personnalite.json`)",
        "",
        f"Statut : **{TEST['statut']}**. Échelle : " + " / ".join(TEST["echelle"]) + ".",
        "",
        "### Méthode (vérifiée automatiquement par `app/src/personnalite.test.ts`)",
        "- 36 questions originales, 9 par dimension, présentées en alternant les dimensions.",
        "- Dans chaque dimension, 4 ou 5 questions vont vers chaque pôle : répondre « d'accord » à tout donne un profil "
        "équilibré (et l'app le signale), au lieu d'un profil artificiellement marqué.",
        "- Score de -100 (pôle A) à +100 (pôle B). Moins de 20 en valeur absolue = « équilibré » ; 20-49 légère ; "
        "50-79 marquée ; 80 et plus très marquée.",
        "- 4 paires de questions jumelles (marquées ⧉) : un écart de 3 points ou plus signale des réponses nuancées et "
        "baisse l'intensité affichée d'un cran.",
        "- Phrases de 25 mots maximum, sans négation (évite les doubles négations avec « Pas du tout d'accord »).",
        "",
        "### Limites à garder en tête",
        "- Pas d'étalonnage sur une population d'élèves ni de mesure de fidélité (test-retest) : le résultat est "
        "présenté comme une photo indicative, jamais comme une étiquette.",
        "- Les seuils (20, 50, 80) sont des choix de lisibilité, pas des normes statistiques.",
        "",
        "### Questions à relire",
        "",
        "| # | Dimension | Pôle visé | Question |",
        "|---|---|---|---|",
    ]
    for n, i in enumerate(TEST["items"], 1):
        d = dims[i["dimension"]]
        marque = " ⧉" if i["id"] in jumelles else ""
        out.append(f"| {n} ({i['id']}{marque}) | {d['nom']} | {i['pole']} : {d[i['pole']]['libelle']} | {i['texte']} |")
    out += ["", "### Textes de résultats", ""]
    for d in TEST["dimensions"]:
        out.append(f"**{d['nom']}** ({d['question']})")
        for p in "AB":
            pol = d[p]
            out.append(f"- Pôle {p}, *{pol['libelle']}* : {pol['description']}")
            out.append(f"  - Forces : {' / '.join(pol['forces'])}")
            out.append(f"  - Vigilance : {' / '.join(pol['vigilance'])}")
        out.append("")
    out += [f"Profil équilibré : {TEST['equilibre']}", "",
            "### Grille de relecture suggérée",
            "- Chaque question est-elle compréhensible par un élève de 15 à 20 ans, sans aide ?",
            "- Mesure-t-elle bien la dimension indiquée, et seulement elle ?",
            "- Une réponse est-elle socialement « mieux vue » qu'une autre (biais de désirabilité) ?",
            "- Les textes de résultats sont-ils bienveillants et sans jugement ?",
            "",
            *section_gouts(),
            *section_familles(),
            *section_liens(),
            "## 6. À venir",
            "- Liens et dispositifs handicap (M6).", ""]
    (RACINE / "docs/CONTENU-A-VALIDER.md").write_text("\n".join(out), encoding="utf-8")
    print("docs/CONTENU-A-VALIDER.md généré")


if __name__ == "__main__":
    main()
