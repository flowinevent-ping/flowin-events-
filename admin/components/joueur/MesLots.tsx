'use client'

/**
 * MES LOTS — carrousel (une carte = un lot), groupé par commerce (pastilles).
 * Règles d'interface : carrousel, peu de texte. Rappels in-app 1 mois / 15 j / 48 h.
 * « En faire profiter un ami » (Romain, 10/11/2026) : prénom + téléphone ou e-mail. Ami inscrit :
 * notification dans son Flowin, billet dans son /moi. Sinon : WhatsApp (billet + invitation).
 * Dans les deux cas l'ami entre dans le fichier client du commerce (parrainage). Le commerce
 * valide le billet avec son code PIN, déstockage habituel (valider_lot).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Ico } from '@/lib/proicons'
import { type MonLot, joursRestants, palierRappel, dateCourte, lienBillet, lienQr, offrirAmi, lienInvitation } from '@/lib/mesLots'

const BLEU = '#2746A6'

/** Libellés des notifications in-app (joueur_notifications.palier). */
export const LIBELLE_NOTIF: Record<'cadeau' | 'relance', (lot: string | null) => string> = {
  cadeau: lot => `Un ami t’offre ${lot ? `« ${lot} »` : 'un lot'} !`,
  relance: lot => `Le commerce te rappelle ton lot${lot ? ` « ${lot} »` : ''}`,
}

const ETAT: Record<MonLot['etat'], { txt: string; fg: string; bg: string }> = {
  a_utiliser: { txt: 'À utiliser', fg: '#fff', bg: '#0B6E50' },
  a_confirmer: { txt: 'En cours de confirmation', fg: '#92400E', bg: '#FEF3C7' },
  utilise: { txt: 'Utilisé', fg: '#6b7280', bg: '#e5e7eb' },
  expire: { txt: 'Expiré', fg: '#991B1B', bg: '#FEE2E2' },
}

function Qr({ url }: { url: string }) {
  const [src, setSrc] = useState('')
  useEffect(() => { QRCode.toDataURL(url, { margin: 1, width: 360 }).then(setSrc).catch(() => setSrc('')) }, [url])
  return src ? <img src={src} alt="QR du billet" width={170} height={170} style={{ display: 'block', margin: '0 auto', borderRadius: 10 }} /> : <div style={{ width: 170, height: 170, margin: '0 auto' }} />
}

function Rappel({ lot }: { lot: MonLot }) {
  const j = joursRestants(lot.valableJusquAu)
  const p = lot.etat === 'a_utiliser' ? palierRappel(j) : null
  if (!p || j === null) return null
  const txt = p === '48h' ? (j <= 0 ? 'Expire aujourd’hui' : 'Expire dans 48 h') : `Expire dans ${j} jours`
  return (
    <div data-rappel={p} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800, color: p === '48h' ? '#991B1B' : '#92400E', background: p === '48h' ? '#FEE2E2' : '#FEF3C7', borderRadius: 10, padding: '7px 10px', marginTop: 10 }}>
      <Ico k="bell" size={14} />{txt}
    </div>
  )
}

function FeuilleAmi({ lot, joueurId, onClose, onOffert }: { lot: MonLot; joueurId: string | null; onClose: () => void; onOffert: () => void }) {
  const [prenom, setPrenom] = useState('')
  const [contact, setContact] = useState('')
  const [etat, setEtat] = useState<'' | 'envoi' | 'notifie' | 'invite'>('')
  const [err, setErr] = useState('')
  const url = lot.token ? lienBillet(lot.token) : ''
  const chiffres = contact.replace(/\D/g, '')
  const valide = prenom.trim().length > 0 && (contact.indexOf('@') > 0 || chiffres.length >= 9)
  const envoyer = async () => {
    if (!lot.token || !joueurId || !valide) return
    setEtat('envoi'); setErr('')
    const r = await offrirAmi(lot.token, joueurId, prenom.trim(), contact.trim())
    if (!r.ok || !r.resultat) { setEtat(''); setErr(r.raison === 'contact' ? 'Téléphone ou e-mail invalide.' : r.raison === 'soi' ? 'C’est ton propre compte.' : 'Envoi impossible. Réessaie.'); return }
    setEtat(r.resultat as 'notifie' | 'invite'); onOffert()
  }
  /* Ami non inscrit : WhatsApp avec le billet et l'invitation à rejoindre Flowin. */
  const texte = `${prenom.trim() || 'Salut'}, je t’offre mon lot « ${lot.lot} » chez ${lot.commerce} ! Ton billet : ${url}\nInscris-toi sur Flowin pour le garder et jouer toi aussi : ${lienInvitation(lot.eventId)}`
  const wa = `https://wa.me/${chiffres.length >= 9 && contact.indexOf('@') < 0 ? (chiffres.length === 10 && chiffres.charAt(0) === '0' ? '33' + chiffres.slice(1) : chiffres) : ''}?text=${encodeURIComponent(texte)}`
  const b: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px', borderRadius: 13, fontWeight: 800, fontSize: 15, textDecoration: 'none', border: 'none', cursor: 'pointer', boxSizing: 'border-box' }
  const champ: React.CSSProperties = { width: '100%', padding: '13px 14px', borderRadius: 12, border: '1.5px solid #d8dce5', fontSize: 16, boxSizing: 'border-box', fontFamily: 'inherit' }
  return (
    <div role="dialog" aria-label="En faire profiter un ami" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,26,38,.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}>
      <div data-feuille-ami onClick={e => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth: 480, borderRadius: '22px 22px 0 0', padding: '22px 18px 26px', boxSizing: 'border-box' }}>
        {etat === 'notifie' ? (<>
          <div data-ami-resultat="notifie" style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>C’est offert !</div>
          <div style={{ fontSize: 14, color: '#5a6071', marginBottom: 16 }}>{prenom.trim()} le retrouve dans son Flowin.</div>
          <button onClick={onClose} style={{ ...b, background: BLEU, color: '#fff' }}>Fermer</button>
        </>) : etat === 'invite' ? (<>
          <div data-ami-resultat="invite" style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Envoie-lui son billet</div>
          <div style={{ fontSize: 14, color: '#5a6071', marginBottom: 16 }}>{prenom.trim()} n’a pas encore Flowin : il reçoit le billet et l’invitation.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a data-ami-whatsapp href={wa} target="_blank" rel="noreferrer" style={{ ...b, background: '#0B6E50', color: '#fff' }}><Ico k="phone" size={16} />Envoyer par WhatsApp</a>
            <button onClick={onClose} style={{ ...b, background: 'transparent', color: '#5a6071' }}>Fermer</button>
          </div>
        </>) : (<>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Offrir ce lot</div>
          <div style={{ fontSize: 13.5, color: '#5a6071', marginBottom: 14 }}>Une seule utilisation, par ton ami.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input data-ami-prenom style={champ} placeholder="Prénom de ton ami" value={prenom} onChange={e => setPrenom(e.target.value)} autoComplete="off" />
            <input data-ami-contact style={champ} placeholder="Son téléphone ou son e-mail" value={contact} onChange={e => setContact(e.target.value)} inputMode="email" autoComplete="off" />
            {err && <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B' }}>{err}</div>}
            <button data-ami-envoyer disabled={!valide || etat === 'envoi' || !joueurId} onClick={envoyer} style={{ ...b, background: BLEU, color: '#fff', opacity: valide && joueurId ? 1 : 0.5 }}><Ico k="gift" size={16} />{etat === 'envoi' ? 'Envoi…' : 'Offrir'}</button>
            <button onClick={onClose} style={{ ...b, background: 'transparent', color: '#5a6071', padding: 8 }}>Annuler</button>
          </div>
        </>)}
      </div>
    </div>
  )
}

function Carte({ lot, onAmi }: { lot: MonLot; onAmi: () => void }) {
  const e = lot.donne && lot.etat === 'a_utiliser' ? { txt: 'Offert', fg: BLEU, bg: '#EFF3FE' } : ETAT[lot.etat]
  const actif = lot.etat === 'a_utiliser' && !lot.donne
  return (
    <div data-lot={lot.id} style={{ scrollSnapAlign: 'center', flex: '0 0 86%', maxWidth: 380, background: '#fff', borderRadius: 22, padding: '18px 17px', boxShadow: '0 4px 16px rgba(20,26,38,.08)', boxSizing: 'border-box', opacity: actif || lot.etat === 'a_confirmer' ? 1 : 0.75 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#9aa0ad', textTransform: 'uppercase', letterSpacing: '.04em', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lot.commerce}</div>
        <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, color: e.fg, background: e.bg, padding: '4px 10px', borderRadius: 100 }}>{e.txt}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 2px', textDecoration: lot.etat === 'utilise' ? 'line-through' : 'none' }}>{lot.lot}</div>
      {lot.operation && <div style={{ fontSize: 12.5, color: '#5a6071' }}>{lot.operation}</div>}
      <div style={{ fontSize: 13, color: '#5a6071', marginTop: 4 }}>
        <Ico k="clock" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />
        {lot.valableJusquAu ? `Valable jusqu’au ${dateCourte(lot.valableJusquAu)}` : 'Validité : [à compléter par le commerce]'}
      </div>
      <Rappel lot={lot} />
      {lot.recu && <div data-recu style={{ fontSize: 12.5, fontWeight: 800, color: '#0B6E50', marginTop: 8 }}><Ico k="gift" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Offert par un ami</div>}
      {lot.offertLe && !lot.recu && <div style={{ fontSize: 12.5, fontWeight: 800, color: BLEU, marginTop: 8 }}><Ico k="gift" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Offert à un ami</div>}
      {actif && lot.token && (
        <div style={{ marginTop: 14 }}>
          <Qr url={lienQr(lot.token)} />
          {lot.ticketCode && <div style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 900, fontSize: 18, letterSpacing: 2, marginTop: 6 }}>{lot.ticketCode}</div>}
          <div style={{ textAlign: 'center', fontSize: 12, color: '#9aa0ad', marginTop: 2 }}>À montrer au commerce</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <a href={lienBillet(lot.token)} style={{ flex: 1, textAlign: 'center', padding: '12px 8px', borderRadius: 12, background: '#EFF3FE', color: BLEU, fontWeight: 800, fontSize: 13.5, textDecoration: 'none' }}>Mon billet</a>
            <button data-ami onClick={onAmi} style={{ flex: 1.4, padding: '12px 8px', borderRadius: 12, background: BLEU, color: '#fff', fontWeight: 800, fontSize: 13.5, border: 'none', cursor: 'pointer' }}><Ico k="gift" size={14} style={{ marginRight: 5, verticalAlign: -2 }} />En faire profiter un ami</button>
          </div>
        </div>
      )}
      {actif && !lot.token && lot.ticketCode && (
        <div style={{ marginTop: 14, textAlign: 'center', background: '#F4F6FB', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 12, color: '#5a6071' }}>Code à montrer au commerce</div>
          <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 24, letterSpacing: 3, color: '#0B6E50' }}>{lot.ticketCode}</div>
        </div>
      )}
    </div>
  )
}

export default function MesLots({ lots, joueurId = null, onChange }: { lots: MonLot[]; joueurId?: string | null; onChange?: () => void }) {
  const [filtre, setFiltre] = useState<string>('tous')
  const [ami, setAmi] = useState<MonLot | null>(null)
  const [idx, setIdx] = useState(0)
  const piste = useRef<HTMLDivElement>(null)

  const commerces = useMemo(() => {
    const m: { cle: string; nom: string; n: number }[] = []
    lots.forEach(l => { const c = m.find(x => x.cle === l.commerceCle); if (c) c.n++; else m.push({ cle: l.commerceCle, nom: l.commerce, n: 1 }) })
    return m
  }, [lots])
  const ordre: Record<MonLot['etat'], number> = { a_utiliser: 0, a_confirmer: 1, utilise: 2, expire: 3 }
  const visibles = lots.filter(l => filtre === 'tous' || l.commerceCle === filtre)
    .slice().sort((a, b) => ordre[a.etat] - ordre[b.etat] || (a.commerce).localeCompare(b.commerce, 'fr'))

  useEffect(() => { setIdx(0); if (piste.current) piste.current.scrollLeft = 0 }, [filtre])
  const onScroll = () => {
    const el = piste.current
    if (!el || !el.firstElementChild) return
    const w = (el.firstElementChild as HTMLElement).offsetWidth + 12
    setIdx(Math.max(0, Math.min(visibles.length - 1, Math.round(el.scrollLeft / w))))
  }

  if (!lots.length) {
    return <div style={{ background: '#fff', borderRadius: 16, padding: 18, fontSize: 14, color: '#5a6071', textAlign: 'center' }}>Pas encore de lot. Joue dans un commerce !</div>
  }

  const pastille = (actif: boolean): React.CSSProperties => ({ flexShrink: 0, fontSize: 12.5, fontWeight: 800, padding: '7px 12px', borderRadius: 100, border: 'none', cursor: 'pointer', background: actif ? BLEU : '#fff', color: actif ? '#fff' : '#141a26', whiteSpace: 'nowrap' })

  return (
    <div>
      {commerces.length > 1 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
          <button style={pastille(filtre === 'tous')} onClick={() => setFiltre('tous')}>Tous · {lots.length}</button>
          {commerces.map(c => <button key={c.cle} style={pastille(filtre === c.cle)} onClick={() => setFiltre(c.cle)}>{c.nom} · {c.n}</button>)}
        </div>
      )}
      <div ref={piste} onScroll={onScroll} data-carrousel-lots style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '4px 7% 10px', margin: '0 -18px', scrollbarWidth: 'none' }}>
        {visibles.map(l => <Carte key={l.id} lot={l} onAmi={() => setAmi(l)} />)}
      </div>
      {visibles.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 4 }}>
          {visibles.map((l, i) => <span key={l.id} style={{ width: i === idx ? 18 : 7, height: 7, borderRadius: 7, background: i === idx ? BLEU : '#cfd3dc', transition: 'width .2s' }} />)}
        </div>
      )}
      {ami && <FeuilleAmi lot={ami} joueurId={joueurId} onClose={() => { setAmi(null); if (onChange) onChange() }} onOffert={() => { /* rechargé à la fermeture */ }} />}
    </div>
  )
}
