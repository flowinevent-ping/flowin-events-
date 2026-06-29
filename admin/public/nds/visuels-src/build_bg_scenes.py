import os, sys; sys.path.insert(0,"/home/claude/vid")
import rk as R
KIT="/home/claude/vid/montage_kit"; SC=f"{KIT}/scenes_apercu"; BG=f"{KIT}/_bgframes"
os.makedirs(SC,exist_ok=True); os.makedirs(BG,exist_ok=True)
# fond anime seul (240 frames = 10s @24)
for i in range(240):
    R.make_bg(i/24.0).convert("RGB").save(f"{BG}/f{i:04d}.jpg", quality=92)
print("bg frames OK")
# apercus de scenes (composite SANS QR -> scene())
for nm,t in [("1-intro",1.7),("2-flash",3.7),("2-joue",5.2),("2-gagne",6.8),("3-billets",10.5),("4-stations",15.5),("5-cumule",20.5),("6-partenaires",27.0),("7-finale",33.0)]:
    R.scene(t).convert("RGB").save(f"{SC}/apercu-{nm}.jpg", quality=90)
print("scenes apercu OK")
