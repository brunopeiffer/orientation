"""Lecteur .xlsx minimal (bibliothèque standard uniquement) : renvoie les lignes d'une feuille."""
import re
import zipfile
import xml.etree.ElementTree as ET

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
T = "{%s}t" % NS["m"]


def _texte(el):
    return "".join(t.text or "" for t in el.iter(T))


def _col(ref):
    n = 0
    for ch in re.match(r"[A-Z]+", ref).group():
        n = n * 26 + ord(ch) - 64
    return n - 1


def lignes(chemin, feuille=0):
    """Liste de lignes (listes de chaînes nettoyées) de la feuille d'index `feuille`."""
    z = zipfile.ZipFile(chemin)
    partages = []
    if "xl/sharedStrings.xml" in z.namelist():
        partages = [_texte(si) for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS)]
    feuilles = sorted(n for n in z.namelist() if re.fullmatch(r"xl/worksheets/sheet\d+\.xml", n))
    sortie = []
    for row in ET.fromstring(z.read(feuilles[feuille])).iter("{%s}row" % NS["m"]):
        cellules = {}
        for c in row.findall("m:c", NS):
            v, inline = c.find("m:v", NS), c.find("m:is", NS)
            if c.get("t") == "s" and v is not None:
                val = partages[int(v.text)]
            elif v is not None:
                val = v.text or ""
            elif inline is not None:
                val = _texte(inline)
            else:
                val = ""
            cellules[_col(c.get("r"))] = val.strip()
        if cellules:
            sortie.append([cellules.get(i, "") for i in range(max(cellules) + 1)])
    return sortie
