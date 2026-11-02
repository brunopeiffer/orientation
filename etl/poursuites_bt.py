"""Génère docs/POURSUITES-A-VALIDER.md : toutes les formations Parcoursup ayant admis des bacheliers technologiques.

Source : open data Parcoursup (fr-esr-parcoursup), MESR, Licence Ouverte Etalab 2.0.
Limite connue : le jeu ne distingue pas les séries technologiques (STMG, STI2D, ST2S...) ; `acc_bt` les regroupe.
Usage : python3 -I etl/poursuites_bt.py
"""
import datetime
import json
import pathlib
import sys
import urllib.parse
import urllib.request

RACINE = pathlib.Path(__file__).resolve().parent.parent
SORTIE = RACINE / "docs/POURSUITES-A-VALIDER.md"
API = "https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-parcoursup/records?"
CHAMPS = {"session", "fili", "form_lib_voe_acc", "fil_lib_voe_acc", "acc_bt", "acc_tot"}

# Proposition (à valider) de pertinence pour un élève de STMG, par spécialité de BUT.
BUT_STMG = {
    "oui": ("Gestion des entreprises", "Techniques de commercialisation", "Gestion administrative et commerciale",
            "Information communication", "Management de la Logistique", "Carrières juridiques",
            "Carrières sociales", "Métiers du multimédia", "Qualité, logistique industrielle", "Science des données"),
    "possible, à vérifier": ("Informatique", "Réseaux et télécommunications", "Hygiène Sécurité"),
}


def get(params):
    with urllib.request.urlopen(API + urllib.parse.urlencode(params), timeout=60) as r:
        return json.load(r)


def pertinence(fili, lib):
    if fili != "BUT":
        return ""
    for niveau, prefixes in BUT_STMG.items():
        if lib.startswith(prefixes):
            return niveau
    return "plutôt autres séries techno"


def main():
    exemple = get({"limit": 1})["results"][0]
    manquants = CHAMPS - set(exemple)
    if manquants:
        sys.exit(f"ERREUR : champs Parcoursup absents {sorted(manquants)} (schéma modifié ?)")
    session = get({"select": "session", "group_by": "session", "order_by": "session desc", "limit": 1})["results"][0]["session"]
    res = get({
        "select": "fili,form_lib_voe_acc,fil_lib_voe_acc,sum(acc_bt) as bt,sum(acc_tot) as tot,count(*) as n",
        "where": f'session="{session}"',
        "group_by": "fili,form_lib_voe_acc,fil_lib_voe_acc",
        "having": "sum(acc_bt)>0",
        "order_by": "fili,form_lib_voe_acc,fil_lib_voe_acc",
        "limit": -1,
    })["results"]
    out = [
        "# Poursuites d'études — liste À VALIDER PAR UN HUMAIN",
        "",
        f"Généré par `etl/poursuites_bt.py` le {datetime.date.today():%d/%m/%Y}, "
        f"open data Parcoursup session {session} (Licence Ouverte Etalab 2.0).",
        "",
        f"**{len(res)} intitulés de formation** ont admis au moins un bachelier technologique en {session}. "
        "C'est la liste exhaustive de ce que Parcoursup montre. Limite : Parcoursup ne détaille pas par série ; "
        "« bac techno » mélange STMG, STI2D, ST2S, STL, STD2A, STHR, STAV, S2TMD. La colonne « STMG ? » "
        "(BUT seulement) est une proposition à valider.",
        "",
        "Hors Parcoursup (non couverts ici, voir PLAN.md) : la plupart des licences professionnelles, "
        "les L3, les admissions parallèles en écoles, les 2e/3e années de BUT, la prépa ATS.",
        "",
    ]
    fili_courante = None
    for x in res:
        if x["fili"] != fili_courante:
            fili_courante = x["fili"]
            out += ["", f"## {fili_courante}", "",
                    "| Type | Formation | Bacheliers techno admis | Total admis | Part techno | Nb de formations | STMG ? |",
                    "|---|---|---|---|---|---|---|"]
        part = round(100 * x["bt"] / x["tot"]) if x["tot"] else 0
        out.append(f"| {x['form_lib_voe_acc']} | {x['fil_lib_voe_acc']} | {x['bt']} | {x['tot']} | {part} % | "
                   f"{x['n']} | {pertinence(x['fili'], x['fil_lib_voe_acc'] or '')} |")
    SORTIE.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"{len(res)} lignes -> {SORTIE}")


if __name__ == "__main__":
    main()
