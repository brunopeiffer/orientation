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
            "## 4. À venir",
            "- Fiches « réalité du métier » (M3), liens et dispositifs handicap (M6).", ""]
    (RACINE / "docs/CONTENU-A-VALIDER.md").write_text("\n".join(out), encoding="utf-8")
    print("docs/CONTENU-A-VALIDER.md généré")


if __name__ == "__main__":
    main()
