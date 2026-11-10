"""Journées portes ouvertes des établissements du supérieur : data/portes-ouvertes.json, par code UAI.

Source : Onisep, « Idéo-Structures d'enseignement supérieur » (data.gouv.fr), licence ODbL, colonne
« journées portes ouvertes » (renseignée par environ un établissement sur dix). L'app n'affiche que les dates à venir.
Usage : python3 -I etl/portes_ouvertes.py
"""
import csv
import datetime
import io
import json
import pathlib
import re
import urllib.request

RACINE = pathlib.Path(__file__).resolve().parent.parent
URL = "https://data.onisep.fr/api/v1/downloads/5fa586da5c4b6/5fa586da5c4b6.csv"
CACHE = RACINE / "data/sources/onisep/structures-sup.csv"
SORTIE = RACINE / "data/portes-ouvertes.json"
C_UAI, C_JPO = "code UAI", "journées portes ouvertes"
DATE = re.compile(r"^(?:le|du) (\d\d)/(\d\d)/(\d{4})(?: au (\d\d)/(\d\d)/(\d{4}))?")


def lire():
    if not CACHE.exists():
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(URL, CACHE)
    lignes = list(csv.DictReader(io.StringIO(CACHE.read_text(encoding="utf-8-sig")), delimiter=";"))
    manquants = [c for c in (C_UAI, C_JPO) if not lignes or c not in lignes[0]]
    if manquants:
        raise SystemExit(f"ERREUR : colonnes absentes du fichier Onisep des établissements : {manquants}")
    return lignes


def journees(texte):
    """« le 28/11/2026 de 09h30 à 17h00 (…) voir https://… | le … » -> [{debut, fin, texte, lien}] ; ignore l'illisible."""
    sortie = []
    for brut in (t.strip() for t in texte.split("|")):
        m = DATE.match(brut)
        if not m:
            continue
        j, mo, a, j2, mo2, a2 = m.groups()
        lien = re.search(r"\bvoir (https://\S+)", brut)
        sortie.append({"debut": f"{a}-{mo}-{j}", "fin": f"{a2}-{mo2}-{j2}" if j2 else f"{a}-{mo}-{j}",
                       "texte": re.sub(r"\s*voir https?://\S+", "", brut).strip(), "lien": lien.group(1) if lien else None})
    return sortie


def construire(lignes):
    sortie = {}
    for x in lignes:
        j = journees(x[C_JPO] or "")
        if x[C_UAI] and j:
            sortie[x[C_UAI]] = j
    return sortie


def main():
    jpo = construire(lire())
    if not jpo:
        raise SystemExit("ERREUR : aucune journée portes ouvertes lue (colonne vide ou format modifié ?)")
    SORTIE.write_text(json.dumps({
        "source": "Onisep, Idéo-Structures d'enseignement supérieur (journées portes ouvertes)", "licence": "ODbL",
        "genere": f"{datetime.date.today():%Y-%m-%d}", "jpo": jpo,
    }, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{len(jpo)} établissements avec des portes ouvertes -> {SORTIE.relative_to(RACINE)}")


if __name__ == "__main__":
    main()
