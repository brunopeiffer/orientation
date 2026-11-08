"""Tests de l'ETL des poursuites après BTS, sur des données fictives. Usage : python3 -I -m unittest discover etl"""
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from offres_post_bts import licences_pro, parcoursup, sites  # noqa: E402


def lp(commune="67482", mention="Commerce et distribution", parcours="", etab="Université de Strasbourg"):
    return {"libelle_intitule_1": mention, "libelle_intitule_2": parcours, "etablissement_lib": etab,
            "etablissement_id_paysage": "abc12", "implantation_code_commune": commune,
            "implantation_commune": "Strasbourg", "implantation_departement": "Bas-Rhin"}


CENTRES = {"67482": [7.7521, 48.5734]}


class TestLicencesPro(unittest.TestCase):
    def test_une_entree_par_formation_et_lieu_avec_coordonnees_de_la_commune(self):
        offres, sans_gps = licences_pro([lp(), lp(), lp(parcours="Commerce et distribution")], CENTRES)
        self.assertEqual(len(offres), 2)  # le doublon exact est ignoré
        self.assertEqual(offres[0], {"k": "LP", "m": "Commerce et distribution", "p": "", "e": "Université de Strasbourg",
                                     "w": "abc12", "v": "Strasbourg", "d": "Bas-Rhin", "la": 48.5734, "lo": 7.7521})
        self.assertEqual(offres[1]["p"], "")  # parcours identique à la mention : non répété
        self.assertEqual(sans_gps, 0)

    def test_commune_inconnue_comptee_et_mention_vide_ignoree(self):
        offres, sans_gps = licences_pro([lp(commune="99999"), lp(mention="")], CENTRES)
        self.assertEqual((offres, sans_gps), ([], 1))


class TestParcoursup(unittest.TestCase):
    def test_sites_https_seulement(self):
        self.assertEqual(sites([{"etablissement_id_paysage": "a", "url": "https://u.fr/"},
                                {"etablissement_id_paysage": "b", "url": "http://x.fr"},
                                {"etablissement_id_paysage": "c", "url": None}]), {"a": "https://u.fr/"})

    def test_garde_dcg_et_but_avec_leur_fiche(self):
        base = {"nm": ["DCG - Diplôme"], "fl": ["DCG - Diplôme"], "etab_nom": "Lycée", "commune": "Colmar",
                "departement": "Haut-Rhin", "etab_gps": {"lat": 48.08, "lon": 7.36}, "fiche": "https://dossier.parcoursup.fr/x"}
        offres = parcoursup([{**base, "gta": "1", "tf": ["DCG"]}, {**base, "gta": "2", "tf": ["BUT"]},
                             {**base, "gta": "3", "tf": ["Licence"]}, {**base, "gta": "4", "tf": ["DCG"], "etab_gps": None}])
        self.assertEqual([(o["k"], o["f"]) for o in offres], [("DCG", base["fiche"]), ("BUT", base["fiche"])])


if __name__ == "__main__":
    unittest.main()
