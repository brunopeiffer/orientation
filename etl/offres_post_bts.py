"""Génère data/post-bts.json : les poursuites d'études localisables après un BTS (toute la France).

Sources (Licence Ouverte Etalab 2.0) :
- Licences professionnelles : « Principaux diplômes et formations préparés dans les établissements publics » (MESR),
  dernière année universitaire disponible ; une licence pro y figure si elle a eu des inscrits cette année-là.
- DCG et BUT (entrée en 2e ou 3e année possible) : cartographie des formations Parcoursup, dernière année.
- Coordonnées des communes (pour les licences pro) : API Découpage administratif, geo.api.gouv.fr (centre de la commune).
- Onisep, Idéo-Actions de formation initiale, enseignement supérieur (licence ODbL) : fiche Onisep de chaque licence pro,
  page de la formation sur le site de l'établissement, et formations des écoles PRIVÉES (bachelors, mastères…) avec
  leur reconnaissance par l'État, leur durée et leur coût.
Le tri « en lien avec ton BTS » se fait dans l'app, d'après contenu/poursuites-bts.json.
Usage : python3 -I etl/offres_post_bts.py
"""
import csv
import gzip
import io
import json
import re
import unicodedata
import pathlib
import sys
import urllib.parse
import urllib.request

RACINE = pathlib.Path(__file__).resolve().parent.parent
MESR = "https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/"
DIPLOMES, CARTO = "fr-esr-principaux-diplomes-et-formations-prepares-etablissements-publics", \
    "fr-esr-cartographie_formations_parcoursup"
CHAMPS_LP = ["annee_universitaire", "typ_diplome_lib", "libelle_intitule_1", "libelle_intitule_2", "etablissement_lib",
             "etablissement_id_paysage", "implantation_code_commune", "implantation_commune",
             "implantation_departement", "effectif", "etablissement_id_uai"]
# Site web officiel de chaque établissement (le lien Paysage demande désormais une connexion).
ETABS, CHAMPS_ETABS = "fr-esr-principaux-etablissements-enseignement-superieur", ["etablissement_id_paysage", "url"]
CHAMPS_CARTO = ["annee", "gta", "nm", "fl", "tf", "etab_nom", "commune", "departement", "etab_gps", "fiche", "etab_uai"]
COMMUNES = "https://geo.api.gouv.fr/communes?fields=code,centre&format=json&geometry=centre"
# Paris, Lyon et Marseille : les inscriptions sont rattachées à l'arrondissement, absent de la liste des communes.
ARRONDISSEMENTS = COMMUNES + "&type=arrondissement-municipal"
SORTIE = RACINE / "data/post-bts.json"
ONISEP = "https://data.onisep.fr/api/v1/downloads/605344579a7d7/605344579a7d7.csv"
CACHE_ONISEP = RACINE / "data/sources/onisep/adf-sup.csv"
C_FOR, C_FOR_URL, C_DOM, C_TYPE, C_CERT, C_NIV = ("Formation (FOR) libellé", "FOR URL et ID Onisep",
                                                  "FOR indexation domaine web Onisep", "FOR type",
                                                  "FOR nature du certificat", "FOR niveau de sortie")
C_UAI = "ENS code UAI"
C_ENS, C_STATUT, C_COMMUNE, C_DEP, C_LAT, C_LON = ("Lieu d'enseignement (ENS) libellé", "ENS statut", "ENS commune",
                                                   "ENS département", "ENS latitude", "ENS longitude")
C_DUREE, C_COUT, C_PAGE = "AF durée cycle standard", "AF coût scolarité", "AF page web"
CHAMPS_ONISEP = [C_UAI, C_FOR, C_FOR_URL, C_DOM, C_TYPE, C_CERT, C_NIV, C_ENS, C_STATUT, C_COMMUNE, C_DEP, C_LAT, C_LON,
                 C_DUREE, C_COUT, C_PAGE]
# Écoles privées : diplômes de niveau bac+3 à bac+5 que l'on prépare souvent après un BTS.
TYPES_ECOLE = {"formation d'école spécialisée", "diplôme d'école de commerce visé (bac + 3)",
               "diplôme d'école de commerce visé de niveau bac + 4 ou 5", "Master of Science", "licence", "licence pro",
               "master"}
NIVEAUX_ECOLE = {"bac + 3", "bac + 4", "bac + 5"}
# Domaines Onisep en lien avec les BTS de l'app (le tri par BTS se fait dans l'app, contenu/poursuites-bts.json).
DOMAINES_ECOLE = {
    "gestion des entreprises, comptabilité/comptabilité", "gestion des entreprises, comptabilité/administration de l'entreprise",
    "gestion des entreprises, comptabilité/ressources humaines", "banque, assurances, immobilier/finances",
    "banque, assurances, immobilier/banque", "banque, assurances, immobilier/assurances",
    "banque, assurances, immobilier/immobilier", "commerce, marketing, vente/marketing, vente",
    "commerce, marketing, vente/commerce international", "commerce, marketing, vente/grande distribution et petits commerces",
    "commerce, marketing, vente/achat, approvisionnement", "information-communication, audiovisuel/communication",
}


def normal(texte):
    """Minuscules, sans accents ni ponctuation : pour rapprocher les intitulés du ministère et de l'Onisep."""
    return re.sub(r"[^a-z0-9]+", " ", unicodedata.normalize("NFD", texte.lower()).encode("ascii", "ignore").decode()).strip()


def lire_onisep():
    if not CACHE_ONISEP.exists():
        CACHE_ONISEP.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(ONISEP, CACHE_ONISEP)
    lignes = list(csv.DictReader(io.StringIO(CACHE_ONISEP.read_text(encoding="utf-8-sig")), delimiter=";"))
    manquants = [c for c in CHAMPS_ONISEP if not lignes or c not in lignes[0]]
    if manquants:
        raise SystemExit(f"ERREUR : colonnes absentes du fichier Onisep : {manquants} (structure modifiée ?)")
    return lignes


def https(url):
    url = (url or "").strip()
    return url if url.startswith("https://") else None


def liens_licences_pro(lignes):
    """{mention: fiche Onisep du diplôme} et {(commune, mention): page de la formation sur le site de l'établissement}."""
    par_mention, par_lieu = {}, {}
    for x in lignes:
        if x[C_TYPE] != "licence pro":
            continue
        mention = normal(re.sub(r"^licence pro(fessionnelle)? mention ", "", x[C_FOR]))
        if https(x[C_FOR_URL]):
            par_mention.setdefault(mention, x[C_FOR_URL])
        if https(x[C_PAGE]):
            par_lieu.setdefault((normal(x[C_COMMUNE]), mention), x[C_PAGE].strip())
    return par_mention, par_lieu


def ecoles(lignes):
    """Formations d'écoles privées (bac+3 à bac+5) dans les domaines des BTS de l'app, avec leur reconnaissance."""
    sortie, vus = [], set()
    for x in lignes:
        domaines = [d.strip() for d in x[C_DOM].split("|") if d.strip() in DOMAINES_ECOLE]
        if (x[C_STATUT] == "public" or x[C_TYPE] not in TYPES_ECOLE or x[C_NIV] not in NIVEAUX_ECOLE or not domaines
                or not x[C_LAT] or not x[C_LON]):
            continue
        k = (x[C_FOR], x[C_ENS], x[C_COMMUNE])
        if k in vus:
            continue
        vus.add(k)
        sortie.append({"k": "ECOLE", "m": x[C_FOR][:1].upper() + x[C_FOR][1:], "p": " | ".join(domaines), "e": x[C_ENS],
                       "v": x[C_COMMUNE] or None, "d": x[C_DEP] or None, "la": round(float(x[C_LAT]), 4),
                       "lo": round(float(x[C_LON]), 4), "n": x[C_NIV], "r": x[C_CERT] or None,
                       "du": x[C_DUREE] or None, "c": x[C_COUT] or None, "a": https(x[C_PAGE]), "o": https(x[C_FOR_URL]), "u": x[C_UAI] or None})
    return sortie


# dossierappel.parcoursup.fr renvoie désormais 404 ; la même fiche est servie par dossier.parcoursup.fr.
def fiche(url):
    return url.replace("https://dossierappel.parcoursup.fr/", "https://dossier.parcoursup.fr/") if url else url


def get_json(url):
    with urllib.request.urlopen(url, timeout=300) as r:
        brut = r.read()
    # Le serveur du ministère renvoie parfois du gzip sans qu'on l'ait demandé.
    return json.loads(gzip.decompress(brut) if brut[:2] == b"\x1f\x8b" else brut)


def mesr(jeu, chemin, params):
    return get_json(f"{MESR}{jeu}/{chemin}?{urllib.parse.urlencode(params)}")


def verifier(jeu, champs, where=""):
    res = mesr(jeu, "records", {"limit": 1, **({"where": where} if where else {})})["results"]
    manquants = [c for c in champs if not res or c not in res[0]]
    if manquants:
        raise SystemExit(f"ERREUR : champs absents de {jeu} : {manquants} (schéma modifié ?)")


def licences_pro(lignes, centres, liens=({}, {})):
    """Une entrée par (établissement, commune, mention, parcours) ; ignore les communes sans coordonnées."""
    vus, sortie, sans_gps = set(), [], 0
    for x in lignes:
        mention = (x["libelle_intitule_1"] or "").strip()
        parcours = (x["libelle_intitule_2"] or "").strip()
        cle = (x["etablissement_lib"], x["implantation_code_commune"], mention, parcours)
        if not mention or cle in vus:
            continue
        vus.add(cle)
        c = centres.get(x["implantation_code_commune"])
        if not c:
            sans_gps += 1
            continue
        sortie.append({"k": "LP", "m": mention, "p": parcours if parcours != mention else "", "e": x["etablissement_lib"],
                       "w": x["etablissement_id_paysage"], "v": x["implantation_commune"],
                       "d": x["implantation_departement"], "la": round(c[1], 4), "lo": round(c[0], 4),
                       "u": (x.get("etablissement_id_uai") or [None])[0],  # UAI de l'établissement : pour ses portes ouvertes
                       "o": liens[0].get(normal(mention)), "a": liens[1].get((normal(x["implantation_commune"] or ""), normal(mention)))})
    return sortie, sans_gps


def sites(lignes):
    """{identifiant Paysage: site web https} ; ignore les établissements sans site sûr."""
    return {x["etablissement_id_paysage"]: x["url"] for x in lignes
            if x.get("etablissement_id_paysage") and (x.get("url") or "").startswith("https://")}


def parcoursup(lignes):
    """DCG et BUT de la carte Parcoursup (lieux réels, avec la fiche officielle)."""
    sortie, vus = [], set()
    for c in lignes:
        types = c["tf"] or []
        k = "DCG" if "DCG" in types else "BUT" if "BUT" in types else None
        gps = c.get("etab_gps") or {}
        if not k or c["gta"] in vus or gps.get("lat") is None:
            continue
        vus.add(c["gta"])
        sortie.append({"k": k, "m": (c["nm"] or c["fl"] or ["?"])[0], "p": " ; ".join(c["fl"] or []), "e": c["etab_nom"],
                       "v": c["commune"], "d": c["departement"], "la": round(gps["lat"], 4), "lo": round(gps["lon"], 4),
                       "f": fiche(c["fiche"]), "u": c.get("etab_uai") or None})
    return sortie


def main():
    verifier(DIPLOMES, CHAMPS_LP, 'typ_diplome_lib="Licence professionnelle"')
    verifier(CARTO, CHAMPS_CARTO)
    verifier(ETABS, CHAMPS_ETABS)
    annee_u = mesr(DIPLOMES, "records", {"select": "annee_universitaire", "where": 'typ_diplome_lib="Licence professionnelle"',
                                        "group_by": "annee_universitaire", "order_by": "annee_universitaire desc",
                                        "limit": 1})["results"][0]["annee_universitaire"]
    annee = mesr(CARTO, "records", {"select": "annee", "group_by": "annee", "order_by": "annee desc", "limit": 1}
                 )["results"][0]["annee"]
    lp = mesr(DIPLOMES, "exports/json", {"select": ",".join(CHAMPS_LP),
                                          "where": f'typ_diplome_lib="Licence professionnelle" and annee_universitaire="{annee_u}"'})
    carto = mesr(CARTO, "exports/json", {"select": ",".join(CHAMPS_CARTO),
                                         "where": f'annee="{annee}" and (tf="DCG" or tf="BUT")'})
    sites_web = sites(mesr(ETABS, "exports/json", {"select": ",".join(CHAMPS_ETABS)}))
    communes = get_json(COMMUNES) + get_json(ARRONDISSEMENTS)
    if not communes or "centre" not in communes[0]:
        raise SystemExit("ERREUR : réponse inattendue de geo.api.gouv.fr (champ centre absent)")
    centres = {c["code"]: c["centre"]["coordinates"] for c in communes if c.get("centre")}

    onisep = lire_onisep()
    offres_lp, sans_gps = licences_pro(lp, centres, liens_licences_pro(onisep))
    offres_ecoles = ecoles(onisep)
    offres = offres_lp + parcoursup(carto) + offres_ecoles
    if not offres_lp or not offres_ecoles or not any(o["k"] == "DCG" for o in offres):
        raise SystemExit("ERREUR : aucune licence pro ou aucun DCG (source modifiée ?)")
    offres.sort(key=lambda o: (o["k"], o["m"], o["v"] or ""))
    SORTIE.write_text(json.dumps({
        "sources": {
            "LP": f"Ministère de l'Enseignement supérieur, diplômes préparés dans les établissements publics, {annee_u}",
            "DCG": f"Parcoursup, cartographie des formations {annee}", "BUT": f"Parcoursup, cartographie des formations {annee}",
            "ECOLE": "Onisep, Idéo-Actions de formation initiale (enseignement supérieur), licence ODbL",
        },
        "licence": "Licence Ouverte Etalab 2.0 (ministère, Parcoursup) ; ODbL (Onisep)", "offres": offres,
        "sites": {w: sites_web[w] for w in sorted({o["w"] for o in offres_lp}) if w in sites_web},
    }, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    n = {k: sum(o["k"] == k for o in offres) for k in ("LP", "DCG", "BUT", "ECOLE")}
    print(f"{len(offres)} offres ({n}) ; licences pro {annee_u}, Parcoursup {annee} ; {sans_gps} licences pro sans commune géolocalisée ; "
          f"{sum(o['w'] in sites_web for o in offres_lp)}/{len(offres_lp)} licences pro avec le site de l'établissement ; "
          f"{sum(bool(o['o']) for o in offres_lp)} avec la fiche Onisep, {sum(bool(o['a']) for o in offres_lp)} avec la page de la formation")


if __name__ == "__main__":
    main()
