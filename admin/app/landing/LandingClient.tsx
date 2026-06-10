'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { trackVisite } from '@/lib/track'

const CSS = `*{margin:0;padding:0;box-sizing:border-box}
  :root{
    --ink:#1B3A5C;--blue:#3B5CC4;--teal:#00B4A0;--orange:#E85D04;--amber:#F59E0B;--violet:#7C5CC4;
    --d1:#13314f;--d2:#0E1B30;--d3:#0A1C32;--dk:#0A1424;
    --paper:#F4F6F9;--muted:#5a6b80;--line:rgba(0,0,0,.07);
  }
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#000;color:var(--ink);-webkit-text-size-adjust:100%}
  .app{max-width:480px;margin:0 auto;background:var(--paper);overflow-x:hidden}
  a{color:inherit}
  .ic{display:block}
  section{padding:40px 22px 48px;scroll-margin-top:64px}
  .page{animation:fade .25s ease}
  .app.paged .page{display:none}
  .app.paged .page.show{display:block}
  @keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

  .menu{position:sticky;top:0;z-index:50;background:rgba(14,27,48,.94);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.08)}
  .menu .row{display:flex;align-items:center;gap:10px;padding:11px 16px}
  .menu .lg{font-size:18px;font-weight:900;letter-spacing:-.02em;color:#fff;flex-shrink:0;cursor:pointer}
  .menu .lg em{color:var(--blue);font-style:normal}
  .menu .links{display:flex;gap:3px;overflow-x:auto;scrollbar-width:none;margin-left:auto}
  .menu .links::-webkit-scrollbar{display:none}
  .menu .links a{flex:0 0 auto;font-size:12px;font-weight:700;color:rgba(255,255,255,.62);text-decoration:none;padding:6px 9px;border-radius:8px;white-space:nowrap;cursor:pointer}
  .menu .links a.cta{background:var(--teal);color:#fff}
  .menu .links a.active:not(.cta){color:#fff;background:rgba(255,255,255,.12)}

  .dark{background:linear-gradient(170deg,var(--d2),var(--d3));color:#fff}
  .darker{background:var(--dk);color:#fff}
  .eyebrow{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.14em;color:var(--teal);margin-bottom:11px;display:flex;align-items:center;gap:8px}
  .eyebrow:before{content:'';width:20px;height:2px;background:var(--teal);border-radius:2px}
  h2.t{font-size:25px;font-weight:900;line-height:1.16;letter-spacing:-.01em}
  .dark h2.t,.darker h2.t{color:#fff}
  .sub{font-size:14.5px;color:var(--muted);margin-top:10px;line-height:1.55}
  .dark .sub,.darker .sub{color:rgba(255,255,255,.6)}
  .btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;background:var(--teal);color:#fff;border:none;border-radius:100px;padding:16px;font-size:15.5px;font-weight:800;cursor:pointer;text-decoration:none;font-family:inherit}

  .hero{background:linear-gradient(165deg,var(--d1) 0%,var(--d2) 55%,var(--d3) 100%);color:#fff;text-align:center;padding:42px 22px 38px}
  .hero .logo{font-size:46px;font-weight:900;letter-spacing:-.02em;margin-bottom:18px}
  .hero .logo em{color:var(--blue);font-style:normal}
  .hero h1{font-size:29px;font-weight:900;line-height:1.14;letter-spacing:-.02em}
  .hero h1 .hl{color:#6A93FF}
  .hero .hsub{font-size:14.5px;color:rgba(255,255,255,.74);margin-top:14px;line-height:1.55}
  .baseline{font-size:15px;font-weight:900;margin-top:16px}
  .baseline .c1{color:var(--orange)}.baseline .c2{color:var(--blue)}.baseline .c3{color:var(--teal)}
  .proof{display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px;margin:24px 0 8px}
  .proof .p{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:15px 8px}
  .proof .v{font-size:24px;font-weight:900;color:var(--teal);line-height:1}
  .proof .l{font-size:10.5px;color:rgba(255,255,255,.6);margin-top:6px;line-height:1.3}
  .pilote{font-size:11px;color:rgba(255,255,255,.4);margin-top:10px}

  .plist{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}
  .pl{display:flex;flex-direction:column;gap:10px;padding:15px 14px;font-size:13.5px;line-height:1.32;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:15px}

  .pl .x{width:28px;height:28px;border-radius:9px;background:rgba(232,115,12,.16);color:#F59E0B;display:grid;place-items:center;flex-shrink:0}

  .flow{display:flex;flex-direction:column;margin-top:20px}
  .fstep{display:flex;align-items:center;gap:14px;position:relative;padding-bottom:18px}
  .fstep:not(:last-child):before{content:'';position:absolute;left:21px;top:44px;bottom:0;width:2px;background:linear-gradient(var(--blue),rgba(59,92,196,.2))}
  .fstep .fn{width:44px;height:44px;border-radius:50%;flex-shrink:0;display:grid;place-items:center;color:#fff;font-weight:900;font-size:16px;z-index:1}
  .fstep h4{font-size:16px;font-weight:800}
  .fstep p{font-size:13px;color:var(--muted);margin-top:2px;line-height:1.42}

  .ben{display:flex;flex-direction:column;gap:12px;margin-top:18px}
  .bc{display:flex;gap:14px;align-items:flex-start;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:16px}
  .bc .bi{width:46px;height:46px;border-radius:13px;display:grid;place-items:center;color:#fff;flex-shrink:0}
  .bc h4{font-size:16px;font-weight:800;color:#fff}
  .bc p{font-size:13px;color:rgba(255,255,255,.62);margin-top:3px;line-height:1.46}

  .se-badge{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#fff;background:linear-gradient(135deg,var(--orange),var(--amber));padding:6px 14px;border-radius:100px;margin-bottom:14px}
  .se-line{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:15px 16px;margin-top:11px}
  .se-line .si{width:38px;height:38px;border-radius:11px;background:rgba(0,180,160,.16);color:var(--teal);display:grid;place-items:center;flex-shrink:0}
  .se-line p{font-size:13.5px;line-height:1.45;color:rgba(255,255,255,.82)}
  .se-line p b{color:#fff;font-weight:800}
  .se-ex{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
  .se-ex span{font-size:12px;font-weight:700;color:#fff;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);padding:8px 13px;border-radius:100px}

  .kpis{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:20px}
  .kpi{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:15px;text-align:center}
  .kpi .v{font-size:24px;font-weight:900}.kpi .l{font-size:11px;color:rgba(255,255,255,.55);margin-top:5px}
  .panel{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:16px;margin-top:12px}
  .panel h4{font-size:13px;font-weight:800;color:rgba(255,255,255,.85);margin-bottom:14px;text-align:center}
  .bar{display:flex;align-items:center;gap:10px;margin-bottom:11px;font-size:13px}
  .bar .bl{width:88px;color:rgba(255,255,255,.7);flex-shrink:0}
  .bar .bt{flex:1;height:11px;background:rgba(255,255,255,.06);border-radius:100px;overflow:hidden}
  .bar .bf{display:block;height:100%;border-radius:100px}
  .bar .bn{width:30px;text-align:right;font-weight:800;color:#fff}
  .donutwrap{display:flex;flex-direction:column;align-items:center;gap:12px}
  .leg{display:flex;flex-direction:column;gap:7px;width:100%}
  .leg .lr{display:flex;align-items:center;gap:9px;font-size:13px;color:rgba(255,255,255,.7)}
  .leg .lr b{margin-left:auto;color:#fff}
  .leg .dot{width:11px;height:11px;border-radius:3px;flex-shrink:0}
  .vbars{display:flex;align-items:flex-end;justify-content:space-between;gap:8px;height:150px;padding-top:14px}
  .vcol{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:7px}
  .vcol .vn{font-size:14px;font-weight:800;color:#fff}
  .vcol .vbar{width:100%;max-width:30px;border-radius:8px 8px 3px 3px;background:linear-gradient(180deg,var(--blue),var(--teal))}
  .vcol .vl{font-size:9.5px;color:rgba(255,255,255,.55);text-align:center;line-height:1.15;min-height:24px}
  .redir{display:flex;gap:10px;margin-top:4px}
  .rcard{flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px 6px;text-align:center}
  .rcard .ri{width:38px;height:38px;border-radius:11px;background:rgba(0,180,160,.16);color:var(--teal);display:grid;place-items:center;margin:0 auto 8px}
  .rcard .rv{font-size:22px;font-weight:900;color:var(--teal);line-height:1}
  .rcard .rl{font-size:11px;color:rgba(255,255,255,.55);margin-top:5px}

  .uses{display:flex;flex-direction:column;gap:10px;margin-top:18px}
  .use{background:#fff;border:1px solid var(--line);border-radius:15px;padding:15px 16px}
  .use .uh{display:flex;align-items:center;gap:11px;font-size:15.5px;font-weight:800}
  .use .ui{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;flex-shrink:0;color:#fff}
  .use p{font-size:12.5px;color:var(--muted);margin-top:8px;line-height:1.5}

  .games{display:flex;flex-direction:column;gap:12px;margin-top:18px}
  .game{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:16px}
  .game .gt{display:flex;align-items:center;gap:12px;margin-bottom:11px}
  .game .gi{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;color:#fff;flex-shrink:0}
  .game h4{font-size:16px;font-weight:800;color:#fff}
  .game .tag{font-size:12.5px;color:var(--teal);font-weight:800;margin-top:2px;letter-spacing:.01em}
  .game li{list-style:none;font-size:12.5px;color:rgba(255,255,255,.62);padding-left:18px;position:relative;line-height:1.5}
  .game li:before{content:'✓';position:absolute;left:0;color:var(--teal);font-weight:900}

  .prices{display:flex;flex-direction:column;gap:15px;margin-top:20px}
  .price{background:#fff;border:1px solid var(--line);border-radius:20px;padding:22px;position:relative;box-shadow:0 10px 30px rgba(20,40,80,.05)}
  .price.hl{border:2px solid var(--teal);box-shadow:0 18px 44px rgba(0,180,160,.18)}
  .price.hl:before{content:'';position:absolute;inset:0;border-radius:20px;padding:2px;background:linear-gradient(135deg,var(--teal),#6A93FF);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none;opacity:.0}
  .pbadge{position:absolute;top:-12px;left:22px;background:linear-gradient(135deg,var(--teal),#12937f);color:#fff;font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;padding:6px 14px;border-radius:100px;box-shadow:0 6px 16px rgba(0,180,160,.35)}
  .price .pn{font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:.04em;color:var(--ink)}
  .price.hl .pn{color:var(--teal)}
  .price .ptag{font-size:12px;color:var(--muted);margin:5px 0 0;line-height:1.45;min-height:34px}
  .price .pp{font-size:32px;font-weight:900;margin:10px 0 4px;color:var(--ink);letter-spacing:-.02em}
  .price .pu{font-size:12.5px;color:var(--muted);font-weight:700}
  .price ul{margin-top:14px}
  .price li{list-style:none;font-size:13px;color:#3a4d63;padding:7px 0;border-top:1px solid var(--line);display:flex;gap:8px;line-height:1.4}
  .price li:before{content:'✓';color:var(--teal);font-weight:900;flex-shrink:0}
  .price li.gold{color:#8a5e12;font-weight:800}
  .price li.gold:before{content:'★';color:#E0A52E}
  .pgold{display:flex;gap:10px;align-items:flex-start;margin-top:14px;padding:13px 14px;border-radius:14px;background:linear-gradient(135deg,rgba(245,181,68,.20),rgba(245,158,11,.07));border:1px solid rgba(224,165,46,.45)}
  .pgold .gi{color:#C2861A;flex-shrink:0;margin-top:1px}
  .pgold .gt2{font-size:12.5px;line-height:1.42;color:#7a5410}
  .pgold .gt2 b{display:block;font-size:12.5px;font-weight:900;color:#9a6a12;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}
  .pmline{display:flex;align-items:center;justify-content:center;gap:8px;font-size:13.5px;font-weight:700;color:#3a4d63;margin-top:18px}

  .carousel{display:flex !important;flex-direction:row !important;flex-wrap:nowrap;align-items:flex-start;overflow-x:auto;overflow-y:visible;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;gap:14px;padding:16px 0 6px;scrollbar-width:none}
  .carousel::-webkit-scrollbar{display:none}
  .carousel > *{flex:0 0 100% !important;width:100%;scroll-snap-align:center;scroll-snap-stop:always;margin-top:0 !important}
  .dots{display:flex;justify-content:center;gap:7px;margin-top:8px}
  .dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.22);cursor:pointer;transition:width .2s,background .2s;flex-shrink:0}
  .dot.on{background:var(--teal);width:20px;border-radius:4px}
  .dots.dk .dot{background:rgba(0,0,0,.16)}
  .dots.dk .dot.on{background:var(--teal)}
  .ctaf{background:linear-gradient(165deg,var(--d1),var(--d3));color:#fff;text-align:center;padding:46px 22px}
  .form{display:flex;flex-direction:column;gap:10px;max-width:420px;margin:20px auto 0}
  .form input,.form select{padding:14px 15px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#fff;font-size:15px;font-family:inherit;width:100%}
  .form input::placeholder{color:rgba(255,255,255,.5)}
  .form select option{color:var(--ink)}
  .ctaor{font-size:12.5px;color:rgba(255,255,255,.5);margin:18px 0 12px}
  .calls{display:flex;gap:10px;flex-wrap:wrap;max-width:420px;margin:0 auto}
  .calls a{flex:1;min-width:104px;display:flex;align-items:center;justify-content:center;gap:7px;border-radius:100px;padding:13px;font-size:13.5px;font-weight:800;text-decoration:none}
  .calls .c-call,.calls .c-mail{background:rgba(255,255,255,.1);color:#fff;border:1.5px solid rgba(255,255,255,.32)}
  .calls .c-wa{background:#25D366;color:#06301B}
  .rgpd{font-size:12px;color:rgba(255,255,255,.45);margin-top:16px}
  .thanks{max-width:420px;margin:20px auto 0;background:rgba(0,180,160,.12);border:1px solid rgba(0,180,160,.4);border-radius:16px;padding:24px}
  .thanks h3{font-size:19px;font-weight:900;margin-bottom:6px}.thanks p{font-size:13.5px;color:rgba(255,255,255,.78)}

  .proofband{background:#fff;border:1px solid var(--line);border-left:4px solid var(--teal);border-radius:14px;padding:16px 18px;margin-top:18px;font-size:14px;line-height:1.5;color:#3a4d63;box-shadow:0 8px 24px rgba(20,40,80,.05)}
  .proofband b{color:var(--ink);font-weight:800}
  .proofband .pbk{display:block;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--teal);margin-bottom:7px}
  footer{background:var(--dk);color:rgba(255,255,255,.5);text-align:center;padding:28px 22px;font-size:12px;line-height:1.7}
  footer .lg{font-size:19px;font-weight:900;color:rgba(255,255,255,.9);letter-spacing:-.02em;margin-bottom:6px}
  footer .lg em{color:var(--blue);font-style:normal}
  footer a{color:var(--teal);text-decoration:none}`

const BODY = `<div class="app">

  <div class="menu">
    <div class="row">
      <div class="lg" data-to="top">Flow<em>in</em></div>
      <div class="links">
        <a data-to="probleme">Pourquoi</a>
        <a data-to="comment">Comment</a>
        <a data-to="resultats">Résultats</a>
        <a data-to="tarifs">Tarifs</a>
        <a data-to="contact" class="cta">Contact</a>
      </div>
    </div>
  </div>

  <!-- 1. HERO -->
  <section class="hero page show" id="top">
    <div class="logo">Flow<em>in</em></div>
    <h1>L'animation qui <span class="hl">fait revenir vos clients</span>.</h1>
    <p class="hsub">Animez votre lieu, créez du lien, faites revenir vos clients.</p>
    <div class="baseline"><span class="c1">Fidélisez</span> · <span class="c2">Animez</span> · <span class="c3">Boostez</span></div>
    <a class="btn" style="margin-top:20px" data-to="comment">Voir comment ça marche →</a>
  </section>

  <!-- 2. CONSTAT -->
  <section class="dark page" id="probleme">
    <div class="eyebrow">Pourquoi Flowin</div>
    <h2 class="t">Le monde passe. <span style="color:var(--teal)">Vous ne gardez rien.</span></h2>
    <p class="sub">Boutique, marché, expo, festival : les gens viennent, profitent… et repartent sans laisser de trace.</p>
    <div class="plist">
      <div class="pl"><span class="x"><svg class="ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></span>Vous ne savez pas qui est venu, ni combien.</div>
      <div class="pl"><span class="x"><svg class="ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></span>Aucun moyen de recontacter vos visiteurs.</div>
      <div class="pl"><span class="x"><svg class="ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></span>Peu ou pas de chiffres à montrer à vos partenaires, sponsors, mécènes.</div>
      <div class="pl"><span class="x"><svg class="ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></span>Tout repose sur les réseaux et le bouche-à-oreille.</div>
      <div class="pl"><span class="x"><svg class="ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></span>Pour faire revenir du monde, vous repayez de la pub.</div>
      <div class="pl"><span class="x"><svg class="ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></span>Aucun outil pour lire vos flux : caisse, réseaux… tout est éparpillé.</div>
    </div>
    <p class="sub" style="font-weight:800;color:#fff;margin-top:20px;text-align:center">Faites de chaque lieu, manifestation ou event une occasion de capter et fidéliser.</p>
    <a class="btn" data-to="comment" style="margin-top:16px">Voir la solution →</a>
  </section>

  <!-- 3. SYSTÈME / MÉTHODE -->
  <section class="page" id="solution">
    <div class="eyebrow">Comment ça marche</div>
    <h2 class="t">Simple, et <span style="color:var(--teal)">direct.</span></h2>
    <p class="sub">Vos réseaux diffusent. Flowin vous aide à fidéliser.</p>
    <div class="uses carousel">
      <div class="use"><div class="uh"><span class="ui" style="background:var(--orange)"><svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>1 · Vous installez Flowin</div><p>Une animation à vos couleurs sur votre lieu ou votre event.</p></div>
      <div class="use"><div class="uh"><span class="ui" style="background:var(--blue)"><svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg></span>2 · Vous récupérez une base</div><p>Vos visiteurs jouent, leurs infos entrent dans votre fichier.</p></div>
      <div class="use"><div class="uh"><span class="ui" style="background:var(--teal)"><svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg></span>3 · Vous passez à l'action</div><p>Insta et Facebook diffusent. Flowin, vous contactez votre base en direct : event, promo, annonce.</p></div>
    </div>
        <p class="sub" style="font-weight:800;color:var(--ink);text-align:center;margin-top:20px">Passez de la communication passive à l'action active.</p>
  </section>

  <!-- 4. BÉNÉFICES -->
  <section class="dark page" id="benefices">
    <div class="eyebrow">Ce que ça vous apporte</div>
    <h2 class="t">Bien plus qu'un jeu.</h2>
    <div class="ben">
      <div class="bc"><div class="bi" style="background:linear-gradient(135deg,var(--blue),#2C49A6)"><svg class="ic" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg></div><div><h4>Vous constituez une base client</h4><p>Chaque participant rejoint votre base.</p></div></div>
      <div class="bc"><div class="bi" style="background:linear-gradient(135deg,var(--teal),#138571)"><svg class="ic" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M19.9 13A8 8 0 1 1 18 7"/><path d="M18 3v4h-4"/></svg></div><div><h4>Vous communiquez en direct</h4><p>Une offre, une actu : vous joignez vos clients directement.</p></div></div>
      <div class="bc"><div class="bi" style="background:linear-gradient(135deg,var(--orange),#C24A03)"><svg class="ic" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg></div><div><h4>Vous animez votre lieu</h4><p>Vous relancez votre public et faites revenir du monde.</p></div></div>
      <div class="bc"><div class="bi" style="background:linear-gradient(135deg,var(--amber),#C77A06)"><svg class="ic" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l3-3 3 2 5-6"/></svg></div><div><h4>Vous mesurez ce qui compte</h4><p>Affluence, profils, retombées : tout est mesuré.</p></div></div>
    </div>
  </section>

  <!-- 5. SUPER EVENT -->
  <section class="darker page" id="superevent">
    <div class="se-badge">L'innovation Flowin</div>
    <h2 class="t">Le Super Event : seul c'est bien, à plusieurs c'est fort.</h2>
    <p class="sub" style="color:rgba(255,255,255,.65)">Plusieurs acteurs, une même animation. Plus d'affluence pour tous — chacun garde son public.</p>
    <div class="se-line"><span class="si"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="9" r="2.8"/><path d="M3.5 18a5.5 5.5 0 0 1 11 0"/><circle cx="17.5" cy="10" r="2.3"/><path d="M16.5 14.5a4.6 4.6 0 0 1 4 4"/></svg></span><p><b>Une dynamique commune</b> qui attire plus de monde.</p></div>
    <div class="se-line"><span class="si"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg></span><p><b>Chacun garde sa base.</b> Vous mutualisez l'animation, vous construisez votre base client.</p></div>
    <div class="se-line"><span class="si"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="5"/><path d="M9 13.5 7.5 21 12 18.5 16.5 21 15 13.5"/></svg></span><p><b>Une visibilité qui attire les sponsors.</b></p></div>
    <div class="se-ex"><span>Rue commerçante</span><span>Centre commercial</span><span>Marché</span><span>Salon</span><span>Fête locale</span><span>Office de tourisme</span></div>
  </section>

  <!-- 6. RÉSULTATS -->
  <section class="dark page" id="resultats">
    <div class="eyebrow">Vos résultats</div>
    <h2 class="t">Vous voyez tout, en direct.</h2>
    <p class="sub">Affluence, profils, provenance, retombées : de vrais indicateurs en temps réel pendant l'animation, prêts à analyser.</p>
    <div class="kpis">
      <div class="kpi"><div class="v" style="color:var(--teal)">192</div><div class="l">Participants</div></div>
      <div class="kpi"><div class="v" style="color:var(--teal)">43 ans</div><div class="l">Âge moyen</div></div>
      <div class="kpi"><div class="v" style="color:var(--blue)">100%</div><div class="l">Conversion</div></div>
      <div class="kpi"><div class="v" style="color:var(--amber)">74%</div><div class="l">souhaitent rester en contact</div></div>
    </div>

    <div class="carousel">
    <div class="panel">
      <h4>Tranches d'âge</h4>
      <div class="vbars">
        <div class="vcol"><span class="vn">81</span><span class="vbar" style="height:100%;background:linear-gradient(180deg,#F9A23C,#E8730C)"></span><span class="vl">36–50</span></div>
        <div class="vcol"><span class="vn">37</span><span class="vbar" style="height:46%;background:linear-gradient(180deg,#6A8AE6,#3B5CC4)"></span><span class="vl">51–65</span></div>
        <div class="vcol"><span class="vn">28</span><span class="vbar" style="height:35%;background:linear-gradient(180deg,#3FE0CC,#00B4A0)"></span><span class="vl">26–35</span></div>
        <div class="vcol"><span class="vn">20</span><span class="vbar" style="height:25%;background:linear-gradient(180deg,#A98AE6,#7C5CC4)"></span><span class="vl">65 +</span></div>
        <div class="vcol"><span class="vn">15</span><span class="vbar" style="height:19%;background:linear-gradient(180deg,#2FD89E,#0B9E6E)"></span><span class="vl">18–25</span></div>
        <div class="vcol"><span class="vn">11</span><span class="vbar" style="height:14%;background:linear-gradient(180deg,#F36A99,#E1306C)"></span><span class="vl">&lt;18</span></div>
      </div>
    </div>

    <div class="panel">
      <h4>Répartition par genre</h4>
      <div class="donutwrap">
        <svg width="120" height="120" viewBox="0 0 120 120"><g transform="rotate(-90 60 60)"><circle cx="60" cy="60" r="42" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="16"/><circle cx="60" cy="60" r="42" fill="none" stroke="#00B4A0" stroke-width="16" stroke-dasharray="161 103"/><circle cx="60" cy="60" r="42" fill="none" stroke="#3B5CC4" stroke-width="16" stroke-dasharray="103 161" stroke-dashoffset="-161"/></g><text x="60" y="57" text-anchor="middle" fill="#fff" font-size="22" font-weight="900">61%</text><text x="60" y="73" text-anchor="middle" fill="rgba(255,255,255,.5)" font-size="10">Femmes</text></svg>
        <div class="leg"><div class="lr"><span class="dot" style="background:#00B4A0"></span>Femmes<b>61%</b></div><div class="lr"><span class="dot" style="background:#3B5CC4"></span>Hommes<b>39%</b></div></div>
      </div>
    </div>

    <div class="panel">
      <h4>Jours de fréquentation</h4>
      <div class="bar"><span class="bl">Samedi</span><span class="bt"><span class="bf" style="width:100%;background:linear-gradient(90deg,var(--teal),#22C55E)"></span></span><span class="bn">71</span></div>
      <div class="bar"><span class="bl">Dimanche</span><span class="bt"><span class="bf" style="width:76%;background:linear-gradient(90deg,var(--teal),#22C55E)"></span></span><span class="bn">54</span></div>
      <div class="bar"><span class="bl">Mercredi</span><span class="bt"><span class="bf" style="width:46%;background:linear-gradient(90deg,var(--teal),#22C55E)"></span></span><span class="bn">33</span></div>
      <div class="bar"><span class="bl">Vendredi</span><span class="bt"><span class="bf" style="width:30%;background:linear-gradient(90deg,var(--teal),#22C55E)"></span></span><span class="bn">21</span></div>
      <div class="bar"><span class="bl">Jeudi</span><span class="bt"><span class="bf" style="width:18%;background:linear-gradient(90deg,var(--teal),#22C55E)"></span></span><span class="bn">13</span></div>
    </div>

    <div class="panel">
      <h4>Pics horaires</h4>
      <div class="vbars">
        <div class="vcol"><span class="vn">38</span><span class="vbar" style="height:66%;background:linear-gradient(180deg,#6A8AE6,#3B5CC4)"></span><span class="vl">10–12h</span></div>
        <div class="vcol"><span class="vn">17</span><span class="vbar" style="height:29%;background:linear-gradient(180deg,#3FE0CC,#00B4A0)"></span><span class="vl">12–14h</span></div>
        <div class="vcol"><span class="vn">49</span><span class="vbar" style="height:84%;background:linear-gradient(180deg,#A98AE6,#7C5CC4)"></span><span class="vl">14–16h</span></div>
        <div class="vcol"><span class="vn">58</span><span class="vbar" style="height:100%;background:linear-gradient(180deg,#F9A23C,#E8730C)"></span><span class="vl">16–18h</span></div>
        <div class="vcol"><span class="vn">30</span><span class="vbar" style="height:52%;background:linear-gradient(180deg,#2FD89E,#0B9E6E)"></span><span class="vl">18–20h</span></div>
      </div>
    </div>

    <div class="panel">
      <h4>Intention de revenir</h4>
      <div style="text-align:center">
        <svg width="190" height="118" viewBox="0 0 190 118" style="max-width:100%">
          <path d="M20 102 A75 75 0 0 1 170 102" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="16" stroke-linecap="round"/>
          <path d="M20 102 A75 75 0 0 1 170 102" fill="none" stroke="#22C55E" stroke-width="16" stroke-linecap="round" stroke-dasharray="156 236"/>
          <text x="95" y="86" text-anchor="middle" fill="#fff" font-size="32" font-weight="900">66%</text>
          <text x="95" y="106" text-anchor="middle" fill="rgba(255,255,255,.55)" font-size="11">comptent revenir</text>
        </svg>
      </div>
    </div>

    <div class="panel">
      <h4>Comment ils vous ont connu</h4>
      <div class="donutwrap">
        <svg width="120" height="120" viewBox="0 0 120 120"><g transform="rotate(-90 60 60)">
          <circle cx="60" cy="60" r="42" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="16"/>
          <circle cx="60" cy="60" r="42" fill="none" stroke="#F59E0B" stroke-width="16" stroke-dasharray="111 153" stroke-dashoffset="0"/>
          <circle cx="60" cy="60" r="42" fill="none" stroke="#0B6E4F" stroke-width="16" stroke-dasharray="45 219" stroke-dashoffset="-111"/>
          <circle cx="60" cy="60" r="42" fill="none" stroke="#E1306C" stroke-width="16" stroke-dasharray="40 224" stroke-dashoffset="-156"/>
          <circle cx="60" cy="60" r="42" fill="none" stroke="#00B4A0" stroke-width="16" stroke-dasharray="34 230" stroke-dashoffset="-196"/>
          <circle cx="60" cy="60" r="42" fill="none" stroke="#1877F2" stroke-width="16" stroke-dasharray="34 230" stroke-dashoffset="-230"/>
        </g><text x="60" y="57" text-anchor="middle" fill="#fff" font-size="22" font-weight="900">42%</text><text x="60" y="73" text-anchor="middle" fill="rgba(255,255,255,.5)" font-size="10">Affiche</text></svg>
        <div class="leg">
          <div class="lr"><span class="dot" style="background:#F59E0B"></span>Affiche / Flyer<b>42%</b></div>
          <div class="lr"><span class="dot" style="background:#0B6E4F"></span>Site internet<b>17%</b></div>
          <div class="lr"><span class="dot" style="background:#E1306C"></span>Instagram<b>15%</b></div>
          <div class="lr"><span class="dot" style="background:#00B4A0"></span>Mairie<b>13%</b></div>
          <div class="lr"><span class="dot" style="background:#1877F2"></span>Facebook<b>13%</b></div>
        </div>
      </div>
    </div>

    <div class="panel">
      <h4>D'où viennent vos visiteurs</h4>
      <div class="bar"><span class="bl">06140</span><span class="bt"><span class="bf" style="width:100%;background:linear-gradient(90deg,var(--blue),var(--teal))"></span></span><span class="bn">74</span></div>
      <div class="bar"><span class="bl">06610</span><span class="bt"><span class="bf" style="width:32%;background:linear-gradient(90deg,var(--blue),var(--teal))"></span></span><span class="bn">24</span></div>
      <div class="bar"><span class="bl">06800</span><span class="bt"><span class="bf" style="width:31%;background:linear-gradient(90deg,var(--blue),var(--teal))"></span></span><span class="bn">23</span></div>
      <div class="bar"><span class="bl">06700</span><span class="bt"><span class="bf" style="width:30%;background:linear-gradient(90deg,var(--blue),var(--teal))"></span></span><span class="bn">22</span></div>
      <div class="bar"><span class="bl">06000</span><span class="bt"><span class="bf" style="width:30%;background:linear-gradient(90deg,var(--blue),var(--teal))"></span></span><span class="bn">22</span></div>
      <div class="bar"><span class="bl">06130</span><span class="bt"><span class="bf" style="width:24%;background:linear-gradient(90deg,var(--blue),var(--teal))"></span></span><span class="bn">18</span></div>
    </div>

    <div class="panel">
      <h4>Redirections vers vos liens.</h4>
      <div class="redir">
        <div class="rcard"><div class="ri"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.8 2.4 4.2 5.6 4.2 9s-1.4 6.6-4.2 9c-2.8-2.4-4.2-5.6-4.2-9S9.2 5.4 12 3z"/></svg></div><div class="rv">38%</div><div class="rl">Site internet</div></div>
        <div class="rcard"><div class="ri"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="4.6"/><circle cx="12" cy="12" r="3.6"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg></div><div class="rv">31%</div><div class="rl">Instagram</div></div>
        <div class="rcard"><div class="ri"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h-2.4C10.6 4 9.4 5.4 9.4 7.4V10H7v3h2.4v7h3.1v-7H15l.5-3h-3v-2.1c0-.6.2-.9.9-.9H15z"/></svg></div><div class="rv">24%</div><div class="rl">Facebook</div></div>
      </div>
    </div>

    </div>
    <p class="sub" style="font-size:12px">Exemple réel d'un tableau de bord — événement réalisé à Vence (06140).</p>
    <a class="btn" data-to="tarifs" style="margin-top:6px">Voir les tarifs →</a>
  </section>

  <!-- 7. POUR QUI -->
  <section class="page" id="cas">
    <div class="eyebrow">Pour qui</div>
    <h2 class="t">Quel que soit votre lieu, votre public.</h2>
    <div class="uses carousel">
      <div class="use"><div class="uh"><span class="ui" style="background:var(--orange)"><svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"><path d="M7 2v8M5 2v6a2 2 0 0 0 4 0V2M7 10v12M16 2c-2 0-3 2-3 5s1 4 3 4v11"/></svg></span>Restaurant &amp; bar</div><p>Constituez une base de clients réguliers et communiquez vos offres directement, sans repasser par la pub.</p></div>
      <div class="use"><div class="uh"><span class="ui" style="background:var(--blue)"><svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"><path d="M6 8h12l-1 12H7zM9 8V6a3 3 0 0 1 6 0v2"/></svg></span>Commerce &amp; boutique</div><p>Transformez le passage en clientèle que vous pouvez relancer, seul ou avec les commerces de votre rue.</p></div>
      <div class="use"><div class="uh"><span class="ui" style="background:var(--violet)"><svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"><path d="M3 21h18M5 21V7l6-3 6 3v14"/><path d="M9 21v-4h4v4"/></svg></span>Association</div><p>Animez vos temps forts, gardez le lien avec vos membres et mesurez votre impact pour vos partenaires.</p></div>
      <div class="use"><div class="uh"><span class="ui" style="background:#0B6E4F"><svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"><path d="M3 21h18M3 10 12 4l9 6M5 10v11M19 10v11M10 21v-5h4v5"/></svg></span>Collectivité &amp; tourisme</div><p>Mesurez l'affluence et les profils de vos animations, et fédérez les acteurs locaux autour d'un même outil.</p></div>
      <div class="use"><div class="uh"><span class="ui" style="background:var(--teal)"><svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9.5h16M8 3v3M16 3v3"/></svg></span>Événementiel &amp; salon</div><p>Mesurez la fréquentation réelle et repartez avec une base qualifiée à chaque édition.</p></div>
    </div>
  </section>

  <!-- 8. MÉCANIQUES -->
  <section class="dark page" id="jeux">
    <div class="eyebrow">Les animations</div>
    <h2 class="t">6 façons d'animer.</h2>
    <p class="sub">On choisit ensemble celle qui colle à votre public. Personnalisez, sondez.</p>
    <div class="games carousel">
      <div class="game"><div class="gt"><div class="gi" style="background:#0B6E4F"><svg class="ic" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.4 9a2.6 2.6 0 1 1 3.7 2.4c-.9.4-1.1.9-1.1 1.8"/><path d="M12 16.5h.01"/></svg></div><div><h4>Quiz + bonus</h4><div class="tag">Engagez et sondez</div></div></div><ul><li>Un jeu à votre image qui capte l'attention</li><li>Vous sondez vos visiteurs en même temps</li></ul></div>
      <div class="game"><div class="gt"><div class="gi" style="background:var(--orange)"><svg class="ic" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4z"/><path d="M13 6v12" stroke-dasharray="2 2"/></svg></div><div><h4>Tombola</h4><div class="tag">Simple et efficace</div></div></div><ul><li>Vos lots, vos couleurs, en quelques clics</li><li>Tirage et gagnants gérés en un instant, prêts à diffuser</li></ul></div>
      <div class="game"><div class="gt"><div class="gi" style="background:var(--amber)"><svg class="ic" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"><path d="M7 11v8H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z"/><path d="M7 11l4-7a2 2 0 0 1 2 2v3h4.5a2 2 0 0 1 2 2.3l-1 5a2 2 0 0 1-2 1.7H7"/></svg></div><div><h4>Vote live</h4><div class="tag">Immersif et participatif</div></div></div><ul><li>Votre public s'exprime en direct</li><li>Vous récupérez les votes en 1 clic</li></ul></div>
      <div class="game"><div class="gt"><div class="gi" style="background:var(--teal)"><svg class="ic" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="8" r="3.4"/><path d="M5 20a7 7 0 0 1 14 0"/></svg></div><div><h4>Quiz solo</h4><div class="tag">Intéressez votre public</div></div></div><ul><li>Chacun joue à son rythme, sans animateur</li><li>Vous suivez les résultats en temps réel</li></ul></div>
      <div class="game"><div class="gt"><div class="gi" style="background:#F97316"><svg class="ic" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="9" r="5"/><path d="M9 13.5 7.5 21 12 18.5 16.5 21 15 13.5"/></svg></div><div><h4>Quiz master</h4><div class="tag">Fédérez votre communauté</div></div></div><ul><li>Tout le monde joue ensemble, en direct</li><li>Scores et gagnants gérés automatiquement — un moment fort qui rassemble</li></ul></div>
      <div class="game"><div class="gt"><div class="gi" style="background:var(--blue)"><svg class="ic" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/></svg></div><div><h4>Roue de la fortune</h4><div class="tag">L'accroche qui attire</div></div></div><ul><li>Donne envie de s'arrêter en une seconde</li><li>Transforme le passage en participation</li></ul></div>
    </div>
    <a class="btn" data-to="resultats" style="margin-top:18px">Voir les résultats →</a>
  </section>

  <!-- 9. TARIFS -->
  <section class="page" id="tarifs">
    <div class="eyebrow">Tarifs</div>
    <h2 class="t">Des tarifs clairs, pensés pour le terrain.</h2>
    <p class="sub">Pas de coûts cachés. Vous choisissez, on s'occupe du reste.</p>
    <div class="prices carousel">

      <div class="price">
        <div class="pn">À l'event</div>
        <div class="ptag">Pour un temps fort ponctuel ou un premier test.</div>
        <div class="pp">189 €<span class="pu"> / event · HT</span></div>
        <ul>
          <li>Jusqu'à 1 000 participants</li>
          <li>Tous les jeux · visuel à vos couleurs</li>
          <li>Tableau de bord temps réel · export</li>
        </ul>
      </div>

      <div class="price hl">
        <span class="pbadge">Le plus choisi</span>
        <div class="pn">Abonnement</div>
        <div class="ptag">Pour animer toute l'année et capitaliser votre base client.</div>
        <div class="pp">289 €<span class="pu"> / mois · HT</span></div>
        <div class="pgold"><span class="gi"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5l2.6 6.3 6.8.5-5.2 4.4 1.6 6.6L12 17.2 6.2 20.8l1.6-6.6L2.6 9.8l6.8-.5z"/></svg></span><span class="gt2"><b>Super Event inclus</b>Plusieurs commerces réunis, une animation commune, un tirage global — chacun garde sa base.</span></div>
        <ul>
          <li>Events illimités · jusqu'à 3 000 participants</li>
          <li>Tableau de bord multi-events</li>
          <li>Rapports analytiques</li>
        </ul>
      </div>

      <div class="price">
        <div class="pn">Sur mesure</div>
        <div class="ptag">Pour les multi-sites, gros volumes et besoins spécifiques.</div>
        <div class="pp">Sur devis</div>
        <ul>
          <li>Volumes importants · multi-sites</li>
          <li class="gold">Super Event sponsorisé · co-branding</li>
          <li>Campagne sur votre fichier client</li>
          <li>Stratégie &amp; développement</li>
        </ul>
      </div>

    </div>
    <div class="pmline"><span style="color:var(--blue);display:inline-flex"><svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.4"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="m16 11 2 2 4-4"/></svg></span> Un chef de projet dédié à votre compte.</div>
  </section>

  <!-- 10. CTA FINAL -->
  <section class="ctaf page" id="contact">
    <h2 class="t" style="color:#fff">Et si on animait votre lieu ?</h2>
    <p class="sub" style="color:rgba(255,255,255,.6)">Quelques minutes, sans matériel. On regarde ce qui marche chez vous.</p>
    <div class="form" id="cForm">
      <input type="text" placeholder="Votre prénom">
      <input type="email" inputmode="email" placeholder="Email professionnel">
      <input type="tel" inputmode="tel" placeholder="Téléphone">
      <select>
        <option value="">Secteur d'activité…</option>
        <option>Commerce &amp; Négoce</option>
        <option>Point de vente indépendant</option>
        <option>Restaurateur</option>
        <option>Association / Événementiel</option>
        <option>Municipalité / Office de tourisme</option>
        <option>Centre commercial</option>
        <option>Entreprise / RH</option>
        <option>Organisateur de salon</option>
      </select>
      <button class="btn" style="margin-top:6px">Réserver ma démo →</button>
    </div>
    <div id="cThanks" hidden>
      <div class="thanks"><h3>Demande envoyée !</h3><p>On vous répond sous 24 h pour caler votre rendez-vous. Sans engagement.</p></div>
    </div>
    <div class="ctaor">— ou joignez-nous directement —</div>
    <div class="calls">
      <a class="c-call" href="tel:+33616354936"><svg class="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h3l2 5-2.4 1.4a11 11 0 0 0 5 5L14 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg> Appel</a>
      <a class="c-wa" href="https://wa.me/33616354936"><svg class="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.7-4.1A8 8 0 1 1 8 19.4z"/></svg> WhatsApp</a>
      <a class="c-mail" href="mailto:info@opconsult.co"><svg class="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg> Email</a>
    </div>
    <div class="rgpd">Données jamais cédées à des tiers · RGPD</div>
  </section>

  <footer>
    <div class="lg">Flow<em>in</em></div>
    <div>Flowin is powered by OPConsult · Vence, France</div>
    <div style="margin-top:8px"><a href="mailto:info@opconsult.co">info@opconsult.co</a> · <a href="tel:+33493599137">04 93 59 91 37</a> · <a href="tel:+33616354936">06 16 35 49 36</a></div>
  </footer>
</div>`

export default function LandingClient({ cfg, source = '' }: { cfg?: any; source?: string }) {
  void cfg
  useEffect(() => {
    trackVisite('landing')

    const GROUPS: Record<string, string[]> = { top:['top'], probleme:['probleme'], comment:['solution','superevent','jeux'], resultats:['benefices','resultats'], tarifs:['cas','tarifs','contact'], contact:['contact'] }
    const menuLinks = Array.from(document.querySelectorAll('.menu .links a'))
    function setActive(id: string) { menuLinks.forEach((a) => { const t = a.getAttribute('data-to'); if (t === id) a.classList.add('active'); else a.classList.remove('active') }) }
    function showPage(key: string) {
      if (!GROUPS[key]) key = 'top'
      const ids = GROUPS[key]
      Array.from(document.querySelectorAll('section.page')).forEach((p) => p.classList.remove('show'))
      ids.forEach((id) => { const s = document.getElementById(id); if (s) s.classList.add('show') })
      setActive(key); window.scrollTo(0, 0)
      const at = menuLinks.find((a) => a.getAttribute('data-to') === key) as HTMLElement | undefined
      if (at && at.scrollIntoView) at.scrollIntoView({ inline: 'center', block: 'nearest' })
    }
    Array.from(document.querySelectorAll('[data-to]')).forEach((el) => el.addEventListener('click', () => showPage(el.getAttribute('data-to') || 'top')))
    const app = document.querySelector('.app'); if (app) app.classList.add('paged')
    showPage('top')

    function buildDots(car: any) {
      const slides = car.children, n = slides.length
      if (n < 2) return
      const dots = document.createElement('div')
      dots.className = 'dots' + ((car.closest('.dark') || car.closest('.darker')) ? '' : ' dk')
      for (let k = 0; k < n; k++) {
        const d = document.createElement('span')
        d.className = 'dot' + (k === 0 ? ' on' : '')
        const idx = k
        d.addEventListener('click', () => slides[idx].scrollIntoView({ behavior:'smooth', inline:'center', block:'nearest' }))
        dots.appendChild(d)
      }
      car.parentNode.insertBefore(dots, car.nextSibling)
      car.addEventListener('scroll', () => {
        let pitch = slides[1].offsetLeft - slides[0].offsetLeft
        if (pitch <= 0) pitch = car.clientWidth || 1
        let idx = Math.round(car.scrollLeft / pitch)
        if (idx < 0) idx = 0
        if (idx > n - 1) idx = n - 1
        const dd = dots.children
        for (let j = 0; j < dd.length; j++) { (dd[j] as HTMLElement).className = (j === idx) ? 'dot on' : 'dot' }
      })
    }
    Array.from(document.querySelectorAll('.carousel')).forEach((c) => buildDots(c))

    const btn = document.querySelector('#cForm button') as HTMLButtonElement | null
    if (btn) {
      btn.addEventListener('click', async () => {
        const f = document.getElementById('cForm') as HTMLElement
        const ins = Array.from(f.querySelectorAll('input,select')) as (HTMLInputElement | HTMLSelectElement)[]
        let ok = true
        ins.forEach((el) => { if (!el.value.trim()) { el.style.borderColor = '#EF6B6B'; ok = false } else el.style.borderColor = '' })
        if (!ok) return
        const prenom = ins[0].value.trim(), email = ins[1].value.toLowerCase().trim(), tel = ins[2].value.trim(), secteur = ins[3].value
        try {
          const today = new Date().toISOString().slice(0, 10)
          await supabase.from('joueurs').upsert({
            external_id: 'j-cta-' + email.replace(/[^a-z0-9]/g, '-').substring(0, 36),
            email, prenom, tel: tel || null,
            tags: ['btob','cta', secteur].filter(Boolean),
            optin: true, optin_date: today, first_seen: today, last_seen: today,
            source: source === 'qr' ? 'landing_qr' : 'landing_cta', client_type: 'btob', enseigne: secteur || null, secteur: secteur || null,
            ts: new Date().toISOString(),
          }, { onConflict: 'external_id' })
        } catch { /* best-effort */ }
        ;(document.getElementById('cForm') as HTMLElement).hidden = true
        const th = document.getElementById('cThanks'); if (th) th.hidden = false
      })
    }
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div dangerouslySetInnerHTML={{ __html: BODY }} />
    </>
  )
}
