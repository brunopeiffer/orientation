import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from niveaux_onisep import construire, lire_fiches  # noqa: E402

XML = b"""<metiers><metier><identifiant>MET.149</identifiant><nom_metier>expert/e-comptable</nom_metier>
<niveau_acces_min><id>REF.1</id><libelle>bac + 8</libelle></niveau_acces_min></metier></metiers>"""


class TestNiveaux(unittest.TestCase):
    def test_lit_le_niveau_et_le_relie_au_code_rome(self):
        n = construire({"M1211": "MET.149"}, lire_fiches(XML), {"M1211"})
        self.assertEqual(n["M1211"]["niveau"], "bac + 8")
        self.assertTrue(n["M1211"]["lien"].endswith("MET.149"))

    def test_echec_propre_si_fiche_ou_code_inconnu(self):
        fiches = lire_fiches(XML)
        self.assertRaises(SystemExit, construire, {"M1211": "MET.999"}, fiches, {"M1211"})
        self.assertRaises(SystemExit, construire, {"Z9999": "MET.149"}, fiches, {"M1211"})

    def test_echec_propre_si_structure_modifiee(self):
        self.assertRaises(SystemExit, lire_fiches, b"<metiers><job/></metiers>")


if __name__ == "__main__":
    unittest.main()
