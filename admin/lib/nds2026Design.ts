// Design NDS v24 (CSS + sprite icônes) — extrait de la maquette, injecté dans le master React
export const NDS_CSS = `
  :root{
    --purple:#7C2D92; --purple-deep:#5A1E6E;
    --card1:#2B1036; --card2:#160820;
    --orange:#F5A100; --magenta:#E0218A; --magenta2:#8E2E9E; --pink-glow:#F7A8D4;
    --ink:#1c1024; --muted:#8a7e93; --line:#efe9f2;
  }
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
  body{background:#0c0a12;font-family:'Manrope',system-ui,sans-serif;color:#fff;-webkit-font-smoothing:antialiased;display:flex;flex-direction:column;align-items:center;height:100vh;height:100dvh;padding:10px 10px 0;overflow:hidden}
  .head{width:100%;max-width:480px;margin-bottom:8px;flex-shrink:0}
  .head h1{font-family:'Manrope';font-size:16px;font-weight:800}
  .head p{font-size:11.5px;color:#8c97ad;margin-top:2px}
  .bar{display:flex;gap:6px;width:100%;max-width:480px;margin-bottom:10px;flex-wrap:wrap;flex-shrink:0}
  .bar button{border:1px solid #34244a;background:#1a1230;color:#bba8d0;font-family:inherit;font-weight:700;font-size:11px;padding:8px 10px;border-radius:10px;cursor:pointer}
  .bar button.on{background:var(--magenta);border-color:var(--magenta);color:#fff}

  .phone{position:relative;width:100%;max-width:480px;flex:1;min-height:0;background:#fff;border-radius:22px 22px 0 0;overflow:hidden;box-shadow:0 -2px 40px rgba(0,0,0,.4)}
  .scr{position:absolute;inset:0;display:none;overflow-y:auto}
  .scr.on{display:block}
  .scr.purple{background:linear-gradient(180deg,#2a1036,#160820)}
  .disp{font-family:'Manrope'}

  /* icônes SVG */
  .ic{display:inline-block;width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vertical-align:middle;flex-shrink:0}

  /* ===== ACCUEIL ===== */
  .hero{display:block;position:relative}
  .hlogo{display:block;height:86px;width:auto;max-width:90%}
  .hart{display:block;width:100%;height:auto}
  .hbar{background:#6e2785;padding:10px 0 10px 16px;line-height:0}
  .qbadge{position:absolute;left:14px;bottom:14px;display:inline-flex;align-items:center;gap:10px;background:linear-gradient(135deg,#2746A6,#3B7DE0);color:#fff;box-shadow:0 6px 22px rgba(39,70,166,.42);border-radius:16px;padding:10px 14px;max-width:88%}
  .qdot{width:10px;height:10px;border-radius:50%;background:#4ADE80;flex-shrink:0;box-shadow:0 0 0 4px rgba(74,222,128,.25)}
  .qtx b{display:block;font-size:15px;font-weight:800;line-height:1.15}
  .qtx i{display:block;font-size:12.5px;opacity:.9;font-style:normal;margin-top:1px}
  .prize{margin:-56px 18px 0;z-index:2;border-radius:18px;background:linear-gradient(180deg,var(--card1),var(--card2));padding:15px 16px;position:relative;overflow:hidden;box-shadow:0 14px 30px rgba(43,16,54,.38)}
  .prize:before{content:"";position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,var(--orange),var(--magenta),#6f4bd8)}
  .prize .lbl{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:11px}
  .prow{display:flex;align-items:center;gap:13px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:11px 13px}
  .prow .sq{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff}
  .prow .sq .ic{width:22px;height:22px}
  .prow .nm{font-family:'Manrope';font-weight:700;font-size:19px;line-height:1.05}
  .prow .vl{font-size:13px;font-weight:700;color:var(--orange);margin-top:1px}
  .prize .div{height:1px;background:rgba(255,255,255,.1);margin:11px 2px 10px}
  .prize .tir{display:flex;align-items:center;gap:9px;font-size:13.5px;font-weight:600;color:rgba(255,255,255,.82)}
  .prize .tir .ic{width:16px;height:16px;color:var(--orange)}

  /* règles */
  .rules{margin:18px 18px 0}
  .rules .rt{font-family:'Manrope';font-size:19px;font-weight:700;color:var(--ink);margin-bottom:12px}
  .rstep{display:flex;align-items:center;gap:14px;background:#faf6fc;border:1px solid #f0e6f5;border-radius:16px;padding:13px 15px;margin-bottom:10px;color:var(--ink)}
  .rstep .ri{width:42px;height:42px;border-radius:12px;background:#fff;border:1px solid #efe2f5;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--purple)}
  .rstep .ri .ic{width:21px;height:21px}
  .rstep .num{font-family:'Manrope';font-size:13px;font-weight:800;color:var(--magenta);margin-bottom:1px}
  .rstep .rh{font-size:15px;font-weight:800}
  .rstep .rs{font-size:12.5px;color:#6b6076;margin-top:1px;line-height:1.4}
  .cumul{display:flex;gap:13px;align-items:center;background:linear-gradient(135deg,#f3e6fa,#fbe8f2);border:1px solid #eed7f0;border-radius:16px;padding:14px 15px;margin-top:4px;color:var(--purple-deep)}
  .cumul .ci{width:40px;height:40px;border-radius:11px;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--magenta)}
  .cumul .tx{font-size:13.5px;line-height:1.45;font-weight:600}
  /* bandeau */
  .bandeau{margin:16px 18px 0;display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#f3e6fa,#fbe8f2);border:1px solid #eed7f0;border-radius:16px;padding:13px 14px}
  .bstep{display:flex;align-items:center;gap:7px;font-size:13.5px;font-weight:800;color:var(--purple-deep)}
  .bstep .bi{color:var(--magenta);display:flex}
  .bstep .bi .ic{width:18px;height:18px}
  .bsep{display:flex;color:#caa9d6}
  .bsep .ic{width:15px;height:15px}
  .bnote{text-align:center;font-size:12px;color:#9a8fa6;margin:9px 24px 0;line-height:1.45}

  .cta{display:block;margin:18px 18px 0;text-align:center;border:none;border-radius:50px;padding:17px;font-family:'Manrope';font-weight:700;font-size:19px;color:#fff;text-decoration:none;cursor:pointer;
       background:linear-gradient(90deg,var(--magenta2),var(--magenta));box-shadow:0 0 0 5px rgba(247,168,212,.45),0 12px 26px rgba(224,33,138,.4)}
  .legal{text-align:center;font-size:11px;color:#a99fb3;margin:14px 24px 26px;line-height:1.5}

  /* ===== INSCRIPTION ===== */
  .pad{padding:22px 20px 30px}
  .dhead{display:flex;align-items:center;gap:10px;margin-bottom:18px}
  .back{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff}
  .back .ic{width:18px;height:18px}
  .dtitle{font-family:'Manrope';font-weight:700;font-size:21px}
  .dsub{font-size:12.5px;color:rgba(255,255,255,.5)}
  .label{display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.45);margin-bottom:5px}
  .input{width:100%;padding:13px 14px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.14);border-radius:13px;color:#fff;font-size:15px;font-weight:600;outline:none;font-family:inherit}
  .input::placeholder{color:rgba(255,255,255,.32)}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .chips{display:flex;flex-wrap:nowrap;gap:8px;margin-top:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;scroll-snap-type:x proximity;padding-bottom:4px}
  .chips::-webkit-scrollbar{display:none}
  .chip{flex:0 0 auto;scroll-snap-align:start;white-space:nowrap;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:7px 13px;font-size:12px;font-weight:600;color:rgba(255,255,255,.62)}
  .chip.sel{background:rgba(224,33,138,.18);border-color:var(--magenta);color:#ffd5ec}
  .rgpd{display:flex;gap:10px;align-items:flex-start;margin:16px 0 0;font-size:11px;color:rgba(255,255,255,.5);line-height:1.5}
  .rgpd-check{cursor:pointer;padding:12px;border:1px solid rgba(255,255,255,.14);border-radius:12px;background:rgba(255,255,255,.03);transition:border-color .2s,background .2s}
  .rgpd-check.on{border-color:var(--magenta);background:rgba(232,33,107,.06)}
  .rgpd .rc{width:22px;height:22px;border-radius:6px;border:1.5px solid rgba(255,255,255,.3);background:transparent;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;transition:background .2s,border-color .2s}
  .rgpd-check.on .rc{background:var(--magenta);border-color:var(--magenta)}
  .rgpd .rc .ic{width:13px;height:13px;stroke-width:3}
  .btn{display:block;width:100%;text-align:center;border:none;border-radius:50px;padding:16px;font-family:'Manrope';font-weight:700;font-size:18px;color:#fff;cursor:pointer;text-decoration:none;margin-top:18px;background:linear-gradient(90deg,var(--magenta2),var(--magenta));box-shadow:0 10px 24px rgba(224,33,138,.35)}
  .btn-ghost{display:block;text-align:center;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:50px;color:rgba(255,255,255,.82);font-size:14px;font-weight:700;padding:14px;cursor:pointer;font-family:inherit;text-decoration:none;margin-top:10px}

  /* ===== CARTE ===== */
  #mapC{position:absolute;inset:0;z-index:0}
  .map-top{position:absolute;top:0;left:0;right:0;z-index:900;padding:14px;pointer-events:none}
  .map-top .qc{display:inline-flex;align-items:center;gap:11px;background:#fff;color:var(--ink);box-shadow:0 6px 22px rgba(20,26,38,.22);border-radius:16px;padding:11px 15px;pointer-events:auto;max-width:94%}
  .map-top .qc .em{width:34px;height:34px;border-radius:11px;background:linear-gradient(135deg,var(--purple),var(--magenta));display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff}
  .map-top .qc .em .ic{width:18px;height:18px}
  .map-top .qc .t{font-family:'Manrope';font-size:16px;font-weight:700;line-height:1.05}
  .map-top .qc .s{font-size:12px;color:#7a708a;margin-top:1px}
  .map-top .qc .tk{margin-left:6px;display:flex;align-items:center;gap:5px;background:#fbe9f4;color:var(--magenta);font-weight:800;border-radius:10px;padding:6px 9px;font-size:13px;flex-shrink:0}
  .map-top .qc .tk .ic{width:15px;height:15px}
  .locate{position:absolute;right:16px;bottom:150px;z-index:900;width:46px;height:46px;border-radius:14px;background:#fff;border:none;box-shadow:0 4px 14px rgba(20,26,38,.25);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--purple)}
  .locate .ic{width:22px;height:22px}
  .map-sheet{position:absolute;left:14px;right:14px;bottom:84px;z-index:900;background:#fff;color:var(--ink);border-radius:18px;box-shadow:0 10px 34px rgba(20,26,38,.25);padding:15px 16px;display:none}
  .map-sheet.on{display:block;animation:rise .25s ease}
  @keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  .ms-row{display:flex;align-items:center;gap:13px}
  .ms-ico{width:46px;height:46px;border-radius:13px;background:linear-gradient(135deg,var(--purple),var(--magenta));display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff}
  .ms-ico .ic{width:24px;height:24px}
  .ms-nm{font-family:'Manrope';font-size:18px;font-weight:700}
  .ms-ou{font-size:12.5px;color:#6b6076;margin-top:1px}
  .ms-tag{margin-left:auto;font-size:11px;font-weight:800;padding:4px 9px;border-radius:100px;flex-shrink:0}
  .ms-note{display:flex;gap:9px;align-items:flex-start;background:#FBF1E6;color:#8a5a1e;border-radius:12px;padding:11px 13px;font-size:13px;line-height:1.45;margin-top:12px}
  .ms-note .ic{width:16px;height:16px;flex-shrink:0;margin-top:1px}

  /* ===== QUIZ ===== */
  .progress{display:flex;gap:6px;margin-bottom:18px}
  .pstep{flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,.14)}
  .pstep.on{background:var(--magenta)}
  .qcard{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:18px;margin-bottom:14px}
  .qtxt{font-family:'Manrope';font-size:19px;font-weight:700;line-height:1.3;margin-bottom:16px}
  .opt{display:block;width:100%;text-align:left;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.14);border-radius:14px;padding:14px 15px;color:#fff;font-size:15px;font-weight:600;font-family:inherit;margin-bottom:10px;cursor:pointer}
  .opt.sel{border-color:var(--magenta);background:rgba(224,33,138,.16)}
  .preview{font-size:12px;color:rgba(255,255,255,.4);text-align:center;margin-top:4px}

  /* ===== RÉSULTATS ===== */
  .res-head{position:relative;background:linear-gradient(180deg,var(--purple),var(--purple-deep));color:#fff;text-align:center;padding:30px 22px 26px}
  .res-head:before{content:"";position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,var(--orange),var(--magenta),#6f4bd8)}
  .res-ico{width:62px;height:62px;border-radius:50%;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;margin:0 auto 12px}
  .res-ico .ic{width:30px;height:30px;color:#fff}
  .res-bravo{font-size:34px;font-weight:800;line-height:1}
  .res-sub{font-size:13.5px;color:rgba(255,255,255,.82);margin-top:8px}
  .res-body{padding:0 18px 30px}
  .score-card{background:#f6effa;border-radius:20px;padding:22px;text-align:center;margin:18px 0 16px}
  .score{font-size:60px;font-weight:800;color:var(--purple);line-height:1}
  .score-line{font-size:15px;font-weight:700;color:var(--magenta);margin-top:2px}
  .infocard{display:flex;gap:12px;align-items:flex-start;background:#faf7fc;border-radius:14px;border-left:4px solid #ccc;padding:14px 15px;margin-bottom:10px;font-size:14.5px;color:#33283b;line-height:1.4}
  .infocard .ic{width:19px;height:19px;flex-shrink:0;margin-top:1px}
  .b-orange{border-left-color:var(--orange)} .b-orange .ic{color:var(--orange)}
  .b-magenta{border-left-color:var(--magenta)} .b-magenta .ic{color:var(--magenta)}
  .b-green{border-left-color:#1D9E75} .b-green .ic{color:#1D9E75}
  .double{display:flex;align-items:center;justify-content:center;gap:9px;text-align:center;text-decoration:none;cursor:pointer;margin:16px 0;border-radius:50px;padding:16px;font-family:'Manrope';font-weight:700;font-size:17px;color:#fff;background:linear-gradient(90deg,var(--magenta2),var(--magenta));box-shadow:0 0 0 5px rgba(247,168,212,.4),0 10px 22px rgba(224,33,138,.35)}
  .double .ic{width:20px;height:20px}
  .bonusbtn{display:flex;align-items:center;justify-content:center;gap:9px;text-align:center;text-decoration:none;cursor:pointer;margin:16px 0;border-radius:50px;padding:17px;font-family:'Manrope';font-weight:800;font-size:17px;color:#fff;background:linear-gradient(90deg,#1d4ed8,#3b82f6);animation:pulseBlue 1.4s ease-in-out infinite}
  .bonusbtn .ic{width:21px;height:21px}
  @keyframes pulseBlue{0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,.55),0 10px 22px rgba(37,99,235,.42)}50%{box-shadow:0 0 0 11px rgba(59,130,246,0),0 12px 26px rgba(37,99,235,.5)}}
  .parrainbtn{display:flex;align-items:center;justify-content:center;gap:9px;text-align:center;text-decoration:none;cursor:pointer;margin:14px 0;border-radius:50px;padding:16px;font-family:'Manrope';font-weight:800;font-size:16px;color:#fff;background:linear-gradient(90deg,#0d9488,#10b981);animation:pulseGreen 1.7s ease-in-out infinite}
  .parrainbtn .ic{width:20px;height:20px}
  @keyframes pulseGreen{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.55),0 10px 22px rgba(5,150,105,.38)}50%{box-shadow:0 0 0 11px rgba(16,185,129,0),0 12px 26px rgba(5,150,105,.48)}}
  .ticketfly{position:fixed;left:50%;bottom:42%;transform:translateX(-50%);z-index:4000;pointer-events:none;font-family:'Manrope';font-weight:800;font-size:34px;color:#10b981;text-shadow:0 4px 14px rgba(16,185,129,.45);animation:flyUp 1.25s cubic-bezier(.2,.7,.3,1) forwards}
  @keyframes flyUp{0%{opacity:0;transform:translateX(-50%) translateY(20px) scale(.5)}18%{opacity:1;transform:translateX(-50%) translateY(0) scale(1.15)}100%{opacity:0;transform:translateX(-50%) translateY(-190px) scale(1)}}
  .res-eyebrow{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#9a8fa6;margin:6px 0 9px}
  .nextcard{background:#faf7fc;border:1px solid #f0e6f5;border-radius:14px;padding:4px 13px;margin-bottom:8px}
  .nextline{display:flex;align-items:center;gap:11px;padding:10px 0;border-bottom:1px solid #f0e6f5}
  .nextline:last-child{border-bottom:none}
  .nextline .em{width:34px;height:34px;border-radius:10px;background:#fbe9f4;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--magenta)}
  .nextline .em .ic{width:17px;height:17px}
  .nextline .nm{font-size:14px;font-weight:800;color:var(--ink)}
  .nextline .ou{font-size:12px;color:#8a7e93}
  .reslink{display:block;text-align:center;color:var(--purple);font-weight:700;font-size:14px;text-decoration:none;padding:10px;margin-bottom:18px}
  .social-lbl{text-align:center;font-size:13px;color:#9a8fa6;font-weight:600;margin-bottom:11px}
  .social-row{display:flex;gap:10px;justify-content:center}
  .social-pill{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;border:1.5px solid #ecdff2;border-radius:50px;padding:12px 6px;font-size:13px;font-weight:800;color:var(--purple);text-decoration:none}
  .social-pill .ic{width:16px;height:16px}

  /* ===== BONUS (light) ===== */
  .bonus-wrap{background:linear-gradient(180deg,#f7eefb,#fdf6ee);min-height:100%;padding:24px 20px 30px}
  .bonus-banner{display:flex;align-items:center;justify-content:center;gap:9px;text-align:center;border-radius:50px;padding:15px;font-family:'Manrope';font-weight:700;font-size:18px;color:#fff;background:linear-gradient(90deg,var(--magenta),#7a1f50);box-shadow:0 8px 22px rgba(224,33,138,.3)}
  .bonus-banner .ic{width:20px;height:20px}
  .bonus-sub{text-align:center;font-size:13.5px;color:#7a708a;margin:13px 0 4px}
  .skip{display:block;text-align:center;font-size:13.5px;color:#9a8fa6;text-decoration:underline;margin-bottom:16px}
  .bcard{background:#fff;border-radius:16px;border-left:4px solid var(--magenta);box-shadow:0 2px 10px rgba(124,45,146,.08);padding:16px;margin-bottom:12px}
  .bq{font-family:'Manrope';font-size:17px;font-weight:700;color:var(--ink);margin-bottom:12px}
  .bopt{display:inline-block;background:#faf6fc;border:1.5px solid #efe2f5;border-radius:50px;padding:10px 16px;font-size:14px;font-weight:600;color:#52455e;margin:0 6px 8px 0;cursor:pointer}
  .bopt.sel{background:rgba(224,33,138,.12);border-color:var(--magenta);color:#a11f6e}
  .btn-light{display:block;text-align:center;border:none;border-radius:50px;padding:16px;font-family:'Manrope';font-weight:700;font-size:18px;color:#fff;cursor:pointer;text-decoration:none;margin-top:8px;background:linear-gradient(90deg,var(--magenta2),var(--magenta));box-shadow:0 10px 24px rgba(224,33,138,.3)}

  /* ===== MES TICKETS ===== */
  .padnav{padding-bottom:84px}
  .tk-hero{background:linear-gradient(150deg,var(--purple),var(--magenta));color:#fff;border-radius:22px;padding:24px;text-align:center;margin-bottom:16px;box-shadow:0 14px 30px rgba(124,45,146,.32)}
  .tk-big{font-family:'Manrope';font-size:52px;font-weight:800;line-height:1}
  .tk-lbl{font-size:13px;opacity:.92;margin-top:2px}
  .tk-draw{margin-top:14px;display:flex;align-items:center;justify-content:center;gap:7px;background:rgba(255,255,255,.16);border-radius:12px;padding:10px 12px;font-size:13px;font-weight:600}
  .tk-draw .ic{width:16px;height:16px}
  .eyebrow{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#9a8fa6;margin-bottom:10px}
  .prog3{display:flex;gap:8px;margin-bottom:16px}
  .prog3 .c{flex:1;text-align:center;border-radius:15px;padding:14px 6px;background:#faf6fc;border:1px solid #f0e6f5;color:var(--ink)}
  .prog3 .c.done{background:#E9F7F0;border-color:#bfedd6;color:var(--purple-deep)}
  .prog3 .c .e{display:flex;justify-content:center;color:var(--purple)}
  .prog3 .c.done .e{color:#1D9E75}
  .prog3 .c .e .ic{width:22px;height:22px}
  .prog3 .c .n{font-size:11px;font-weight:800;margin-top:6px}
  .prog3 .c .st{font-size:10px;margin-top:2px;opacity:.8}
  .tk-tip{display:flex;gap:11px;align-items:flex-start;background:#faf6fc;border:1px solid #f0e6f5;border-radius:16px;padding:14px 15px;font-size:13.5px;color:#52455e;line-height:1.5}
  .tk-tip .ic{width:18px;height:18px;flex-shrink:0;margin-top:1px;color:var(--magenta)}

  /* ===== PARTENAIRES ===== */
  .pt-hero{font-family:'Manrope';font-size:24px;font-weight:800;color:var(--ink)}
  .pt-sub{font-size:13.5px;color:#6b6076;margin:6px 0 16px;line-height:1.5}
  .pt-banner{display:flex;gap:9px;align-items:flex-start;background:#FBF1E6;border:1px solid #f3e2cb;color:#8a5a1e;border-radius:13px;padding:11px 13px;font-size:12.5px;font-weight:600;margin-bottom:16px}
  .pt-banner .ic{width:16px;height:16px;flex-shrink:0;margin-top:1px}
  .pt-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .pt-card{background:transparent;border:none;border-radius:0;padding:10px 6px;text-align:center;cursor:pointer;color:var(--ink)}
  .pt-logo{width:96px;height:96px;background:transparent;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;color:var(--magenta);overflow:hidden}
  .pt-logo .ic{width:34px;height:34px}
  .pt-nm{font-size:13.5px;font-weight:800;color:#7a708a}
  .pt-lots{margin:12px 0 4px}
  .pt-lots-h{display:flex;align-items:center;gap:8px;font-weight:800;font-size:13px;color:#7C2D92;margin-bottom:9px}
  .pt-lots-h .ic{width:16px;height:16px}
  .pt-lot{background:#faf7fd;border:1px solid #ece2f3;border-radius:13px;padding:10px 13px;margin-bottom:8px}
  .pt-lot-t{font-weight:800;font-size:14.5px;color:#1a1226}
  .pt-lot-q{display:inline-block;margin-top:4px;font-size:11.5px;font-weight:800;color:#0e7c6e;background:rgba(32,224,196,.16);border-radius:100px;padding:2px 9px}
  .pt-lot-d{font-size:12.5px;color:#6b6076;margin-top:5px;line-height:1.45}

  .pt-dim{position:absolute;inset:0;z-index:1500;background:rgba(28,16,36,.5);display:none}
  .pt-dim.on{display:block}
  .pt-sheet{position:absolute;left:0;right:0;bottom:0;z-index:1600;background:#fff;color:var(--ink);border-radius:24px 24px 0 0;box-shadow:0 -6px 30px rgba(0,0,0,.25);padding:8px 22px 28px;display:none}
  .pt-sheet.on{display:block;animation:rise .28s ease}
  .pt-grab{width:48px;height:6px;background:#e3dae9;border-radius:3px;margin:10px auto 16px}
  .pt-bigl{width:74px;height:74px;border-radius:20px;background:linear-gradient(135deg,#f3e9f7,#fbe9f4);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;color:var(--magenta)}
  .pt-bigl .ic{width:34px;height:34px}
  .pt-bign{font-family:'Manrope';font-size:20px;font-weight:700;text-align:center}
  .pt-prev{font-size:12px;color:#a99fb3;text-align:center;margin:4px 0 16px}
  .pt-links{display:flex;gap:9px}
  .pt-link{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:13px;border-radius:13px;color:#fff;text-decoration:none;font-weight:700;font-size:13px}
  .pt-link .ic{width:16px;height:16px}

  /* ===== NAV ===== */
  .nav{position:absolute;left:0;right:0;bottom:0;z-index:1200;display:none;background:#fff;border-top:1px solid #efe6f3;padding:8px 8px calc(12px + env(safe-area-inset-bottom))}
  .nav.on{display:flex}
  .nb{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;border:none;background:none;cursor:pointer;font-size:10px;font-weight:800;color:#9a8fa6;font-family:inherit}
  .nb.on{color:var(--magenta)}
  .nb .ic{width:21px;height:21px}

/* === ACCUEIL NDS v2 === */

  
  
  
  
  .hero{background:#6e2785;padding:20px 22px 22px}
  .hlogo{display:block;width:62%;max-width:230px;height:auto;margin:0;filter:drop-shadow(0 3px 12px rgba(0,0,0,.3))}

  .htop{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:700;letter-spacing:.18em;color:#e7d4ef;text-transform:uppercase;margin-bottom:10px}
  .hname{font-size:56px;line-height:.9;font-weight:800;letter-spacing:-2px;color:#fff}
  .hdate{font-size:21px;font-weight:800;color:var(--orange);margin-top:12px;letter-spacing:-.5px}
  .stage{position:relative;background:linear-gradient(180deg,#6e2785 0%,#3a1450 45%,#160820 100%);padding:22px 0 1px}
  .stage::before{content:none}
  .prize{position:relative;z-index:1;margin:0 18px;border-radius:20px;background:rgba(20,8,22,.5);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.14);padding:17px 16px;box-shadow:0 16px 40px rgba(0,0,0,.3)}
  .lbl{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.45);margin-bottom:12px}
  .prow{display:flex;align-items:center;gap:13px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:12px 13px;margin-bottom:10px}
  .sq{width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:20px}
  .nm{font-weight:800;font-size:21px;line-height:1.05;color:#fff}
  .vl{font-size:14px;font-weight:700;color:var(--orange);margin-top:2px}
  .div{height:1px;background:rgba(255,255,255,.1);margin:6px 2px 12px}
  .tir{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:600;color:rgba(255,255,255,.85)}
  .dot{width:8px;height:8px;border-radius:50%;background:var(--orange);flex-shrink:0}
  .btn{position:relative;z-index:1;display:block;width:calc(100% - 36px);margin:20px 18px 14px;text-align:center;border:none;border-radius:50px;padding:17px;font-weight:800;font-size:18px;color:#fff;cursor:pointer;background:linear-gradient(90deg,var(--magenta2),var(--magenta));box-shadow:0 0 0 5px rgba(247,168,212,.4),0 12px 26px rgba(224,33,138,.32)}
  .foot{position:relative;z-index:1;color:rgba(255,255,255,.7);text-align:center;font-size:12.5px;color:#9a8fa6;padding:0 24px 26px}

#onboard .nm,#onboard .btn,#onboard .foot{font-family:'Manrope',system-ui,sans-serif !important}

/* === CORRECTIONS v24 === */
#quiz .sel{background:rgba(255,255,255,.14)!important;border-color:rgba(255,255,255,.5)!important;color:#fff!important}
@keyframes popIn{from{opacity:0;transform:scale(.72)}to{opacity:1;transform:scale(1)}}
#resultats .score-card{animation:popIn .5s cubic-bezier(.2,.8,.3,1.25) both}
#resultats .score{animation:popIn .6s .12s cubic-bezier(.2,.8,.3,1.25) both}
`

export const NDS_SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-scan" viewBox="0 0 24 24"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></symbol>
  <symbol id="i-help" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></symbol>
  <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></symbol>
  <symbol id="i-ticket" viewBox="0 0 24 24"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v14"/></symbol>
  <symbol id="i-pin" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></symbol>
  <symbol id="i-glass" viewBox="0 0 24 24"><path d="M8 22h8"/><path d="M12 15v7"/><path d="M7 3h10l-1 8a4 4 0 0 1-8 0L7 3Z"/></symbol>
  <symbol id="i-monitor" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></symbol>
  <symbol id="i-gift" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8"/><path d="M16.5 8a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8"/></symbol>
  <symbol id="i-trophy" viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 22v-3.6h4V22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></symbol>
  <symbol id="i-checkc" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m8.5 12 2.5 2.5 4.5-5"/></symbol>
  <symbol id="i-spark" viewBox="0 0 24 24"><path d="M12 3l1.7 5L19 9.7 13.7 11.4 12 17l-1.7-5.6L5 9.7 10.3 8 12 3Z"/></symbol>
  <symbol id="i-insta" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"/></symbol>
  <symbol id="i-fb" viewBox="0 0 24 24"><path d="M17 2h-3a5 5 0 0 0-5 5v3H6v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" fill="currentColor" stroke="none"/></symbol>
  <symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z"/></symbol>
  <symbol id="i-map" viewBox="0 0 24 24"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14"/><path d="M15 6v14"/></symbol>
  <symbol id="i-store" viewBox="0 0 24 24"><path d="M4 9.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9.5"/><path d="M3 9.5 4.6 4h14.8L21 9.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z"/></symbol>
  <symbol id="i-layers" viewBox="0 0 24 24"><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></symbol>
  <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>
  <symbol id="i-image" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></symbol>
  <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></symbol>
  <symbol id="i-arrowl" viewBox="0 0 24 24"><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></symbol>
</svg>`
