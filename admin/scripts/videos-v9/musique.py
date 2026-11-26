# Piste house 120 BPM synthetisee (libre de droits, faite ici) : kick 4/4, clap, hats, basse, accords en sidechain.
import numpy as np, wave, sys
sr=48000; bpm=120; beat=60/bpm; dur=float(sys.argv[2]); n=int(sr*dur); t=np.arange(n)/sr
out=np.zeros(n)
def env(x,a,d): return np.where(x<0,0,np.where(x<a,x/a,np.exp(-(x-a)/d)))
nb=int(dur/beat)+1
rng=np.random.default_rng(1)
noise=rng.uniform(-1,1,n)
kick=np.zeros(n); hat=np.zeros(n); clap=np.zeros(n); side=np.ones(n)
for b in range(nb):
    s=int(b*beat*sr)
    if s>=n: break
    L=min(n-s,int(.35*sr)); x=np.arange(L)/sr
    f=45+120*np.exp(-x*30); ph=2*np.pi*np.cumsum(f)/sr
    kick[s:s+L]+=np.sin(ph)*np.exp(-x*7)
    side[s:s+L]=np.minimum(side[s:s+L],0.25+0.75*(1-np.exp(-x*9)))
    if b%2==1:
        L2=min(n-s,int(.2*sr)); x2=np.arange(L2)/sr
        clap[s:s+L2]+=noise[s:s+L2]*np.exp(-x2*28)*0.6
    so=int((b+.5)*beat*sr)
    if so<n:
        L3=min(n-so,int(.12*sr)); x3=np.arange(L3)/sr
        hat[so:so+L3]+=np.diff(np.concatenate([[0],noise[so:so+L3]]))*np.exp(-x3*30)*0.35
# accords Am F C G, une mesure (4 temps) chacun
prog=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]]; bass=[45,41,36,43]
def mtof(m): return 440*2**((m-69)/12)
chords=np.zeros(n); bs=np.zeros(n)
bar=4*beat
for i in range(int(dur/bar)+1):
    s=int(i*bar*sr); e=min(n,int((i+1)*bar*sr))
    if s>=n: break
    x=np.arange(e-s)/sr; c=prog[i%4]
    # stabs sur les contretemps (rythme house)
    st=np.zeros(e-s)
    for k in range(8):
        if k in (1,3,4,6):
            o=int(k*beat/2*sr)
            if o<e-s:
                L=min(e-s-o,int(.22*sr)); st[o:o+L]=np.exp(-np.arange(L)/sr*9)
    for m in c:
        for det in (-0.08,0.08):
            fr=mtof(m+12)*(1+det/100)
            chords[s:e]+=(2*((x*fr)%1)-1)*st*0.12
    fb=mtof(bass[i%4])
    bs[s:e]+=np.sin(2*np.pi*fb*x)*0.5+0.15*np.sign(np.sin(2*np.pi*fb*x))
# filtre passe-bas simple sur les accords
def lp(sig,a):
    y=np.zeros_like(sig); acc=0
    for i in range(0,len(sig)):
        acc+=a*(sig[i]-acc); y[i]=acc
    return y
chords=lp(chords,0.18)
mix=0.9*kick+0.5*clap+hat+ (0.55*bs+chords)*side
# montee d'intro et fin
fade=np.clip(t/0.4,0,1)*np.clip((dur-t)/1.5,0,1)
mix*=fade
mix/=np.max(np.abs(mix))+1e-9; mix*=0.8
w=wave.open(sys.argv[1],'w'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((mix*32767).astype(np.int16).tobytes()); w.close()
print('ok',dur)
