"""Génère docs/CONTENU-A-VALIDER.md : tout le contenu rédigé qu'un humain doit relire, dans un format lisible.

Usage : python3 -I etl/contenu_a_valider.py
"""
import collections
import json
import pathlib

RACINE = pathlib.Path(__file__).resolve().parent.parent
TEST = json.loads((RACINE / "contenu/test-personnalite.json").read_text(encoding="utf-8"))


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
            "## 2. À venir",
            "- Fiches « réalité du métier » (M3), liens et dispositifs handicap (M6).", ""]
    (RACINE / "docs/CONTENU-A-VALIDER.md").write_text("\n".join(out), encoding="utf-8")
    print("docs/CONTENU-A-VALIDER.md généré")


if __name__ == "__main__":
    main()
