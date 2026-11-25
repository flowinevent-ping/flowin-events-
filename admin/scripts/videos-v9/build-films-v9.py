#!/usr/bin/env python3
"""Assemble films-v9.html (25/11/2026) : scenes a personnages des films v4 (Alex, Lea, Max, Sam), recalees sur la voix off v9 (timing/*.json),
legendes reecrites sur le texte de la voix (docs/ARGUMENTAIRE-flowin-event.md, dictee du 25/11).
Usage : python3 build-films-v9.py   (lit ../../public/videos/scenes/films-v4.html, ecrit films-v9.html a cote)"""
import json, os, re
HERE=os.path.dirname(os.path.abspath(__file__))
SC=os.path.join(HERE,'..','..','public','videos','scenes')
src=open(os.path.join(SC,'films-v4.html'),encoding='utf-8').read()
L=src.split('\n')
# scenes de v4 : (film, n) -> texte source
scenes={}; film=None; n=0; cur=None
for i,l in enumerate(L[277:426]):
    m=re.match(r"if\(FILM==='(f\d)'\)\{",l)
    if m: film=m.group(1); n=0; cur=None; continue
    if l.startswith(' scene('):
        n+=1; cur=(film,n); scenes[cur]=[l]
    elif l=='}': cur=None
    elif cur: scenes[cur].append(l)
scenes={k:'\n'.join(v) for k,v in scenes.items()}
LEAD=0.2
def js(s): return "'"+s.replace('\\','\\\\').replace("'","\\'")+"'"
CAP=re.compile(r"cap\('((?:[^'\\]|\\.)*)'(?:,'((?:[^'\\]|\\.)*)'(?:,'((?:[^'\\]|\\.)*)')?)?\)")
def adapt(code,head=None,sub=None):
    if head is not None or sub is not None:
        m=CAP.search(code)
        if m:
            h=js(head) if head is not None else "'"+m.group(1)+"'"
            s=js(sub) if sub is not None else ("'"+(m.group(2) or '')+"'")
            code=code[:m.start()]+'cap('+h+','+s+')'+code[m.end():]
    return code
SPECIAL={}
# scene sur mesure : partenaires mis a l'honneur (logos generiques, aucun nom reel)
SPECIAL['honneur']=""" scene(3,function(){var h='',p=[[40,330],[200,330],[360,330],[40,470],[200,470],[360,470]];for(var i=0;i<6;i++)h+=A(p[i][0],p[i][1],'<div class="card" style="width:140px;padding:18px 6px;text-align:center;border:3px solid #FF8A14"><div style="font-weight:900;font-size:20px;color:#1B3A5C">Logo</div><div class="ex">commerce partenaire</div></div>','opacity:0" data-in="'+(.3+i*.28));
   return cap('Ils vous mettent en avant. <em>Vous les mettez à l\\'honneur.</em>')+h+C('sam','sam','deuxbras','joie',170,190,640);},function(t,el){bob($(el,'#sam'),t);});"""
PLAN={
 'a-com':('v9acom',[
  ('b01',(1,1),'f1-1','Bienvenue sur <em>Flowin.</em>','L\'animation de votre commerce.'),
  ('b02',(1,1),'f1-7','Mieux connaître <em>votre clientèle.</em>',None),
  ('b03',(1,1),'f1-10',None,None),
  ('b04',(1,1),'f1-4','Captez <em>le flux des passants.</em>',''),
  ('b05',(1,1),'f1-12',None,None),
  ('b06',(0,.5),'f1-8',None,None),('b06',(.5,1),'f1-9',None,None),
  ('b07',(1,1),'f1-6','Ils jouent, ils reviennent, <em>ils font parler de vous.</em>',''),
  ('b08',(0,0),'f1-13',None,None),('b08',(1,1),'f1-11','100 % <em>automatisée.</em>','Vous choisissez, Flowin s\'occupe du reste.'),
  ('b09',(1,1),'f1-15','FIN:Flowin, l\'animation plug and play.',None)]),
 'a-part':('v9apart',[
  ('b01',(1,1),'f2-7','Chez tes commerçants : <em>promotions et jeux.</em>',''),
  ('b02',(1,1),'f2-1','Une occasion <em>de jouer.</em>',''),
  ('b03',(1,1),'f2-4','Une occasion <em>de gagner.</em>',''),
  ('b04',(1,1),'f2-2','Mieux connaître <em>ton commerce de proximité.</em>',''),
  ('b05',(1,1),'f1-6','Flashe le QR code, <em>et joue.</em>',''),
  ('b06',(1,1),'f2-3',None,None),
  ('b07',(1,1),'f2-5','Offre ton lot <em>à un ami.</em>',''),
  ('b08',(1,1),'f1-12','Retrouve les commerces <em>sur la carte.</em>',''),
  ('b09',(1,1),'f2-8',None,None)]),
 'se-part':('v9separt',[
  ('b01',(1,1),'f5-1','Tu connais Flowin ? <em>Tu le retrouves dans ton commerce.</em>',''),
  ('b02',(1,1),'f5-5','Retrouve-le <em>à ton festival.</em>',''),
  ('b03',(0,0),'f5-2','Viens remporter des lots, <em>chez ton commerçant.</em>',''),('b03',(1,1),'f5-7','Et d\'autres lots <em>pendant le festival.</em>',''),
  ('b04',(1,1),'f5-3','Flashe, <em>joue.</em>',None),
  ('b05',(1,1),'f5-4',None,None),
  ('b06',(1,1),'f5-6','Quiz : <em>découvre les stations jeux.</em>',''),
  ('b07',(1,1),'f5-8','Plus tu joues, <em>plus tu cumules de tickets.</em>',''),
  ('b08',(1,1),'f5-9','Partage <em>avec tes potes.</em>',''),
  ('b09',(1,1),'f5-10',None,None)]),
 'se-org':('v9seorg',[
  ('b01',(1,1),'f3-1','Rayonnez en local : <em>avant, pendant, après.</em>',''),
  ('b02',(0,0),'f3-2','Avant : <em>votre événement est diffusé.</em>'),
  ('b02',(1,1),'f3-6','Avant : <em>faites-les gagner des places, des goodies.</em>',''),
  ('b03',(1,1),'f3-7','Pendant : <em>mesurez le trafic.</em>',''),
  ('b04',(1,1),'f3-5','D\'où viennent-ils ? <em>Comment vous ont-ils connu ?</em>',''),
  ('b05',(1,1),'f3-10','Connaissez mieux vos participants. <em>Gardez le contact.</em>',''),
  ('b06',(1,1),'f3-9','Des chiffres utiles : <em>RSE, éthique, mobilité.</em>',None),
  ('b07',(1,1),'f3-4','Comment ça marche ? <em>Un parcours, des stations jeux.</em>',''),
  ('b08',(1,1),'f3-3','Diffusé <em>avant, pendant, après.</em>','Dans le réseau des commerces participants.'),
  ('b09',(1,1),'honneur',None,None),
  ('b10',(1,1),'f3-14','FIN:Flowin, l\'animation plug and play.',None)])}
# normalise les entrees a 5 elements
def norm(e):
    e=list(e)+[None]*(5-len(e)); return e
code=[];SE_NAMES=[];CIBS={'v9acom':'Pour les commerçants','v9apart':'Pour les participants','v9separt':'Pour les participants','v9seorg':'Pour les organisateurs'}
for fid,(fname,entries) in PLAN.items():
    T=json.load(open(os.path.join(HERE,'timing',fid+'.json')))
    B0={};acc=0.0
    for k in T['keys']: B0[k]=acc; acc+=T['d'][k]
    # decoupe : sentences (a,b) ; (0,.5) = fractions du bloc
    blocs={}
    for e in entries: blocs.setdefault(e[0],[]).append(e)
    body=[];times=[]
    for e in entries:
        k,rng,srcid,head,sub=norm(e)
        b0=B0[k];D=T['d'][k];c=T['c'][k];nS=len(c)
        # une entree est une phrase (0 / 1 pour 2 phrases) ou une fraction
        multi=len([x for x in blocs[k]])>1
        if rng in((0,0),(1,1)) and nS==1 and rng==(1,1) and not multi: a,b=b0,b0+D
        elif rng==(0,.5) or rng==(.5,1): a,b=b0+rng[0]*D,b0+rng[1]*D
        else:
            i=0 if rng==(0,0) else 1
            if nS==1: a,b=b0,b0+D
            else:
                a=b0 if i==0 else b0+LEAD+c[i]-0.15
                b=(b0+D) if i==nS-1 else b0+LEAD+c[i+1]-0.15
            if len(blocs[k])==1: a,b=b0,b0+D
        # bloc a 2 phrases mais une seule entree : tout le bloc
        times.append((round(a,3),round(b,3)))
        if srcid in SPECIAL: body.append(SPECIAL[srcid])
        else:
            f,n=srcid.split('-');txt=scenes[(f,int(n))]
            fin=isinstance(head,str) and head.startswith('FIN:')
            if fin:
                nsub=head[4:]
                txt=re.sub(r"(fin\('(?:[^'\\]|\\.)*',)'(?:[^'\\]|\\.)*'",lambda m:m.group(1)+js(nsub),txt,count=1)
            else: txt=adapt(txt,head,sub)
            if srcid=='f3-7':  # pas de chiffre : jauge a la place du compteur « exemple »
                txt=txt.replace('<div class="big" style="color:#C2410C" id="n">0</div>','<div class="bar"><i class="bb" id="n" style="width:0"></i></div>')
                txt=txt.replace("$(el,'#n').textContent=Math.round(1240*eo(win(t,.4,2.6))).toLocaleString('fr-FR');","$(el,'#n').style.width=(72*eo(win(t,.4,2.6)))+'%';")
            body.append(txt)
    # enchainement continu : chaque plan finit ou commence le suivant
    for i in range(len(times)-1): times[i]=(times[i][0],times[i+1][0])
    SE_NAMES.append((fname,fid))
    code.append("if(FILM==='%s'){\n%s\n window.V9T=%s;}"%(fname,'\n'.join(body),json.dumps(times)))
blk='\n'.join(code)
blk+="""
if(window.V9T){for(var i9=0;i9<S.length;i9++){S[i9].a=V9T[i9][0];S[i9].b=V9T[i9][1];S[i9].d=S[i9].b-S[i9].a;}}
"""
out=src
out=out.replace("/* ================= MOTEUR ================= */", blk+"\n/* ================= MOTEUR ================= */",1)
out=out.replace("var SE=FILM==='f3'","var SE=FILM==='v9separt'||FILM==='v9seorg'||FILM==='f3'",1)
out=out.replace("if(V6){}else if(COURT){","if(V6||window.V9T){}else if(COURT){",1)
out=out.replace("if(COURTS[FILM])for(","if(COURTS[FILM]&&!window.V9T)for(",1)
out=out.replace("var CIB={","var CIB={"+','.join("%s:'%s'"%(k,v) for k,v in CIBS.items())+",",1)
# vitesse et fin : v=1, d0=d
out=out.replace("if(window.V9T){for(var i9","if(window.V9T){for(var i9",1)
out=out.replace("window.DUREE=S.length?S[S.length-1].b:0;","if(window.V9T){for(var j9=0;j9<S.length;j9++){S[j9].v=1;S[j9].d0=S[j9].d;}}\nwindow.DUREE=S.length?S[S.length-1].b:0;",1)
open(os.path.join(SC,'films-v9.html'),'w',encoding='utf-8').write(out)
print('ecrit films-v9.html',len(out))
for fid,(fname,_) in PLAN.items(): print(fname,'scenes OK')
