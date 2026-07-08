/* MASTER Brigade Verte - questionnaire unique. Modifier ICI = met a jour brigade 1/2/3 en meme temps. */
(function(){
  var _s=document.createElement('style'); _s.textContent="\n  :root{\n    --purple:#7C2D92; --purple-deep:#5A1E6E;\n    --orange:#F5A100; --magenta:#E0218A; --magenta2:#8E2E9E;\n    --ink:#0a1020; --amber:#f4b544; --teal:#20e0c4; --violet:#964ee0;\n  }\n  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}\n  html,body{height:100%}\n  body{background:#0c0a12;font-family:'Manrope',system-ui,sans-serif;color:#fff;-webkit-font-smoothing:antialiased;min-height:100dvh;display:flex;flex-direction:column;align-items:center;padding:0}\n  .ic{display:inline-block;width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vertical-align:middle;flex-shrink:0}\n  .phone{position:relative;width:100%;max-width:480px;min-height:100dvh;background:#0c0a12;display:flex;flex-direction:column}\n  .scr{display:none;flex-direction:column;min-height:0}\n  .scr.on{display:flex}\n  .scr.purple{background:linear-gradient(180deg,#2a1036,#160820)}\n\n  /* ===== BARRE AGENT \u2014 une seule ligne, sobre ===== */\n  .agentbar{background:#0c0a12;border-bottom:1px solid rgba(255,255,255,.08);padding:11px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12.5px;color:rgba(255,255,255,.55)}\n  .agentbar b{color:#fff}\n  .counter{display:flex;align-items:center;gap:6px;background:rgba(22,163,74,.16);color:#4ade80;font-weight:800;padding:5px 11px;border-radius:20px;font-size:12px;white-space:nowrap;flex-shrink:0}\n\n  /* ===== ACCUEIL ===== */\n  .hero{background:#6e2785;padding:26px 22px 22px}\n  .htop{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:700;letter-spacing:.16em;color:#e7d4ef;text-transform:uppercase;margin-bottom:10px}\n  .hname{font-size:38px;line-height:1;font-weight:800;letter-spacing:-1.4px;color:#fff}\n  .hsub{font-size:14px;color:rgba(255,255,255,.75);margin-top:8px;line-height:1.5}\n  .stage{position:relative;background:linear-gradient(180deg,#6e2785 0%,#3a1450 45%,#160820 100%);padding:22px 0 26px;flex:1}\n  .prize{position:relative;z-index:1;margin:0 18px;border-radius:20px;background:rgba(20,8,22,.5);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.14);padding:17px 16px;box-shadow:0 16px 40px rgba(0,0,0,.3)}\n  .lbl{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.45);margin-bottom:12px}\n  .prow{display:flex;align-items:center;gap:13px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:12px 13px}\n  .sq{width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;background:linear-gradient(135deg,var(--purple),var(--magenta))}\n  .nm{font-weight:800;font-size:16px;line-height:1.25;color:#fff}\n  .btn{display:block;width:calc(100% - 36px);margin:22px 18px 6px;text-align:center;border:none;border-radius:50px;padding:17px;font-family:'Manrope';font-weight:800;font-size:18px;color:#fff;cursor:pointer;background:linear-gradient(90deg,var(--magenta2),var(--magenta));box-shadow:0 0 0 5px rgba(247,168,212,.4),0 12px 26px rgba(224,33,138,.32)}\n  .btn[disabled]{opacity:.35;pointer-events:none;box-shadow:none}\n  .foot{position:relative;z-index:1;color:#9a8fa6;text-align:center;font-size:12px;padding:10px 24px 8px}\n\n  /* ===== CADRE CHARTE CINEMATIQUE (questionnaire + formulaire) ===== */\n  .cine-scr{background:var(--ink);position:relative;overflow:hidden;flex:1;min-height:0}\n  .cine-scr::before{content:'';position:absolute;inset:0;background:\n      radial-gradient(circle at 15% 0%, rgba(150,78,224,.35), transparent 55%),\n      radial-gradient(circle at 90% 8%, rgba(230,24,127,.32), transparent 50%),\n      radial-gradient(circle at 15% 100%, rgba(32,224,196,.22), transparent 55%);\n    pointer-events:none}\n  .cine-scr>.pad{position:relative;z-index:1;flex:1;display:flex;flex-direction:column;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:20px 18px calc(24px + env(safe-area-inset-bottom))}\n  .dhead{display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-shrink:0}\n  .back{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;cursor:pointer}\n  .back .ic{width:18px;height:18px}\n  .dtitle{font-family:'Manrope';font-weight:800;font-size:19px;background:linear-gradient(90deg,var(--amber),var(--magenta) 55%,var(--teal));-webkit-background-clip:text;background-clip:text;color:transparent}\n  .dsub{font-size:12.5px;color:rgba(255,255,255,.5);margin-top:1px}\n  .progress{display:flex;gap:6px;margin-bottom:14px;flex-shrink:0}\n  .pstep{flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,.14)}\n  .pstep.on{background:linear-gradient(90deg,var(--amber),var(--magenta))}\n\n  /* cadre a bordure degradee (frame) */\n  .frame{position:relative;border-radius:20px;padding:1.5px;background:linear-gradient(135deg,var(--amber),var(--magenta) 50%,var(--teal));box-shadow:0 10px 30px rgba(0,0,0,.35);margin-bottom:14px;flex-shrink:0}\n  .frame-in{background:#12081f;border-radius:18.5px;padding:18px}\n  .qtxt{font-family:'Manrope';font-size:17.5px;font-weight:700;line-height:1.32;margin-bottom:16px;color:#fff}\n  .opt{display:block;width:100%;text-align:left;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.14);border-radius:14px;padding:13px 15px;color:#fff;font-size:14.5px;font-weight:600;font-family:inherit;margin-bottom:9px;cursor:pointer}\n  .opt.sel{border-color:var(--magenta);background:rgba(224,33,138,.18)}\n  .opt:last-child{margin-bottom:0}\n\n  /* ===== FORMULAIRE ===== */\n  .label{display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.45);margin-bottom:5px}\n  .input{width:100%;padding:13px 14px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.14);border-radius:13px;color:#fff;font-size:15px;font-weight:600;outline:none;font-family:inherit}\n  .input::placeholder{color:rgba(255,255,255,.32)}\n  select.input option{background:#12081f;color:#fff}\n  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}\n  .fld{margin-bottom:12px}\n  .rgpd{display:flex;gap:10px;align-items:flex-start;margin:14px 0 0;font-size:11.5px;color:rgba(255,255,255,.6);line-height:1.5;cursor:pointer;padding:12px;border:1px solid rgba(255,255,255,.14);border-radius:12px;background:rgba(255,255,255,.03);flex-shrink:0}\n  .rgpd.on{border-color:var(--magenta);background:rgba(232,33,107,.08)}\n  .rc{width:22px;height:22px;border-radius:6px;border:1.5px solid rgba(255,255,255,.3);background:transparent;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff}\n  .rgpd.on .rc{background:var(--magenta);border-color:var(--magenta)}\n  .rc .ic{width:13px;height:13px;stroke-width:3}\n  .err{color:#ff8fa3;font-size:11.5px;margin-top:8px;font-weight:700;flex-shrink:0}\n  .growspace{flex:1;min-height:8px}\n  .qnav{flex-shrink:0;margin-top:12px}\n\n  /* ===== CONFIRMATION ===== */\n  .res-head{position:relative;background:linear-gradient(180deg,var(--purple),var(--purple-deep));color:#fff;text-align:center;padding:46px 22px;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center}\n  .res-ico{width:74px;height:74px;border-radius:50%;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;margin:0 auto 16px}\n  .res-ico .ic{width:36px;height:36px;color:#fff}\n  .res-bravo{font-size:26px;font-weight:800;line-height:1.2}\n  .res-sub{font-size:14px;color:rgba(255,255,255,.82);margin-top:10px;max-width:280px}\n  .res-note{margin-top:22px;font-size:12.5px;color:rgba(255,255,255,.5)}\n\n  .flowincap{text-align:center;font-size:12px;color:rgba(255,255,255,.4);padding:10px 0 16px;font-weight:800;flex-shrink:0;background:#0c0a12}\n  .flowincap span{color:var(--magenta)}\n"; document.head.appendChild(_s);
  document.body.insertAdjacentHTML('beforeend', "\n<div class=\"phone\">\n\n  <div class=\"agentbar\">\n    <span>\ud83c\udf3f <b>Brigade Verte</b> \u00b7 sondage terrain</span>\n    <span class=\"counter\">\u2705 <span id=\"counterN\">0</span> aujourd'hui</span>\n  </div>\n\n  <!-- ===== ECRAN 1 : ACCUEIL ===== -->\n  <section class=\"scr on\" id=\"scrStart\">\n    <div class=\"hero\">\n      <div class=\"htop\">Flowin \u00d7 Nuits du Sud 2026</div>\n      <div class=\"hname\">Brigade Verte</div>\n      <div class=\"hsub\">5 questions sur la mobilit\u00e9 et l'acc\u00e8s au festival, puis les coordonn\u00e9es du festivalier pour le tirage au sort.</div>\n    </div>\n    <div class=\"stage\">\n      <div class=\"prize\">\n        <div class=\"lbl\">\u00c0 gagner</div>\n        <div class=\"prow\">\n          <div class=\"sq\"><svg class=\"ic\"><use href=\"#i-gift\"/></svg></div>\n          <div><div class=\"nm\">2 places de concert</div><div style=\"font-size:12.5px;color:rgba(255,255,255,.6);margin-top:2px\">Tir\u00e9es chaque soir \u00b7 + grand tirage final</div></div>\n        </div>\n      </div>\n      <a class=\"btn\" onclick=\"startSurvey()\">\ud83c\udfa4 Nouveau sondage</a>\n      <div class=\"foot\">Rempli par l'agent avec le festivalier, sur place</div>\n    </div>\n  </section>\n\n  <!-- ===== ECRAN 2 : QUESTIONS (cadre charte cinematique) ===== -->\n  <section class=\"scr cine-scr\" id=\"scrQuiz\">\n    <div class=\"pad\">\n      <div class=\"dhead\">\n        <div class=\"back\" onclick=\"confirmBack('scrStart')\"><svg class=\"ic\"><use href=\"#i-arrowl\"/></svg></div>\n        <div style=\"flex:1\"><div class=\"dtitle\">Sondage</div><div class=\"dsub\" id=\"qProgress\">1 / 5</div></div>\n      </div>\n      <div class=\"progress\" id=\"progressBar\"></div>\n      <div class=\"frame\">\n        <div class=\"frame-in\">\n          <div class=\"qtxt\" id=\"qLabel\"></div>\n          <div id=\"qOpts\"></div>\n        </div>\n      </div>\n      <div class=\"growspace\"></div>\n      <a class=\"btn qnav\" id=\"qNextBtn\" onclick=\"nextQuestion()\">Suivant \u2192</a>\n    </div>\n  </section>\n\n  <!-- ===== ECRAN 3 : FICHE FESTIVALIER (cadre charte cinematique) ===== -->\n  <section class=\"scr cine-scr\" id=\"scrForm\">\n    <div class=\"pad\">\n      <div class=\"dhead\">\n        <div class=\"back\" onclick=\"confirmBack('scrQuiz')\"><svg class=\"ic\"><use href=\"#i-arrowl\"/></svg></div>\n        <div><div class=\"dtitle\">Coordonn\u00e9es</div><div class=\"dsub\">Pour le tirage au sort</div></div>\n      </div>\n      <div class=\"frame\">\n        <div class=\"frame-in\">\n          <div class=\"grid2 fld\">\n            <div><label class=\"label\">Pr\u00e9nom</label><input class=\"input\" id=\"f_prenom\" autocomplete=\"given-name\"/></div>\n            <div><label class=\"label\">Nom</label><input class=\"input\" id=\"f_nom\" autocomplete=\"family-name\"/></div>\n          </div>\n          <div class=\"fld\"><label class=\"label\">T\u00e9l\u00e9phone</label><input class=\"input\" id=\"f_tel\" type=\"tel\" inputmode=\"tel\" autocomplete=\"tel\"/></div>\n          <div class=\"fld\"><label class=\"label\">Email <span style=\"opacity:.5;text-transform:none;font-weight:600\">(optionnel)</span></label><input class=\"input\" id=\"f_email\" type=\"email\" inputmode=\"email\" autocapitalize=\"none\"/></div>\n          <div class=\"grid2 fld\">\n            <div><label class=\"label\">Sexe</label><select class=\"input\" id=\"f_sexe\"><option value=\"\">\u2014</option><option value=\"H\">Homme</option><option value=\"F\">Femme</option></select></div>\n            <div><label class=\"label\">Tranche d'\u00e2ge</label><select class=\"input\" id=\"f_age\">\n              <option value=\"\">\u2014</option>\n              <option value=\"-18\">Moins de 18 ans</option>\n              <option value=\"18-25\">18\u201325 ans</option>\n              <option value=\"26-35\">26\u201335 ans</option>\n              <option value=\"36-50\">36\u201350 ans</option>\n              <option value=\"51-65\">51\u201365 ans</option>\n              <option value=\"65+\">66 ans et plus</option>\n            </select></div>\n          </div>\n          <div class=\"fld\" style=\"margin-bottom:0\"><label class=\"label\">Code postal <span style=\"opacity:.5;text-transform:none;font-weight:600\">(optionnel)</span></label><input class=\"input\" id=\"f_cp\" inputmode=\"numeric\" placeholder=\"\u2014\"/></div>\n        </div>\n      </div>\n      <div class=\"rgpd\" id=\"optinBox\" onclick=\"toggleOptin()\">\n        <span class=\"rc\" id=\"optinCheck\"></span>\n        <div>Le festivalier a \u00e9t\u00e9 inform\u00e9 : ses r\u00e9ponses servent \u00e0 des statistiques RSE et ses coordonn\u00e9es \u00e0 le contacter en cas de gain (tirage au sort). Donn\u00e9es non c\u00e9d\u00e9es.</div>\n      </div>\n      <div class=\"err\" id=\"formErr\" style=\"display:none\"></div>\n      <div class=\"growspace\"></div>\n      <a class=\"btn qnav\" id=\"submitBtn\" onclick=\"submitSurvey()\">\u2705 Valider et enregistrer</a>\n    </div>\n  </section>\n\n  <!-- ===== ECRAN 4 : CONFIRMATION (auto-retour) ===== -->\n  <section class=\"scr\" id=\"scrDone\">\n    <div class=\"res-head\">\n      <div class=\"res-ico\"><svg class=\"ic\"><use href=\"#i-checkc\"/></svg></div>\n      <div class=\"res-bravo\">Enregistr\u00e9 \u2705</div>\n      <div class=\"res-sub\" id=\"doneMsg\">Merci ! R\u00e9ponses et coordonn\u00e9es bien enregistr\u00e9es.</div>\n      <div class=\"res-note\">Retour \u00e0 l'accueil dans <span id=\"doneCountdown\">3</span>s\u2026</div>\n    </div>\n  </section>\n\n  <div class=\"flowincap\">Flow<span>in</span> \u00d7 Nuits du Sud 2026 \u2014 outil agent Brigade Verte</div>\n</div>\n\n<svg width=\"0\" height=\"0\" style=\"position:absolute\" aria-hidden=\"true\">\n  <symbol id=\"i-gift\" viewBox=\"0 0 24 24\"><rect x=\"3\" y=\"8\" width=\"18\" height=\"4\" rx=\"1\"/><path d=\"M12 8v13\"/><path d=\"M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7\"/><path d=\"M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8\"/><path d=\"M16.5 8a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8\"/></symbol>\n  <symbol id=\"i-checkc\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m8.5 12 2.5 2.5 4.5-5\"/></symbol>\n  <symbol id=\"i-arrowl\" viewBox=\"0 0 24 24\"><path d=\"M19 12H5\"/><path d=\"m11 18-6-6 6-6\"/></symbol>\n  <symbol id=\"i-check\" viewBox=\"0 0 24 24\"><path d=\"M20 6 9 17l-5-5\"/></symbol>\n</svg>\n\n");

  var SUPA_URL = 'https://ywcqtupgoxfzkddqkztk.supabase.co';
  var SUPA_ANON = 'sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1';
  var EV_ID = window.EV_ID || 'ev-nds-tablette-1'; // une seule ligne : pas de choix de brigade cote agent

  var QUESTIONS = [
    {id:'bv_decouverte',type:'multi',label:"Comment as-tu connu le festival ?",options:[
      {val:'reseaux',label:'Réseaux sociaux'},{val:'radio',label:'Publicité radio'},{val:'presse',label:'Presse / média'},{val:'affichage',label:'Affichage (ville, commerces, transports…)'},{val:'bouche',label:'Bouche-à-oreille'},{val:'web',label:'Site internet / recherche perso'}]},
    {id:'bv_motivation',type:'multi',max:3,label:"Qu'est-ce qui te donne envie de venir à un festival plutôt qu'un autre ?",options:[
      {val:'artistes',label:"La découverte d'artistes"},{val:'grandsnoms',label:'De grands noms de la musique'},{val:'ambiance',label:"L'ambiance et l'expérience sur place"},{val:'valeurs',label:'Les valeurs (écologie, inclusion, culture…)'},{val:'lieu',label:'Le lieu / le cadre'},{val:'prix',label:'Le prix des billets'},{val:'proximite',label:'La proximité avec mon lieu de vie'}]},
    {id:'bv_venue',type:'single',label:"Comment es-tu venu·e ce soir ?",options:[
      {val:'pied',label:'À pied / vélo'},{val:'tc',label:'Bus / navette'},{val:'covoit',label:'Covoiturage'},{val:'voiture',label:'Voiture (seul·e)'}]},
    {id:'bv_acces',type:'single',label:"L'accès au festival, ça a été ?",options:[
      {val:'ok',label:'Nickel.'},{val:'parking',label:'Galère de stationnement'},{val:'entree',label:"Dur de trouver l'entrée"},{val:'tc',label:'Compliqué en transports'}]},
    {id:'bv_infos',type:'single',label:"Avant de venir, tu as trouvé les infos accès / parking / navettes ?",options:[
      {val:'clair',label:'Oui, clair.'},{val:'manque',label:'Oui, mais incomplet'},{val:'non',label:'Non, galère'},{val:'pascherche',label:"J'ai pas cherché"}]},
    {id:'bv_solutions',type:'multi',label:"Qu'est-ce qui t'aiderait à laisser la voiture ?",options:[
      {val:'navette',label:'Des navettes'},{val:'covoit',label:'Du covoiturage'},{val:'velo',label:'Un parking vélo sécurisé'},{val:'horaires',label:'Des horaires calés sur les concerts'}]},
    {id:'bv_mobilite_si',type:'multi',label:"Je viendrais au festival autrement qu'en voiture si…",options:[
      {val:'infos',label:"Plus d'infos transport disponibles"},{val:'navettes',label:'Des navettes calées sur les horaires des concerts'},{val:'covoit',label:'Une solution de covoiturage'},{val:'parkings',label:'Des parkings relais mieux identifiés'},{val:'velo',label:'Des aménagements vélo / mobilités douces'},{val:'rien',label:'Rien, la voiture reste indispensable pour moi'}]},
    {id:'bv_engagement',type:'single',label:"Prêt·e à changer ta façon de venir, pour la planète ?",options:[
      {val:'oui',label:'Oui, facile.'},{val:'oui_si',label:'Oui, si y a des solutions'},{val:'peut',label:'Peut-être'},{val:'non',label:'Non'}]}
  ];

  var qIdx = 0;
  var answers = {};
  var optin = false;
  var counterKey = 'flowin_brigade_counter_' + (new Date().toISOString().slice(0,10));

  function $(id){ return document.getElementById(id); }
  function showScreen(id){
    ['scrStart','scrQuiz','scrForm','scrDone'].forEach(function(s){ $(s).className = $(s).className.replace(/\s*on\b/,''); });
    var el = $(id); el.className += ' on';
    window.scrollTo(0,0);
  }

  function refreshCounter(){
    var n = parseInt(localStorage.getItem(counterKey) || '0', 10);
    $('counterN').textContent = n;
  }
  refreshCounter();

  window.startSurvey = function(){
    qIdx = 0; answers = {}; optin = false;
    $('optinCheck').innerHTML = ''; $('optinBox').className = 'rgpd';
    ['f_prenom','f_nom','f_tel','f_email','f_cp'].forEach(function(id){ $(id).value=''; });
    $('f_sexe').value=''; $('f_age').value='';
    $('formErr').style.display='none';
    renderQuestion();
    showScreen('scrQuiz');
  };

  // Confirmation avant de quitter en cours de sondage (pas de sortie a mi-parcours par erreur,
  // pas de reponses laissees "vierges" en route).
  window.confirmBack = function(target){
    var hasProgress = Object.keys(answers).length > 0 || ($('f_prenom') && $('f_prenom').value.trim());
    if (hasProgress && !confirm('Abandonner ce sondage en cours ? Les réponses saisies seront perdues.')) return;
    showScreen(target);
  };

  function answerGiven(q){
    var a = answers[q.id];
    if (q.type === 'multi') return Array.isArray(a) && a.length > 0;
    return !!a;
  }

  function renderQuestion(){
    var q = QUESTIONS[qIdx];
    $('qProgress').textContent = (qIdx+1)+' / '+QUESTIONS.length;
    $('qLabel').textContent = q.label;
    if (q.type==='multi'){
      var _h = document.createElement('span');
      _h.style.cssText = 'display:block;font-size:12.5px;color:rgba(255,255,255,.55);font-weight:700;margin-top:6px';
      _h.textContent = q.max ? ('Plusieurs réponses · '+q.max+' max') : 'Plusieurs réponses possibles';
      $('qLabel').appendChild(_h);
    }
    var pb = $('progressBar'); pb.innerHTML='';
    for (var i=0;i<QUESTIONS.length;i++){ var d=document.createElement('div'); d.className='pstep'+(i<=qIdx?' on':''); pb.appendChild(d); }
    var wrap = $('qOpts'); wrap.innerHTML='';
    q.options.forEach(function(opt){
      var b = document.createElement('button');
      var ans = answers[q.id];
      var isSel = Array.isArray(ans) ? ans.indexOf(opt.val)>-1 : ans===opt.val;
      b.className = 'opt'+(isSel?' sel':'');
      b.textContent = opt.label;
      b.onclick = function(){
        if (q.type==='multi'){
          var cur = answers[q.id] || [];
          var k = cur.indexOf(opt.val);
          if (k>-1) cur.splice(k,1);
          else { if (q.max && cur.length >= q.max) return; cur.push(opt.val); }
          answers[q.id] = cur;
        } else { answers[q.id] = opt.val; }
        renderQuestion();
      };
      wrap.appendChild(b);
    });
    var nextBtn = $('qNextBtn');
    nextBtn.textContent = (qIdx+1 < QUESTIONS.length) ? 'Suivant →' : 'Continuer →';
    // Pas de passage a une question vierge : bouton desactive tant que rien n'est coche.
    if (answerGiven(q)) nextBtn.removeAttribute('disabled'); else nextBtn.setAttribute('disabled','disabled');
  }
  window.nextQuestion = function(){
    var q = QUESTIONS[qIdx];
    if (!answerGiven(q)) return; // garde-fou : jamais de passage sans reponse
    if (qIdx+1 < QUESTIONS.length){ qIdx++; renderQuestion(); }
    else { showScreen('scrForm'); }
  };

  window.toggleOptin = function(){
    optin = !optin;
    $('optinBox').className = 'rgpd'+(optin?' on':'');
    $('optinCheck').innerHTML = optin ? '<svg class="ic"><use href="#i-check"/></svg>' : '';
  };

  async function sbInsert(table, rows){
    var r;
    try{
      r = await fetch(SUPA_URL+'/rest/v1/'+table, {
        method:'POST',
        headers:{ 'apikey':SUPA_ANON, 'Authorization':'Bearer '+SUPA_ANON, 'Content-Type':'application/json', 'Prefer':'return=representation' },
        body: JSON.stringify(rows)
      });
    } catch(netErr){
      // Echec avant meme la reponse HTTP : reseau coupe, ou page ouverte en file:// (CORS/origin bloque),
      // ou pas de connexion sur le terrain. On distingue explicitement ce cas.
      throw new Error('Connexion impossible (réseau coupé, ou page ouverte en local plutôt qu\'en ligne). ' + (netErr && netErr.message ? netErr.message : ''));
    }
    var data = null; try{ data = await r.json(); }catch(e){}
    if (!r.ok){
      var reason = (data && (data.message || data.hint || data.details)) || ('HTTP ' + r.status);
      throw new Error('Supabase a refusé l\'enregistrement (' + table + ') : ' + reason);
    }
    return { ok:true, data:data };
  }

  window.submitSurvey = async function(){
    var prenom = $('f_prenom').value.trim();
    var nom = $('f_nom').value.trim();
    if (!prenom || !nom){ $('formErr').textContent='Prénom et nom requis.'; $('formErr').style.display='block'; return; }
    if (!optin){ $('formErr').textContent='Coche la case de consentement avec le festivalier.'; $('formErr').style.display='block'; return; }
    $('formErr').style.display='none';
    $('submitBtn').setAttribute('disabled','disabled');
    $('submitBtn').textContent='Enregistrement…';

    var today = new Date().toISOString().slice(0,10);
    var joueurRow = {
      prenom: prenom, nom: nom,
      tel: $('f_tel').value.trim() || null,
      email: $('f_email').value.trim() || null,
      genre: $('f_sexe').value || null,
      age_tranche: $('f_age').value || null,
      code_postal: $('f_cp').value.trim() || null,
      events: [EV_ID],
      source: 'brigade-manuel',
      optin: true, optin_date: today,
      first_seen: today, last_seen: today
    };

    try{
      var jr = await sbInsert('joueurs', [joueurRow]);
      var joueurId = (jr.data && jr.data[0]) ? jr.data[0].id : null;
      if (joueurId){
        await sbInsert('participations', [{
          joueur_id: joueurId, event_id: EV_ID, bonus_answers: answers,
          completed: true, tickets: 1, source_qr: 'brigade-manuel'
        }]);
      }
      await sbInsert('sondage_brigade', [{ event_id: EV_ID, reponses: answers }]);

      var n = parseInt(localStorage.getItem(counterKey) || '0', 10) + 1;
      localStorage.setItem(counterKey, String(n));
      refreshCounter();

      $('doneMsg').textContent = 'Merci ' + prenom + ' ! Réponses et coordonnées bien enregistrées.';
      showScreen('scrDone');
      var c = 3; $('doneCountdown').textContent = c;
      var t = setInterval(function(){
        c--; $('doneCountdown').textContent = c;
        if (c<=0){ clearInterval(t); showScreen('scrStart'); }
      }, 1000);
    } catch(e){
      $('formErr').textContent = (e && e.message) ? e.message : 'Erreur inconnue — réessaie.';
      $('formErr').style.display='block';
    }
    $('submitBtn').removeAttribute('disabled');
    $('submitBtn').textContent = '✅ Valider et enregistrer';
  };
})();
