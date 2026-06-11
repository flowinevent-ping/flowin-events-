'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Cfg = {
  accent_color?: string
  wa_number?: string
  hero?: any
  proof?: any
  pricing?: any
  cta_section?: any
  modules?: any
}

export default function NdsClient({ cfg }: { cfg: Cfg }) {
  const [tab, setTab] = useState<'accueil' | 'festival' | 'visibilite' | 'offre'>('accueil')

  // Formulaire partenaire → CRM partenaires (statut prospect)
  const [pf, setPf] = useState({ nom: '', categorie: '', adresse: '', contact: '', email: '', tel: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  async function submitPartenaire() {
    if (!pf.nom.trim() || !pf.email.includes('@') || !pf.tel.trim()) return
    setSending(true)
    try {
      const emailLower = pf.email.toLowerCase().trim()
      const now = new Date().toISOString()
      await supabase.from('partenaires').upsert({
        id: `prosp-nds-${emailLower.replace(/[^a-z0-9]/g, '-').slice(0, 36)}`,
        nom: pf.nom.trim(),
        type: pf.categorie.trim() || null,
        adresse: pf.adresse.trim() || null,
        ville: 'Vence',
        contact_nom: pf.contact.trim() || null,
        contact: pf.contact.trim() || null,
        contact_email: emailLower,
        email: emailLower,
        contact_tel: pf.tel.trim() || null,
        tel: pf.tel.trim() || null,
        notes: pf.message.trim() || null,
        super_event_id: 'se-nds-2026',
        tags: ['prospect', 'nds-landing'],
        statut_paiement: 'prospect',
        actif: false,
        visible: false,
        en_avant: false,
        ts: now,
        created_at: now,
      }, { onConflict: 'id' })
      setSent(true)
    } catch { /* best-effort */ }
    setSending(false)
  }

  // Couleurs : pilotées par cfg.accent_color (défaut violet NDS), magenta en secondaire
  const accent = cfg?.accent_color || '#8B5CF6'

  // Contenu : cfg en priorité, sinon données officielles figées (plaquette / nuitsdusud.com)
  const heroTitle = cfg?.hero?.title || 'Le festival\njoue pour vous'
  const heroSub =
    cfg?.hero?.sub ||
    'Cette année, les Nuits du Sud se jouent aussi sur mobile. 24 000 festivaliers jouent, gagnent — et découvrent votre commerce.'

  // Prix : jamais inventé. Si absent de la config -> "Sur demande".
  const prix: string | number | undefined =
    cfg?.pricing?.prix ?? cfg?.pricing?.price ?? cfg?.pricing?.montant
  const prixLabel = prix ? `${prix} €` : 'Sur demande'

  const wa = cfg?.wa_number || ''
  const waHref = wa ? `https://wa.me/${wa.replace(/[^0-9]/g, '')}` : '#offre'

  const nights = [
    { d: '09', j: 'Jeu', a: 'Luiza · Mariam chante Amadou & Mariam', t: '★ Micro Ondes — Talents' },
    { d: '10', j: 'Ven', a: "Maya Kamaty · Kassav'", t: '' },
    { d: '11', j: 'Sam', a: 'Bakermat · Breakbot & Irfane', t: '★ Geiste — Talents' },
    { d: '16', j: 'Jeu', a: 'Soom T (DJ set) · Danakil', t: '' },
    { d: '17', j: 'Ven', a: 'Kolinga · Véronique Sanson', t: '' },
    { d: '18', j: 'Sam', a: "Magic System · Ben l'Oncle Soul", t: '★ Killian Alaari — Talents' },
  ]

  const Tab = ({ id, label }: { id: typeof tab; label: string }) => (
    <button className={'tab' + (tab === id ? ' on' : '')} onClick={() => { setTab(id); if (typeof window !== 'undefined') window.scrollTo(0, 0) }}>
      {label}
    </button>
  )

  return (
    <div className="nds-app">
      <style>{css(accent)}</style>

      <div className="topbar">
        <div className="brandrow">
          <div className="nds-lock"><span className="moon" /><span className="nm">NUITS DU SUD</span></div>
          <div className="powered">Espace partenaires<br />propulsé par <b>Flowin</b></div>
        </div>
        <div className="tabs">
          <Tab id="accueil" label="Accueil" />
          <Tab id="festival" label="Le festival" />
          <Tab id="visibilite" label="Votre visibilité" />
          <Tab id="offre" label="Devenir partenaire" />
        </div>
      </div>

      {/* ACCUEIL */}
      {tab === 'accueil' && (
        <div className="panel">
          <div className="hero">
            <div className="bg" /><div className="veil" />
            <span className="badge">29e ÉDITION · 9 → 18 JUILLET 2026</span>
            <h1>{heroTitle.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}</h1>
            <div className="dt">Place du Grand Jardin · Vence</div>
            <p className="sub">{heroSub}</p>
          </div>
          <div className="wrap">
            <div className="statband">
              <div className="s"><b>24 000</b><span>festivaliers</span></div>
              <div className="s"><b>6</b><span>soirées</span></div>
              <div className="s"><b>80%</b><span>locaux</span></div>
              <div className="s"><b>60%</b><span>femmes</span></div>
            </div>
            <div className="mini3">
              <div className="m3"><div className="icw">{icQR}</div><div><h3>Votre QR perso</h3><p>Faites jouer vos clients, captez les festivaliers.</p></div></div>
              <div className="m3"><div className="icw">{icChart}</div><div><h3>Vos statistiques</h3><p>Scans, participations, clics sur vos liens — mesurés.</p></div></div>
              <div className="m3"><div className="icw">{icStar}</div><div><h3>Partenaire officiel</h3><p>Associé au plus grand festival de l’arrière-pays niçois.</p></div></div>
            </div>
            <button className="btn" style={{ margin: '26px 0 8px' }} onClick={() => { setTab('offre'); window.scrollTo(0, 0) }}>Devenir partenaire</button>
          </div>
        </div>
      )}

      {/* FESTIVAL */}
      {tab === 'festival' && (
        <div className="panel"><div className="sec wrap">
          <div className="kick mag">Le festival</div>
          <h2 className="hsec">Six soirées, <em>Place du Grand Jardin</em></h2>
          <p className="edito">« Voyager, rassembler, révéler, partager, offrir, surprendre. »</p>
          <div className="nights">
            {nights.map((n, i) => (
              <div className="night" key={i}>
                <div className="date"><div className="dd">{n.d}</div><div className="jj">{n.j}</div></div>
                <div className="bar" />
                <div><div className="aa">{n.a}</div>{n.t && <div className="tt">{n.t}</div>}</div>
              </div>
            ))}
          </div>
          <p className="foot">Direction artistique Rock en Seine × Radio Nova</p>
          <div className="reach">
            <div className="rs"><b>24 000</b>festivaliers · 6 jours</div>
            <div className="rs"><b>80%</b>locaux (06 · Var)</div>
            <div className="rs"><b>22 000</b>abonnés newsletter</div>
            <div className="rs"><b>90 000</b>visites du site</div>
          </div>
        </div></div>
      )}

      {/* VISIBILITE */}
      {tab === 'visibilite' && (
        <div className="panel"><div className="sec wrap">
          <div className="kick gold">Votre place dans le jeu</div>
          <h2 className="hsec">Là où <em className="g">24 000 personnes</em> vous voient</h2>
          <p className="lead">Le jeu officiel est le support. Vous gagnez en visibilité de proximité — et vous la mesurez.</p>
          <div className="vcards">
            <div className="vc"><div className="icw">{icQR}</div><h3>Votre QR personnalisé</h3><p>À votre caisse. Vos clients jouent, de nouveaux festivaliers vous découvrent. Chaque scan vous est attribué.</p></div>
            <div className="vc"><div className="icw">{icList}</div><h3>Présence officielle</h3><p>Logo dans l’annuaire des partenaires, fiche dédiée (accroche + liens), position sur la carte du festival.</p></div>
            <div className="vc"><div className="icw">{icLink}</div><h3>Liens traçés</h3><p>Site, Instagram : chaque clic compté en temps réel. Une présence qui se mesure, là où un flyer ne dira jamais rien.</p></div>
            <div className="vc"><div className="icw">{icCal}</div><h3>Avant · pendant · après</h3><p>Vous êtes visible dès l’annonce, pendant les six soirées, et après la dernière note.</p></div>
          </div>
          <div className="note">Le scan sur place reste la clé : il prouve le passage et l’attribue à votre commerce.</div>
        </div></div>
      )}

      {/* OFFRE */}
      {tab === 'offre' && (
        <div className="panel" id="offre"><div className="sec wrap">
          <div className="kick">Devenir partenaire</div>
          <h2 className="hsec">Une offre, <em>tout inclus</em></h2>
          <p className="lead">Devenez partenaire officiel visible des Nuits du Sud 2026.</p>
          <div className="offer">
            <div className="oh"><div className="onm">Partenaire visible NDS 2026</div><div className="opr">{prixLabel}</div></div>
            <ul>
              <li>Votre <b>QR Code personnalisé</b> — faites jouer vos clients, captez-en de nouveaux</li>
              <li><b>Présence officielle</b> dans l’appli du festival (annuaire + fiche + liens)</li>
              <li><b>Vos statistiques</b> — scans, participations, clics, en temps réel</li>
              <li><b>Position sur la carte</b> du festival</li>
              <li><b>Mise en avant</b> auprès des festivaliers — avant · pendant · après</li>
            </ul>
            <a className="btn" href={waHref} target={wa ? '_blank' : undefined} rel="noopener">
              {prix ? 'Réserver ma place' : 'Demander une présentation'}
            </a>
            <p className="reassure">Facture dès validation · sans engagement de durée</p>
          </div>

          {sent ? (
            <div className="psent">✅ Merci ! Votre demande est enregistrée — l’équipe Flowin · Nuits du Sud vous recontacte rapidement.</div>
          ) : (
            <div className="pform">
              <div><label>Nom de l’établissement *</label><input value={pf.nom} onChange={e => setPf({ ...pf, nom: e.target.value })} placeholder="Ex. Cave du Jardin" /></div>
              <div className="row2">
                <div><label>Catégorie</label><input value={pf.categorie} onChange={e => setPf({ ...pf, categorie: e.target.value })} placeholder="Caviste, resto…" /></div>
                <div><label>Adresse</label><input value={pf.adresse} onChange={e => setPf({ ...pf, adresse: e.target.value })} placeholder="Rue, Vence" /></div>
              </div>
              <div><label>Votre nom *</label><input value={pf.contact} onChange={e => setPf({ ...pf, contact: e.target.value })} placeholder="Prénom et nom" /></div>
              <div className="row2">
                <div><label>Email *</label><input type="email" inputMode="email" value={pf.email} onChange={e => setPf({ ...pf, email: e.target.value })} placeholder="vous@exemple.fr" /></div>
                <div><label>Téléphone *</label><input type="tel" inputMode="tel" value={pf.tel} onChange={e => setPf({ ...pf, tel: e.target.value })} placeholder="06 00 00 00 00" /></div>
              </div>
              <div><label>Message (facultatif)</label><textarea value={pf.message} onChange={e => setPf({ ...pf, message: e.target.value })} placeholder="Votre intérêt…" /></div>
              <button className="btn" disabled={sending} onClick={submitPartenaire}>{sending ? 'Envoi…' : 'Envoyer ma demande'}</button>
            </div>
          )}

          <p className="sponsor-line">Vous souhaitez sponsoriser un lot ou bénéficier d’une mise en avant premium ? <a href={waHref} target={wa ? '_blank' : undefined} rel="noopener">Contactez-nous.</a></p>
        </div></div>
      )}

      <div className="flowinfoot">
        <div className="muted2">Le jeu officiel des Nuits du Sud est propulsé par</div>
        <div className="fl">Flowin</div>
        <div className="tript"><span>Captez</span><span>Dynamisez</span><span>Fidélisez</span></div>
        <a className="fllink" href="/landing">Découvrir Flowin →</a>
      </div>
    </div>
  )
}

const icQR = <svg className="ic" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v7h-7" /></svg>
const icChart = <svg className="ic" viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
const icStar = <svg className="ic" viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6L12 17l-5.4 2.6 1.2-6L3.3 9.4l6.1-.8z" /></svg>
const icList = <svg className="ic" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
const icLink = <svg className="ic" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
const icCal = <svg className="ic" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>

function css(accent: string) {
  return `
  .nds-app{--accent:${accent};--magenta:#EC4899;--cyan:#22D3EE;--gold:#F8B84E;--ink:#0a0713;--text:#f6f2ff;--muted:rgba(246,242,255,.62);--faint:rgba(246,242,255,.36);--line:rgba(246,242,255,.13);--card:rgba(255,255,255,.05);--flowin:#7E9BF2;
    max-width:480px;margin:0 auto;min-height:100vh;background:linear-gradient(180deg,var(--ink),#070510);color:var(--text);font-family:'DM Sans',system-ui,sans-serif;position:relative;overflow:hidden}
  .nds-app *{box-sizing:border-box}
  .nds-app h1,.nds-app h2,.nds-app h3{font-family:'Fredoka','DM Sans',sans-serif;font-weight:600;line-height:1.1;margin:0}
  .nds-app .wrap{padding:0 20px}.nds-app .sec{padding:32px 0}
  .nds-app .ic{width:24px;height:24px;stroke:currentColor;fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
  .nds-app .muted2{color:var(--muted);font-size:12px}
  .topbar{position:sticky;top:0;z-index:50;background:rgba(10,7,19,.86);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
  .brandrow{display:flex;align-items:center;justify-content:space-between;padding:13px 20px 11px}
  .nds-lock{display:flex;align-items:center;gap:8px}
  .nds-lock .moon{width:11px;height:11px;border-radius:50%;background:radial-gradient(circle at 64% 34%,#fff,var(--gold));box-shadow:0 0 9px var(--gold)}
  .nds-lock .nm{font-family:'Fredoka';font-weight:600;font-size:15px;letter-spacing:.16em}
  .powered{font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);text-align:right;line-height:1.3}
  .powered b{color:var(--flowin)}
  .tabs{display:flex;gap:4px;padding:0 14px 10px;overflow-x:auto}
  .tab{flex-shrink:0;font-family:'Fredoka','DM Sans';font-weight:500;font-size:13px;color:var(--muted);padding:8px 13px;border-radius:100px;cursor:pointer;white-space:nowrap;border:1px solid transparent;background:none}
  .tab.on{color:#fff;background:linear-gradient(100deg,var(--accent),var(--magenta));box-shadow:0 6px 18px -8px var(--magenta)}
  .kick{font-family:'Fredoka';font-weight:600;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--cyan);margin-bottom:11px;display:flex;align-items:center;gap:9px}
  .kick.mag{color:var(--magenta)}.kick.gold{color:var(--gold)}.kick:before{content:'';width:22px;height:2px;background:currentColor}
  .hsec{font-size:25px;margin-bottom:8px}.hsec em{font-style:normal;color:var(--accent)}.hsec em.g{color:var(--gold)}
  .lead{font-size:14.5px;color:var(--muted);margin-bottom:20px}
  .btn{display:flex;align-items:center;justify-content:center;width:100%;cursor:pointer;border:none;font-family:'Fredoka';font-weight:600;font-size:16px;border-radius:14px;padding:15px;text-decoration:none;color:#fff;background:linear-gradient(100deg,var(--accent),var(--magenta));box-shadow:0 14px 30px -12px var(--magenta)}
  .hero{position:relative;padding:46px 20px 40px;overflow:hidden}
  .hero .bg{position:absolute;inset:0;z-index:0;background:url('/nds/hero.jpg') center/cover;opacity:.9}
  .hero .veil{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(10,7,19,.4),rgba(139,92,246,.32) 40%,rgba(236,72,153,.42) 78%,#070510)}
  .hero>*{position:relative;z-index:2}
  .hero .badge{display:inline-block;font-family:'Fredoka';font-weight:600;font-size:11px;letter-spacing:.14em;padding:6px 13px;border-radius:100px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);margin-bottom:16px}
  .hero h1{font-size:33px;text-shadow:0 4px 24px rgba(0,0,0,.5)}
  .hero .dt{font-family:'Fredoka';font-weight:500;font-size:14px;margin-top:8px;opacity:.92}
  .hero .sub{font-size:14.5px;color:rgba(246,242,255,.85);margin-top:14px;max-width:330px;text-shadow:0 2px 12px rgba(0,0,0,.5)}
  .statband{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;margin:22px 0 0;background:var(--line);border:1px solid var(--line);border-radius:16px;overflow:hidden}
  .statband .s{background:var(--ink);padding:14px 6px;text-align:center}
  .statband b{font-family:'Fredoka';font-size:21px;display:block;line-height:1;color:var(--accent)}
  .statband .s:nth-child(2) b{color:var(--magenta)}.statband .s:nth-child(3) b{color:var(--cyan)}.statband .s:nth-child(4) b{color:var(--gold)}
  .statband span{font-size:9.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;font-weight:700;margin-top:4px;display:block}
  .mini3{display:flex;flex-direction:column;gap:10px;margin-top:24px}
  .m3{display:flex;gap:13px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px}
  .m3 .icw{width:40px;height:40px;flex-shrink:0;border-radius:11px;display:grid;place-items:center;color:var(--accent);background:rgba(139,92,246,.14)}
  .m3:nth-child(2) .icw{color:var(--magenta);background:rgba(236,72,153,.14)}
  .m3:nth-child(3) .icw{color:var(--gold);background:rgba(248,184,78,.14)}
  .m3 h3{font-size:15px}.m3 p{font-size:12.5px;color:var(--muted)}
  .edito{font-size:13px;color:var(--faint);font-style:italic;margin:-2px 0 20px}
  .nights{display:flex;flex-direction:column;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:16px;overflow:hidden}
  .night{background:var(--ink);padding:15px 16px;display:flex;align-items:center;gap:14px}
  .night .date{flex-shrink:0;width:46px;text-align:center}
  .night .dd{font-family:'Fredoka';font-weight:600;font-size:21px;line-height:1}
  .night .jj{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--cyan);margin-top:3px;font-weight:700}
  .night:nth-child(even) .jj{color:var(--magenta)}
  .night .bar{width:3px;align-self:stretch;border-radius:3px;background:var(--accent)}
  .night:nth-child(even) .bar{background:var(--magenta)}
  .night .aa{font-family:'Fredoka';font-weight:600;font-size:15px;line-height:1.15}
  .night .tt{font-size:10.5px;color:var(--gold);font-weight:700;margin-top:2px}
  .foot{font-size:11.5px;color:var(--faint);text-align:center;margin-top:13px}
  .reach{display:flex;flex-wrap:wrap;gap:7px;justify-content:center;margin-top:18px}
  .rs{background:var(--card);border:1px solid var(--line);border-radius:100px;padding:8px 14px;font-size:12px;color:var(--muted)}
  .rs b{font-family:'Fredoka';color:var(--text);margin-right:4px}
  .vcards{display:flex;flex-direction:column;gap:11px}
  .vc{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px}
  .vc .icw{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;color:var(--accent);background:rgba(139,92,246,.13);margin-bottom:11px}
  .vc:nth-child(2) .icw{color:var(--cyan);background:rgba(34,211,238,.12)}
  .vc:nth-child(3) .icw{color:var(--magenta);background:rgba(236,72,153,.12)}
  .vc:nth-child(4) .icw{color:var(--gold);background:rgba(248,184,78,.12)}
  .vc h3{font-size:16px;margin-bottom:5px}.vc p{font-size:13px;color:var(--muted)}
  .note{margin-top:18px;font-size:12.5px;color:var(--gold);background:rgba(248,184,78,.1);border:1px solid rgba(248,184,78,.26);border-radius:12px;padding:12px 14px;line-height:1.45}
  .offer{border:1.5px solid var(--accent);border-radius:20px;padding:22px;background:rgba(139,92,246,.08);box-shadow:0 16px 40px -22px var(--accent)}
  .oh{display:flex;justify-content:space-between;align-items:center;gap:10px;padding-bottom:14px;border-bottom:1px solid var(--line);margin-bottom:14px}
  .onm{font-family:'Fredoka';font-weight:600;font-size:18px}
  .opr{font-family:'Fredoka';font-weight:600;font-size:26px;white-space:nowrap;color:var(--accent)}
  .offer ul{list-style:none;padding:0;margin:0 0 16px;display:flex;flex-direction:column;gap:10px}
  .offer li{font-size:13px;display:flex;gap:9px;align-items:flex-start;line-height:1.35;color:var(--text)}
  .offer li:before{content:'';width:17px;height:17px;flex-shrink:0;margin-top:1px;border-radius:50%;background:var(--accent);-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='white' d='M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z'/%3E%3C/svg%3E") center/11px no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='white' d='M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z'/%3E%3C/svg%3E") center/11px no-repeat}
  .reassure{font-size:12px;color:var(--muted);text-align:center;margin-top:13px}
  .sponsor-line{font-size:12.5px;color:var(--muted);text-align:center;margin-top:18px;line-height:1.5}
  .sponsor-line a{color:var(--accent);font-weight:700;text-decoration:none}
  .pform{margin-top:18px;display:flex;flex-direction:column;gap:11px}
  .pform label{display:block;font-size:12px;font-weight:700;color:var(--muted);margin-bottom:5px}
  .pform input,.pform textarea{width:100%;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;color:var(--text);font-size:14px;font-family:inherit;outline:none}
  .pform input::placeholder,.pform textarea::placeholder{color:var(--faint)}
  .pform input:focus,.pform textarea:focus{border-color:var(--accent)}
  .pform textarea{min-height:74px;resize:vertical}
  .pform .row2{display:flex;gap:10px}
  .pform .row2>div{flex:1;min-width:0}
  .pform .btn{margin-top:4px}
  .psent{margin-top:18px;padding:18px;border:1px solid var(--line);border-radius:14px;background:var(--card);text-align:center;font-weight:700;line-height:1.5}
  .flowinfoot{border-top:1px solid var(--line);padding:26px 20px 40px;text-align:center;background:rgba(126,155,242,.05)}
  .flowinfoot .fl{font-family:'Fredoka';font-weight:600;font-size:20px;background:linear-gradient(100deg,#7E9BF2,#A9BEF8);-webkit-background-clip:text;background-clip:text;color:transparent}
  .tript{display:flex;gap:7px;justify-content:center;flex-wrap:wrap;margin:12px 0 14px}
  .tript span{font-family:'Fredoka';font-weight:500;font-size:12.5px;padding:7px 14px;border-radius:100px;border:1px solid var(--line)}
  .fllink{color:var(--flowin);text-decoration:none;font-weight:700;font-size:13px}
  `
}
