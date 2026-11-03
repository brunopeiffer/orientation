"""Génère data/formations/<région>.json et data/formations-index.json depuis l'open data Parcoursup.

Sources (MESR, Licence Ouverte Etalab 2.0) :
- fr-esr-cartographie_formations_parcoursup : l'offre de formation de la dernière année (lieu, apprentissage, internat).
- fr-esr-parcoursup : les statistiques d'admission de la dernière session (candidats et propositions bac techno).
Formations retenues : tous les types de formation (code_formation) ayant admis au moins un bachelier technologique
lors de la dernière session, partout en France. Limite : Parcoursup ne distingue pas STMG des autres séries techno.
Usage : python3 -I etl/formations.py
"""
import json
import pathlib
import re
import sys
import unicodedata
import urllib.parse
import urllib.request

RACINE = pathlib.Path(__file__).resolve().parent.parent
BASE = "https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/"
STATS, CARTO = "fr-esr-parcoursup", "fr-esr-cartographie_formations_parcoursup"
CHAMPS_STATS = ["session", "cod_aff_form", "acc_bt", "nb_voe_pp_bt", "prop_tot_bt", "taux_acces_ens", "capa_fin"]
CHAMPS_CARTO = ["annee", "gta", "etab_nom", "tc", "tf", "nm", "fl", "app", "int", "region", "departement", "commune",
                "fiche", "etab_gps", "code_formation"]
SORTIE = RACINE / "data/formations"
INDEX = RACINE / "data/formations-index.json"


def get(jeu, chemin, params):
    with urllib.request.urlopen(f"{BASE}{jeu}/{chemin}?{urllib.parse.urlencode(params)}", timeout=300) as r:
        return json.load(r)


def verifier(jeu, champs):
    exemple = get(jeu, "records", {"limit": 1})["results"][0]
    manquants = [c for c in champs if c not in exemple]
    if manquants:
        raise SystemExit(f"ERREUR : champs absents de {jeu} : {manquants} (schéma modifié ?)")


def derniere(jeu, champ):
    return get(jeu, "records", {"select": champ, "group_by": champ, "order_by": f"{champ} desc", "limit": 1}
               )["results"][0][champ]


def slug(texte):
    t = unicodedata.normalize("NFKD", texte or "autre").encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-") or "autre"


def nombre(x):
    return None if x is None else int(round(float(x)))


def construire(stats, carto):
    """Formations de la carte dont le type a admis au moins un bachelier techno ; regroupées par région."""
    par_code = {s["cod_aff_form"]: s for s in stats}
    types_bt = {c["code_formation"] for c in carto if (par_code.get(c["gta"]) or {}).get("acc_bt") or 0}
    if not types_bt:
        raise SystemExit("ERREUR : aucun type de formation avec des bacheliers techno (jointure gta/cod_aff_form cassée ?)")
    regions, vus, sans_gps = {}, set(), 0
    for c in carto:
        if c["code_formation"] not in types_bt or c["gta"] in vus:
            continue
        vus.add(c["gta"])
        gps = c.get("etab_gps") or {}
        if gps.get("lat") is None or gps.get("lon") is None:
            sans_gps += 1
            continue
        nom = (c["nm"] or c["fl"] or c["tf"] or ["?"])[0]  # nm = intitulé précis ; fl = parcours et mentions
        f = {
            "i": c["gta"], "n": nom, "p": [x for x in c["fl"] or [] if x != nom], "t": (c["tf"] or [""])[0],
            "e": c["etab_nom"], "v": c["commune"], "d": c["departement"],
            "la": round(gps["lat"], 4), "lo": round(gps["lon"], 4),
            "pu": (c["tc"] or "").startswith("Public"), "a": bool(c["app"]), "h": bool(c["int"]), "f": c["fiche"],
        }
        s = par_code.get(c["gta"])
        if s:
            f["s"] = {"tx": nombre(s["taux_acces_ens"]), "bt": nombre(s["nb_voe_pp_bt"]),
                      "pbt": nombre(s["prop_tot_bt"]), "cap": nombre(s["capa_fin"])}
        regions.setdefault(c["region"] or "Autre", []).append(f)
    return regions, sans_gps


def main():
    verifier(STATS, CHAMPS_STATS)
    verifier(CARTO, CHAMPS_CARTO)
    session, annee = derniere(STATS, "session"), derniere(CARTO, "annee")
    stats = get(STATS, "exports/json", {"select": ",".join(CHAMPS_STATS), "where": f'session="{session}"'})
    carto = get(CARTO, "exports/json", {"select": ",".join(CHAMPS_CARTO), "where": f'annee="{annee}"'})
    regions, sans_gps = construire(stats, carto)

    SORTIE.mkdir(parents=True, exist_ok=True)
    for ancien in SORTIE.glob("*.json"):
        ancien.unlink()
    index = []
    for nom, formations in sorted(regions.items()):
        formations.sort(key=lambda f: (f["n"], f["v"] or ""))
        (SORTIE / f"{slug(nom)}.json").write_text(json.dumps(formations, ensure_ascii=False, separators=(",", ":")),
                                                   encoding="utf-8")
        la, lo = [f["la"] for f in formations], [f["lo"] for f in formations]
        index.append({"slug": slug(nom), "nom": nom, "n": len(formations),
                      "bbox": [min(la), min(lo), max(la), max(lo)]})
    INDEX.write_text(json.dumps({
        "source": "Parcoursup, ministère de l'Enseignement supérieur : cartographie des formations et "
                  "statistiques d'admission",
        "licence": "Licence Ouverte Etalab 2.0", "annee": annee, "session": session, "regions": index,
    }, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    total = sum(r["n"] for r in index)
    print(f"{total} formations ({annee}, statistiques {session}) dans {len(index)} régions ; "
          f"{sans_gps} sans coordonnées ignorées")


if __name__ == "__main__":
    main()
