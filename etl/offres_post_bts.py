"""Génère data/post-bts.json : les poursuites d'études localisables après un BTS (toute la France).

Sources (Licence Ouverte Etalab 2.0) :
- Licences professionnelles : « Principaux diplômes et formations préparés dans les établissements publics » (MESR),
  dernière année universitaire disponible ; une licence pro y figure si elle a eu des inscrits cette année-là.
- DCG et BUT (entrée en 2e ou 3e année possible) : cartographie des formations Parcoursup, dernière année.
- Coordonnées des communes (pour les licences pro) : API Découpage administratif, geo.api.gouv.fr (centre de la commune).
Le tri « en lien avec ton BTS » se fait dans l'app, d'après contenu/poursuites-bts.json.
Usage : python3 -I etl/offres_post_bts.py
"""
import gzip
import json
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
             "implantation_departement", "effectif"]
# Site web officiel de chaque établissement (le lien Paysage demande désormais une connexion).
ETABS, CHAMPS_ETABS = "fr-esr-principaux-etablissements-enseignement-superieur", ["etablissement_id_paysage", "url"]
CHAMPS_CARTO = ["annee", "gta", "nm", "fl", "tf", "etab_nom", "commune", "departement", "etab_gps", "fiche"]
COMMUNES = "https://geo.api.gouv.fr/communes?fields=code,centre&format=json&geometry=centre"
# Paris, Lyon et Marseille : les inscriptions sont rattachées à l'arrondissement, absent de la liste des communes.
ARRONDISSEMENTS = COMMUNES + "&type=arrondissement-municipal"
SORTIE = RACINE / "data/post-bts.json"


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


def licences_pro(lignes, centres):
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
                       "d": x["implantation_departement"], "la": round(c[1], 4), "lo": round(c[0], 4)})
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
                       "f": c["fiche"]})
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

    offres_lp, sans_gps = licences_pro(lp, centres)
    offres = offres_lp + parcoursup(carto)
    if not offres_lp or not any(o["k"] == "DCG" for o in offres):
        raise SystemExit("ERREUR : aucune licence pro ou aucun DCG (source modifiée ?)")
    offres.sort(key=lambda o: (o["k"], o["m"], o["v"] or ""))
    SORTIE.write_text(json.dumps({
        "sources": {
            "LP": f"Ministère de l'Enseignement supérieur, diplômes préparés dans les établissements publics, {annee_u}",
            "DCG": f"Parcoursup, cartographie des formations {annee}", "BUT": f"Parcoursup, cartographie des formations {annee}",
        },
        "licence": "Licence Ouverte Etalab 2.0", "offres": offres,
        "sites": {w: sites_web[w] for w in sorted({o["w"] for o in offres_lp}) if w in sites_web},
    }, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    n = {k: sum(o["k"] == k for o in offres) for k in ("LP", "DCG", "BUT")}
    print(f"{len(offres)} offres ({n}) ; licences pro {annee_u}, Parcoursup {annee} ; {sans_gps} licences pro sans commune géolocalisée ; "
          f"{sum(o['w'] in sites_web for o in offres_lp)}/{len(offres_lp)} licences pro avec le site de l'établissement")


if __name__ == "__main__":
    main()
