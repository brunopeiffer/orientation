"""Tests de l'ETL Parcoursup sur des données fictives. Usage : python3 -I -m unittest discover etl"""
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from formations import construire, slug  # noqa: E402


def carte(gta, code, region="Grand Est", gps=(48.58, 7.75), app=None):
    return {"gta": gta, "code_formation": code, "nm": [f"BTS - Formation {code}"],
            "fl": [f"BTS - Formation {code}", "BTS - Parcours X"], "tf": ["BTS - BTSA - BTSM"],
            "etab_nom": "Lycée", "commune": "Strasbourg", "departement": "Bas-Rhin", "region": region,
            "etab_gps": gps and {"lat": gps[0], "lon": gps[1]}, "tc": "Public", "app": app, "int": None,
            "fiche": "https://dossier.parcoursup.fr/x"}


STATS = [{"cod_aff_form": "1", "acc_bt": 3.0, "nb_voe_pp_bt": 40.0, "prop_tot_bt": 12.0, "taux_acces_ens": 55,
          "capa_fin": 24}]


class TestConstruire(unittest.TestCase):
    def test_garde_tous_les_lieux_d_un_type_qui_a_admis_des_bacheliers_techno(self):
        # "2" n'a pas de statistiques mais partage le type "A" de "1" : il est gardé ; le type "B" ne l'est pas.
        regions, _ = construire(STATS, [carte("1", "A"), carte("2", "A", app=["Formations en apprentissage"]),
                                        carte("3", "B")])
        f = {x["i"]: x for x in regions["Grand Est"]}
        self.assertEqual(set(f), {"1", "2"})
        self.assertEqual(f["1"]["s"], {"tx": 55, "bt": 40, "pbt": 12, "cap": 24})
        self.assertNotIn("s", f["2"])  # pas de statistiques : jamais de chiffre inventé
        self.assertTrue(f["2"]["a"])
        self.assertEqual((f["1"]["n"], f["1"]["p"]), ("BTS - Formation A", ["BTS - Parcours X"]))

    def test_ignore_les_doublons_et_compte_les_lieux_sans_coordonnees(self):
        regions, sans_gps = construire(STATS, [carte("1", "A"), carte("1", "A"), carte("4", "A", gps=None)])
        self.assertEqual(len(regions["Grand Est"]), 1)
        self.assertEqual(sans_gps, 1)

    def test_echec_propre_si_la_jointure_ne_donne_rien(self):
        with self.assertRaises(SystemExit) as e:
            construire([{**STATS[0], "cod_aff_form": "999"}], [carte("1", "A")])
        self.assertIn("jointure", str(e.exception))


class TestSlug(unittest.TestCase):
    def test_noms_de_fichiers_sans_accent(self):
        self.assertEqual(slug("Provence-Alpes-Côte d'Azur"), "provence-alpes-cote-d-azur")
        self.assertEqual(slug(None), "autre")


if __name__ == "__main__":
    unittest.main()
