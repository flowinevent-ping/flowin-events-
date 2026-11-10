'use client'

/**
 * RAPPORT D'ACTIVITE DU PRO (Romain, 10/11/2026 soir — « ce que voit et fait un pro »).
 * Carrousel, une idée par écran, données AGRÉGÉES uniquement (aucune donnée personnelle) :
 *  1. Passages = nombre de flashs (visites sans étape) ET nombre de joueurs (distincts), contacts.
 *  2. Hommes / Femmes (donut, comme dans le super admin).
 *  3. Zone de chalandise : codes postaux en % (8 premiers + « Autres »).
 *  4. Fréquentation par jour : « égaliseur » (barres).
 *  5. Rappel : invitez vos clients à jouer + partage du lien / WhatsApp / QR.
 * Sources (RPC existantes, SECURITY DEFINER, agrégats) : evenement_tracking(text[]) -> totaux.flashs,
 * totaux.joueurs ; operation_stats(text[], se) -> sexe, code_postal, par_jour.
 * Super event : `superEvent` -> flashs de TOUT l'événement (toutes stations) en plus de la station du pro.
 */
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabase'
import { Camembert } from '@/components/dashboard/Camembert'
import Carrousel from '@/components/pro/Carrousel'
import type { StatsOperation } from '@/lib/operations'

const BLEU = '#3B5CC4'
const ORANGE = '#C2410C'
const PALETTE_PRO = [BLEU, ORANGE, '#1D9E75', '#F5A100', '#0E7490', '#94A3B8', '#2B47A8', '#FB923C', '#CBD5E1']
const MUT = '#64748B'

interface Totaux { flashs: number; joueurs: number; parties: number }

export interface ContactsResume { autorises: number; importes: number }

function Tuile({ v, l, c = BLEU }: { v: React.ReactNode; l: string; c?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #D5DEF3', borderRadius: 14, padding: '12px 14px' }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: c, lineHeight: 1.1 }}>{v}</div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', marginTop: 2 }}>{l}</div>
    </div>
  )
}

function Titre({ t }: { t: string }) {
  return <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 10 }}>{t}</div>
}

/** « Égaliseur » : barres verticales, comme le pic de fréquentation du super admin. */
export function Egaliseur({ points, couleur = BLEU }: { points: { l: string; n: number }[]; couleur?: string }) {
  const max = Math.max(1, ...points.map(p => p.n))
  if (!points.length) return <div style={{ fontSize: 13, color: MUT }}>Pas encore de partie.</div>
  return (
    <div data-egaliseur style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 150, padding: '8px 0 0', borderBottom: '1px solid #E2E8F0' }}>
      {points.map(p => (
        <div key={p.l} title={`${p.l} : ${p.n}`} style={{ flex: 1, minWidth: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#334155' }}>{p.n}</div>
          <div style={{ width: '100%', maxWidth: 28, height: `${Math.max(4, (p.n / max) * 110)}px`, background: couleur, borderRadius: '5px 5px 0 0' }} />
          <div style={{ fontSize: 9.5, color: MUT, marginTop: 3, whiteSpace: 'nowrap' }}>{p.l}</div>
        </div>
      ))}
    </div>
  )
}

/** Rappel au pro + partage (lien, WhatsApp, QR). */
export function RappelPartage({ lien, compact }: { lien: string | null; compact?: boolean }) {
  const [qr, setQr] = useState('')
  const [copie, setCopie] = useState(false)
  useEffect(() => {
    if (!lien) return
    QRCode.toDataURL(lien, { margin: 1, width: 240 }).then(setQr, () => setQr(''))
  }, [lien])
  const btn: React.CSSProperties = { minHeight: 44, display: 'inline-flex', alignItems: 'center', padding: '0 14px', borderRadius: 12, border: '1.5px solid #C7D2EE', background: '#fff', color: '#0F172A', fontWeight: 800, fontSize: 13.5, textDecoration: 'none', cursor: 'pointer', fontFamily: 'inherit' }
  return (
    <div data-rappel-partage style={{ background: '#EEF2FB', border: '1px solid #D5DEF3', borderRadius: 16, padding: 14 }}>
      <div style={{ fontSize: 15, fontWeight: 900, lineHeight: 1.35 }}>Invitez vos clients à jouer : plus ils jouent, plus ils partagent, plus vous êtes visible.</div>
      {!compact && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, margin: '10px 0', fontSize: 12.5, fontWeight: 700, color: '#334155' }}>
          <div>• Constituer votre fichier client</div>
          <div>• Animer vos clients</div>
          <div>• Augmenter votre panier</div>
          <div>• Augmenter votre chiffre d’affaires</div>
        </div>
      )}
      {lien ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: compact ? 10 : 0 }}>
          <button type="button" data-copier-lien style={btn} onClick={async () => { try { await navigator.clipboard.writeText(lien); setCopie(true); setTimeout(() => setCopie(false), 2500) } catch { setCopie(false) } }}>{copie ? 'Lien copié' : 'Copier le lien'}</button>
          <a data-whatsapp style={btn} target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent('Venez jouer et tenter de gagner : ' + lien)}`}>WhatsApp</a>
          {qr && <a style={btn} href={qr} download="qr-animation.png">Télécharger le QR</a>}
          {qr && !compact && <img src={qr} alt="QR de votre animation" width={84} height={84} style={{ borderRadius: 8, background: '#fff' }} />}
        </div>
      ) : (
        <div style={{ fontSize: 12.5, color: MUT, marginTop: 8 }}>Publiez une animation pour obtenir votre lien de jeu.</div>
      )}
    </div>
  )
}

export default function RapportPro({ eventIds, superEventId, contacts, gagnants, lien, nom = 'Rapport d’activité' }: {
  gagnants?: number
  eventIds: string[]
  /** Super event : son id -> total de flashs de tout l'événement (toutes stations). */
  superEventId?: string | null
  contacts?: ContactsResume | null
  lien: string | null
  nom?: string
}) {
  const [t, setT] = useState<Totaux | null | undefined>(undefined)
  const [st, setSt] = useState<StatsOperation | null>(null)
  const [flashsEvent, setFlashsEvent] = useState<number | null>(null)
  const [i, setI] = useState(0)
  const superEvent = superEventId ? { id: superEventId } : null
  const cle = eventIds.join(',') + '|' + (superEventId ?? '')
  useEffect(() => {
    let vivant = true
    setT(undefined)
    if (!eventIds.length) { setT(null); return }
    Promise.all([
      supabase.rpc('evenement_tracking', { p_events: eventIds }),
      supabase.rpc('operation_stats', { p_events: eventIds, p_se: superEvent?.id ?? null }),
      superEventId
        ? supabase.from('events').select('id').eq('super_event_id', superEventId).then(({ data }) => {
            const tous = ((data ?? []) as { id: string }[]).map(e => e.id)
            return tous.length ? supabase.rpc('evenement_tracking', { p_events: tous }) : { data: null }
          })
        : Promise.resolve({ data: null }),
    ]).then(([tr, os, ge]) => {
      if (!vivant) return
      const tt = (tr.data as { totaux?: Totaux } | null)?.totaux
      setT(tt ? { flashs: Number(tt.flashs ?? 0), joueurs: Number(tt.joueurs ?? 0), parties: Number(tt.parties ?? 0) } : null)
      setSt((os.data as StatsOperation) ?? null)
      const g = (ge.data as { totaux?: Totaux } | null)?.totaux
      setFlashsEvent(g ? Number(g.flashs ?? 0) : null)
    })
    return () => { vivant = false }
  }, [cle]) // eslint-disable-line react-hooks/exhaustive-deps

  if (t === undefined) return <div style={{ fontSize: 13, color: MUT, padding: 12 }}>Chargement du rapport…</div>

  const sexe = (st?.sexe ?? []).filter(x => x.valeur === 'Femmes' || x.valeur === 'Hommes')
  const cp = st?.code_postal ?? []
  const jours = (st?.par_jour ?? []).slice(-14).map(p => ({ l: new Date(`${p.jour}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), n: p.parties }))

  const ecrans = [
    { cle: 'chiffres', contenu: (
      <div data-slide="chiffres">
        <Titre t={superEvent ? 'Le Super Event et votre station' : 'Vos chiffres'} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {superEvent && <Tuile c={ORANGE} v={flashsEvent ?? '—'} l="flashs de tout l’événement" />}
          <Tuile v={t?.flashs ?? 0} l={superEvent ? 'passages à votre station (flashs)' : 'passages (flashs du QR)'} />
          <Tuile v={t?.joueurs ?? 0} l="joueurs (personnes distinctes)" />
          <Tuile v={t?.parties ?? 0} l="parties jouées" />
          {contacts && <Tuile v={contacts.autorises} l="contacts autorisés" />}
          {contacts && <Tuile v={contacts.importes} l="clients importés" />}
          {gagnants != null && <Tuile c={ORANGE} v={gagnants} l="gagnants" />}
        </div>
        <div style={{ fontSize: 11.5, color: MUT, marginTop: 8 }}>Un flash est une ouverture du QR ; un joueur est compté une fois.</div>
      </div>
    ) },
    { cle: 'genre', contenu: (
      <div data-slide="genre">
        {sexe.length ? <Camembert titre="Hommes / Femmes" parts={sexe} unite="joueurs" palette={[ORANGE, BLEU]} /> : <><Titre t="Hommes / Femmes" /><div style={{ fontSize: 13, color: MUT }}>Pas encore de joueur.</div></>}
      </div>
    ) },
    { cle: 'chalandise', contenu: (
      <div data-slide="chalandise">
        {cp.length ? <Camembert titre="Zone de chalandise (codes postaux, en %)" parts={cp} unite="joueurs" palette={PALETTE_PRO} /> : <><Titre t="Zone de chalandise" /><div style={{ fontSize: 13, color: MUT }}>Pas encore de joueur.</div></>}
      </div>
    ) },
    { cle: 'frequentation', contenu: (
      <div data-slide="frequentation" style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 16 }}>
        <Titre t="Parties par jour" />
        <Egaliseur points={jours} />
      </div>
    ) },
    { cle: 'rappel', contenu: <div data-slide="rappel"><RappelPartage lien={lien} /></div> },
  ]
  return (
    <div data-rapport-pro>
      <Carrousel ecrans={ecrans} i={i} setI={setI} nom={nom} />
    </div>
  )
}
