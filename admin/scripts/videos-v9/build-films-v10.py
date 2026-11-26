#!/usr/bin/env python3
"""Assemble films-v10.html (26/11/2026, scenarios valides par Romain : docs/SCENARIOS-videos-v10-2026-11-26.md)
Base : films-v9 (25/11/2026) : scenes a personnages des films v4 (Alex, Lea, Max, Sam), recalees sur la voix off v9 (timing/*.json),
legendes reecrites sur le texte de la voix (docs/ARGUMENTAIRE-flowin-event.md, dictee du 25/11).
Usage : python3 build-films-v10.py   (lit ../../public/videos/scenes/films-v4.html, ecrit films-v10.html a cote)"""
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
SPECIAL['honneur']=""" scene(3,function(){var h='',p=[[40,330],[200,330],[360,330],[40,470],[200,470],[360,470]];for(var i=0;i<6;i++)h+=A(p[i][0],p[i][1],'<div class="card" style="width:140px;padding:18px 6px;text-align:center;border:3px solid #FF8A14"><div style="font-weight:900;font-size:20px;color:#1B3A5C">Logo</div><div class="ex">commerce partenaire</div></div>','opacity:0" data-in="'+(.3+i*.28));
   return cap('Ils vous mettent en avant. <em>Vous les mettez à l\\'honneur.</em>')+h+C('sam','sam','deuxbras','joie',170,190,640);},function(t,el){bob($(el,'#sam'),t);});"""
SPECIAL['retour']=""" scene(3,function(){return cap('Et elle <em>revient.</em>','','Le lendemain')+sol()+A(30,350,boutique(480))+C('lea','lea','debout','sourire',170,560,540);},
  function(t,el){var l=$(el,'#lea');walk(l,t,560,300,.2,1.8);repose(l,'lea',t>1.9?'joie':'debout',t>1.9?'joie':'sourire',{w:170,regard:-6});});"""
SPECIAL['festival']=""" scene(3,function(){var h='',x=[70,215,360],c=['#FF8A14','#FFC21A','#C2410C'];for(var i=0;i<3;i++)h+=A(x[i],330+i*12,cadeau('g'+i,72+i*6,c[i]),'opacity:0" data-in="'+(.8+i*.4));
   return cap('Retrouve-le <em>à ton festival.</em>')+A(30,300,sceneSE())+A(0,600,'<div style="width:540px;height:360px;background:#0A1426"></div>')+A(30,790,foule(9,480))+h;},function(t,el){fouleAnim(el,t);});"""
SPECIAL['duel']=""" scene(3,function(){return cap('Challenge <em>tes potes.</em>')+sol(true)+C('lea','lea','telephone','joie',170,30,590)+C('max','max','telephone','sourire',170,340,590)+A(100,330,'<div class="card" style="width:340px;padding:18px"><div style="display:flex;justify-content:space-between"><b style="font-size:22px">Défi</b><span class="ex">exemple</span></div><div style="margin-top:12px;font-weight:800">Léa</div><div class="bar"><i class="bb" id="d1" style="width:0"></i></div><div style="margin-top:10px;font-weight:800">Max</div><div class="bar"><i class="bb" id="d2" style="width:0"></i></div></div>');},
  function(t,el){bob($(el,'#lea'),t);bob($(el,'#max'),t,2);$(el,'#d1').style.width=(78*eo(win(t,.3,2.2)))+'%';$(el,'#d2').style.width=(62*eo(win(t,.5,2.2)))+'%';});"""
SPECIAL['origine']=""" scene(3,function(){var s=['Affiche','Réseaux sociaux','Commerce','Bouche à oreille'],h='';for(var i=0;i<4;i++)h+=A(40,330+i*118,'<div class="card" style="width:460px;padding:16px 20px"><div style="display:flex;justify-content:space-between;font-weight:900;font-size:22px"><span>'+s[i]+'</span><span class="ex">exemple</span></div><div class="bar"><i class="bb" id="o'+i+'" style="width:0"></i></div></div>','opacity:0" data-in="'+(.2+i*.3));
   return cap('D\\'où viennent-ils ? <em>Comment vous ont-ils connu ?</em>')+h;},function(t,el){var w=[70,45,58,30];for(var i=0;i<4;i++)$(el,'#o'+i).style.width=(w[i]*eo(win(t,.6+i*.25,2.4)))+'%';});"""
SPECIAL['parcours']=""" scene(3,function(){var st=['Un parcours','Des questions','Des stations jeux'],h='';for(var i=0;i<3;i++)h+=A(40,340+i*150,'<div class="card" style="width:460px;display:flex;align-items:center;gap:16px;padding:18px"><div style="width:48px;height:48px;border-radius:99px;background:#FF8A14;color:#0E1B30;font-weight:900;font-size:26px;display:grid;place-items:center">'+(i+1)+'</div><b style="font-size:26px">'+st[i]+'</b>'+(i===2?'<div style="margin-left:auto">'+qrMini(54)+'</div>':'')+'</div>','opacity:0" data-in="'+(1.0+i*.9));
   return cap('Comment ça marche ? <em>Un parcours, des stations jeux.</em>')+h;},function(t,el){});"""
PLAN={
 'a-part':('v10apart',[
  ('b01',(1,1),'f2-7','Chez tes commerçants : <em>promotions et jeux.</em>',''),
  ('b02',(0,.62),'f2-1','Une occasion <em>de jouer.</em>',''),('b02',(.62,1),'f2-4','Une occasion <em>de gagner.</em>',''),
  ('b03',(1,1),'f2-2','Mieux connaître <em>ton commerce de proximité.</em>',''),
  ('b04',(0,.5),'f1-6','Scan, <em>joue.</em>',''),('b04',(.5,1),'f2-5','Entre amis <em>ou en famille.</em>',''),
  ('b05',(0,0),'f1-7','Teste tes connaissances <em>sur le quiz.</em>',''),('b05',(1,1),'f1-8','Remporte <em>les lots.</em>',''),
  ('b06',(1,1),'f2-3',None,None),
  ('b07',(1,1),'f1-12','Découvre la carte. <em>Rends-toi dans les commerces participants.</em>',''),
  ('b08',(1,1),'f2-8','FIN2:Suis <b>le flow.</b>|Découvre ce que tu gagnes.',None)]),
 'a-com':('v10acom',[
  ('b01',(0,0),'f1-1','Un commerce, <em>un fichier client ?</em>',''),('b01',(1,1),'f1-5','Faites-le <em>grandir.</em>',''),
  ('b02',(1,1),'f1-4','Captez <em>le flux.</em>',''),
  ('b03',(0,.6),'f1-13','Vous choisissez <em>le jeu.</em>',''),('b03',(.6,1),'f1-6','Quiz, tombola, <em>roue de la fortune.</em>',''),
  ('b04',(1,1),'f1-7','Animez-les. <em>Mieux les connaître.</em>',''),
  ('b05',(1,1),'f1-14','Simple à installer. <em>Renforce votre image de marque.</em>',''),
  ('b06',(0,.5),'f1-8','Mettez des lots <em>en jeu.</em>',''),('b06',(.5,1),'retour',None,None),
  ('b07',(1,1),'f1-9','Ils parlent de vous. <em>Ils offrent leurs lots.</em>',''),
  ('b08',('s',0),'f1-12','Sur la carte, <em>avec les autres commerces.</em>',''),('b08',('s',1),'flash','Offres flash : <em>les clients participent.</em>',''),('b08',('s',2),'f1-4','Ils viennent chez vous, <em>en parlent autour d\'eux.</em>',''),
  ('b09',(1,1),'f1-11','Automatisée. <em>Plus de visibilité.</em>',''),
  ('b10',(1,1),'f1-15','FIN:Flowin, l\'animation jeu plug and play.',None)]),
 'se-part':('v10separt',[
  ('b01',(0,0),'f5-1','Tu connais <em>Flowin ?</em>',''),('b01',(1,1),'f5-2','Tu l\'as déjà <em>chez ton commerçant.</em>',''),
  ('b02',(1,1),'festival',None,None),
  ('b03',(0,0),'f5-6','Les stations-jeux <em>de la ville.</em>','Dans les commerces et dans le festival.'),('b03',(1,1),'f5-5','Des cadeaux à gagner, <em>des places.</em>',''),
  ('b04',(0,.5),'f5-3','Scan, <em>joue.</em>',''),('b04',(.5,1),'f5-9','Entre amis <em>ou en famille.</em>',''),
  ('b05',(0,0),'f3-5','Teste tes connaissances <em>sur le quiz.</em>',''),('b05',(1,1),'duel',None,None),
  ('b06',(0,0),'f5-7','Remporte <em>les lots.</em>',''),('b06',(1,1),'f5-4','Gagne tes tickets : <em>grand tirage ou gain immédiat.</em>',''),
  ('b07',(1,1),'f2-7','Découvre la carte. <em>Rends-toi dans les commerces participants.</em>',''),
  ('b08',(0,.6),'f5-6','Suis <em>le flow.</em>','Découvre ce que tu gagnes.'),('b08',(.6,1),'f5-10','FIN2:Suis <b>le flow.</b>|Découvre ce que tu gagnes.',None)]),
 'se-org':('v10seorg',[
  ('b01',(1,1),'f3-1','Rayonnez en local : <em>avant, pendant, après.</em>',''),
  ('b02',(0,0),'f3-2','Avant : <em>votre événement est diffusé.</em>'),
  ('b02',(1,1),'f3-6','Avant : <em>faites-les gagner des places, des goodies.</em>',''),
  ('b03',(1,1),'f3-7','Pendant : <em>mesurez le trafic.</em>',''),
  ('b04',(1,1),'origine',None,None),
  ('b05',(1,1),'f3-10','Connaissez mieux vos participants. <em>Gardez le contact.</em>',''),
  ('b06',(1,1),'f3-9','Des chiffres utiles : <em>RSE, éthique, mobilité.</em>',None),
  ('b07',(1,1),'parcours',None,None),
  ('b08',(1,1),'f3-3','Diffusé <em>avant, pendant, après.</em>','Dans le réseau des commerces participants.'),
  ('b09',(1,1),'honneur',None,None),
  ('b10',(1,1),'f3-14','FIN:Flowin, l\'animation jeu plug and play.',None)])}
# normalise les entrees a 5 elements
def norm(e):
    e=list(e)+[None]*(5-len(e)); return e
code=[];SE_NAMES=[];CIBS={'v10apart':'Pour les participants','v10acom':'Pour les commerçants','v10separt':'Pour les participants','v10seorg':'Pour les organisateurs'}
for fid,(fname,entries) in PLAN.items():
    T=json.load(open(os.path.join(HERE,'timing10',fid+'.json')))
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
        if isinstance(rng[0],str):  # ('s', i) ou ('s', i, j) : phrases i a j du bloc
            i=rng[1]; j=rng[-1]
            a=b0 if i==0 else b0+LEAD+c[i]-0.15
            b=(b0+D) if j==nS-1 else b0+LEAD+c[j+1]-0.15
        elif rng in((0,0),(1,1)) and nS==1 and rng==(1,1) and not multi: a,b=b0,b0+D
        elif rng not in ((0,0),(1,1)): a,b=b0+rng[0]*D,b0+rng[1]*D
        else:
            i=0 if rng==(0,0) else 1
            if nS==1: a,b=b0,b0+D
            else:
                a=b0 if i==0 else b0+LEAD+c[i]-0.15
                b=(b0+D) if i==nS-1 else b0+LEAD+c[i+1]-0.15
            if len(blocs[k])==1: a,b=b0,b0+D
        # bloc a 2 phrases mais une seule entree : tout le bloc
        times.append((round(a,3),round(b,3)))
        if srcid=='flash':
            t=adapt(scenes[('f1',12)],head,sub).replace("{}));},","{}))+A(250,470,'<div class=\"card\" style=\"padding:10px 18px;border:3px solid #FF8A14;font-weight:900;font-size:24px\">Offre flash</div>','opacity:0\" data-in=\"1.1');},",1); body.append(t)
        elif srcid in SPECIAL: body.append(SPECIAL[srcid])
        else:
            f,n=srcid.split('-');txt=scenes[(f,int(n))]
            if isinstance(head,str) and head.startswith('FIN2:'):
                big,nsub=head[5:].split('|')
                txt=re.sub(r"fin\('(?:[^'\\]|\\.)*','(?:[^'\\]|\\.)*'",lambda m:'fin('+js(big)+','+js(nsub),scenes[(f,int(n))],count=1)
                body.append(txt); continue
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
out=out.replace("var SE=FILM==='f3'","var SE=FILM==='v10separt'||FILM==='v10seorg'||FILM==='f3'",1)
out=out.replace("if(V6){}else if(COURT){","if(V6||window.V9T){}else if(COURT){",1)
out=out.replace("if(COURTS[FILM])for(","if(COURTS[FILM]&&!window.V9T)for(",1)
out=out.replace("var CIB={","var CIB={"+','.join("%s:'%s'"%(k,v) for k,v in CIBS.items())+",",1)
# vitesse et fin : v=1, d0=d
out=out.replace("if(window.V9T){for(var i9","if(window.V9T){for(var i9",1)
out=out.replace("window.DUREE=S.length?S[S.length-1].b:0;","if(window.V9T){for(var j9=0;j9<S.length;j9++){S[j9].v=1;S[j9].d0=S[j9].d;}}\nwindow.DUREE=S.length?S[S.length-1].b:0;",1)
open(os.path.join(SC,'films-v10.html'),'w',encoding='utf-8').write(out)
print('ecrit films-v10.html',len(out))
for fid,(fname,_) in PLAN.items(): print(fname,'scenes OK')
