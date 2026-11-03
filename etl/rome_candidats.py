"""Génère les métiers de la V1 depuis le ROME : data/metiers.json (lu par l'app) et docs/METIERS-A-VALIDER.md.

Source : Répertoire Opérationnel des Métiers et des Emplois (ROME), France Travail, Licence Ouverte.
Fichiers : arborescence principale (fiches, appellations) et arborescence des centres d'intérêt (octobre 2026).
Usage : python3 -I etl/rome_candidats.py
"""
import datetime
import json
import pathlib
import re
import sys
import urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from xlsx import lignes  # noqa: E402

RACINE = pathlib.Path(__file__).resolve().parent.parent
BASE = ("https://www.francetravail.org/files/live/sites/peorg/files/documents/Statistiques-et-analyses/"
        "Open-data/ROME/261014-")
SOURCES = {
    "arbo": (BASE + "rome_arboprincipale-octobre-2026.xlsx", RACINE / "data/sources/rome_arboprincipale.xlsx"),
    "centres": (BASE + "rome_arbocentresdinteret-octobre-2026.xlsx",
                RACINE / "data/sources/rome_arbocentresdinteret.xlsx"),
}
VERSION_ROME = "octobre 2026"
FAMILLES = json.loads((RACINE / "contenu/metiers-familles.json").read_text(encoding="utf-8"))
SORTIE_DOC = RACINE / "docs/METIERS-A-VALIDER.md"
SORTIE_JSON = RACINE / "data/metiers.json"

# Publics pour lesquels la fiche est proposée. STMG voit tout ; CG et NDRC selon la cohérence avec le BTS.
S, CG, NDRC = "STMG", "BTS_CG", "BTS_NDRC"
SELECTION = {
    "compta": {
        S + "|" + CG: "M1203 M1213 M1225 M1206 M1204 M1222 M1207 M1215 M1202 M1211 M1210 M1220 M1201 "
                      "M1209 M1223 M1205 M1608 M1611",
    },
    "paie_rh": {
        S + "|" + CG: "M1507 M1509 M1501",
        S: "M1502 M1504 M1505 M1508 M1510 M1511 M1503",
    },
    "admin": {
        S + "|" + CG: "M1607 M1604 M1432 M1621 M1612 K1406 M1602",
        S: "M1601",
    },
    "banque": {
        S + "|" + NDRC: "C1201 C1203 C1205 C1206 C1212 C1217 C1211 C1207",
        S + "|" + CG: "C1202 C1214 C1215 C1401",
    },
    "assurance": {
        S + "|" + NDRC: "C1102 C1103 C1104 C1111 C1112 C1116 C1119 C1110 C1115",
        S + "|" + CG: "C1109 C1107 C1130 C1126 C1124",
    },
    "immobilier": {
        S + "|" + NDRC: "C1503 C1504 C1505",
        S + "|" + CG: "C1501 C1502 C1508 C1507",
    },
    "vente_b2b": {
        S + "|" + NDRC: "D1402 D1407 D1410 D1416 D1417 D1406 D1429 D1433 D1439 D1444 D1401 D1409 D1431",
        S + "|" + CG + "|" + NDRC: "D1422",
    },
    "vente_distance": {
        S + "|" + NDRC: "D1403 D1404 D1408 D1415 D1432 D1435 D1443 D1438",
    },
    "magasin": {
        S + "|" + NDRC: "D1501 D1502 D1503 D1504 D1506 D1508 D1509 D1510 D1516 D1517 D1301 D1302",
    },
    "marketing": {
        S + "|" + NDRC: "M1620 M1701 M1703 M1704 M1705 M1706 M1707 M1715 M1718 M1719 M1720 M1430 M1101",
        S + "|" + CG: "M1419",
        S: "M1102 M1406 M1413 M1429",
    },
    "communication": {
        S + "|" + NDRC: "E1101 E1124 E1112 E1113 E1405 E1407 E1127 E1401 E1404",
        S: "E1103 E1107",
    },
    "logistique": {
        S: "N1201 N1202 N1203 N1204 N1209 N1210 N1301 N1302 N1303 N1308 N4201 N4203 N4205",
    },
}

# Appellations rattachées par le ROME à une fiche retenue mais hors sujet pour ces publics. À VALIDER.
EXCLUSIONS = {"Caissier / Caissière de casino de jeux", "Comptable des jeux"}


def telecharger(cle):
    url, cache = SOURCES[cle]
    if not cache.exists():
        cache.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(url, cache)
    return lignes(cache, 1)


def lire_arbo(rows):
    """{code ROME: [appellations]} ; la première est le libellé de la fiche."""
    entete = rows[0] if rows else []
    if len(entete) < 5 or entete[4] != "Code OGR":
        raise SystemExit(f"ERREUR : structure de l'arborescence principale inattendue (en-tête {entete!r}). "
                         f"Vérifier {SOURCES['arbo'][0]}")
    fiches = {}
    for r in rows[1:]:
        r = (r + [""] * 5)[:5]
        if r[2]:  # ligne de fiche ou d'appellation : grand domaine, domaine, fiche, libellé, code OGR
            fiches.setdefault(r[0] + r[1] + r[2], []).append(r[3])
    return {code: list(dict.fromkeys(app)) for code, app in fiches.items()}


def lire_centres(rows, connus):
    """{code ROME: [centres d'intérêt]}. Échoue si un centre n'est pas décrit dans contenu/metiers-familles.json."""
    centres, courant = {}, None
    for r in rows:
        if not any(r):
            continue
        if r[0] == "" and len(r) > 1:
            if r[1] not in connus:
                raise SystemExit(f"ERREUR : centre d'intérêt inconnu {r[1]!r} (ROME modifié ?). "
                                 "L'ajouter à centresVersTypes dans contenu/metiers-familles.json.")
            courant = r[1]
        elif re.fullmatch(r"[A-N]\d{4}", r[0]) and courant:
            centres.setdefault(r[0], []).append(courant)
        else:
            raise SystemExit(f"ERREUR : ligne inattendue dans l'arborescence des centres d'intérêt : {r!r}")
    if not centres:
        raise SystemExit("ERREUR : aucun centre d'intérêt lu (structure du fichier modifiée ?)")
    return centres


def construire(fiches, centres):
    familles = {f["id"] for f in FAMILLES["familles"]}
    if familles != set(SELECTION):
        raise SystemExit(f"ERREUR : familles différentes entre SELECTION et le contenu : {familles ^ set(SELECTION)}")
    metiers, vus = [], set()
    for famille, groupes in SELECTION.items():
        for publics, codes in groupes.items():
            for code in codes.split():
                if code in vus:
                    raise SystemExit(f"ERREUR : code en double dans SELECTION : {code}")
                vus.add(code)
                if code not in fiches:
                    raise SystemExit(f"ERREUR : fiche {code} absente du ROME (version modifiée ?)")
                app = [a for a in fiches[code] if a not in EXCLUSIONS]
                metiers.append({"code": code, "libelle": app[0], "famille": famille, "publics": publics.split("|"),
                                "appellations": app[1:], "centres": centres.get(code, [])})
    return metiers


def main():
    fiches = lire_arbo(telecharger("arbo"))
    centres = lire_centres(telecharger("centres"), FAMILLES["centresVersTypes"])
    metiers = construire(fiches, centres)
    SORTIE_JSON.write_text(json.dumps({
        "source": "ROME, France Travail : arborescence principale et arborescence des centres d'intérêt",
        "version": VERSION_ROME, "licence": "Licence Ouverte Etalab 2.0",
        "genere": f"{datetime.date.today():%Y-%m-%d}", "metiers": metiers,
    }, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    noms = {f["id"]: f["nom"] for f in FAMILLES["familles"]}
    out = [
        "# Métiers V1 — liste À VALIDER PAR UN HUMAIN",
        "",
        f"Généré par `etl/rome_candidats.py` le {datetime.date.today():%d/%m/%Y}.",
        f"**{len(metiers)} fiches ROME retenues.**",
        f"Source : ROME, France Travail, arborescences d'{VERSION_ROME}, Licence Ouverte Etalab 2.0.",
        "Libellé = première appellation de la fiche ; les autres appellations (titres de poste réels) "
        "sont proposées dans l'app. Centres d'intérêt = rattachement officiel du ROME.",
        "",
        "Règle des publics : un élève de STMG voit toutes les fiches ; un étudiant de BTS ne voit que celles "
        "cohérentes avec son BTS.",
        "",
        f"Appellations exclues (hors sujet) : {', '.join(sorted(EXCLUSIONS)) or 'aucune'}.",
        "",
    ]
    for famille in SELECTION:
        out += [f"## {noms[famille]}", "",
                "| Code ROME | Métier | Publics | Centres d'intérêt (ROME) | Nb d'appellations | Exemples |",
                "|---|---|---|---|---|---|"]
        for m in (m for m in metiers if m["famille"] == famille):
            exemples = " ; ".join(m["appellations"][:4]) or "—"
            out.append(f"| {m['code']} | {m['libelle']} | {', '.join(m['publics'])} | "
                       f"{' ; '.join(m['centres']) or '—'} | {len(m['appellations']) + 1} | {exemples} |")
        out.append("")
    SORTIE_DOC.write_text("\n".join(out), encoding="utf-8")
    print(f"{len(metiers)} fiches -> {SORTIE_JSON.relative_to(RACINE)} et {SORTIE_DOC.relative_to(RACINE)}")


if __name__ == "__main__":
    main()
