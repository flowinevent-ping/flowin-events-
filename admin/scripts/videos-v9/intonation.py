import numpy as np, parselmouth
from parselmouth.praat import call
def expanser(src,dst,k=1.4):
    """Amplifie les variations de hauteur (demi-tons autour de la mediane de la phrase) d'un facteur k ; duree et timbre inchanges (PSOLA)."""
    s=parselmouth.Sound(src); m=call(s,"To Manipulation",0.01,75,500)
    pt=call(m,"Extract pitch tier"); n=call(pt,"Get number of points")
    if n<5: s.save(dst,'WAV'); return
    ts=[call(pt,"Get time from index",i) for i in range(1,n+1)]; fs=np.array([call(pt,"Get value at index",i) for i in range(1,n+1)])
    med=float(np.median(fs)); new=med*2**(k*np.log2(fs/med))
    npt=call("Create PitchTier","n",s.xmin,s.xmax)
    for t,f in zip(ts,new): call(npt,"Add point",t,float(f))
    call([m,npt],"Replace pitch tier")
    call(m,"Get resynthesis (overlap-add)").save(dst,'WAV')
