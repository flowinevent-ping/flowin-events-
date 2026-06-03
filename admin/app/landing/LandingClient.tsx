'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { trackVisite } from '@/lib/track'

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
'mail':'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
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
 { nom:'Votre campagne', prix:'189', unite:'/ event · HT', badge:null, hl:false, f:["Jusqu'à 1 000 participants","Tous les modules","Visuel co-brandé","Data stockée","Tableau de bord Pro temps réel","Export CSV","Chef de projet dédié"] },
 { nom:'Abonnement', prix:'289', unite:'/ mois', badge:'Recommandé', hl:true, f:["Jusqu'à 3 000 participants / event","Events illimités","Tableau de bord multi-events","Super events + tirage global","Rapports analytiques","Chef de projet dédié"] },
 { nom:'Sur mesure', prix:'Devis', unite:'', badge:null, hl:false, f:["Gros volumes","Stratégie & dev","Campagne sur fichier client","Customisation","Rapports analytiques","Super-events sponsorisés","Chef de projet dédié"] },
]
interface Step { verbe:string; ico:string; txt:string; col:string }
interface Proc { desc:string; steps:Step[] }
const PROCESS: Proc[] = [
 { desc:"Vous partez de zéro ou presque : captez le flux qui passe et construisez une base de contacts qui vous appartient.", steps:[
   { verbe:'Captez', ico:'target-arrow', txt:"Chaque visiteur — salon, marché, event — entre dans votre base en moins de 30 secondes !", col:'#E85D04' },
   { verbe:'Dynamisez', ico:'bolt', txt:"Créons de l'intérêt : par la participation, nous créons l'engagement !", col:'#3B5CC4' },
   { verbe:'Fidélisez', ico:'heart-handshake', txt:"Une base qui vous appartient, réexploitable à tout moment — des visiteurs et clients qui vous correspondent, avec leur consentement.", col:'#00B4A0' },
 ] },
 { desc:"Vous avez déjà des contacts ? Flowin vous aide à valoriser et exploiter votre capital.", steps:[
   { verbe:'Exploitez', ico:'rotate-clockwise', txt:"Réactivez vos clients et prospects dormants.", col:'#7B2FBE' },
   { verbe:'Dynamisez', ico:'bolt', txt:"Créez de l'engagement, gamifiez, créez de l'intérêt.", col:'#3B5CC4' },
   { verbe:'Transformez', ico:'trending-up', txt:"À vous de jouer ! Augmentez vos ventes, votre fréquentation, vos visites…", col:'#00B4A0' },
 ] },
]
const G_AGE = 'linear-gradient(90deg,#3B5CC4,#00B4A0)'
const G_GEO = 'linear-gradient(90deg,#00B4A0,#3B5CC4)'
const AGE: [string,number,number][] = [['36-50 ans',81,100],['51-65 ans',37,46],['26-35 ans',28,35],['65 ans et +',20,25],['18-25 ans',15,19],['Moins de 18',11,14]]
const GENRE: [string,number,number,string][] = [['Femmes',61,61,'#00B4A0'],['Hommes',39,39,'#3B5CC4']]
const GEO: [string,number,number][] = [['06140',74,100],['06610',24,33],['06800',23,31],['06700',22,30],['06000',22,30],['06130',18,24]]
const RETOUR: [string,number,number,string][] = [['Oui',66,66,'#22C55E'],['Peut-être',3,3,'#F59E0B'],['Non',1,1,'#EF4444']]
const CONNU: [string,number][] = [['Affiche / Flyer',42],['Mairie',13],['Site internet',17],['Instagram',15],['Facebook',13]]
const REDIR: [string,string,number,string][] = [['Site internet','world',38,'#'],['Instagram','brand-instagram',31,'#'],['Facebook','brand-facebook',24,'#']]
const G_JOURS = 'linear-gradient(90deg,#00B4A0,#22C55E)'
const JOURS: [string,number,number][] = [['Samedi',71,100],['Dimanche',54,76],['Mercredi',33,46],['Vendredi',21,30],['Jeudi',13,18]]
const HEURES: [string,number,number][] = [['16h–18h',58,100],['14h–16h',49,84],['10h–12h',38,66],['18h–20h',30,52],['12h–14h',17,29]]

function Bar({ lbl, n, w, col }: { lbl:string; n:string|number; w:number; col:string }) {
  return (
    <div className="bar">
      <span className="bl">{lbl}</span>
      <span className="bt"><span className="bf" style={{ width:w+'%', background:col }} /></span>
      <span className="bn">{n}</span>
    </div>
  )
}

function Pyramid({ data, grad }:{ data:[string,number,number][]; grad:string }) {
  const max = Math.max(...data.map(d => d[1]))
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:13, padding:'4px 0' }}>
      {data.map((d, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:10, fontSize:14 }}>
          <span style={{ width:84, textAlign:'right', color:'rgba(255,255,255,.72)', flexShrink:0 }}>{d[0]}</span>
          <span style={{ flex:1, display:'flex', justifyContent:'center' }}>
            <span style={{ width:((d[1]/max)*100)+'%', height:20, background:grad, borderRadius:100, display:'block' }} />
          </span>
          <span style={{ width:30, textAlign:'right', fontWeight:800, color:'#fff', flexShrink:0, fontSize:16 }}>{d[1]}</span>
        </div>
      ))}
    </div>
  )
}

function Donut({ data }:{ data:[string,number,string][] }) {
  const C = 263.9
  const total = data.reduce((s, d) => s + d[1], 0) || 1
  let acc = 0
  const segs = data.map((d) => {
    const start = (acc / total) * C
    const len = (d[1] / total) * C
    acc += d[1]
    return { len, start, col:d[2] }
  })
  const lead = Math.round((data[0][1] / total) * 100)
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:18, padding:'4px 0' }}>
      <svg width="168" height="168" viewBox="0 0 120 120">
        <g transform="rotate(-90 60 60)">
          <circle cx="60" cy="60" r="42" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="16" />
          {segs.map((s, i) => (
            <circle key={i} cx="60" cy="60" r="42" fill="none" stroke={s.col} strokeWidth="16"
              strokeDasharray={s.len + ' ' + (C - s.len)} strokeDashoffset={-s.start} />
          ))}
        </g>
        <text x="60" y="57" textAnchor="middle" fill="#fff" fontSize="23" fontWeight="900">{lead}%</text>
        <text x="60" y="73" textAnchor="middle" fill="rgba(255,255,255,.5)" fontSize="10">{data[0][0]}</text>
      </svg>
      <div style={{ display:'flex', flexDirection:'column', gap:9, width:'100%' }}>
        {data.map((d, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, color:'rgba(255,255,255,.72)' }}>
            <span style={{ width:12, height:12, borderRadius:4, background:d[2], flexShrink:0 }} />
            <span style={{ flex:1 }}>{d[0]}</span>
            <span style={{ fontWeight:800, color:'#fff' }}>{d[1]}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Gauge({ pct, label, color }:{ pct:number; label:string; color:string }) {
  const C = Math.PI * 50
  const len = (pct / 100) * C
  return (
    <div style={{ display:'flex', justifyContent:'center', paddingTop:6 }}>
      <svg width="186" height="108" viewBox="0 0 120 70">
        <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="14" strokeLinecap="round" />
        <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={len + ' ' + C} />
        <text x="60" y="50" textAnchor="middle" fill="#fff" fontSize="26" fontWeight="900">{pct}%</text>
        <text x="60" y="64" textAnchor="middle" fill="rgba(255,255,255,.5)" fontSize="9">{label}</text>
      </svg>
    </div>
  )
}

function carStep(el:HTMLElement):number {
  const child = el.children[0] as HTMLElement | undefined
  return child ? child.getBoundingClientRect().width + 14 : el.clientWidth
}
function Dots({ id, count }:{ id:string; count:number }) {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const el = document.getElementById(id)
    if (!el) return
    const onScroll = () => setActive(Math.round(el.scrollLeft / carStep(el)))
    el.addEventListener('scroll', onScroll, { passive:true })
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [id])
  const go = (i:number) => {
    const el = document.getElementById(id)
    if (el) el.scrollTo({ left: i * carStep(el), behavior:'smooth' })
  }
  return (
    <div className="cdots">
      {Array.from({ length: count }).map((_, i) => (
        <button key={i} type="button" aria-label={'Voir ' + (i + 1)} className={'cdot' + (i === active ? ' on' : '')} onClick={() => go(i)} />
      ))}
    </div>
  )
}

function Wave({ data, color }:{ data:[string,number,number][]; color:string }) {
  const W = 280, H = 90, pad = 18
  const innerW = W - pad * 2
  const max = Math.max(...data.map(d => d[1]))
  const n = data.length
  const pts = data.map((d, i) => [pad + (n === 1 ? innerW/2 : (i/(n-1))*innerW), H - 6 - (d[1]/max)*(H-26)] as [number,number])
  const curve = (arr:[number,number][]) => arr.slice(1).map((p, i) => {
    const x0 = arr[i][0], y0 = arr[i][1], x1 = p[0], y1 = p[1], mx = (x0+x1)/2
    return ' C' + mx + ' ' + y0 + ' ' + mx + ' ' + y1 + ' ' + x1 + ' ' + y1
  }).join('')
  const line = 'M' + pts[0][0] + ' ' + pts[0][1] + curve(pts)
  const area = line + ' L' + pts[n-1][0] + ' ' + H + ' L' + pts[0][0] + ' ' + H + ' Z'
  return (
    <svg width="100%" viewBox={'0 0 ' + W + ' ' + (H + 22)} preserveAspectRatio="none" style={{ display:'block' }}>
      <defs><linearGradient id="wvgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.45" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={area} fill="url(#wvgrad)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={color} />)}
      {data.map((d, i) => <text key={'v'+i} x={pts[i][0]} y={pts[i][1]-7} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="800">{d[1]}</text>)}
      {data.map((d, i) => <text key={'l'+i} x={pts[i][0]} y={H+16} textAnchor="middle" fill="rgba(255,255,255,.6)" fontSize="9">{d[0]}</text>)}
    </svg>
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
  .title{font-size:clamp(28px,6.6vw,38px);font-weight:800;text-align:center;line-height:1.2;overflow-wrap:break-word}
  .sub{font-size:14px;color:rgba(120,130,150,.9);text-align:center;margin-top:8px}
  .sec-dark .sub{color:rgba(255,255,255,.55)}
  .pico{width:20px;height:20px;flex-shrink:0;color:#00B4A0}
  .hero{background:linear-gradient(160deg,#13314f 0%,#0E2742 55%,#0A1C32 100%);color:#fff;text-align:center;padding:90px 24px 80px}
  .logo{font-size:clamp(56px,13vw,78px);font-weight:900;letter-spacing:-.02em}
  .logo em{color:#A855F7;font-style:normal}
  .promise{font-size:clamp(31px,7.2vw,46px);font-weight:900;line-height:1.13;margin:18px auto 16px;max-width:760px}
  .baseline{font-size:clamp(21px,4.8vw,28px);font-weight:900;margin-bottom:10px}
  .baseline .c1{color:#F97316}.baseline .c2{color:#3B5CC4}.baseline .c3{color:#00B4A0}
  .ans{color:rgba(255,255,255,.6);font-size:15px;margin-bottom:26px}
  .hstats{display:flex;gap:26px;justify-content:center;margin:24px 0 26px;flex-wrap:wrap}
  .hstat .v{font-size:clamp(26px,4vw,36px);font-weight:900;color:#00B4A0}
  .hstat .l{font-size:12px;color:rgba(255,255,255,.55)}
  .cta{display:inline-flex;align-items:center;gap:8px;background:#00B4A0;color:#fff;border:none;border-radius:100px;padding:16px 36px;font-size:16px;font-weight:800;cursor:pointer;text-decoration:none}
  .prob{display:grid;gap:10px;max-width:680px;margin:28px auto 0}
  .prob .q{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:14px 16px;font-size:15px;text-align:left}
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
  .pstep{display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;background:#F6F8FB;border:1px solid rgba(0,0,0,.08);border-radius:16px;padding:24px 18px}
  .cdots{display:none}
  .pstep .pico{width:50px;height:50px;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:25px}
  .pstep .pverb{font-size:18px;font-weight:800}
  .pstep .ptxt{font-size:14px;color:#5B7085;line-height:1.55}
  .proof{display:flex;gap:50px;justify-content:center;margin:10px 0 24px;flex-wrap:wrap}
  .proof .v{font-size:clamp(40px,7vw,64px);font-weight:900}
  .proof .l{font-size:13px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.08em;text-align:center}
  .quote{font-size:18px;font-style:italic;color:rgba(255,255,255,.9);text-align:center;max-width:700px;margin:0 auto}
  .grid3m{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:30px}
  .mcard{background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:18px;padding:26px 22px;box-shadow:0 8px 30px rgba(20,40,80,.06);text-align:center}
  .mcard .ic{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 12px}
  .mcard h3{font-size:16px;margin-bottom:4px}.mcard .tag{font-size:12px;color:#00B4A0;font-weight:700;margin-bottom:10px}
  .mcard li{font-size:12px;color:#5a6b80;padding:5px 0;border-top:1px solid rgba(0,0,0,.06);list-style:none;display:flex;gap:6px}
  .mcard li::before{content:'✓';color:#00B4A0;font-weight:900}
  .dash{background:linear-gradient(180deg,#0F1E36,#0A1424);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:24px;max-width:820px;margin:0 auto;text-align:left}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px}
  .kpi{background:rgba(255,255,255,.04);border-radius:12px;padding:14px;text-align:center}
  .kpi .v{font-size:22px;font-weight:900}.kpi .l{font-size:11px;color:rgba(255,255,255,.55)}
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:28px}
  .statpanels{display:grid;grid-template-columns:1fr 1fr;gap:24px 30px;margin-top:6px;align-items:stretch}
  .statpanel{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:18px 16px;display:flex;flex-direction:column}
  .spbody{flex:1;display:flex;flex-direction:column;justify-content:center}
  .statpanel .barh{margin-top:0}
  .barh{font-size:13px;font-weight:800;color:rgba(255,255,255,.7);margin-bottom:14px}
  .bar{display:flex;align-items:center;gap:10px;margin-bottom:13px;font-size:14px}
  .bar .bl{width:92px;color:rgba(255,255,255,.72);flex-shrink:0}
  .bar .bt{flex:1;height:13px;background:rgba(255,255,255,.06);border-radius:100px;overflow:hidden}
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
  /* Carrousels horizontaux en mobile : profils, mecaniques, etapes besoins */
  @media(max-width:720px){
    .chips{flex-wrap:nowrap;overflow-x:auto;justify-content:flex-start;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:2px 4px 8px;margin:24px 0}
    .chips::-webkit-scrollbar{display:none}
    .chip{flex:0 0 auto;scroll-snap-align:center}
    .grid3m{display:flex;overflow-x:auto;gap:14px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:10px}
    .grid3m::-webkit-scrollbar{display:none}
    .mcard{flex:0 0 100%;scroll-snap-align:center}
    .proc-view{padding:24px 16px}
    .proc-steps{display:flex;overflow-x:auto;gap:14px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:8px}
    .proc-steps::-webkit-scrollbar{display:none}
    .pstep{flex:0 0 100%;scroll-snap-align:center}
    .cdots{display:flex;justify-content:center;align-items:center;gap:8px;margin-top:18px}
    .cdot{width:9px;height:9px;border-radius:50%;border:none;padding:0;background:rgba(0,0,0,.16);cursor:pointer;transition:width .2s,background .2s}
    .cdot.on{width:24px;border-radius:100px;background:#00B4A0}
    .sec-dark .cdot{background:rgba(255,255,255,.22)}
    .sec-dark .cdot.on{background:#00B4A0}
    .statpanels{display:flex;align-items:stretch;overflow-x:auto;gap:14px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:6px}
    .statpanels::-webkit-scrollbar{display:none}
    .statpanel{flex:0 0 100%;scroll-snap-align:center;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:20px 18px}
    .statpanel .redirviz{gap:8px}
    .statpanel .redirviz .rv{min-width:0;padding:12px 6px}
    .gam{display:flex;flex-direction:column;gap:14px}
    .gam::-webkit-scrollbar{display:none}
    .gcard{width:auto}
    .price{display:flex;overflow-x:auto;gap:14px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:10px 0}
    .price::-webkit-scrollbar{display:none}
    .pcard{flex:0 0 100%;scroll-snap-align:center}
    .sec{padding:38px 20px}
    .hero{padding:48px 20px 40px}
    .prob{margin-top:18px}
    .grid3,.grid3m,.gam,.price{margin-top:18px}
    .chips{margin:18px 0}
    .proc-sel{margin:2px 0 16px}
    .proc-view{padding:22px 15px;margin-top:2px}
    .proc-desc{margin-bottom:16px}
    .dash{padding:18px 14px;margin-top:18px}
    .kpis{margin-bottom:14px;gap:10px}
    .promise{margin:12px auto 12px}
    .hstats{margin:18px 0 20px}
    .ans{margin-bottom:18px}
  }
  /* Lisibilite : tailles & espacements homogenes */
  .eyebrow{font-size:15px;letter-spacing:.12em;margin-bottom:14px}
  .sub{font-size:17px;margin-top:10px}
  .bcard .ic{width:60px;height:60px;font-size:32px}
  .bcard h3{font-size:21px}.bcard p{font-size:15px}
  .chip .ic{width:56px;height:56px;font-size:30px}.chip .nm{font-size:15px}
  .pstep .pico{width:66px;height:66px;font-size:34px}.pstep .pverb{font-size:26px}.pstep .ptxt{font-size:17px;line-height:1.55}
  .ptext{font-size:18px}
  .proc-desc{font-size:17px}
  .mcard .ic{width:62px;height:62px;font-size:32px}.mcard h3{font-size:22px}.mcard .tag{font-size:15px}.mcard li{font-size:15px}
  .gcard .ic{font-size:54px}.gcard h3{font-size:24px}.gcard .gi{font-size:16px}
  .pcard .pn{font-size:16px}.pcard li{font-size:16px}.pcard .pp{font-size:40px}.pcard .pu{font-size:15px}
  .kpi .v{font-size:30px}.kpi .l{font-size:14px}
  .barh{font-size:17px;margin-bottom:16px}.bar{font-size:14px}.bar .bl{width:110px}
  .pm-line{font-size:16px}
`

export default function LandingClient({ source = '' }: { cfg?: unknown; source?: string }) {
  const [psel, setPsel] = useState(0)
  const [sel, setSel]   = useState(0)
  const [tab, setTab]   = useState<'reponse'|'benefice'>('reponse')
  const [form, setForm] = useState({ prenom:'', email:'', tel:'', secteur:'' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { trackVisite('landing') }, [])

  // Bouton identique au hero : on enregistre le contact si renseigné (best-effort) puis on lance le jeu
  async function handlePlay() {
    if (form.prenom.trim() && form.email.includes('@')) {
      setSubmitting(true)
      try {
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
      } catch { /* best-effort */ }
    }
    window.location.href = '/parcours/spin?ev=ev-flowin-demo'
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
        <a className="cta" href="/parcours/spin?ev=ev-flowin-demo">Jouer et gagner mon premier event →</a>
      </section>

      {/* PROBLEME */}
      <section className="sec sec-dark" id="probleme">
        <div className="wrap" style={{ maxWidth:760, textAlign:'center' }}>
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
              <div className="q" key={i}>{q}</div>
            ))}
          </div>
        </div>
      </section>

      {/* BESOINS */}
      <section className="sec">
        <div className="wrap">
          <div className="title">Tout ce dont vous avez besoin, à portée de main.</div>
          <div className="sub">Vous souhaitez…</div>
          <div className="proc-sel">
            <button className={'proc-btn' + (psel===0?' on':'')} onClick={() => setPsel(0)}>Créer votre base</button>
            <button className={'proc-btn' + (psel===1?' on':'')} onClick={() => setPsel(1)}>Exploiter votre base existante</button>
          </div>
          <div className="proc-view">
            <p className="proc-desc">{proc.desc}</p>
            <div className="proc-steps" id="besoins">
              {proc.steps.map((s, i) => (
                <div className="pstep" key={i}>
                  <span className="pico" style={{ background:s.col+'18', color:s.col }}><Ic n={s.ico} /></span>
                  <span className="pverb" style={{ color:s.col }}>{s.verbe}</span>
                  <span className="ptxt">{s.txt}</span>
                </div>
              ))}
            </div>
            <Dots id="besoins" count={proc.steps.length} />
          </div>
        </div>
      </section>

      {/* PROFILS */}
      <section className="sec">
        <div className="wrap">
          <div className="title">Flowin s&apos;adapte à votre activité</div>
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
          <div className="grid3m" id="mecaniques">
            {MODULES.map((m, i) => (
              <div className="mcard" key={i}>
                <div className="ic" style={{ background:m.col+'18', color:m.col }}><Ic n={m.ico} /></div>
                <h3>{m.nom}</h3>
                <div className="tag">{m.tag}</div>
                <ul>{m.f.map((x, j) => <li key={j}>{x}</li>)}</ul>
              </div>
            ))}
          </div>
          <Dots id="mecaniques" count={MODULES.length} />
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
            <div className="statpanels" id="stats">
              <div className="statpanel"><div className="barh">Tranches d&apos;âge</div><div className="spbody"><Pyramid data={AGE} grad={G_AGE} /></div></div>
              <div className="statpanel"><div className="barh">Répartition par genre</div><div className="spbody"><Donut data={GENRE.map((r) => [r[0], r[1], r[3]] as [string,number,string])} /></div></div>
              <div className="statpanel"><div className="barh">Jours de fréquentation</div><div className="spbody">{JOURS.map((r, i) => <Bar key={i} lbl={r[0]} n={r[1]} w={r[2]} col={G_JOURS} />)}</div></div>
              <div className="statpanel"><div className="barh">Pics horaires</div><div className="spbody"><Wave data={HEURES} color="#F59E0B" /></div></div>
              <div className="statpanel"><div className="barh">Intention de revenir</div><div className="spbody"><Gauge pct={RETOUR[0][1]} label="comptent revenir" color={RETOUR[0][3]} /></div></div>
              <div className="statpanel"><div className="barh">Comment ils ont connu l&apos;événement</div><div className="spbody"><Donut data={CONNU.map((r, i) => [r[0], r[1], ['#3B5CC4','#00B4A0','#0B6E4F','#F59E0B','#E8212B'][i]] as [string,number,string])} /></div></div>
              <div className="statpanel"><div className="barh">D&apos;où viennent vos visiteurs</div><div className="spbody">{GEO.map((r, i) => <Bar key={i} lbl={r[0]} n={r[1]} w={r[2]} col={G_GEO} />)}</div></div>
              <div className="statpanel">
                <div className="barh">Redirections vers vos liens après le jeu</div>
                <div className="spbody"><div className="redirviz">
                  {REDIR.map((r, i) => (
                    <a className="rv" href={r[3]} target="_blank" rel="noopener" key={i}>
                      <span className="rv-ic"><Ic n={r[1]} /></span>
                      <span className="rv-n">{r[2]}%</span>
                      <span className="rv-l">{r[0]}</span>
                    </a>
                  ))}
                </div></div>
              </div>
            </div>
            <Dots id="stats" count={8} />
            <div style={{ fontSize:11, color:'rgba(255,255,255,.35)', marginTop:18, textAlign:'center', fontStyle:'italic' }}>Et aussi : « venu avec », événements préférés, créneaux horaires, score par tranche d&apos;âge… tout est mesuré.</div>
          </div>
        </div>
      </section>

      {/* GAMME */}
      <section className="sec sec-dark">
        <div className="wrap">
          <div className="title" style={{ color:'#fff' }}>Ce que Flowin vous permet de faire</div>
          <div className="gam">
            <div className="gcard"><div className="ic" style={{ color:'#00B4A0' }}><Ic n="device-gamepad-2" /></div><h3>Animer</h3><div className="gi">6 modules de jeu</div><div className="gi">Customisation jeux / lots / quiz</div><div className="gi">Marque blanche</div></div>
            <div className="gcard"><div className="ic" style={{ color:'#3B5CC4' }}><Ic n="steering-wheel" /></div><h3>Piloter</h3><div className="gi">Tableau de bord temps réel</div><div className="gi">Stats : genre, âge, opt-in, géo</div><div className="gi">Base client réutilisable</div></div>
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
          <div className="price" id="tarifs">
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
          <Dots id="tarifs" count={PRICING.length} />
          <div className="pm-line"><span style={{ color:'#3B5CC4', display:'inline-flex' }}><Ic n="user-check" /></span> Un chef de projet dédié à votre compte.</div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="ctafinal" id="cta">
        <div className="wrap">
          <h2>Contactez-nous</h2>
          <div style={{ color:'rgba(255,255,255,.6)', fontSize:15 }}>Aucune CB requise · Rappel sous 24h · Sans engagement</div>
          <div className="ctaform">
            <input placeholder="Votre prénom" value={form.prenom} onChange={e => setForm({ ...form, prenom:e.target.value })} />
            <input type="email" placeholder="Email professionnel" value={form.email} onChange={e => setForm({ ...form, email:e.target.value })} />
            <input type="tel" placeholder="Téléphone" value={form.tel} onChange={e => setForm({ ...form, tel:e.target.value })} />
            <select value={form.secteur} onChange={e => setForm({ ...form, secteur:e.target.value })}>
              <option value="">Secteur d&apos;activité…</option>
              <option>Commerce &amp; Négoce</option>
              <option>Point de vente indépendant</option>
              <option>Restaurateur</option>
              <option>Association / Événementiel</option>
              <option>Municipalité / Office de tourisme</option>
              <option>Centre commercial</option>
              <option>Entreprise / RH</option>
              <option>Organisateur de salon</option>
            </select>
            <button className="cta" style={{ justifyContent:'center', marginTop:6 }} onClick={handlePlay} disabled={submitting}>
              {submitting ? 'Un instant…' : 'Jouer et gagner mon premier event →'}
            </button>
          </div>
          <div className="ctaor">— ou contactez-nous directement —</div>
          <div className="ctacall">
            <a className="callbtn" href="tel:+33616354936"><Ic n="phone" /> Appelez-nous</a>
            <a className="wabtn" href="https://wa.me/33616354936" target="_blank" rel="noopener"><Ic n="brand-whatsapp" /> WhatsApp</a>
            <a className="callbtn" href="mailto:info@opconsult.co"><Ic n="mail" /> Email</a>
          </div>
          <div className="note">Données jamais cédées à des tiers · RGPD</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background:'#0A1424', color:'rgba(255,255,255,.5)', textAlign:'center', padding:'30px 24px', fontSize:13, lineHeight:1.7 }}>
        <div style={{ fontSize:20, fontWeight:900, color:'rgba(255,255,255,.9)', letterSpacing:'-.02em', marginBottom:6 }}>Flow<em style={{ color:'#A855F7', fontStyle:'normal' }}>in</em></div>
        <div>Flowin is powered by OPConsult · Vence, France</div>
        <div style={{ marginTop:8 }}>
          <a href="mailto:info@opconsult.co" style={{ color:'#00B4A0', textDecoration:'none' }}>info@opconsult.co</a>
          {' · '}
          <a href="tel:+33616354936" style={{ color:'#00B4A0', textDecoration:'none' }}>06 16 35 49 36</a>
        </div>
      </footer>
    </div>
  )
}
