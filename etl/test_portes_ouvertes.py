import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from portes_ouvertes import construire, journees  # noqa: E402


class TestPortesOuvertes(unittest.TestCase):
    def test_lit_dates_horaires_et_lien(self):
        j = journees("le 28/11/2026 de 09h30 à 17h00 (inscription obligatoire) voir https://www.istc.fr/jpo | "
                     "du 12/01/2027 au 15/01/2027 de 10h00 à 16h00 | texte illisible")
        self.assertEqual(j[0], {"debut": "2026-11-28", "fin": "2026-11-28", "lien": "https://www.istc.fr/jpo",
                                "texte": "le 28/11/2026 de 09h30 à 17h00 (inscription obligatoire)"})
        self.assertEqual((j[1]["debut"], j[1]["fin"], j[1]["lien"]), ("2027-01-12", "2027-01-15", None))
        self.assertEqual(len(j), 2)  # l'illisible est ignoré

    def test_un_etablissement_sans_date_n_apparait_pas(self):
        lignes = [{"code UAI": "0670001A", "journées portes ouvertes": "le 06/02/2027"},
                  {"code UAI": "0670002B", "journées portes ouvertes": ""}]
        self.assertEqual(list(construire(lignes)), ["0670001A"])


if __name__ == "__main__":
    unittest.main()
