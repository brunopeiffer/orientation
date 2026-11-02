"""Génère docs/METIERS-A-VALIDER.md : fiches ROME candidates pour la V1, avec leurs appellations.

Source : Répertoire Opérationnel des Métiers et des Emplois (ROME), France Travail, Licence Ouverte.
Usage : python3 -I etl/rome_candidats.py
"""
import datetime
import pathlib
import sys
import urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from xlsx import lignes  # noqa: E402

RACINE = pathlib.Path(__file__).resolve().parent.parent
URL = ("https://www.francetravail.org/files/live/sites/peorg/files/documents/Statistiques-et-analyses/"
       "Open-data/ROME/261014-rome_arboprincipale-octobre-2026.xlsx")
CACHE = RACINE / "data/sources/rome_arboprincipale.xlsx"
SORTIE = RACINE / "docs/METIERS-A-VALIDER.md"

# Publics pour lesquels la fiche est proposée. STMG voit tout ; CG et NDRC selon la cohérence avec le BTS.
S, CG, NDRC = "STMG", "BTS CG", "BTS NDRC"
SELECTION = {
    "Comptabilité, gestion, finance": {
        S + "|" + CG: "M1203 M1213 M1225 M1206 M1204 M1222 M1207 M1215 M1202 M1211 M1210 M1220 M1201 "
                      "M1209 M1223 M1205 M1608 M1611",
    },
    "Paie et ressources humaines": {
        S + "|" + CG: "M1507 M1509 M1501",
        S: "M1502 M1504 M1505 M1508 M1510 M1511 M1503",
    },
    "Assistanat, administration, secteur public": {
        S + "|" + CG: "M1607 M1604 M1432 M1621 M1612 K1406 M1602",
        S: "M1601",
    },
    "Banque": {
        S + "|" + NDRC: "C1201 C1203 C1205 C1206 C1212 C1217 C1211 C1207",
        S + "|" + CG: "C1202 C1214 C1215 C1401",
    },
    "Assurance et protection sociale": {
        S + "|" + NDRC: "C1102 C1103 C1104 C1111 C1112 C1116 C1119 C1110 C1115",
        S + "|" + CG: "C1109 C1107 C1130 C1126 C1124",
    },
    "Immobilier": {
        S + "|" + NDRC: "C1503 C1504 C1505",
        S + "|" + CG: "C1501 C1502 C1508 C1507",
    },
    "Vente et relation client B2B": {
        S + "|" + NDRC: "D1402 D1407 D1410 D1416 D1417 D1406 D1429 D1433 D1439 D1444 D1401 D1409 D1431",
        S + "|" + CG + "|" + NDRC: "D1422",
    },
    "Vente et relation client B2C, à distance": {
        S + "|" + NDRC: "D1403 D1404 D1408 D1415 D1432 D1435 D1443 D1438",
    },
    "Distribution et management de magasin": {
        S + "|" + NDRC: "D1501 D1502 D1503 D1504 D1506 D1508 D1509 D1510 D1516 D1517 D1301 D1302",
    },
    "Marketing, achats, études": {
        S + "|" + NDRC: "M1620 M1701 M1703 M1704 M1705 M1706 M1707 M1715 M1718 M1719 M1720 M1430 M1101",
        S + "|" + CG: "M1419",
        S: "M1102 M1406 M1413 M1429",
    },
    "Communication et digital": {
        S + "|" + NDRC: "E1101 E1124 E1112 E1113 E1405 E1407 E1127 E1401 E1404",
        S: "E1103 E1107",
    },
    "Logistique et transport": {
        S: "N1201 N1202 N1203 N1204 N1209 N1210 N1301 N1302 N1303 N1308 N4201 N4203 N4205",
    },
}


def charger():
    if not CACHE.exists():
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(URL, CACHE)
    rows = lignes(CACHE, 1)
    entete = rows[0]
    if len(entete) < 5 or entete[4] != "Code OGR":
        sys.exit(f"ERREUR : structure ROME inattendue (en-tête {entete!r}). Vérifier le fichier source {URL}")
    fiches = {}
    for r in rows[1:]:
        r = (r + [""] * 5)[:5]
        if r[2]:  # ligne d'appellation : grand domaine, domaine, fiche, libellé, code OGR
            fiches.setdefault(r[0] + r[1] + r[2], []).append(r[3])
    return fiches


def main():
    fiches = charger()
    codes_vus = set()
    out = [
        "# Métiers V1 — liste À VALIDER PAR UN HUMAIN",
        "",
        f"Généré par `etl/rome_candidats.py` le {datetime.date.today():%d/%m/%Y}.",
        "Source : ROME, France Travail, arborescence principale d'octobre 2026, Licence Ouverte Etalab 2.0.",
        "Libellé = première appellation de la fiche ; les autres appellations (titres de poste réels) "
        "seront toutes proposées dans l'app.",
        "",
        "Règle des publics : un élève de STMG voit toutes les fiches ; un étudiant de BTS ne voit que celles "
        "cohérentes avec son BTS.",
        "",
    ]
    total = 0
    for famille, groupes in SELECTION.items():
        out += [f"## {famille}", "", "| Code ROME | Métier | Publics | Nb d'appellations | Exemples d'appellations |",
                "|---|---|---|---|---|"]
        for publics, codes in groupes.items():
            for code in codes.split():
                assert code not in codes_vus, f"code en double : {code}"
                codes_vus.add(code)
                if code not in fiches:
                    sys.exit(f"ERREUR : fiche {code} absente du ROME (version modifiée ?)")
                app = list(dict.fromkeys(fiches[code]))
                exemples = " ; ".join(app[1:5]) or "—"
                out.append(f"| {code} | {app[0]} | {publics.replace('|', ', ')} | {len(app)} | {exemples} |")
                total += 1
        out.append("")
    out.insert(3, f"**{total} fiches ROME retenues.**")
    SORTIE.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"{total} fiches -> {SORTIE}")


if __name__ == "__main__":
    main()
