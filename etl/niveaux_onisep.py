"""Niveau minimum d'accès de chaque métier, lu dans les fiches métiers de l'Onisep : data/niveaux-onisep.json.

Source : Onisep, Idéo-Fiches métiers (data.gouv.fr), licence ODbL. Le lien code ROME -> fiche Onisep est fait
à la main dans contenu/metiers-onisep.json (le fichier Onisep ne connaît que les anciens codes ROME V3).
Usage : python3 -I etl/niveaux_onisep.py
"""
import datetime
import json
import pathlib
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

RACINE = pathlib.Path(__file__).resolve().parent.parent
URL = "https://data.onisep.fr/api/v1/downloads/5fe0808a2da6f/5fe0808a2da6f.zip"
CACHE = RACINE / "data/sources/onisep/ideo-fiches-metiers.zip"
SORTIE = RACINE / "data/niveaux-onisep.json"
LIEN = "https://www.onisep.fr/http/redirection/metier/slug/"


def telecharger():
    if not CACHE.exists():
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(URL, CACHE)
    with zipfile.ZipFile(CACHE) as z:
        xmls = [n for n in z.namelist() if n.endswith(".xml")]
        if len(xmls) != 1:
            raise SystemExit(f"ERREUR : une archive Onisep avec un seul XML était attendue, trouvé {xmls!r}")
        return z.read(xmls[0])


def lire_fiches(xml):
    """{identifiant MET.x: (nom du métier, niveau minimum d'accès)}. Échoue si la structure change."""
    racine = ET.fromstring(xml)
    fiches = {}
    for m in racine.findall("metier"):
        ident, nom, niveau = m.findtext("identifiant"), m.findtext("nom_metier"), m.findtext("niveau_acces_min/libelle")
        if not ident or not nom:
            raise SystemExit("ERREUR : fiche Onisep sans identifiant ou sans nom_metier (structure modifiée ?)")
        fiches[ident] = (nom.strip(), (niveau or "").strip() or None)
    if not fiches:
        raise SystemExit("ERREUR : aucune fiche <metier> lue dans le fichier Onisep (structure modifiée ?)")
    return fiches


def construire(correspondances, fiches, codes_rome):
    niveaux = {}
    for code, ident in correspondances.items():
        if code not in codes_rome:
            raise SystemExit(f"ERREUR : {code} (contenu/metiers-onisep.json) n'est pas dans data/metiers.json")
        if ident not in fiches:
            raise SystemExit(f"ERREUR : fiche Onisep {ident} (pour {code}) absente du fichier Onisep")
        nom, niveau = fiches[ident]
        if not niveau:
            raise SystemExit(f"ERREUR : fiche Onisep {ident} sans niveau_acces_min")
        niveaux[code] = {"id": ident, "nom": nom, "niveau": niveau, "lien": LIEN + ident}
    return niveaux


def main():
    table = json.loads((RACINE / "contenu/metiers-onisep.json").read_text(encoding="utf-8"))
    codes = {m["code"] for m in json.loads((RACINE / "data/metiers.json").read_text(encoding="utf-8"))["metiers"]}
    niveaux = construire(table["correspondances"], lire_fiches(telecharger()), codes)
    SORTIE.write_text(json.dumps({
        "source": "Onisep, Idéo-Fiches métiers (niveau minimum d'accès)", "licence": "ODbL",
        "genere": f"{datetime.date.today():%Y-%m-%d}", "niveaux": niveaux,
    }, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(niveaux)} métiers avec un niveau Onisep -> {SORTIE.relative_to(RACINE)}")


if __name__ == "__main__":
    main()
