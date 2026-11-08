"""Fiche propre à chaque métier proposé par l'app : data/fiches-metiers.json (définition, missions, accès, conditions).

Source : France Travail, « Toutes les données du ROME » (JSON, data.gouv.fr), Licence Ouverte. Seuls les codes de
data/metiers.json sont gardés. Le fichier est encodé en Windows-1252.
Usage : python3 -I etl/fiches_rome.py
"""
import datetime
import json
import pathlib
import re
import urllib.request
import zipfile

RACINE = pathlib.Path(__file__).resolve().parent.parent
URL = "https://api.francetravail.fr/api-nomenclatureemploi/v1/open-data/json"
CACHE = RACINE / "data/sources/rome/rome-open-data-json.zip"
SORTIE = RACINE / "data/fiches-metiers.json"
# Le statut d'emploi (CDI, CDD…) n'aide pas à se représenter le quotidien : on ne le garde pas.
CONTEXTES = ["Horaires et durée du travail", "Conditions de travail et risques professionnels", "Lieux et déplacements",
             "Types de structures"]


def telecharger():
    if not CACHE.exists():
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(URL, CACHE)
    with zipfile.ZipFile(CACHE) as z:
        noms = [n for n in z.namelist() if n.startswith("unix_fiche_emploi_metier_") and n.endswith(".json")]
        if len(noms) != 1:
            raise SystemExit(f"ERREUR : fichier des fiches métiers introuvable dans l'archive ROME ({z.namelist()!r})")
        version = re.search(r"_v(\d+)\.json$", noms[0]).group(1)
        return json.loads(z.read(noms[0]).decode("cp1252")), version


def missions(definition):
    """La définition ROME = une phrase d'introduction, puis des missions collées (« … les coûts Participe à … »)."""
    intro, _, reste = definition.partition(". ")
    actions = [m.strip() for m in re.split(r" (?=[A-ZÀÂÉÈÊÎÔÛ][a-zàâçéèêëîïôûù]+ )", reste) if m.strip()]
    return intro.strip() + ("" if intro.endswith(".") else "."), actions


def construire(fiches, codes):
    sortie = {}
    for f in fiches:
        try:
            code, definition, acces = f["rome"]["code_rome"], f["definition"], f["acces_metier"]
            contextes = f["contextes_travail"]
        except (KeyError, TypeError) as e:
            raise SystemExit(f"ERREUR : fiche ROME sans le champ {e} (structure modifiée ?)")
        if code not in codes:
            continue
        intro, actions = missions(definition)
        sortie[code] = {
            "definition": intro, "missions": actions[:8], "acces": acces.strip(),
            "contextes": {c["libelle"]: [i["libelle"] for i in c["items"]] for c in contextes if c["libelle"] in CONTEXTES},
        }
    manquants = codes - sortie.keys()
    if manquants:
        raise SystemExit(f"ERREUR : fiches ROME absentes pour {sorted(manquants)} (version du ROME modifiée ?)")
    return sortie


def main():
    codes = {m["code"] for m in json.loads((RACINE / "data/metiers.json").read_text(encoding="utf-8"))["metiers"]}
    fiches, version = telecharger()
    sortie = construire(fiches, codes)
    SORTIE.write_text(json.dumps({
        "source": "France Travail, ROME (fiches métiers : définition, accès à l'emploi, contextes de travail)",
        "version": f"v{version}", "licence": "Licence Ouverte Etalab 2.0",
        "genere": f"{datetime.date.today():%Y-%m-%d}", "fiches": sortie,
    }, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(sortie)} fiches -> {SORTIE.relative_to(RACINE)}")


if __name__ == "__main__":
    main()
