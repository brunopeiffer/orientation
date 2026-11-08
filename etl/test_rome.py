"""Tests de l'ETL ROME sur des données fictives. Usage : python3 -I -m unittest discover etl"""
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from rome_candidats import SELECTION, construire, lire_arbo, lire_centres  # noqa: E402

ENTETE = ["", "", "", "Fiche ROME", "Code OGR"]
ARBO = [ENTETE, ["M", "12", "03", "Comptable", ""], ["M", "12", "03", "Comptable unique", "123"],
        ["M", "12", "03", "Comptable", "124"], ["M", "12", "", "Domaine (pas une fiche)", ""]]
CONNUS = {"J'aime manier les chiffres": "C"}
CENTRES = [["", "J'aime manier les chiffres", "description"], ["M1203", "Comptable"], []]


class TestArbo(unittest.TestCase):
    def test_lit_fiches_et_appellations_sans_doublon(self):
        self.assertEqual(lire_arbo(ARBO), {"M1203": ["Comptable", "Comptable unique"]})

    def test_echec_propre_si_en_tete_modifiee(self):
        with self.assertRaises(SystemExit) as e:
            lire_arbo([["", "", "", "Fiche", "OGR code"]] + ARBO[1:])
        self.assertIn("structure de l'arborescence principale inattendue", str(e.exception))

    def test_echec_propre_si_fichier_vide(self):
        self.assertRaises(SystemExit, lire_arbo, [])


class TestCentres(unittest.TestCase):
    def test_rattache_les_fiches_a_leur_centre(self):
        self.assertEqual(lire_centres(CENTRES, CONNUS), {"M1203": ["J'aime manier les chiffres"]})

    def test_echec_propre_si_centre_inconnu(self):
        with self.assertRaises(SystemExit) as e:
            lire_centres([["", "J'aime un centre nouveau", "x"]] + CENTRES[1:], CONNUS)
        self.assertIn("centre d'intérêt inconnu", str(e.exception))

    def test_echec_propre_si_ligne_inattendue(self):
        self.assertRaises(SystemExit, lire_centres, CENTRES + [["???", "colonne déplacée"]], CONNUS)

    def test_echec_propre_si_aucun_centre(self):
        self.assertRaises(SystemExit, lire_centres, [], CONNUS)


class TestConstruire(unittest.TestCase):
    def test_echec_propre_si_une_fiche_retenue_disparait_du_rome(self):
        with self.assertRaises(SystemExit) as e:
            construire({"M1203": ["Comptable"]}, {})
        self.assertIn("absente du ROME", str(e.exception))

    def test_bts_sam_ajoute_aux_fiches_d_assistanat_seulement(self):
        fiches = {c: [c] for g in SELECTION.values() for codes in g.values() for c in codes.split()}
        publics = {m["code"]: m["publics"] for m in construire(fiches, {})}
        self.assertIn("BTS_SAM", publics["M1604"])
        self.assertNotIn("BTS_SAM", publics["M1203"])


if __name__ == "__main__":
    unittest.main()
