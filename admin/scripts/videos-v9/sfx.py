# Effets sonores synthetises (libres de droits) cales sur la video « Le jeu du quartier ».
import numpy as np, wave, json, sys
sr=48000
q=json.load(open(sys.argv[1])); D=q['D']; C=q['C']; dur=sum(D); n=int(sr*dur); out=np.zeros(n)
T0=[sum(D[:i]) for i in range(len(D))]
rng=np.random.default_rng(7)
def add(sig,at,g=1.0):
    s=int(at*sr); 
    if s<0: sig=sig[-s:]; s=0
    e=min(n,s+len(sig)); out[s:e]+=sig[:e-s]*g
def lp(x,a):
    y=np.zeros_like(x); acc=0.0
    for i in range(len(x)): acc+=a*(x[i]-acc); y[i]=acc
    return y
def whoosh(L=.45):
    m=int(L*sr); x=np.arange(m)/sr; nz=rng.uniform(-1,1,m)
    a=np.linspace(.02,.5,m)  # filtre qui s'ouvre
    y=np.zeros(m); acc=0
    for i in range(m): acc+=a[i]*(nz[i]-acc); y[i]=acc
    return y*np.sin(np.pi*x/L)**2*1.6
def impact():
    m=int(.5*sr); x=np.arange(m)/sr; f=40+90*np.exp(-x*25)
    return np.sin(2*np.pi*np.cumsum(f)/sr)*np.exp(-x*6)*1.0+lp(rng.uniform(-1,1,m),.3)*np.exp(-x*30)*.8
def ding(f=1320):
    m=int(.8*sr); x=np.arange(m)/sr
    return (np.sin(2*np.pi*f*x)+.5*np.sin(2*np.pi*f*1.5*x)+.3*np.sin(2*np.pi*f*2*x))*np.exp(-x*5)*.35
def coin():
    m=int(.35*sr); x=np.arange(m)/sr; f=np.where(x<.08,988,1319)
    return np.sign(np.sin(2*np.pi*np.cumsum(f)/sr))*np.exp(-x*8)*.18
def pop():
    m=int(.12*sr); x=np.arange(m)/sr
    return np.sin(2*np.pi*(600-3000*x)*x)*np.exp(-x*40)*.5
def ticks(L=1.2):
    m=int(L*sr); y=np.zeros(m); t=0; gap=.03
    while t<L:
        s=int(t*sr); k=min(m,s+int(.008*sr)); y[s:k]+=rng.uniform(-1,1,k-s)*.6; t+=gap; gap*=1.07
    return y
def riser(L=1.0):
    m=int(L*sr); x=np.arange(m)/sr
    return np.sin(2*np.pi*(200*x+400*x*x/L))*(x/L)**2*.25+lp(rng.uniform(-1,1,m),.2)*(x/L)**2*.4
# whoosh avant chaque coupe, impact a chaque debut de plan
for i,t0 in enumerate(T0):
    if i>0: add(whoosh(),t0-.32,.7)
    add(impact(),t0+.02,.9)
# plan 1 : titre « le jeu du quartier »
add(impact(),T0[0]+1.35,.8); add(ding(1568),T0[0]+1.4,.8)
# plan 2 : nouveau ! + boutiques qui tombent
add(ding(1760),T0[1]+.2,.7)
for i in range(4): add(pop(),T0[1]+.8+i*.12+.3,.8)
# plan 3 : scannez jouez gagnez
for c in C[2]: add(impact(),T0[2]+c,.9)
add(coin(),T0[2]+C[2][2]+.1,1.0)
# plan 4 : riser vers les jeux
add(riser(1.0),T0[4]-1.0,.8)
# plan 5 : jeux
for c in C[4][:3]: add(impact(),T0[4]+c,.7)
add(ding(1320),T0[4]+C[4][0]+.5,.6)          # bonne reponse quiz
add(ticks(1.1),T0[4]+C[4][2]+.05,.7)          # roue
add(impact(),T0[4]+C[4][3],.9); add(ding(1760),T0[4]+C[4][3]+.9,.6)
# plan 6 : +1 contacts puis 56 %
for i in range(6): add(coin(),T0[5]+.5+i*.25,.7)
add(riser(.8),T0[5]+C[5][1]-.8,.7); add(impact(),T0[5]+C[5][1],1.0); add(ding(1568),T0[5]+C[5][1]+1.4,.6)
# plan 7 : offre flash
add(ding(2093),T0[6]+1.3,.6)
# plan 8 : cadeau + confettis + rejoignez
add(pop(),T0[7]+.9,1.0)
for i in range(10): add(pop(),T0[7]+1.0+i*.07,.4)
add(impact(),T0[7]+C[7][1],.9)
# plan 9 : fin
add(ding(1047),T0[8]+.2,.6); add(ding(1568),T0[8]+.75,.6)
out/=np.max(np.abs(out))+1e-9; out*=.9
w=wave.open(sys.argv[2],'w'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((out*32767).astype(np.int16).tobytes()); w.close(); print('sfx ok')
