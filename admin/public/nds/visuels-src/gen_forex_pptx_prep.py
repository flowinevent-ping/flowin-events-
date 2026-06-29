# -*- coding: utf-8 -*-
import os, json, sys
sys.path.insert(0, "/home/claude/vid")
import gen_forex as F

os.makedirs("/home/claude/vid/forex_plates", exist_ok=True)
def hexc(c): return "%02X%02X%02X" % (c[0], c[1], c[2])

manifest = {"page": {"px": F.W, "dpi": 127}, "stations": {}}
F._PLATE = True
for sid, lbl, fn in F.JOBS:
    F._TEXTLOG = []
    # rends la plate (sans textes ct), mais on doit forcer OUT plate path
    img = F.make_bg()
    # re-exécute la routine forex en mode plate
    p = F.forex(sid, lbl, fn)   # _PLATE=True -> écrit plate_<fn>.png dans OUT
    texts = [{"text": t[0], "cx": t[1], "cy": t[2], "size_px": t[3],
              "hex": hexc(t[4]), "weight": t[5]} for t in F._TEXTLOG]
    plate_src = f"{F.OUT}/plate_{fn}.png"
    plate_dst = f"/home/claude/vid/forex_plates/plate_{fn}.png"
    os.replace(plate_src, plate_dst)
    manifest["stations"][fn] = {"label": lbl, "plate": plate_dst, "texts": texts}
    print("PLATE", fn, "texts:", len(texts))

with open("/home/claude/vid/manifest_forex.json", "w") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=1)
print("MANIFEST_OK", list(manifest["stations"].keys()))
