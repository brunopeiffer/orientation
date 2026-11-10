import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from fiches_rome import construire, missions  # noqa: E402

DEF = ("L'Assistant de contrôle budgétaire participe à la gestion financière d'une entreprise. Assure le suivi des "
       "budgets pour optimiser les coûts Participe à l'élaboration des prévisions budgétaires Réalise des rapports")
FICHE = {"rome": {"code_rome": "M1222"}, "definition": DEF, "acces_metier": "Bac +3 à Bac +5. ",
         "contextes_travail": [{"libelle": "Statut d'emploi", "items": [{"libelle": "CDI"}]},
                               {"libelle": "Horaires et durée du travail", "items": [{"libelle": "Travail en journée"}]}],
         "mobilites": [{"rome_cible": "M1204 - Contrôleur / Contrôleuse de gestion", "ordre_mobilite": 2},
                       {"rome_cible": "M1203 - Comptable", "ordre_mobilite": 1}]}


class TestFichesRome(unittest.TestCase):
    def test_separe_l_introduction_et_les_missions(self):
        intro, actions = missions(DEF)
        self.assertEqual(intro, "L'Assistant de contrôle budgétaire participe à la gestion financière d'une entreprise.")
        self.assertEqual(actions, ["Assure le suivi des budgets pour optimiser les coûts",
                                   "Participe à l'élaboration des prévisions budgétaires", "Réalise des rapports"])

    def test_garde_les_codes_de_l_app_et_les_contextes_utiles(self):
        f = construire([FICHE, {**FICHE, "rome": {"code_rome": "Z9999"}}], {"M1222"})
        self.assertEqual(list(f), ["M1222"])
        self.assertEqual(f["M1222"]["contextes"], {"Horaires et durée du travail": ["Travail en journée"]})
        self.assertEqual(f["M1222"]["acces"], "Bac +3 à Bac +5.")
        self.assertEqual(f["M1222"]["mobilites"], ["M1203", "M1204"])  # dans l'ordre du ROME

    def test_echec_propre(self):
        self.assertRaises(SystemExit, construire, [FICHE], {"M1222", "M1203"})
        self.assertRaises(SystemExit, construire, [{"rome": {"code_rome": "M1222"}}], {"M1222"})


if __name__ == "__main__":
    unittest.main()
