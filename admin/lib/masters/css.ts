/* GENERE depuis la maquette validee (scratchpad/maquettes-jeux/index.html) :
   CSS des ecrans telephone, couleurs remplacees par les jetons du theme. */
export const MASTER_CSS = `/* Variables courtes des maquettes, branchees sur le fichier de theme unique
   public/flowin-theme.css (jetons --fl-*). L'accent commun = --fl-accent. */
.fm{--ink:var(--fl-ink);--ink2:var(--fl-ink-2);--muted:var(--fl-muted);--line:var(--fl-line);--field:var(--fl-field);--cta:var(--fl-accent);
--white:#FFFFFF;--off:var(--fl-paper);--mint:var(--fl-mint);--sky:var(--fl-sky);--peach:var(--fl-mint);
--coral:#F26B4F;--violet:var(--fl-solo);--gold:#F5A100;--teal:var(--fl-spin);--blue:var(--fl-vote);--sy:var(--fl-super-jaune);--sr:var(--fl-super-rouge);--sb:var(--fl-super-bleu);--logo-in:var(--fl-blue);
--ok:var(--fl-ok);--ko:var(--fl-ko);--page:var(--fl-paper);
color:var(--ink);font-family:var(--fl-font);-webkit-font-smoothing:antialiased}
:where(.fm) *{box-sizing:border-box;margin:0;padding:0}
:where(.fm) button{font-family:inherit;color:inherit}
.fm .ic{display:inline-block;flex:none;vertical-align:middle}
.fm .pp{display:inline-block;background:var(--fl-accent);color:var(--fl-accent-ink);font-weight:800;font-size:13px;padding:8px 18px;border-radius:99px;letter-spacing:-.01em;white-space:nowrap}
.fm input.inp{font-family:inherit}
:where(.fm .scr>div){flex-shrink:0}
.fm .pband.bas{margin:0;box-shadow:none;border-top:1.5px solid var(--line);border-bottom:0;padding:7px 0 8px;background:#fff}
.fm .pband.bas .ph2{padding-bottom:5px}
.fm .pband.bas .plogo{width:84px!important;height:40px!important}
.fm .pband.bas .vg b{font-size:9.5px}
.fm .foot .pband.bas{margin:12px -20px -28px;padding-bottom:calc(12px + env(safe-area-inset-bottom))}
.fm .dock .pband.bas{margin-top:8px}
.fm .scr>.pband.bas{margin-top:auto;position:sticky;bottom:0;z-index:6}
.fm .fm-err{color:var(--fl-ko);font-size:12.5px;font-weight:700;margin-top:6px}
.fm .fm-logo{width:100%;height:100%;object-fit:contain;border-radius:inherit;background:#fff}
.fm .vitrine img,.fm .av img{width:100%;height:100%;object-fit:cover;position:relative;z-index:1}
/* ================= TÉLÉPHONE : BASE COMMUNE ================= */
.scr{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;scrollbar-width:none;background:var(--bg);color:var(--ink);--bg:#fff}
.scr::-webkit-scrollbar{display:none}
.scr>*{position:relative;z-index:1}
.scr>.geo,.scr>.confetti{position:absolute;z-index:0;pointer-events:none}
.bg-w{--bg:#FFFFFF}.bg-o{--bg:var(--fl-paper)}.bg-m{--bg:var(--fl-paper)}.bg-s{--bg:var(--fl-paper)}

/* thèmes : couleur douce par jeu, texte AA */
.t-quiz{--c:var(--fl-quiz);--c-on:#FFFFFF;--c-ink:var(--fl-quiz-ink);--c2:var(--fl-quiz-soft);--c3:var(--fl-quiz-2);--home:var(--fl-paper)}
.t-solo{--c:var(--fl-solo);--c-on:#FFFFFF;--c-ink:var(--fl-solo-ink);--c2:var(--fl-solo-soft);--c3:var(--fl-solo-2);--home:var(--fl-paper)}
.t-spin{--c:var(--fl-spin);--c-on:var(--fl-spin-on);--c-ink:var(--fl-spin-ink);--c2:var(--fl-spin-soft);--c3:var(--fl-spin-2);--home:var(--fl-paper)}
.t-tombola{--c:var(--fl-tombola);--c-on:#FFFFFF;--c-ink:var(--fl-tombola-ink);--c2:var(--fl-tombola-soft);--c3:var(--fl-tombola-2);--home:var(--fl-paper)}
.t-vote{--c:var(--fl-vote);--c-on:#FFFFFF;--c-ink:var(--fl-vote-ink);--c2:var(--fl-vote-soft);--c3:var(--fl-vote-2);--home:var(--fl-paper)}
.t-pro{--c:var(--fl-quiz);--c-on:#FFFFFF;--c-ink:var(--fl-quiz-ink);--c2:var(--fl-quiz-soft);--c3:var(--fl-quiz-2);--home:var(--fl-paper)}
.t-super{--c:var(--fl-super-rouge);--c-on:#FFFFFF;--c-ink:var(--fl-super-rouge-ink);--c2:var(--fl-super-jaune);--c3:var(--fl-super-bleu);--home:var(--fl-paper)}

/* volumes géométriques */
.geo{position:absolute!important;display:block;pointer-events:none;z-index:0}
.g-c{border-radius:50%}.g-h{border-radius:999px 999px 0 0}.g-r{border-radius:26%}.g-q{border-radius:0 0 0 100%}.g-p{border-radius:999px}.g-o{border-radius:50%;background:transparent!important}

/* barre d'état */
.sb{height:54px;flex:none;display:flex;justify-content:space-between;align-items:center;padding:12px 32px 0 36px;font-weight:700;font-size:15.5px;letter-spacing:-.01em}
.sb .r{display:flex;gap:6px;align-items:center}
.sb .bars{display:flex;gap:2px;align-items:flex-end;height:11px}
.sb .bars i{width:3px;background:currentColor;border-radius:1px}
.sb .bat{width:25px;height:12px;border:1.5px solid currentColor;border-radius:4px;position:relative;padding:1.5px}
.sb .bat:after{content:'';position:absolute;right:-4px;top:3px;width:2px;height:4px;border-radius:1px;background:currentColor}
.sb .bat i{display:block;height:100%;width:72%;background:currentColor;border-radius:1.5px}

/* en-tête */
.hdr{flex:none;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 20px 4px;min-height:58px}
.brand{display:flex;align-items:center;gap:11px;min-width:0}
.mono{width:42px;height:42px;border-radius:14px;background:var(--c);color:var(--c-on);display:grid;place-items:center;font-weight:800;font-size:15px;letter-spacing:-.03em;flex:none}
.brand b{display:block;font-size:15.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.brand i{display:block;font-style:normal;font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-top:2px}
.iconbtn{width:44px;height:44px;border-radius:50%;background:#fff;border:1.5px solid var(--line);display:grid;place-items:center;cursor:pointer;flex:none;color:var(--ink)}
.hdr .ttl{flex:1;text-align:center;font-weight:800;font-size:16px}
.hdr .ttl small{display:block;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-top:1px}

.body{flex:1 0 auto;padding:10px 20px 18px;display:flex;flex-direction:column}
.foot{flex:none;position:sticky;bottom:0;padding:12px 20px 28px;z-index:5;background:linear-gradient(to top,var(--bg) 74%,rgba(255,255,255,0))}

/* boutons */
.btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:60px;border:0;border-radius:99px;background:var(--cta);color:#fff;font-weight:800;font-size:19px;letter-spacing:-.01em;cursor:pointer;box-shadow:0 10px 22px rgba(27,58,92,.10);text-decoration:none;transition:transform .15s}
.btn:active{transform:scale(.98)}
.btn.line{background:#fff;color:var(--ink);box-shadow:none;border:1.5px solid var(--field);min-height:54px;font-size:16.5px}
.btn.teal{background:var(--cta);color:#fff}
.btn[disabled]{background:#E7ECF3;color:var(--fl-muted);box-shadow:none;cursor:not-allowed}
.btn+.btn{margin-top:12px}
.lnk{display:block;width:100%;text-align:center;font-weight:800;font-size:15.5px;color:var(--c-ink);padding:14px 10px 4px;background:none;border:0;cursor:pointer}
.mention{font-size:12.5px;line-height:1.45;text-align:center;color:var(--muted);font-weight:600;margin-top:12px}

/* typographie */
.kicker{font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--c-ink)}
.big{font-size:48px;font-weight:900;line-height:.92;letter-spacing:-.05em;text-transform:uppercase;margin-top:10px}
.h2{font-size:31px;font-weight:900;line-height:1.02;letter-spacing:-.04em;margin-top:6px}
.sub{font-size:15.5px;line-height:1.5;color:var(--ink2);font-weight:600;margin-top:10px}

/* cartes cerclées */
.card{background:#fff;border:1.5px solid var(--line);border-radius:24px}
.gain{padding:16px 16px 4px;margin-top:18px}
.gain .lbl{display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:2px}
.lot{display:flex;align-items:center;gap:14px;padding:12px 0;border-top:1px solid var(--line)}
.lot:first-of-type{border-top:0}
.lot .tx{min-width:0;flex:1}
.lot b{display:block;font-size:16px;font-weight:800;line-height:1.2}
.lot small{display:block;font-size:13px;color:var(--muted);font-weight:600;margin-top:2px;line-height:1.35}
.glyph{width:56px;height:56px;border-radius:17px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex:none;line-height:1;border:1.5px solid transparent}
.glyph b{font-size:20px;font-weight:800;letter-spacing:-.04em;display:block;line-height:1;color:inherit}
.glyph small{font-size:9.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin-top:3px;color:inherit}
.g-produit{background:#E6F7F4;color:#00796B}
.g-remise{background:#F1ECFA;color:var(--fl-solo)}
.g-bon{background:#fff;border-color:#F59E0B;color:#8a5e12}
.g-service{background:#F1ECFA;color:var(--fl-solo)}
.g-ticket{background:#fff;border-color:var(--c);color:var(--c-ink)}
.g-tour{background:#E6F7F4;color:#00796B}
.tag{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:800;padding:3px 9px;border-radius:99px;margin-top:6px;white-space:nowrap;border:1.5px solid transparent}
.tag.imm{background:#DDF3F0;color:#0B6F67}
.tag.tir{background:#fff;border-color:#AEBBCD;color:var(--fl-ink)}
.tag.neutral{background:var(--fl-paper);border-color:var(--line);color:var(--ink2)}
.tag.dist{background:#E3EBFB;color:#2F5FC0}
.tirline{display:flex;align-items:center;gap:10px;margin:2px -16px 0;padding:12px 16px 13px;border-top:1px dashed var(--field);font-size:14px;font-weight:700;color:var(--ink2)}
.howto{padding:6px 16px;margin-top:14px}
.how{display:flex;gap:12px;align-items:center;padding:10px 0;border-top:1px solid var(--line)}
.how:first-child{border-top:0}
.how .n{width:34px;height:34px;border-radius:11px;background:var(--c);color:var(--c-on);display:grid;place-items:center;font-weight:800;font-size:15px;flex:none}
.how b{display:block;font-size:15px;font-weight:800}
.how span{display:block;font-size:13px;color:var(--muted);font-weight:600}
.infobox{padding:4px 16px;margin-top:14px}
.inforow{display:flex;gap:12px;align-items:center;padding:12px 0;border-top:1px solid var(--line);font-size:14.5px;font-weight:700;color:var(--ink2);line-height:1.35}
.inforow:first-child{border-top:0}
.inforow .ic{color:var(--c-ink)}

/* étapes (curseur) */
.etapes{display:flex;align-items:center;gap:6px;padding:10px 20px 0;flex:none}
.etapes .e{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:800;color:var(--muted)}
.etapes .e i{width:22px;height:22px;border-radius:50%;border:1.5px solid var(--field);display:grid;place-items:center;font-style:normal;font-size:11px;background:#fff}
.etapes .e.on{color:var(--ink)}
.etapes .e.on i{background:var(--c);border-color:var(--c);color:var(--c-on)}
.etapes .e.done i{background:#fff;border-color:var(--c-ink);color:var(--c-ink)}
.etapes .s{flex:1;height:2px;background:var(--field);border-radius:1px}
.etapes .s.on{background:var(--c-ink)}

/* dock bas : CTA + bandeau partenaires + barre de navigation */
.dock{position:sticky;bottom:0;z-index:30;flex:none;background:#fff;border-top:1.5px solid var(--line)}
.dock .cta{padding:12px 20px 4px}
.band{display:flex;align-items:center;gap:10px;padding:9px 0 9px 16px;border-bottom:1px solid var(--line);overflow:hidden;cursor:pointer}
.band .bl{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);flex:none;line-height:1.2}
.band .mq{flex:1;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 20px,#000 calc(100% - 20px),transparent);mask-image:linear-gradient(90deg,transparent,#000 20px,#000 calc(100% - 20px),transparent)}
.band .mqi{display:flex;gap:10px;width:max-content;animation:mq 22s linear infinite}
.band .pl{display:flex;align-items:center;gap:7px;border:1.5px solid var(--line);border-radius:99px;padding:4px 11px 4px 4px;font-size:12.5px;font-weight:800;white-space:nowrap;background:#fff}
.band .pl i{width:26px;height:26px;border-radius:9px;display:grid;place-items:center;font-style:normal;font-size:10.5px;font-weight:800}
.nav{display:flex;padding:7px 6px 24px}
.nav a{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:11.5px;font-weight:800;color:var(--muted);cursor:pointer;text-decoration:none;padding-top:3px;border-radius:12px}
.nav a.on{color:var(--c-ink)}
.nav a.on .ic{stroke-width:2.3}

/* quiz */
.qtop{display:flex;align-items:center;gap:14px;padding:4px 20px 0;flex:none}
.qtop .mid{flex:1}
.qtop .mid small{display:block;font-size:12.5px;font-weight:800;letter-spacing:.06em;color:var(--muted);margin-bottom:8px}
.prog{display:flex;gap:6px}
.prog i{flex:1;height:6px;border-radius:3px;background:#E7ECF3}
.prog i.on{background:var(--c)}
.timer{width:54px;height:54px;position:relative;flex:none}
.timer svg{position:absolute;inset:0;transform:rotate(-90deg)}
.timer b{position:absolute;inset:0;display:grid;place-items:center;font-size:17px;font-weight:800}
.qcard{margin-top:12px;padding:20px 18px;position:relative;overflow:hidden}
.qtxt{font-size:27px;font-weight:800;line-height:1.14;letter-spacing:-.03em;margin-top:8px;position:relative}
.opts{margin-top:16px}
.opt{display:flex;align-items:center;gap:14px;width:100%;min-height:64px;padding:12px 16px;border-radius:20px;background:#fff;border:1.5px solid var(--field);color:var(--ink);font-weight:700;font-size:18px;text-align:left;margin-bottom:11px;cursor:pointer;position:relative;overflow:hidden}
.opt:hover{border-color:var(--ink)}
.opt>*{position:relative;z-index:1}
.opt .k{width:36px;height:36px;border-radius:12px;background:var(--off);border:1.5px solid var(--line);display:grid;place-items:center;font-weight:800;font-size:15px;flex:none}
.opt .end{margin-left:auto;display:grid;place-items:center}
.opt.ok,.opt.ko{border-color:transparent;color:#fff}
.opt.ok:before,.opt.ko:before{content:'';position:absolute;inset:0;z-index:0;transform-origin:left;animation:sweep .45s cubic-bezier(.3,.7,.2,1) both}
.opt.ok:before{background:var(--ok)}
.opt.ko:before{background:var(--ko)}
.opt.ko{animation:shake .5s .45s both}
.opt.ok .k,.opt.ko .k{background:#fff;color:var(--ink);border-color:#fff}
.opt.reveal{border:2px solid var(--ok)}
.opt.faded{opacity:.45}
.fb{position:absolute;left:12px;right:12px;bottom:12px;z-index:20;background:#fff;color:var(--ink);border:1.5px solid var(--line);border-radius:30px;padding:20px 20px 18px;box-shadow:0 -10px 34px rgba(27,58,92,.14);animation:up .5s .55s cubic-bezier(.2,.8,.2,1) both}
.fb .fh{display:flex;align-items:center;gap:12px}
.fb .badge{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;flex:none;color:#fff}
.fb h3{font-size:25px;font-weight:800;letter-spacing:-.03em}
.fb p{font-size:15px;line-height:1.5;color:var(--ink2);font-weight:600;margin:10px 0 14px}
.ring{position:relative;width:206px;height:206px;margin:12px auto 0}
.ring svg{position:absolute;inset:0;transform:rotate(-90deg)}
.ring .v{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.ring .v b{font-size:70px;font-weight:800;letter-spacing:-.05em;line-height:.9}
.ring .v small{font-size:12.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-top:6px}
.ring .arc{stroke-dasharray:578;animation:arc 1.3s .2s cubic-bezier(.3,.7,.2,1) both}
.reward{padding:14px 16px;margin-top:18px;display:flex;gap:14px;align-items:center;text-align:left}
.reward .tx small{display:block;font-size:11.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.reward .tx b{display:block;font-size:17.5px;font-weight:800;line-height:1.2;margin-top:3px}
.reward .tx span{display:block;font-size:13.5px;color:var(--ink2);font-weight:600;margin-top:3px}
.bcard{padding:16px;margin-top:12px}
.bcard .kicker{font-size:11px}
.bcard h4{font-size:18px;font-weight:800;letter-spacing:-.02em;line-height:1.25;margin:5px 0 12px}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{min-height:44px;padding:0 15px;border-radius:99px;border:1.5px solid var(--field);background:#fff;font-weight:700;font-size:14.5px;cursor:pointer;color:var(--ink);display:inline-flex;align-items:center;gap:7px}
.chip.on{border-color:var(--ink);box-shadow:inset 0 0 0 1.5px var(--ink);font-weight:800}
.plus1{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1.5px solid var(--c-ink);color:var(--ink);border-radius:99px;padding:6px 14px 6px 6px;font-weight:800;font-size:14px}
.plus1 i{width:26px;height:26px;border-radius:50%;background:var(--c);color:var(--c-on);display:grid;place-items:center;font-style:normal;font-size:12.5px}

/* formulaire */
.recap{display:flex;gap:12px;align-items:center;padding:12px 14px;margin-top:14px}
.recap b{display:block;font-size:15.5px;font-weight:800;line-height:1.25}
.recap small{display:block;font-size:12.5px;font-weight:700;color:var(--muted)}
.fld{margin-top:15px}
.fld label,.fld .lab{display:flex;justify-content:space-between;align-items:baseline;font-size:14px;font-weight:800;margin-bottom:7px;color:var(--ink)}
.fld .opt-l{font-size:12px;font-weight:700;color:var(--muted)}
.inp{width:100%;height:54px;border-radius:16px;border:1.5px solid var(--field);background:#fff;padding:0 16px;font:600 16.5px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:var(--ink);outline:none}
.inp:focus{border-color:var(--ink);box-shadow:0 0 0 3px rgba(242,107,79,.2)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.seg{display:grid;grid-template-columns:1fr 1fr;background:var(--off);border:1.5px solid var(--line);border-radius:16px;padding:4px;height:56px}
.seg button{border:0;background:transparent;border-radius:12px;font-weight:800;font-size:15.5px;color:var(--ink2);cursor:pointer}
.seg button.on{background:#fff;color:var(--ink);box-shadow:inset 0 0 0 1.5px var(--ink)}
.ages{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
.ages .chip{padding:0 6px;justify-content:center;font-size:13.5px;min-height:42px}
.ages .chip:first-child{grid-column:span 2}
.consent{display:flex;gap:13px;align-items:flex-start;padding:14px;border:1.5px solid var(--field);border-radius:18px;cursor:pointer;margin-top:12px;background:#fff}
.consent .box{width:26px;height:26px;border-radius:8px;border:2px solid #8797AB;flex:none;display:grid;place-items:center;color:#fff;margin-top:1px}
.consent .box svg{opacity:0}
.consent p{font-size:14px;line-height:1.45;font-weight:600;color:var(--ink2)}
.consent em{display:inline-block;font-style:normal;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;border-radius:99px;padding:2px 8px;margin-top:7px;border:1.5px solid var(--line);color:var(--ink2);background:var(--off)}
.consent em.req{border-color:var(--ink);color:var(--ink);background:#fff}
.consent.on{border-color:var(--ink);box-shadow:inset 0 0 0 1px var(--ink)}
.consent.on .box{background:var(--ink);border-color:var(--ink)}
.consent.on .box svg{opacity:1}

/* billet */
.billet{margin-top:18px;border-radius:28px;background:#fff;border:1.5px solid var(--line);color:var(--ink);box-shadow:0 22px 44px rgba(27,58,92,.10);position:relative;overflow:hidden;animation:billetIn .8s .15s cubic-bezier(.2,.9,.25,1.15) both}
.billet .bt{background:var(--c);color:var(--c-on);padding:18px 20px 20px;position:relative;overflow:hidden}
.billet .bt>*{position:relative;z-index:1}
.billet .bt .geo{z-index:0;opacity:.22}
.billet .bt small{display:block;font-size:11.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
.billet .bt h3{font-size:27px;font-weight:800;letter-spacing:-.035em;line-height:1.05;margin-top:8px}
.billet .bt span{display:block;font-size:14px;font-weight:700;margin-top:8px}
.perf{height:26px;position:relative;background:#fff}
.perf:before{content:'';position:absolute;left:24px;right:24px;top:12px;border-top:2.5px dashed var(--field)}
.perf i{position:absolute;top:0;width:26px;height:26px;border-radius:50%;background:var(--bg);border:1.5px solid var(--line)}
.perf i:first-child{left:-14px}.perf i:last-child{right:-14px}
.billet .bb{display:flex;gap:16px;align-items:center;padding:4px 20px 20px}
.billet .bb .qrw{padding:8px;border-radius:16px;border:1.5px solid var(--line);flex:none;position:relative;overflow:hidden}
.billet .bb .qrw:after{content:'';position:absolute;top:0;bottom:0;width:40%;left:-60%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.9),transparent);animation:shine 1.2s 1s ease-in-out both}
.kv dt{font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-top:8px}
.kv dt:first-child{margin-top:0}
.kv dd{font-size:14.5px;font-weight:800;color:var(--ink)}
.num{font-variant-numeric:tabular-nums;letter-spacing:.02em}

/* ticket */
.tk{display:flex;margin-top:20px;animation:stamp .7s .15s cubic-bezier(.2,.9,.3,1.3) both}
.tk .main{flex:1;background:#fff;border:2px solid var(--c);border-right:0;border-radius:22px 0 0 22px;padding:16px 18px;position:relative;overflow:hidden;color:var(--ink)}
.tk .main small{display:block;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--c-ink)}
.tk .main b{display:block;font-size:38px;font-weight:800;letter-spacing:-.04em;line-height:1;margin-top:10px}
.tk .main span{display:block;font-size:14px;font-weight:700;color:var(--ink2);margin-top:9px}
.tk .stub{width:82px;background:var(--c);color:var(--c-on);border-radius:0 22px 22px 0;position:relative;display:flex;align-items:center;justify-content:center}
.tk .stub:before{content:'';position:absolute;left:-1px;top:12px;bottom:12px;border-left:3px dotted #fff}
.tk .stub b{transform:rotate(-90deg);font-size:15px;font-weight:800;letter-spacing:.14em;white-space:nowrap}
.stack{display:flex;align-items:center;gap:12px;padding:13px 16px;margin-top:14px}
.stack .cnt{font-size:34px;font-weight:800;letter-spacing:-.04em;color:var(--c-ink);line-height:1}
.stack p{font-size:14px;font-weight:700;color:var(--ink2);line-height:1.4}

/* profil */
.avatar{width:66px;height:66px;border-radius:50%;background:var(--c);color:var(--c-on);display:grid;place-items:center;font-weight:800;font-size:24px;letter-spacing:-.03em;flex:none}
.kpis{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
.kpi{padding:12px 14px}
.kpi b{display:block;font-size:30px;font-weight:800;letter-spacing:-.04em;line-height:1}
.kpi span{display:block;font-size:12.5px;font-weight:700;color:var(--muted);margin-top:4px}
.sect{display:flex;justify-content:space-between;align-items:baseline;margin:22px 0 10px}
.sect h4{font-size:18.5px;font-weight:800;letter-spacing:-.02em}
.sect span,.sect button{font-size:13px;font-weight:800;color:var(--c-ink);background:none;border:0;cursor:pointer}
.sect span{color:var(--muted);font-weight:700}
.mb{display:flex;gap:14px;align-items:center;padding:12px 14px;margin-bottom:10px;cursor:pointer}
.mb .tx{flex:1;min-width:0}
.mb b{display:block;font-size:15.5px;font-weight:800;line-height:1.25}
.mb small{display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin-top:2px}
.mt{display:flex;align-items:stretch;border-radius:18px;overflow:hidden;margin-bottom:9px;border:1.5px solid var(--line);background:#fff}
.mt .l{width:9px;background:var(--c)}
.mt .c{flex:1;padding:11px 14px}
.mt .c b{display:block;font-size:15.5px;font-weight:800}
.mt .c small{display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin-top:2px}
.mt .r{display:flex;align-items:center;padding:0 14px;border-left:2px dotted var(--line);color:var(--ink2)}
.rows{padding:2px 16px;margin-top:12px}
.rows>div{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-top:1px solid var(--line);font-size:14.5px}
.rows>div:first-child{border-top:0}
.rows span{color:var(--muted);font-weight:700}
.rows b{font-weight:800;text-align:right}
.action{display:flex;gap:13px;align-items:center;padding:13px 14px;margin-top:10px;cursor:pointer;text-align:left;width:100%}
.action .ai{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;flex:none;background:var(--off);border:1.5px solid var(--line);color:var(--c-ink)}
.action b{display:block;font-size:15.5px;font-weight:800}
.action small{display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin-top:1px}
.placeholder{color:var(--fl-muted);font-weight:700}

/* commerces */
.toggle{display:grid;grid-template-columns:1fr 1fr;background:#fff;border:1.5px solid var(--line);border-radius:16px;padding:4px;margin-top:14px}
.toggle button{height:44px;border:0;border-radius:12px;background:none;font-weight:800;font-size:15px;cursor:pointer;color:var(--ink2);display:flex;align-items:center;justify-content:center;gap:7px}
.toggle button.on{background:var(--c);color:var(--c-on)}
.pcard{display:flex;gap:13px;align-items:flex-start;padding:13px 14px;margin-top:10px;cursor:pointer}
.pmono{width:52px;height:52px;border-radius:16px;display:grid;place-items:center;font-weight:800;font-size:16.5px;letter-spacing:-.03em;flex:none;border:1.5px solid var(--line)}
.pcard .tx{flex:1;min-width:0}
.pcard b{display:block;font-size:16px;font-weight:800}
.pcard small{display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin-top:2px}
.pcard .enjeu{font-size:13px;font-weight:700;color:var(--ink2);margin-top:6px}
.surplace{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:800;color:var(--c-ink);margin-top:6px}
.bigmono{width:88px;height:88px;border-radius:26px;display:grid;place-items:center;font-weight:800;font-size:29px;letter-spacing:-.04em;background:#fff;border:1.5px solid var(--line);margin-top:8px}
.acts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
.act{display:flex;align-items:center;justify-content:center;gap:8px;min-height:50px;border-radius:16px;background:#fff;border:1.5px solid var(--field);font-weight:800;font-size:14.5px;color:var(--ink);cursor:pointer}
.links{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}
.links button{display:inline-flex;align-items:center;gap:6px;min-height:38px;padding:0 12px;border-radius:99px;border:1.5px solid var(--field);background:#fff;font-weight:800;font-size:13px;cursor:pointer;color:var(--ink)}
.spons{padding:16px;margin-top:12px}
.pgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:4px}
.pgrid .pg{padding:12px 6px;text-align:center;cursor:pointer}
.pgrid .pg .pmono{margin:0 auto 8px}
.pgrid .pg b{font-size:12.5px;font-weight:800;line-height:1.2;display:block}

/* carte */
.map{position:relative;min-height:560px;flex:1 0 auto;overflow:hidden;background:#EEF2F7}
.map svg.base{position:absolute;inset:0;width:100%;height:100%}
.maptop{position:absolute;left:14px;right:14px;top:6px;z-index:3}
.pin{position:absolute;width:44px;height:54px;margin:-54px 0 0 -22px;z-index:2;cursor:pointer}
.pin .p{width:44px;height:44px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);display:grid;place-items:center;border:3px solid #fff;box-shadow:0 0 0 1.5px var(--line),0 6px 12px rgba(27,58,92,.14)}
.pin .p>*{transform:rotate(45deg)}
.pin .p b{font-weight:800;font-size:16px}
.pin.todo .p{background:var(--c);color:var(--c-on)}
.pin.done .p{background:#fff;color:var(--ok);box-shadow:0 0 0 2px var(--ok)}
.pin.here:before{content:'';position:absolute;left:50%;top:22px;width:80px;height:80px;margin:-40px 0 0 -40px;border-radius:50%;border:3px solid var(--c);animation:ping 1.8s ease-out infinite}
.msheet{position:absolute;left:12px;right:12px;bottom:12px;padding:14px;z-index:3;animation:up .5s .3s cubic-bezier(.2,.8,.2,1) both}

/* pop-up */
.veil{position:absolute;inset:0;background:rgba(246,247,245,.82);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);z-index:40;animation:fade .35s both}
.sheet{position:absolute;left:0;right:0;bottom:0;z-index:41;background:#fff;color:var(--ink);border-top:1.5px solid var(--line);border-radius:32px 32px 0 0;padding:12px 22px 32px;box-shadow:0 -14px 40px rgba(27,58,92,.12);animation:up .5s .15s cubic-bezier(.2,.8,.2,1) both}
.grab{width:46px;height:5px;border-radius:3px;background:var(--field);margin:0 auto 16px}
.sicon{width:62px;height:62px;border-radius:20px;background:var(--off);border:1.5px solid var(--line);color:var(--c-ink);display:grid;place-items:center}

/* parrainage */
.share{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:14px}
.share button{display:flex;flex-direction:column;align-items:center;gap:7px;padding:14px 6px;border-radius:20px;border:1.5px solid var(--field);background:#fff;font-weight:800;font-size:14px;cursor:pointer;color:var(--ink)}
.share button .ic{color:var(--c-ink)}
.msg{padding:14px;margin-top:14px}
.msg .mh{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.msg .bubble{background:var(--off);border:1.5px solid var(--line);border-radius:18px 18px 18px 6px;padding:12px 14px;margin-top:8px;font-size:14px;line-height:1.45;font-weight:600;color:var(--ink2)}
.msg .mini{display:flex;gap:10px;align-items:center;border:1.5px solid var(--line);border-radius:16px;padding:9px;margin-top:9px;background:#fff}
.dots3{display:flex;gap:8px;margin-top:10px}
.dots3 i{flex:1;height:10px;border-radius:5px;background:#E7ECF3}
.dots3 i.on{background:var(--c)}
.event{padding:16px;margin-top:12px;position:relative;overflow:hidden}
.event>*{position:relative;z-index:1}
.event .geo{z-index:0}

/* commerçant */
.prohdr{flex:none;display:flex;align-items:center;justify-content:space-between;padding:6px 20px 14px}
.prohdr .wm{font-weight:800;font-size:22px;letter-spacing:-.045em}
.prohdr .wm span{color:var(--fl-blue)}
.prohdr .wm em{font-style:normal;font-size:11px;letter-spacing:.1em;border:1.5px solid var(--ink);color:var(--ink);border-radius:6px;padding:2px 6px;margin-left:6px;vertical-align:4px}
.badge-ok{display:inline-flex;align-items:center;gap:8px;background:#DDF3F0;color:#0B6F67;border-radius:99px;padding:7px 14px;font-weight:800;font-size:14px;border:1.5px solid var(--fl-line)}
.badge-ok i{width:9px;height:9px;border-radius:50%;background:var(--fl-spin)}
.pinbox{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px}
.pinbox span{height:64px;border-radius:18px;border:1.5px solid var(--field);background:#fff;display:grid;place-items:center;font-size:30px;font-weight:800}
.pinbox span.f{border-color:var(--ink)}
.pinbox span.cur{border-color:var(--ink);box-shadow:0 0 0 3px rgba(242,107,79,.2)}
.pinbox span.cur:after{content:'';width:2px;height:28px;background:var(--ink);animation:blink 1s steps(1) infinite}
.okcircle{width:150px;height:150px;border-radius:50%;background:#fff;border:1.5px solid var(--fl-line);display:grid;place-items:center;margin:36px auto 0;position:relative;animation:pop .6s .1s cubic-bezier(.2,.9,.3,1.3) both}
.okcircle:before,.okcircle:after{content:'';position:absolute;inset:-2px;border-radius:50%;border:3px solid var(--fl-spin);animation:ripple 1.6s .5s ease-out both;opacity:0}
.okcircle:after{animation-delay:.8s}
.okcircle .draw{stroke-dasharray:60;animation:draw60 .55s .5s ease-out both}

/* roue */
.wheelbox{position:relative;width:330px;height:330px;margin:16px auto 0}
.wheel{position:absolute;inset:0}
.wheel svg{width:100%;height:100%;display:block}
.pointer{position:absolute;left:50%;top:-12px;width:40px;height:48px;margin-left:-20px;z-index:3;transform-origin:50% 20%;filter:drop-shadow(0 3px 4px rgba(27,58,92,.2))}
.wheelbox.spinning .pointer{animation:tick .12s linear 26 alternate}
.bulb{animation:bulb .5s steps(1) infinite}
.bulb.b2{animation-delay:.25s}
.resultchip{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:4;background:#fff;border:1.5px solid var(--line);color:var(--ink);border-radius:24px;padding:14px 22px;text-align:center;box-shadow:0 18px 40px rgba(27,58,92,.18);min-width:200px;animation:popc .55s 4.7s cubic-bezier(.2,.9,.3,1.3) both}
.resultchip small{display:block;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#00796B}
.resultchip b{display:block;font-size:26px;font-weight:800;letter-spacing:-.03em;margin-top:2px}
.after{animation:rise .5s 5s both}
.legend{display:flex;gap:10px;align-items:center;justify-content:center;font-size:13.5px;font-weight:700;color:var(--ink2);margin-top:16px;text-align:center;padding:0 10px}

/* tombola */
.machine{position:relative;margin:24px auto 0;width:300px}
.slot{height:40px;border-radius:20px;background:#fff;border:1.5px solid var(--field);position:relative;z-index:3;box-shadow:0 8px 18px rgba(27,58,92,.08)}
.slot:after{content:'';position:absolute;left:18px;right:18px;top:15px;height:7px;border-radius:4px;background:var(--fl-field)}
.paper{position:relative;height:300px;overflow:hidden;margin:-20px 22px 0;z-index:2}
.ptk{position:absolute;left:0;right:0;top:0;background:#fff;border:2px solid var(--c);color:var(--ink);border-radius:0 0 22px 22px;padding:32px 20px 16px;text-align:center;animation:print 2.4s .5s cubic-bezier(.4,.1,.3,1) both}
.ptk small{display:block;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--c-ink)}
.ptk .no{display:flex;justify-content:center;gap:2px;font-size:46px;font-weight:800;letter-spacing:-.03em;margin-top:10px;height:50px;line-height:50px;overflow:hidden}
.ptk .roll{display:block;height:50px;overflow:hidden}
.ptk .roll i{display:block;font-style:normal;transform:translateY(-450px);animation:roll 1.2s cubic-bezier(.3,.7,.2,1) both;animation-delay:var(--d)}
.ptk .bar{height:32px;margin:12px auto 0;width:180px;background:repeating-linear-gradient(90deg,var(--ink) 0 2px,transparent 2px 4px,var(--ink) 4px 5px,transparent 5px 8px,var(--ink) 8px 11px,transparent 11px 13px)}
.ptk .line{border-top:2.5px dashed var(--field);margin:12px -4px 10px}
.bigbtn{width:176px;height:176px;border-radius:50%;margin:34px auto 0;display:grid;place-items:center;text-align:center;background:var(--fl-tombola);color:#fff;font-weight:800;font-size:22px;line-height:1.1;border:0;cursor:pointer;box-shadow:0 0 0 10px rgba(11,158,110,.16),0 0 0 22px rgba(11,158,110,.07);animation:breathe 2s ease-in-out infinite}

/* vote */
.artists{margin-top:16px}
.art{display:flex;gap:14px;align-items:center;width:100%;padding:10px 14px 10px 10px;margin-bottom:9px;text-align:left;cursor:pointer;color:var(--ink)}
.art .av{width:62px;height:62px;border-radius:18px;position:relative;overflow:hidden;flex:none;border:1.5px solid var(--line)}
.art b{display:block;font-size:16.5px;font-weight:800}
.art small{display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin-top:2px}
.art .rad{width:26px;height:26px;border-radius:50%;border:2px solid #8797AB;margin-left:auto;flex:none;display:grid;place-items:center;color:#fff}
.art .rad svg{opacity:0}
.art.on{border-color:var(--c);box-shadow:inset 0 0 0 1.5px var(--c)}
.art.on .rad{background:var(--c);border-color:var(--c)}
.art.on .rad svg{opacity:1}
.urn{position:relative;width:230px;height:250px;margin:30px auto 0}
.urn .box{position:absolute;left:0;right:0;bottom:0;height:170px;border-radius:26px;background:#fff;border:1.5px solid var(--line);box-shadow:0 18px 34px rgba(27,58,92,.10)}
.urn .box b{position:absolute;left:0;right:0;bottom:14px;text-align:center;font-size:30px;font-weight:800;letter-spacing:.06em;color:var(--c-ink)}
.urn .lid{position:absolute;left:-12px;right:-12px;top:62px;height:28px;border-radius:12px;background:#fff;border:1.5px solid var(--line);z-index:3}
.urn .lid:after{content:'';position:absolute;left:50%;top:9px;width:110px;height:8px;margin-left:-55px;border-radius:4px;background:var(--fl-field)}
.urn .card2{position:absolute;left:50%;top:-6px;width:96px;height:110px;margin-left:-48px;border-radius:14px;background:#fff;border:1.5px solid var(--line);z-index:2;animation:drop 1.3s .4s cubic-bezier(.5,0,.3,1) both;opacity:0;overflow:hidden}
.urn .vok{position:absolute;left:50%;top:104px;width:76px;height:76px;margin-left:-38px;border-radius:50%;background:var(--ok);display:grid;place-items:center;z-index:4;animation:pop .5s 1.75s cubic-bezier(.2,.9,.3,1.4) both;box-shadow:0 0 0 7px #fff}
.vbar{margin-top:12px}
.vbar .lb{display:flex;justify-content:space-between;font-size:14px;font-weight:800}
.vbar .tr{height:12px;border-radius:6px;background:#E7ECF3;margin-top:6px;overflow:hidden}
.vbar .tr i{display:block;height:100%;border-radius:6px;background:var(--c);transform-origin:left;animation:sweep 1s cubic-bezier(.3,.7,.2,1) both;animation-delay:var(--d)}
.vitrine{height:230px;border-radius:20px;position:relative;overflow:hidden;border:1.5px solid var(--line);background:#fff}

/* pro */
.stepper{display:flex;gap:6px;margin-top:4px}
.stepper i{flex:1;height:5px;border-radius:3px;background:#E7ECF3}
.stepper i.on{background:var(--c-ink)}
.choice{display:flex;gap:14px;align-items:center;text-align:left;width:100%;padding:15px;cursor:pointer;color:var(--ink);margin-top:12px;position:relative;overflow:hidden}
.choice>*{position:relative;z-index:1}
.choice .geo{z-index:0}
.choice .cv{width:62px;height:62px;border-radius:18px;display:grid;place-items:center;flex:none;font-weight:800;font-size:18px;border:1.5px solid var(--line);background:var(--off)}
.choice b{display:block;font-size:17px;font-weight:800}
.choice small{display:block;font-size:13px;font-weight:600;color:var(--ink2);line-height:1.4;margin-top:2px}
.choice .rad{width:24px;height:24px;border-radius:50%;border:2px solid #8797AB;flex:none;margin-left:auto}
.choice.on{border-color:var(--ink);box-shadow:inset 0 0 0 1px var(--ink)}
.choice.on .rad{border:7px solid var(--ink)}
.qty{display:flex;align-items:center;justify-content:space-between;background:#fff;border:1.5px solid var(--field);border-radius:20px;padding:7px}
.qty button{width:50px;height:50px;border-radius:15px;border:1.5px solid var(--line);background:var(--off);display:grid;place-items:center;cursor:pointer;color:var(--ink)}
.qty b{font-size:32px;font-weight:800;letter-spacing:-.04em}
.dates{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
.date{border-radius:18px;border:1.5px solid var(--field);background:#fff;padding:12px;text-align:left;cursor:pointer;color:var(--ink)}
.date b{display:block;font-size:15px;font-weight:800}
.date small{display:block;font-size:12.5px;font-weight:700;color:var(--muted);margin-top:3px}
.date.on{border-color:var(--ink);box-shadow:inset 0 0 0 1.5px var(--ink)}
.cal{padding:12px 14px;margin-top:12px}
.cal .ch{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:16px}
.cal .cg{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-top:8px;text-align:center}
.cal .cg span{font-size:11px;font-weight:800;color:var(--muted);padding:4px 0}
.cal .cg button{height:36px;border:0;border-radius:12px;background:none;font-weight:700;font-size:14.5px;cursor:pointer;color:var(--ink)}
.cal .cg button.on{background:var(--c);color:var(--c-on);font-weight:800}
.cal .cg button.mut{color:#A3AFBF}
.rlot{display:flex;gap:14px;align-items:center;padding:13px 14px;margin-top:10px}
.rlot .tx{flex:1;min-width:0}
.rlot b{display:block;font-size:15.5px;font-weight:800;line-height:1.25}
.stock{height:6px;border-radius:3px;background:#E7ECF3;margin-top:8px;overflow:hidden}
.stock i{display:block;height:100%;border-radius:3px;background:var(--teal)}
.addlot{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:54px;border-radius:20px;border:2px dashed var(--field);background:transparent;font-weight:800;font-size:15.5px;margin-top:12px;cursor:pointer;color:var(--ink)}
.apercu-band{background:#fff;border-bottom:1.5px solid var(--line);color:var(--ink);font-size:12px;font-weight:800;text-align:center;padding:8px;letter-spacing:.08em}
.secard{padding:14px;margin-top:10px;display:flex;gap:13px;align-items:center}
.secard .tx{flex:1;min-width:0}
.secard b{display:block;font-size:16px;font-weight:800}
.secard small{display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin-top:2px}


/* bandeau partenaires visible (sous l'en-tête) */
.pband{flex:none;background:#fff;border-top:1.5px solid var(--line);border-bottom:1.5px solid var(--line);box-shadow:0 6px 14px rgba(27,58,92,.06);padding:9px 0 10px;cursor:pointer;margin-top:4px}
.pband .ph2{display:flex;justify-content:space-between;align-items:center;padding:0 20px 7px;font-size:11.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--c-ink)}
.pband .ph2{color:var(--fl-ink)!important;font-size:12.5px!important}.pband .ph2 span{letter-spacing:0;text-transform:none;color:#2C49A6;font-weight:800;font-size:12.5px;display:inline-flex;align-items:center;gap:2px}
.pband .mq{overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 18px,#000 calc(100% - 18px),transparent);mask-image:linear-gradient(90deg,transparent,#000 18px,#000 calc(100% - 18px),transparent)}
.pband .mqi{display:flex;gap:10px;width:max-content;animation:mq 30s linear infinite;padding-left:18px}
.vg{width:108px;flex:none;text-align:center}
.vg i{display:grid;place-items:center;width:64px;height:48px;border-radius:14px;border:1.5px solid var(--line);font-style:normal;font-weight:800;font-size:15px;letter-spacing:-.02em}
.vg b{display:block;font-size:10.5px;font-weight:800;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--ink2)}
/* grille de vignettes partenaires */
.vgrid3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.vtile{background:none;border:0;padding:0;cursor:pointer;text-align:center;color:var(--ink);display:flex;flex-direction:column;justify-content:flex-start}
.vtile .plogo{width:100%}.vtile i{display:grid;place-items:center;aspect-ratio:1/1;border-radius:20px;border:1.5px solid var(--line);background:#fff;font-style:normal;font-weight:800;font-size:22px;letter-spacing:-.03em;position:relative}
.vtile i em{position:absolute;right:6px;top:6px;width:10px;height:10px;border-radius:50%;background:var(--fl-vote);border:2px solid #fff}
.vtile b{display:block;font-size:12.5px;font-weight:800;line-height:1.2;margin-top:7px}
.vtile.vbig i{font-size:28px;border-radius:24px}
/* univers SUPER EVENT : comics rétro, clair */
.t-super.scr{background-color:#FFF8EA;background-image:radial-gradient(rgba(226,35,26,.14) 1.3px,transparent 1.7px);background-size:11px 11px}
.t-super .card{border:2.5px solid var(--fl-ink);border-radius:14px;box-shadow:4px 4px 0 var(--fl-ink)}
.t-super .btn{font-family:'Bangers',cursive;font-weight:400;letter-spacing:.06em;font-size:25px;background:var(--fl-super-jaune);color:var(--fl-ink);border:2.5px solid var(--fl-ink);box-shadow:4px 4px 0 var(--fl-ink);border-radius:14px}
.t-super .btn.line{background:#fff;font-size:22px;border:2.5px solid var(--fl-ink)}
.t-super .btn.red{background:var(--fl-super-rouge);color:#fff}
.t-super .h2,.t-super .big,.t-super .bang{font-family:'Bangers',cursive;font-weight:400;letter-spacing:.03em;text-transform:uppercase}
.t-super .kicker{color:var(--fl-super-rouge-ink)}
.t-super .iconbtn{border:2.5px solid var(--fl-ink)}
.t-super .stepper i{background:var(--fl-line)}.t-super .stepper i.on{background:var(--fl-super-rouge)}
.t-super .chip.on{background:var(--fl-super-jaune);box-shadow:inset 0 0 0 1.5px var(--fl-ink);border-color:var(--fl-ink)}
.t-super .choice.on{border-color:var(--fl-ink);box-shadow:4px 4px 0 var(--fl-super-rouge)}
.t-super .choice .cv{border:2.5px solid var(--fl-ink)}
.t-super .inp{border:2.5px solid var(--fl-ink);border-radius:12px}
.t-super .pband{border-top:2.5px solid var(--fl-ink);border-bottom:2.5px solid var(--fl-ink)}
.t-super .dock{border-top:2.5px solid var(--fl-ink)}
.super-logo{font-family:'Bangers',cursive;font-weight:400;font-style:normal;text-transform:uppercase;color:var(--fl-super-jaune);letter-spacing:.05em;display:inline-block;padding:0 .14em 0 .06em;line-height:1;-webkit-text-stroke:.06em var(--fl-ink);paint-order:stroke fill;text-shadow:.035em .035em 0 var(--fl-super-rouge),.07em .07em 0 var(--fl-super-rouge),.105em .105em 0 #A8101A,.14em .14em 0 var(--fl-ink);transform:rotate(-4deg) skewX(-8deg)}
.se-word{font-family:'Bangers',cursive;font-weight:400;color:var(--fl-ink);letter-spacing:.05em;text-transform:uppercase;display:inline-block;transform:rotate(-4deg)}
.panel{border:3px solid var(--fl-ink);border-radius:6px;background:#fff;box-shadow:5px 5px 0 var(--fl-ink);position:relative;overflow:hidden}
.panel .ptag{position:absolute;left:-3px;top:-3px;background:var(--fl-super-jaune);border:3px solid var(--fl-ink);font-family:'Bangers',cursive;font-size:17px;letter-spacing:.06em;padding:2px 10px 1px;z-index:3}
.bubble2{position:relative;display:inline-block;background:#fff;border:2.5px solid var(--fl-ink);border-radius:20px;padding:9px 14px;font-weight:800;font-size:14px;color:var(--fl-ink)}
.bubble2:after{content:'';position:absolute;left:22px;bottom:-12px;width:16px;height:16px;background:#fff;border-right:2.5px solid var(--fl-ink);border-bottom:2.5px solid var(--fl-ink);transform:skewX(-30deg) rotate(45deg)}
.comic{border:2.5px solid var(--fl-ink)!important;box-shadow:4px 4px 0 var(--fl-ink);background-color:#FFF8EA!important;background-image:radial-gradient(rgba(226,35,26,.14) 1.3px,transparent 1.7px);background-size:11px 11px}
.sbar{height:16px;border:2.5px solid var(--fl-ink);border-radius:9px;background:#fff;overflow:hidden}
.sbar i{display:block;height:100%;background:repeating-linear-gradient(-45deg,var(--fl-super-rouge) 0 8px,#F0463D 8px 16px);transform-origin:left;animation:sweep 1s .3s cubic-bezier(.3,.7,.2,1) both}
.spin2{animation:pop .7s cubic-bezier(.2,.9,.3,1.4) both;animation-delay:var(--d,0s)}


/* scène de jeu quiz + bonus : bandeau profond bleu nuit -> bleu, encarts blancs */
.scr.stage{background:linear-gradient(180deg,var(--fl-stage-1) 0%,var(--fl-stage-2) 48%,var(--fl-stage-3) 100%);color:#fff;--bg:var(--fl-blue);--ring:#fff}
.stage .hdr .brand b,.stage .h2{color:#fff}.stage .brand i,.stage .qtop .mid small{color:rgba(255,255,255,.78)}
.stage .mono{background:#fff;color:var(--fl-ink)}
.stage .iconbtn{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.32);color:#fff}
.stage .prog i{background:rgba(255,255,255,.22)}.stage .prog i.on{background:#fff}
.stage .timer b{color:#fff}.stage .timer circle:first-child{fill:rgba(255,255,255,.1);stroke:rgba(255,255,255,.22)}
.stage .qcard{background:transparent;border:0;padding:6px 2px}.stage .qcard .geo{display:none}
.stage .qcard .kicker,.stage .kicker{color:var(--fl-stage-kicker)}.stage .qtxt{color:#fff}
.stage .opt{border-color:#fff;box-shadow:0 8px 18px rgba(10,20,40,.18)}.stage .opt.faded{opacity:.62}
.stage .opt.reveal{border:3px solid #3FE0CC}
.stage .mention{color:rgba(255,255,255,.82)}
.stage .etapes .e{color:rgba(255,255,255,.75)}.stage .etapes .e.on{color:#fff}.stage .etapes .e i{background:transparent;border-color:rgba(255,255,255,.5);color:#fff}.stage .etapes .e.on i{background:#fff;color:var(--fl-ink);border-color:#fff}.stage .etapes .s{background:rgba(255,255,255,.3)}.stage .etapes .s.on{background:#fff}
.stage .ring circle:first-child{stroke:rgba(255,255,255,.18)}.stage .ring .v small{color:rgba(255,255,255,.8)}
.stage .lnk{color:#fff}
.stage .card,.stage .fb{color:var(--ink)}
.heroband{background:linear-gradient(135deg,var(--fl-ink),var(--fl-blue));color:#fff;border-radius:24px;padding:18px 18px 20px;margin-top:10px;position:relative;overflow:hidden}
.heroband .kicker{color:var(--fl-stage-kicker)}.heroband>*{position:relative;z-index:1}.heroband .geo{z-index:0}
/* logos partenaires d'exemple */
.plogo{display:grid;place-items:center;background:#fff;border:1.5px solid var(--line);border-radius:14px}
.flowin-comic{font-family:'Bangers',cursive;font-weight:400;letter-spacing:.04em;display:inline-block;color:#fff;-webkit-text-stroke:.07em var(--fl-ink);paint-order:stroke fill;text-shadow:.05em .05em 0 var(--fl-ink),.09em .09em 0 var(--fl-ink);transform:rotate(-4deg) skewX(-8deg);line-height:1}
.flowin-comic em{font-style:normal;color:var(--fl-blue)}

/* confettis */
.confetti{position:absolute;inset:0;overflow:hidden;z-index:30!important;pointer-events:none}
.confetti i{position:absolute;top:-30px;display:block;animation:fall var(--t) var(--d) cubic-bezier(.25,.5,.5,1) both}

/* animations */
@keyframes rise{from{opacity:0;transform:translateY(18px)}}
@keyframes fade{from{opacity:0}}
@keyframes pop{0%{opacity:0;transform:scale(.55)}60%{opacity:1;transform:scale(1.06)}}
@keyframes popc{0%{opacity:0;transform:translate(-50%,-50%) scale(.5)}60%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}}
@keyframes grow{from{opacity:0;transform:scale(.2)}}
@keyframes up{from{transform:translateY(115%)}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(9px)}60%{transform:translateX(-6px)}80%{transform:translateX(4px)}}
@keyframes sweep{from{transform:scaleX(0)}}
@keyframes draw60{from{stroke-dashoffset:60}}
@keyframes arc{from{stroke-dashoffset:578}}
@keyframes billetIn{0%{opacity:0;transform:translateY(-60px) rotate(-6deg) scale(.9)}70%{opacity:1;transform:translateY(6px) rotate(1deg)}}
@keyframes stamp{0%{opacity:0;transform:scale(1.4) rotate(-6deg)}70%{opacity:1;transform:scale(.97) rotate(-1deg)}}
@keyframes shine{from{left:-60%}to{left:130%}}
@keyframes print{0%{transform:translateY(-100%)}14%{transform:translateY(-86%)}22%{transform:translateY(-86%)}40%{transform:translateY(-58%)}48%{transform:translateY(-58%)}68%{transform:translateY(-28%)}76%{transform:translateY(-28%)}}
@keyframes roll{from{transform:translateY(0)}}
@keyframes fall{from{transform:translate3d(0,0,0) rotate(0)}to{transform:translate3d(var(--dx),920px,0) rotate(var(--r))}}
@keyframes ping{0%{transform:scale(.4);opacity:1}100%{transform:scale(1.3);opacity:0}}
@keyframes ripple{0%{transform:scale(1);opacity:.8}100%{transform:scale(1.8);opacity:0}}
@keyframes blink{50%{opacity:0}}
@keyframes tick{from{transform:rotate(0)}to{transform:rotate(-16deg)}}
@keyframes bulb{50%{fill:#FFFFFF}}
@keyframes breathe{50%{box-shadow:0 0 0 14px rgba(11,158,110,.2),0 0 0 30px rgba(11,158,110,.06)}}
@keyframes drop{0%{opacity:1;transform:translateY(-60px) rotate(-6deg)}35%{opacity:1;transform:translateY(0) rotate(0)}75%{opacity:1;transform:translateY(60px)}100%{opacity:0;transform:translateY(96px)}}
@keyframes flyin{0%{opacity:0;transform:translate(-90px,90px) rotate(-20deg) scale(.6)}60%{opacity:1;transform:translate(6px,-6px) rotate(4deg) scale(1.05)}}
@keyframes mq{to{transform:translateX(-50%)}}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(27,58,92,.16)}70%{box-shadow:0 0 0 14px rgba(27,58,92,0)}100%{box-shadow:0 0 0 0 rgba(27,58,92,0)}}
.a-rise{animation:rise .6s cubic-bezier(.2,.8,.2,1) both;animation-delay:var(--d,0s)}
.a-pop{animation:pop .55s cubic-bezier(.2,.9,.3,1.3) both;animation-delay:var(--d,0s)}
.a-grow{animation:grow .8s cubic-bezier(.2,.9,.3,1.15) both;animation-delay:var(--d,0s)}
.a-fade{animation:fade .6s both;animation-delay:var(--d,0s)}
.a-pulse{animation:pulse 1.8s ease-out infinite}
.a-fly{animation:flyin .8s cubic-bezier(.2,.9,.3,1.2) both;animation-delay:var(--d,0s)}

.static *,.static *:before,.static *:after{animation:none!important;transition:none!important}
.static .confetti{display:none}
.static .veil{backdrop-filter:none;-webkit-backdrop-filter:none;background:rgba(244,246,249,.88)}
.static .urn .card2{opacity:0}
/* --- Tickets par commerce, statuts de tirage, pastille, bloc « autres commerces » (01/11) --- */
.autres{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;margin-top:14px}
.autres .ai{width:44px;height:44px;border-radius:14px;background:var(--fl-accent-soft);color:var(--fl-accent);display:grid;place-items:center;flex:none}
.autres b{display:block;font-size:15.5px;font-weight:800;line-height:1.25}
.autres small{display:block;font-size:12.5px;color:var(--muted);font-weight:600;margin-top:4px;line-height:1.4}
.grp{padding:12px 14px;margin-top:10px}
.grp .gh{display:flex;gap:12px;align-items:center;padding-bottom:10px;border-bottom:1px solid var(--line)}
.grp .gh b{display:block;font-size:15.5px;font-weight:800;line-height:1.2}
.grp .gh small{display:block;font-size:12px;color:var(--muted);font-weight:600;margin-top:2px}
.grp .gt{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;padding:10px 0;border-top:1px solid var(--line)}
.grp .gt:first-of-type{border-top:0}
.grp .gt b{font-size:15px;font-weight:800}.grp .gt b i{font-style:normal;color:var(--muted);font-size:12px;font-weight:700}
.grp .gt small{flex:1;min-width:70px;font-size:12px;color:var(--muted);font-weight:600}
.grp .gt .tag{margin-top:0}
.tag.st-attente{background:#fff;border-color:#AEBBCD;color:var(--fl-ink)}
.tag.st-gagne{background:#DDF3F0;color:#0B6F67}
.tag.st-perdu{background:#FDECEC;color:#9B2323}
.nav a{position:relative}
.nav .pastille{position:absolute;top:-1px;left:calc(50% + 6px);min-width:18px;height:18px;padding:0 5px;border-radius:99px;background:var(--fl-touche);color:#fff;font-size:11px;font-weight:800;display:grid;place-items:center;border:2px solid #fff;line-height:1}
.card.alerte{display:flex;gap:12px;align-items:center;width:100%;padding:12px 14px;margin-top:14px;cursor:pointer;border-color:var(--fl-accent);background:var(--fl-accent-soft);font-family:inherit;color:var(--ink)}
.card.alerte .ai{width:42px;height:42px;border-radius:13px;background:var(--fl-accent);color:#fff;display:grid;place-items:center;flex:none}
.card.alerte b{display:block;font-size:15px;font-weight:800}
.card.alerte small{display:block;font-size:12.5px;color:var(--ink2);font-weight:600;margin-top:2px}
`