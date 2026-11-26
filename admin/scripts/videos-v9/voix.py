#!/usr/bin/env python3
"""Voix off v9 (25/11/2026). edge-tts fr-FR-VivienneMultilingualNeural, rate -3 %, pitch +0 Hz, rendue phrase par phrase.
Usage : SSL_CERT_FILE=/root/.ccr/ca-bundle.crt python3 voix.py <film> <dossier_sortie>
Sortie : <dossier>/<film>/bNN.wav, voix.wav (mixage), timing.json {keys, d, c, total}."""
import asyncio, json, os, re, subprocess, sys, wave, edge_tts
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from intonation import expanser
RATE=os.environ.get("RATE","-3%"); PITCH="+2Hz"; K_INTO=1.25; VOICE="fr-FR-VivienneMultilingualNeural"
PAUSE_PHRASE=0.40; PAUSE_SIGN=0.42; GLUE=0.04; LEAD=0.20; TAIL=0.45; FIN=1.6
film=sys.argv[1]; out=os.path.join(sys.argv[2],film); os.makedirs(out,exist_ok=True)
S=json.load(open(os.path.join(os.path.dirname(__file__),os.environ.get('SCRIPTS','scripts.json'))))[film]
def sh(*a): subprocess.run(a,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
def dur(p):
    w=wave.open(p); d=w.getnframes()/w.getframerate(); w.close(); return d
async def tts(txt,mp3):
    c=edge_tts.Communicate(txt,VOICE,rate=RATE,pitch=PITCH,proxy=os.environ.get('HTTPS_PROXY'))
    await c.save(mp3)
def seg(txt,name):
    mp3=os.path.join(out,name+'.mp3'); wav=os.path.join(out,name+'.wav')
    asyncio.run(tts(txt,mp3))
    # silences de bord coupes
    sh('ffmpeg','-y','-i',mp3,'-ar','48000','-ac','1','-af','silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse',wav)
    exp=wav[:-4]+'_i.wav'; expanser(wav,exp,K_INTO); os.replace(exp,wav)  # intonation amplifiee (x1,5)
    return wav
def silence(sec,name):
    p=os.path.join(out,name+'.wav'); sh('ffmpeg','-y','-f','lavfi','-i','anullsrc=r=48000:cl=mono','-t',str(sec),p); return p
def concat(parts,dst):
    lst=os.path.join(out,'l.txt'); open(lst,'w').write(''.join("file '%s'\n"%os.path.abspath(p) for p in parts))
    sh('ffmpeg','-y','-f','concat','-safe','0','-i',lst,'-ar','48000','-ac','1',dst)
keys=[];D={};C={}
for bi,(k,phrases) in enumerate(S['blocs']):
    parts=[];cues=[];t=0.0
    for pi,ph in enumerate(phrases):
        cues.append(round(t,3))
        subs=[x for s0 in ph.split('~~') for x in re.split(r'(Flow in\s*[,.:;?!]?)',s0) if re.search(r'\w',x)]; sp=[]  # « Flow in » rendu a part : lecture anglaise

        for si,s in enumerate(subs):
            w=seg(s,'%s_p%d_%d'%(k,pi,si)); sp.append(w)
            if si<len(subs)-1: sp.append(silence(GLUE,'g%s%d%d'%(k,pi,si)))
        for w in sp: t+=dur(w)
        parts+=sp
        if pi<len(phrases)-1:
            ps=silence(PAUSE_SIGN if bi==len(S['blocs'])-1 else PAUSE_PHRASE,'ps%s%d'%(k,pi)); parts.append(ps); t+=dur(ps)
    wav=os.path.join(out,k+'.wav'); concat(parts,wav)
    v=dur(wav); keys.append(k); C[k]=cues
    D[k]=round(LEAD+v+(FIN if bi==len(S['blocs'])-1 else TAIL),3)
# mixage : chaque bloc commence LEAD apres le debut de son plan
parts=[]
for bi,k in enumerate(keys):
    v=dur(os.path.join(out,k+'.wav')); parts.append(silence(LEAD,'lead'+k)); parts.append(os.path.join(out,k+'.wav'))
    parts.append(silence(D[k]-LEAD-v,'tail'+k))
raw=os.path.join(out,'brut.wav'); concat(parts,raw)
chain="highpass=f=70,equalizer=f=180:t=q:w=1:g=2.5,equalizer=f=3200:t=q:w=1:g=-1.5,equalizer=f=9000:t=q:w=1:g=1,aecho=0.8:0.88:12:0.05,acompressor=threshold=-20dB:ratio=2.5:attack=20:release=250"
import re
r=subprocess.run(['ffmpeg','-y','-i',raw,'-af',chain+',loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True).stderr
m=json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}',r,re.S).group(0))
ln="loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=%s:measured_TP=%s:measured_LRA=%s:measured_thresh=%s:offset=%s:linear=true"%(m['input_i'],m['input_tp'],m['input_lra'],m['input_thresh'],m['target_offset'])
sh('ffmpeg','-y','-i',raw,'-af',chain+','+ln,'-ar','48000','-ac','1',os.path.join(out,'voix.wav'))
total=round(sum(D.values()),3)
json.dump({'keys':keys,'d':D,'c':C,'total':total},open(os.path.join(out,'timing.json'),'w'),indent=1)
print(film,'ok',total,'s')
