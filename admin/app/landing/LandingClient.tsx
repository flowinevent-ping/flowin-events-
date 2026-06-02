'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

/* ── Icônes SVG inline (sans CDN, robustes iOS/Android) ── */
const TIP: Record<string, string> = {
'help-circle':'<circle cx="12" cy="12" r="9"/><path d="M9.1 9a2.9 2.9 0 0 1 5.6 1c0 2-3 2-3 4"/><line x1="12" y1="17" x2="12" y2="17.01"/>',
'target-arrow':'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
'bolt':'<path d="M13 3 4 14h7l-1 7 9-11h-7z"/>',
'heart-handshake':'<path d="M12 20 4.8 12.8a4 4 0 0 1 6-5.2 4 4 0 0 1 6 5.2z"/><path d="M12 8.5 10.6 10a1.4 1.4 0 0 0 2 2"/>',
'device-gamepad-2':'<path d="M7 8h10a4 4 0 0 1 4 4 4 4 0 0 1-7 2.6l-.5-.6h-3l-.5.6A4 4 0 0 1 3 12a4 4 0 0 1 4-4z"/><line x1="7" y1="12" x2="9" y2="12"/><line x1="8" y1="11" x2="8" y2="13"/><line x1="15" y1="11" x2="15.01" y2="11"/><line x1="17" y1="13" x2="17.01" y2="13"/>',
'steering-wheel':'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.4"/><line x1="12" y1="14.4" x2="12" y2="21"/><line x1="9.9" y1="11" x2="3.6" y2="9"/><line x1="14.1" y1="11" x2="20.4" y2="9"/>',
'users-group':'<circle cx="9" cy="9" r="2.8"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17.5" cy="10" r="2.3"/><path d="M16.5 14.6a4.6 4.6 0 0 1 4 4.4"/>',
'user-check':'<circle cx="9" cy="8" r="3.4"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="m16 11 2 2 4-4"/>',
'phone':'<path d="M5 4h3l2 5-2.4 1.4a11 11 0 0 0 5 5L14 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
'brand-whatsapp':'<path d="M3 21l1.7-4.1A8 8 0 1 1 8 19.4z"/><path d="M9 9.4c0 3.8 2.9 5.8 5.3 5.8.8 0 1.4-.5 1.4-1.1 0-.3-1.6-1.2-1.9-1.2s-.6.6-1 .6-1.7-1-2.1-2.1c0-.3.7-.6.7-1s-1-1.9-1.2-1.9-1.2.3-1.2 1z"/>',
'tools-kitchen-2':'<path d="M5 3v6a2 2 0 0 0 4 0V3"/><line x1="7" y1="9" x2="7" y2="21"/><path d="M16 3c-1.6 0-2.8 2-2.8 4.4S14.4 12 16 12s2.8-2.2 2.8-4.6S17.6 3 16 3z"/><line x1="16" y1="12" x2="16" y2="21"/>',
'calendar-event':'<rect x="4" y="5" width="16" height="16" rx="2"/><line x1="4" y1="9.5" x2="20" y2="9.5"/><line x1="8" y1="3" x2="8" y2="6"/><line x1="16" y1="3" x2="16" y2="6"/><rect x="8" y="13" width="3.5" height="3.5" rx=".5"/>',
'building-store':'<path d="M4 9h16l-1.2-4.2a1 1 0 0 0-1-.8H6.2a1 1 0 0 0-1 .8z"/><path d="M5 9v1a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 4 0V9"/><path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/><path d="M9 20v-4h4v4"/>',
'building-community':'<path d="M3 21h18"/><path d="M5 21V7l6-3 6 3v14"/><line x1="9" y1="9" x2="9" y2="9.01"/><line x1="13" y1="9" x2="13" y2="9.01"/><line x1="9" y1="13" x2="9" y2="13.01"/><line x1="13" y1="13" x2="13" y2="13.01"/><path d="M9 21v-4h4v4"/>',
'building-bank':'<line x1="3" y1="21" x2="21" y2="21"/><path d="M3 10 12 4l9 6"/><line x1="5" y1="10" x2="5" y2="21"/><line x1="9" y1="10" x2="9" y2="21"/><line x1="15" y1="10" x2="15" y2="21"/><line x1="19" y1="10" x2="19" y2="21"/>',
'rotate-clockwise':'<path d="M19.9 13A8 8 0 1 1 18 7"/><path d="M18 3v4h-4"/>',
'ticket':'<path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4z"/><line x1="13" y1="6" x2="13" y2="18" stroke-dasharray="2 2"/>',
'thumb-up':'<path d="M7 11v8H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z"/><path d="M7 11l4-7a2 2 0 0 1 2 2v3h4.5a2 2 0 0 1 2 2.3l-1 5a2 2 0 0 1-2 1.7H7"/>',
'user':'<circle cx="12" cy="8" r="3.6"/><path d="M5 20a7 7 0 0 1 14 0"/>',
'award':'<circle cx="12" cy="9" r="5"/><path d="M9 13.5 7.5 21 12 18.5 16.5 21 15 13.5"/>',
'world':'<circle cx="12" cy="12" r="9"/><line x1="3.5" y1="9" x2="20.5" y2="9"/><line x1="3.5" y1="15" x2="20.5" y2="15"/><path d="M11.5 3a16 16 0 0 0 0 18M12.5 3a16 16 0 0 1 0 18"/>',
'brand-instagram':'<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.2"/><line x1="16.6" y1="7.4" x2="16.6" y2="7.41"/>',
'brand-facebook':'<path d="M13 22v-8h2.6l.4-3H13V9.1c0-.9.3-1.5 1.7-1.5H16V5.1A22 22 0 0 0 13.6 5C11.4 5 10 6.3 10 8.8V11H7.5v3H10v8z"/>',
'trending-up':'<path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/>',
}
function svg(n: string) {
  return '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block">' + (TIP[n] || '') + '</svg>'
}
function Ic({ n }: { n: string }) {
  return <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center' }} dangerouslySetInnerHTML={{ __html: svg(n) }} />
}

/* ── Données (reprises du prototype validé) ── */
interface Profil { ico:string; lbl:string; col:string; scenario:string; reponse:string; benefice:string }
const PROFILS: Profil[] = [
 { ico:'tools-kitchen-2', lbl:'Restaurateur', col:'#D62828',
   scenario:"Et si on créait une base client qui vous permettrait d'augmenter votre fréquentation ?",
   reponse:"Captez les clients qui passent sans laisser de trace, puis réactivez cette base quand vous en avez besoin : heures creuses, soirée à thème, nouveau menu, promo…",
   benefice:"Vous ne subissez plus les creux : vous les remplissez avec vos propres clients, sans racheter de la pub à chaque fois." },
 { ico:'calendar-event', lbl:"Créateur d'events", col:'#7B2FBE',
   scenario:"Et si vous pouviez recontacter directement ceux et celles qui sont venus ? Et si vous mesuriez votre trafic avec plus de précision — pour avoir de meilleurs partenaires ?",
   reponse:"Chaque participant entre dans une base qui vous appartient. Vous la réactivez d'un event à l'autre et vous savez précisément qui est venu, d'où, et combien.",
   benefice:"Vous ne repartez jamais de zéro et vous négociez vos partenariats avec des chiffres réels, pas des estimations." },
 { ico:'building-store', lbl:'Commerce', col:'#E85D04',
   scenario:"Faites de chaque fête une occasion d'acquérir du monde, boostez votre clientèle.",
   reponse:"Le flux que vous voyez passer sans le capter — faute de temps ou d'outil — devient une base à vous, réactivable à chaque temps fort, seul ou avec les commerces de votre rue.",
   benefice:"Une clientèle que vous possédez et relancez à volonté, au lieu de la voir repartir chez le voisin." },
 { ico:'building-community', lbl:'Association', col:'#3B5CC4',
   scenario:"Recensez vos actions, faites participer, sensibilisez, créez de l'engagement, gardez le contact, donnez de la visibilité à vos partenaires / mécènes.",
   reponse:"Le jeu capte vos participants et vos données d'engagement. Vous les valorisez au service de votre cause et vous animez votre communauté dans la durée.",
   benefice:"Un engagement mesurable, des rapports prêts pour vos mécènes, une communauté qui reste mobilisée entre deux actions." },
 { ico:'building-bank', lbl:'Institution', col:'#0B6E4F',
   scenario:"Donnez de l'attractivité, augmentez la visibilité et le trafic, mesurez l'impact et les retombées en temps réel.",
   reponse:"Le flux de visiteurs, aujourd'hui invisible, devient une donnée exploitable : d'où ils viennent, qui ils sont, quand ils passent — au service de votre territoire.",
   benefice:"Des retombées chiffrées en temps réel à présenter à vos élus et partenaires, sans étude coûteuse." },
]
interface Module { ico:string; nom:string; col:string; tag:string; f:string[] }
const MODULES: Module[] = [
 { ico:'rotate-clockwise', nom:'Roue de la fortune', col:'#3B5CC4', tag:'Premier contact CRM', f:['Segments personnalisables','Parcours mobile-first','Capture CRM en 30s'] },
 { ico:'help-circle', nom:'Quiz événement', col:'#A855F7', tag:'Qualifiez en engageant', f:['Banques par thème','Score animé','Ticket de tirage auto'] },
 { ico:'ticket', nom:'Tombola', col:'#E8212B', tag:'Tirage transparent', f:['Lots avec stocks','Tirage vérifiable','Export CSV gagnants'] },
 { ico:'thumb-up', nom:'Vote live', col:'#F59E0B', tag:'La foule en temps réel', f:['Résultats instantanés','Multi-choix','Historique des votes'] },
 { ico:'user', nom:'Quiz solo', col:'#00B4A0', tag:'Capture autonome', f:['Parcours libre','Score personnel','Ticket de participation'] },
 { ico:'award', nom:'Quiz master', col:'#F97316', tag:'Engagement compétitif', f:['Classement temps réel','Questions simultanées','Ambiance tournoi'] },
]
interface Tier { nom:string; prix:string; unite:string; badge:string|null; hl:boolean; f:string[] }
const PRICING: Tier[] = [
 { nom:'Votre campagne', prix:'189', unite:'/ event · HT', badge:null, hl:false, f:["Jusqu'à 1 000 participants","Tous les modules","Visuel co-brandé","Data stockée","Dashboard Pro temps réel","Export CSV","Chef de projet dédié"] },
 { nom:'Abonnement', prix:'289', unite:'/ mois', badge:'Recommandé', hl:true, f:["Jusqu'à 3 000 participants / event","Events illimités","Dashboard multi-events","Super events + tirage global","Rapports analytiques","Chef de projet dédié"] },
 { nom:'Sur mesure', prix:'Devis', unite:'', badge:null, hl:false, f:["Gros volumes","Stratégie & dev","Campagne sur fichier client","Customisation","Rapports analytiques","Super-events sponsorisés","Chef de projet dédié"] },
]
interface Step { verbe:string; ico:string; txt:string; col:string }
interface Proc { desc:string; steps:Step[] }
const PROCESS: Proc[] = [
 { desc:"Vous partez de zéro ou presque : captez le flux qui passe et construisez une base de contacts qui vous appartient.", steps:[
   { verbe:'Capter', ico:'target-arrow', txt:"Chaque visiteur — salon, marché, event — entre dans votre base en moins de 30 secondes !", col:'#E85D04' },
   { verbe:'Dynamiser', ico:'bolt', txt:"Créons de l'intérêt : par la participation, nous créons l'engagement !", col:'#3B5CC4' },
   { verbe:'Fidéliser', ico:'heart-handshake', txt:"Une base qui vous appartient, réexploitable à tout moment — des visiteurs et clients qui vous correspondent, avec leur consentement.", col:'#00B4A0' },
 ] },
 { desc:"Vous avez déjà des contacts, mais ils dorment : exploitez ce fichier et transformez-le en clients actifs à chaque temps fort.", steps:[
   { verbe:'Exploiter', ico:'rotate-clockwise', txt:"Réactivez vos clients et prospects dormants.", col:'#7B2FBE' },
   { verbe:'Dynamiser', ico:'bolt', txt:"Créez de l'engagement, gamifiez, créez de l'intérêt.", col:'#3B5CC4' },
   { verbe:'Transformer', ico:'trending-up', txt:"À vous de jouer ! Augmentez vos ventes, votre fréquentation, vos visites…", col:'#00B4A0' },
 ] },
]
const G_AGE = 'linear-gradient(90deg,#A855F7,#3B5CC4)'
const G_GEO = 'linear-gradient(90deg,#00B4A0,#3B5CC4)'
const G_CONNU = 'linear-gradient(90deg,#3B5CC4,#00B4A0)'
const AGE: [string,number,number][] = [['36-50 ans',81,100],['51-65 ans',37,46],['26-35 ans',28,35],['65 ans et +',20,25],['18-25 ans',15,19],['Moins de 18',11,14]]
const GENRE: [string,number,number,string][] = [['Femmes',61,61,'#00B4A0'],['Hommes',39,39,'#3B5CC4']]
const GEO: [string,number,number][] = [['06140',74,100],['06610',24,33],['06800',23,31],['06700',22,30],['06000',22,30],['06130',18,24]]
const RETOUR: [string,number,number,string][] = [['Oui',66,66,'#22C55E'],['Peut-être',3,3,'#F59E0B'],['Non',1,1,'#EF4444']]
const CONNU: [string,number][] = [['Affiche / Flyer',42],['Mairie',13],['Site internet',17],['Instagram',15],['Facebook',13]]
const REDIR: [string,string,number,string][] = [['Site internet','world',38,'#'],['Instagram','brand-instagram',31,'#'],['Facebook','brand-facebook',24,'#']]

function Bar({ lbl, n, w, col }: { lbl:string; n:string|number; w:number; col:string }) {
  return (
    <div className="bar">
      <span className="bl">{lbl}</span>
      <span className="bt"><span className="bf" style={{ width:w+'%', background:col }} /></span>
      <span className="bn">{n}</span>
    </div>
  )
}

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#F4F6F9;color:#1B3A5C;overflow-x:hidden;-webkit-text-size-adjust:100%}
  .lp-root{-webkit-tap-highlight-color:transparent}
  .wrap{max-width:1100px;margin:0 auto}
  .sec{padding:70px 24px}
  .sec-dark{background:#0E1B30;color:#fff}
  .eyebrow{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#00B4A0;text-align:center;margin-bottom:12px}
  .title{font-size:clamp(22px,4vw,32px);font-weight:800;text-align:center;line-height:1.25}
  .sub{font-size:14px;color:rgba(120,130,150,.9);text-align:center;margin-top:8px}
  .sec-dark .sub{color:rgba(255,255,255,.55)}
  .pico{width:20px;height:20px;flex-shrink:0;color:#00B4A0}
  .hero{background:linear-gradient(160deg,#13314f 0%,#0E2742 55%,#0A1C32 100%);color:#fff;text-align:center;padding:90px 24px 80px}
  .logo{font-size:clamp(40px,8vw,64px);font-weight:900;letter-spacing:-.02em}
  .logo em{color:#A855F7;font-style:normal}
  .promise{font-size:clamp(24px,4vw,40px);font-weight:900;line-height:1.15;margin:18px auto 16px;max-width:760px}
  .baseline{font-size:clamp(17px,2.5vw,22px);font-weight:900;margin-bottom:10px}
  .baseline .c1{color:#F97316}.baseline .c2{color:#3B5CC4}.baseline .c3{color:#00B4A0}
  .ans{color:rgba(255,255,255,.6);font-size:15px;margin-bottom:26px}
  .hstats{display:flex;gap:26px;justify-content:center;margin:24px 0 26px;flex-wrap:wrap}
  .hstat .v{font-size:clamp(26px,4vw,36px);font-weight:900;color:#00B4A0}
  .hstat .l{font-size:12px;color:rgba(255,255,255,.55)}
  .cta{display:inline-flex;align-items:center;gap:8px;background:#00B4A0;color:#fff;border:none;border-radius:100px;padding:16px 36px;font-size:16px;font-weight:800;cursor:pointer;text-decoration:none}
  .prob{display:grid;gap:10px;max-width:680px;margin:28px auto 0}
  .prob .q{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:14px 16px;font-size:15px}
  .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:30px}
  .bcard{background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:16px;padding:26px 22px;text-align:center;box-shadow:0 8px 30px rgba(20,40,80,.05)}
  .bcard .ic{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:26px}
  .bcard h3{font-size:18px;margin-bottom:8px}.bcard p{font-size:13px;color:#5a6b80;line-height:1.5}
  .chips{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin:30px 0}
  .chip{background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:16px;padding:18px 14px;width:150px;text-align:center;cursor:pointer;transition:.15s}
  .chip.on{border-color:#00B4A0;box-shadow:0 0 0 3px rgba(0,180,160,.12)}
  .chip .ic{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:22px}
  .chip .nm{font-size:13px;font-weight:800;line-height:1.2}
  .pdetail{background:#fff;border-radius:18px;padding:28px;max-width:920px;margin:0 auto;box-shadow:0 12px 40px rgba(20,40,80,.06)}
  .ptabs{display:flex;gap:8px;margin:14px 0 18px}
  .ptab{border:1px solid rgba(0,0,0,.1);background:#fff;border-radius:100px;padding:8px 18px;font-size:13px;font-weight:700;cursor:pointer;color:#1B3A5C}
  .ptab.on{background:#00B4A0;color:#fff;border-color:#00B4A0}
  .ptext{font-size:16px;font-style:italic;color:#3a4d63;line-height:1.6;min-height:54px}
  .axcard{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:28px}
  .pcardp{background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:20px;padding:32px;box-shadow:0 4px 20px rgba(0,0,0,.04);text-align:left}
  .proc-sel{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:6px 0 26px}
  .proc-btn{border:1.5px solid rgba(0,0,0,.12);background:#fff;border-radius:100px;padding:14px 26px;font-size:15px;font-weight:800;cursor:pointer;color:#1B3A5C;transition:all .15s}
  .proc-btn.on{background:#1B3A5C;color:#fff;border-color:#1B3A5C}
  .proc-view{background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:20px;padding:34px 28px;box-shadow:0 4px 20px rgba(0,0,0,.04);max-width:880px;margin:0 auto}
  .proc-desc{font-size:16px;color:#3a4d63;line-height:1.6;margin-bottom:24px;text-align:center}
  .proc-steps{display:grid;grid-template-columns:1fr 1fr 1fr;gap:22px;margin-top:6px}
  @media(max-width:720px){.proc-steps{grid-template-columns:1fr}}
  .pstep{display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px}
  .pstep .pico{width:50px;height:50px;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:25px}
  .pstep .pverb{font-size:18px;font-weight:800}
  .pstep .ptxt{font-size:14px;color:#5B7085;line-height:1.55}
  .proof{display:flex;gap:50px;justify-content:center;margin:10px 0 24px;flex-wrap:wrap}
  .proof .v{font-size:clamp(40px,7vw,64px);font-weight:900}
  .proof .l{font-size:13px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.08em;text-align:center}
  .quote{font-size:18px;font-style:italic;color:rgba(255,255,255,.9);text-align:center;max-width:700px;margin:0 auto}
  .grid3m{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:30px}
  .mcard{background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:16px;padding:22px}
  .mcard .ic{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:12px}
  .mcard h3{font-size:16px;margin-bottom:4px}.mcard .tag{font-size:12px;color:#00B4A0;font-weight:700;margin-bottom:10px}
  .mcard li{font-size:12px;color:#5a6b80;padding:5px 0;border-top:1px solid rgba(0,0,0,.06);list-style:none;display:flex;gap:6px}
  .mcard li::before{content:'✓';color:#00B4A0;font-weight:900}
  .dash{background:linear-gradient(180deg,#0F1E36,#0A1424);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:24px;max-width:820px;margin:0 auto;text-align:left}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px}
  .kpi{background:rgba(255,255,255,.04);border-radius:12px;padding:14px;text-align:center}
  .kpi .v{font-size:22px;font-weight:900}.kpi .l{font-size:11px;color:rgba(255,255,255,.55)}
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:28px}
  .barh{font-size:13px;font-weight:800;color:rgba(255,255,255,.7);margin-bottom:14px}
  .bar{display:flex;align-items:center;gap:10px;margin-bottom:9px;font-size:12px}
  .bar .bl{width:92px;color:rgba(255,255,255,.7);flex-shrink:0}
  .bar .bt{flex:1;height:8px;background:rgba(255,255,255,.06);border-radius:100px;overflow:hidden}
  .bar .bf{display:block;height:100%;border-radius:100px}
  .bar .bn{width:30px;text-align:right;font-weight:800}
  .gam{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:30px}
  .gcard{background:linear-gradient(180deg,rgba(16,31,56,.9),rgba(10,20,36,.9));border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:28px 22px;text-align:center}
  .gcard .ic{font-size:40px;margin-bottom:12px;display:inline-flex}
  .gcard h3{font-size:20px;font-weight:900;margin-bottom:12px}
  .gcard .gi{font-size:13px;color:rgba(255,255,255,.6);padding:7px 0;border-top:1px solid rgba(255,255,255,.07)}
  .price{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:30px;max-width:920px;margin-left:auto;margin-right:auto}
  .pcard{position:relative;background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:18px;padding:28px 22px;text-align:center}
  .pcard.hl{border:2px solid #00B4A0}
  .pbadge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#00B4A0;color:#fff;font-size:11px;font-weight:800;padding:4px 14px;border-radius:100px;text-transform:uppercase}
  .pcard .pn{font-size:13px;font-weight:800;text-transform:uppercase;color:#5a6b80}
  .pcard .pp{font-size:32px;font-weight:900;margin:8px 0}.pcard .pu{font-size:13px;color:#5a6b80}
  .pcard li{list-style:none;font-size:13px;color:#3a4d63;padding:6px 0;border-top:1px solid rgba(0,0,0,.06);display:flex;gap:6px;text-align:left}
  .pcard li::before{content:'✓';color:#00B4A0;font-weight:900}
  .pm-line{text-align:center;margin-top:22px;font-size:14px;font-weight:700;color:#3a4d63;display:flex;align-items:center;justify-content:center;gap:8px}
  .ctafinal{background:linear-gradient(160deg,#13314f,#0A1C32);color:#fff;text-align:center;padding:80px 24px}
  .ctafinal h2{font-size:clamp(24px,4vw,34px);font-weight:900;margin-bottom:10px}
  .ctaform{max-width:420px;margin:24px auto 0;display:grid;gap:10px}
  .ctaform input,.ctaform select{padding:14px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#fff;font-size:16px;font-family:inherit;width:100%}
  .ctaform input::placeholder{color:rgba(255,255,255,.5)}
  .ctaform select option{color:#1B3A5C}
  .ctacall{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:18px auto 0;max-width:420px}
  .ctacall a{flex:1;min-width:150px;display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:100px;padding:13px 22px;font-size:15px;font-weight:800;text-decoration:none}
  .ctacall .callbtn{background:rgba(255,255,255,.10);color:#fff;border:1.5px solid rgba(255,255,255,.35)}
  .ctacall .wabtn{background:#25D366;color:#0A1C32}
  .ctaor{color:rgba(255,255,255,.5);font-size:13px;margin-top:14px}
  .redirviz{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:14px}
  .redirviz .rv{flex:1;min-width:120px;max-width:210px;display:flex;flex-direction:column;align-items:center;gap:6px;padding:18px 12px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff;text-decoration:none;transition:background .15s}
  .redirviz .rv:hover{background:rgba(255,255,255,.12)}
  .redirviz .rv-ic{width:36px;height:36px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;background:rgba(0,180,160,.18);color:#00B4A0;font-size:20px}
  .redirviz .rv-n{font-size:26px;font-weight:900;color:#00B4A0;line-height:1}
  .redirviz .rv-l{font-size:13px;color:rgba(255,255,255,.7)}
  .note{font-size:13px;color:rgba(255,255,255,.5);margin-top:14px}
  .thanks{max-width:420px;margin:24px auto 0;background:rgba(0,180,160,.12);border:1px solid rgba(0,180,160,.4);border-radius:16px;padding:28px 22px}
  .thanks h3{font-size:20px;font-weight:900;margin-bottom:6px}
  .thanks p{font-size:14px;color:rgba(255,255,255,.75)}
  @media(max-width:720px){.grid3,.grid3m,.gam,.price,.kpis,.cols{grid-template-columns:1fr}.kpis{grid-template-columns:repeat(2,1fr)}}
`

export default function LandingClient({ source = '' }: { cfg?: unknown; source?: string }) {
  const [psel, setPsel] = useState(0)
  const [sel, setSel]   = useState(0)
  const [tab, setTab]   = useState<'reponse'|'benefice'>('reponse')
  const [form, setForm] = useState({ prenom:'', email:'', tel:'', secteur:'' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  async function handleSubmit() {
    if (!form.prenom.trim() || !form.email.includes('@')) return
    setSubmitting(true)
    const today = new Date().toISOString().slice(0,10)
    const emailLower = form.email.toLowerCase().trim()
    await supabase.from('joueurs').upsert({
      external_id: `j-cta-${emailLower.replace(/[^a-z0-9]/g,'-').substring(0,36)}`,
      email: emailLower, prenom: form.prenom.trim(), tel: form.tel.trim() || null,
      tags: ['btob','cta', form.secteur].filter(Boolean),
      optin: true, optin_date: today, first_seen: today, last_seen: today,
      source: source === 'qr' ? 'landing_qr' : 'landing_cta',
      client_type: 'btob', enseigne: form.secteur || null,
    }, { onConflict: 'external_id' })
    setSubmitting(false); setSubmitted(true)
  }

  const p = PROFILS[sel]
  const proc = PROCESS[psel]

  return (
    <div className="lp-root">
      <style>{CSS}</style>

      {/* HERO */}
      <section className="hero">
        <div className="logo">Flow<em>in</em></div>
        <h1 className="promise">Transformez votre passage en prospect, vos prospects en clients.</h1>
        <div className="baseline"><span className="c1">Captez</span> · <span className="c2">Dynamisez</span> · <span className="c3">Fidélisez</span></div>
        <div className="hstats">
          <div className="hstat"><div className="v">980</div><div className="l">contacts captés</div></div>
          <div className="hstat"><div className="v">5 dates</div><div className="l">une saison</div></div>
          <div className="hstat"><div className="v">100%</div><div className="l">d&apos;opt-in</div></div>
        </div>
        <a className="cta" href="#cta">Jouer et gagner mon premier event →</a>
      </section>

      {/* PROBLEME */}
      <section className="sec sec-dark" id="probleme">
        <div className="wrap" style={{ maxWidth:760, textAlign:'center' }}>
          <div className="eyebrow">Le constat</div>
          <div className="title" style={{ color:'#fff' }}>Des visiteurs, des prospects, des clients passent. Et après{'\u00A0'}?</div>
          <div className="prob">
            {[
              'Combien de personnes sont passées à votre stand, boutique, event ?',
              'Pouvez-vous les recontacter ?',
              'Combien de clients viennent chaque jour ? Quel est le pic de fréquentation ?',
              'D\u2019où viennent-ils ?',
              'Quel est votre taux de retour questionnaire ?',
              'Quels chiffres transmettre à vos partenaires ?',
            ].map((q, i) => (
              <div className="q" key={i}><Ic n="help-circle" /> {q}</div>
            ))}
          </div>
        </div>
      </section>

      {/* BESOINS */}
      <section className="sec">
        <div className="wrap">
          <div className="eyebrow">Vos besoins</div>
          <div className="title">Tout ce dont vous avez besoin, à portée de main.</div>
          <div className="sub">Vous souhaitez…</div>
          <div className="proc-sel">
            <button className={'proc-btn' + (psel===0?' on':'')} onClick={() => setPsel(0)}>Créer votre base</button>
            <button className={'proc-btn' + (psel===1?' on':'')} onClick={() => setPsel(1)}>Exploiter votre base existante</button>
          </div>
          <div className="proc-view">
            <p className="proc-desc">{proc.desc}</p>
            <div className="proc-steps">
              {proc.steps.map((s, i) => (
                <div className="pstep" key={i}>
                  <span className="pico" style={{ background:s.col+'18', color:s.col }}><Ic n={s.ico} /></span>
                  <span className="pverb" style={{ color:s.col }}>{s.verbe}</span>
                  <span className="ptxt">{s.txt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROFILS */}
      <section className="sec">
        <div className="wrap">
          <div className="title">Flowin s&apos;adapte à votre activité</div>
          <div className="sub">Choisissez votre profil pour voir ce que Flowin peut faire pour vous.</div>
          <div className="chips">
            {PROFILS.map((pf, i) => (
              <div className={'chip' + (i===sel?' on':'')} key={i} onClick={() => setSel(i)}>
                <div className="ic" style={{ background:pf.col+'18', color:pf.col }}><Ic n={pf.ico} /></div>
                <div className="nm">{pf.lbl}</div>
              </div>
            ))}
          </div>
          <div className="pdetail">
            <h3 style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ width:34, height:34, borderRadius:9, display:'inline-flex', alignItems:'center', justifyContent:'center', background:p.col+'18', color:p.col }}><Ic n={p.ico} /></span> {p.lbl}
            </h3>
            <div style={{ marginTop:10, fontSize:15, fontWeight:600, color:'#1B3A5C' }}>{p.scenario}</div>
            <div className="ptabs" style={{ marginTop:16 }}>
              <button className={'ptab' + (tab==='reponse'?' on':'')} onClick={() => setTab('reponse')}>La réponse Flowin</button>
              <button className={'ptab' + (tab==='benefice'?' on':'')} onClick={() => setTab('benefice')}>Le bénéfice</button>
            </div>
            <div className="ptext">{tab==='reponse' ? p.reponse : p.benefice}</div>
          </div>
        </div>
      </section>

      {/* PREUVE */}
      <section className="sec sec-dark">
        <div className="wrap">
          <div className="eyebrow">Ils l&apos;ont fait. Vraiment.</div>
          <div className="proof">
            <div><div className="v" style={{ color:'#00B4A0' }}>980</div><div className="l">contacts</div></div>
            <div><div className="v" style={{ color:'#F59E0B' }}>5</div><div className="l">dates</div></div>
            <div><div className="v" style={{ color:'#A855F7' }}>100%</div><div className="l">opt-in</div></div>
          </div>
          <div className="quote">« En 5 dates, nous avons capté 980 personnes qui ont accepté d&apos;être recontactées. »</div>
        </div>
      </section>

      {/* MODULES */}
      <section className="sec">
        <div className="wrap">
          <div className="eyebrow">6 mécaniques</div>
          <div className="title">Un module pour chaque moment</div>
          <div className="grid3m">
            {MODULES.map((m, i) => (
              <div className="mcard" key={i}>
                <div className="ic" style={{ background:m.col+'18', color:m.col }}><Ic n={m.ico} /></div>
                <h3>{m.nom}</h3>
                <div className="tag">{m.tag}</div>
                <ul>{m.f.map((x, j) => <li key={j}>{x}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS DASHBOARD */}
      <section className="sec sec-dark">
        <div className="wrap" style={{ maxWidth:820, textAlign:'center' }}>
          <div className="eyebrow">Vos chiffres, en direct</div>
          <div className="title" style={{ color:'#fff' }}>Vous mesurez tout, en temps réel.</div>
          <div className="sub">Données réelles d&apos;un événement physique (192 participants).</div>
          <div className="dash" style={{ marginTop:28 }}>
            <div className="kpis">
              <div className="kpi"><div className="v" style={{ color:'#00B4A0' }}>192</div><div className="l">Participants</div></div>
              <div className="kpi"><div className="v" style={{ color:'#00B4A0' }}>43 ans</div><div className="l">Âge moyen</div></div>
              <div className="kpi"><div className="v" style={{ color:'#3B5CC4' }}>100%</div><div className="l">Conversion</div></div>
              <div className="kpi"><div className="v" style={{ color:'#F59E0B' }}>74%</div><div className="l">Opt-in RGPD</div></div>
            </div>
            <div className="cols">
              <div>
                <div className="barh">Tranches d&apos;âge</div>
                <div>{AGE.map((r, i) => <Bar key={i} lbl={r[0]} n={r[1]} w={r[2]} col={G_AGE} />)}</div>
                <div className="barh" style={{ marginTop:22 }}>Répartition par genre</div>
                <div>{GENRE.map((r, i) => <Bar key={i} lbl={r[0]} n={r[1]+'%'} w={r[2]} col={r[3]} />)}</div>
              </div>
              <div>
                <div className="barh">D&apos;où viennent vos visiteurs</div>
                <div>{GEO.map((r, i) => <Bar key={i} lbl={r[0]} n={r[1]} w={r[2]} col={G_GEO} />)}</div>
                <div className="barh" style={{ marginTop:22 }}>Intention de revenir</div>
                <div>{RETOUR.map((r, i) => <Bar key={i} lbl={r[0]} n={r[1]+'%'} w={r[2]} col={r[3]} />)}</div>
              </div>
            </div>
            <div className="barh" style={{ marginTop:24 }}>Comment ils ont connu l&apos;événement</div>
            <div className="cols" style={{ gap:'2px 28px' }}>
              {CONNU.map((r, i) => <Bar key={i} lbl={r[0]} n={r[1]+'%'} w={r[1]*2} col={G_CONNU} />)}
            </div>
            <div className="barh" style={{ marginTop:24 }}>Redirections vers vos liens après le jeu</div>
            <div className="redirviz">
              {REDIR.map((r, i) => (
                <a className="rv" href={r[3]} target="_blank" rel="noopener" key={i}>
                  <span className="rv-ic"><Ic n={r[1]} /></span>
                  <span className="rv-n">{r[2]}%</span>
                  <span className="rv-l">{r[0]}</span>
                </a>
              ))}
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.35)', marginTop:18, textAlign:'center', fontStyle:'italic' }}>Et aussi : « venu avec », événements préférés, créneaux horaires, score par tranche d&apos;âge… tout est mesuré.</div>
          </div>
        </div>
      </section>

      {/* GAMME */}
      <section className="sec sec-dark">
        <div className="wrap">
          <div className="eyebrow">La gamme</div>
          <div className="title" style={{ color:'#fff' }}>Ce que Flowin vous permet de faire</div>
          <div className="gam">
            <div className="gcard"><div className="ic" style={{ color:'#00B4A0' }}><Ic n="device-gamepad-2" /></div><h3>Animer</h3><div className="gi">6 modules de jeu</div><div className="gi">Customisation jeux / lots / quiz</div><div className="gi">Marque blanche</div></div>
            <div className="gcard"><div className="ic" style={{ color:'#3B5CC4' }}><Ic n="steering-wheel" /></div><h3>Piloter</h3><div className="gi">Dashboard temps réel</div><div className="gi">Stats : genre, âge, opt-in, géo</div><div className="gi">Base client réutilisable</div></div>
            <div className="gcard"><div className="ic" style={{ color:'#A855F7' }}><Ic n="users-group" /></div><h3>Mutualiser</h3><div className="gi">Super-events collectifs</div><div className="gi">Sponsoring / partenaires</div><div className="gi">Rejoindre un super-event</div></div>
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section className="sec">
        <div className="wrap">
          <div className="eyebrow">Tarifs</div>
          <div className="title">Boostez, mesurez, gardez le contact.</div>
          <div className="sub">Flowin : vous créez l&apos;événement, on crée l&apos;engagement.</div>
          <div className="price">
            {PRICING.map((pr, i) => (
              <div className={'pcard' + (pr.hl?' hl':'')} key={i}>
                {pr.badge && <div className="pbadge">{pr.badge}</div>}
                <div className="pn">{pr.nom}</div>
                <div className="pp">{pr.prix==='Devis' ? 'Sur devis' : pr.prix+' €'}</div>
                <div className="pu">{pr.unite}</div>
                <ul style={{ marginTop:14 }}>{pr.f.map((x, j) => <li key={j}>{x}</li>)}</ul>
              </div>
            ))}
          </div>
          <div className="pm-line"><span style={{ color:'#3B5CC4', display:'inline-flex' }}><Ic n="user-check" /></span> Un chef de projet dédié à votre compte.</div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="ctafinal" id="cta">
        <div className="wrap">
          <h2>Gagnez votre premier event</h2>
          <div style={{ color:'rgba(255,255,255,.6)', fontSize:15 }}>Aucune CB requise · Rappel sous 24h · Sans engagement</div>
          {submitted ? (
            <div className="thanks">
              <h3>Merci {form.prenom} !</h3>
              <p>Votre demande est enregistrée. On vous rappelle sous 24h.</p>
            </div>
          ) : (
            <>
              <div className="ctaform">
                <input placeholder="Votre prénom" value={form.prenom} onChange={e => setForm({ ...form, prenom:e.target.value })} />
                <input type="email" placeholder="Email professionnel" value={form.email} onChange={e => setForm({ ...form, email:e.target.value })} />
                <input type="tel" placeholder="Téléphone" value={form.tel} onChange={e => setForm({ ...form, tel:e.target.value })} />
                <select value={form.secteur} onChange={e => setForm({ ...form, secteur:e.target.value })}>
                  <option value="">Secteur d&apos;activité…</option>
                  <option>Commerce &amp; Négoce</option>
                  <option>Restaurateur</option>
                  <option>Association / Événementiel</option>
                  <option>Municipalité / Office de tourisme</option>
                </select>
                <button className="cta" style={{ justifyContent:'center', marginTop:6 }} onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Envoi…' : 'Gagner mon premier event →'}
                </button>
              </div>
              <div className="ctaor">— ou contactez-nous directement —</div>
              <div className="ctacall">
                <a className="callbtn" href="tel:+33616354936"><Ic n="phone" /> Appelez-nous</a>
                <a className="wabtn" href="https://wa.me/33616354936" target="_blank" rel="noopener"><Ic n="brand-whatsapp" /> WhatsApp</a>
              </div>
              <div className="note">Données jamais cédées à des tiers · RGPD</div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
