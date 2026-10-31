'use client'

/**
 * DIFFUSION D UNE STATION — referentiel 12, 13, 14, 15, 17, 18, 28.
 *
 * Pour chaque station d une operation (event autonome ou station de super
 * event), au meme endroit, cote pro comme cote SA :
 *   - le texte type (« Nous sommes heureux… » + lien), modifiable, enregistre
 *     dans events.cfg.texteDiffusion, et reutilise par tous les canaux ;
 *   - email prerempli (Gmail), WhatsApp, SMS, Instagram (texte a copier +
 *     visuel QR a telecharger) ;
 *   - le QR du jeu (PNG, SVG, affiche) ;
 *   - les QR traces par support (lot QR, 31/10) : le pro les cree lui-meme,
 *     nommes, types physique / digital, publies tout de suite (QrTraces) ;
 *   - l export des contacts opt-in au format Mailchimp (par operation).
 */

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { libelleDates, type DonneesOperation } from '@/lib/operations'
import QrTraces from './QrTraces'
import Diffusion from '@/components/dashboard/Diffusion'

type Mode = 'sa' | 'pro'
type Station = DonneesOperation['stations'][number]

const BASE = 'https://flowin-events.vercel.app'
const BRD = 'var(--sa-border, #E2E8F0)'
const MUT = 'var(--sa-muted, #64748B)'
const btn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 8,
  border: `1.5px solid ${BRD}`, background: '#fff', color: '#0F172A', fontSize: 12, fontWeight: 700,
  cursor: 'pointer', textDecoration: 'none', fontFamily: 'inherit', whiteSpace: 'nowrap',
}
const btnP: React.CSSProperties = { ...btn, background: '#2563EB', borderColor: '#2563EB', color: '#fff' }
const zone: React.CSSProperties = {
  width: '100%', minHeight: 92, border: `1.5px solid ${BRD}`, borderRadius: 10, padding: '9px 11px',
  fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical',
}

export const lienJeuStation = (s: { id: string; module: string }, source?: string) =>
  `${BASE}/parcours/${s.module || 'nds2026'}?ev=${encodeURIComponent(s.id)}${source ? `&source=${encodeURIComponent(source)}` : ''}`

/** Texte type par defaut : uniquement ce que l operation connait deja. */
export function texteTypeParDefaut(op: DonneesOperation, s: Station): string {
  const url = lienJeuStation(s)
  const dates = op.dateD ? ` (${libelleDates(op.dateD, op.dateF)})` : ''
  const lots = op.lots.filter(l => !l.stationNom || l.stationNom === s.nom).map(l => l.nom)
  const lignes = op.type === 'super'
    ? [`Nous sommes heureux de participer à ${op.nom}${dates} !`, `Venez jouer chez ${s.nom} et tentez votre chance.`]
    : [`Nous sommes heureux de vous inviter à jouer à « ${s.nom} »${dates} !`]
  if (lots.length) lignes.push(`À gagner : ${lots.join(', ')}.`)
  lignes.push(`Participez ici : ${url}`)
  return lignes.join('\n')
}

export function DiffusionStation({ op, s, mode }: { op: DonneesOperation; s: Station; mode: Mode }) {
  const cfg = (s.cfg ?? {}) as Record<string, unknown>
  const [ouvert, setOuvert] = useState(false)
  const [texte, setTexte] = useState<string>((cfg.texteDiffusion as string) || texteTypeParDefaut(op, s))
  const [etat, setEtat] = useState<'' | 'ok' | 'ko' | 'copie'>('')
  const url = lienJeuStation(s)
  const dd = cfg.diffusion_demandee as { physique?: boolean; digital?: boolean; qr_tracking?: boolean; statut?: string } | undefined
  const [traitee, setTraitee] = useState(dd?.statut === 'traitee')
  const demandes = dd && !traitee ? [dd.physique && 'supports imprimés', dd.digital && 'diffusion digitale', dd.qr_tracking && 'QR de suivi'].filter(Boolean) : []

  /* Le SA solde la demande une fois les supports produits (ecran Controle). */
  async function marquerTraitee() {
    const { data } = await supabase.from('events').select('cfg').eq('id', s.id).maybeSingle()
    const actuel = ((data as { cfg: Record<string, unknown> | null } | null)?.cfg) ?? {}
    const d0 = (actuel.diffusion_demandee ?? {}) as Record<string, unknown>
    const { error } = await supabase.from('events').update({ cfg: { ...actuel, diffusion_demandee: { ...d0, statut: 'traitee' } } }).eq('id', s.id)
    if (!error) setTraitee(true)
  }

  async function enregistrer() {
    setEtat('')
    const { data } = await supabase.from('events').select('cfg').eq('id', s.id).maybeSingle()
    const actuel = ((data as { cfg: Record<string, unknown> | null } | null)?.cfg) ?? {}
    const { error } = await supabase.from('events').update({ cfg: { ...actuel, texteDiffusion: texte } }).eq('id', s.id)
    setEtat(error ? 'ko' : 'ok')
  }
  function copier() {
    navigator.clipboard?.writeText(texte).then(() => setEtat('copie')).catch(() => setEtat('ko'))
  }
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(op.type === 'super' ? `${op.nom} — ${s.nom}` : s.nom)}&body=${encodeURIComponent(texte)}`

  return (
    <div style={{ borderTop: `1px solid ${BRD}`, padding: '8px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 700, fontSize: 12.5 }}>{s.nom}</div>
          <div style={{ fontSize: 10.5, color: MUT, wordBreak: 'break-all' }}>{url}</div>
          {demandes.length > 0 && (
            <div style={{ fontSize: 11, color: '#B45309', marginTop: 2 }}>
              Demande enregistrée ({demandes.join(', ')}) — {mode === 'sa' ? 'à traiter.' : 'Flowin la traite et revient vers vous.'}
              {mode === 'sa' && <button style={{ ...btn, marginLeft: 8, padding: '2px 8px', fontSize: 11 }} onClick={marquerTraitee}>✓ Marquer traitée</button>}
            </div>
          )}
        </div>
        <button style={btn} onClick={() => setOuvert(o => !o)}>{ouvert ? '▲ Diffusion' : '▼ Texte, QR & partage'}</button>
      </div>

      {ouvert && (
        <div style={{ paddingTop: 10 }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, marginBottom: 4 }}>Texte de diffusion</div>
          <textarea style={zone} value={texte} onChange={e => { setTexte(e.target.value); setEtat('') }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <button style={btnP} onClick={enregistrer}>Enregistrer le texte</button>
            <button style={btn} onClick={() => { setTexte(texteTypeParDefaut(op, s)); setEtat('') }}>Texte par défaut</button>
            {etat === 'ok' && <span style={{ fontSize: 11.5, color: '#15803D', fontWeight: 700 }}>Enregistré.</span>}
            {etat === 'copie' && <span style={{ fontSize: 11.5, color: '#15803D', fontWeight: 700 }}>Texte copié.</span>}
            {etat === 'ko' && <span style={{ fontSize: 11.5, color: '#B45309', fontWeight: 700 }}>Échec, réessayez.</span>}
          </div>

          <div style={{ fontSize: 11.5, fontWeight: 800, margin: '12px 0 4px' }}>Publier</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a style={btn} href={gmail} target="_blank" rel="noopener noreferrer">Email (Gmail)</a>
            <a style={btn} href={`https://wa.me/?text=${encodeURIComponent(texte)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a style={btn} href={`sms:?body=${encodeURIComponent(texte)}`}>SMS</a>
            <button style={btn} onClick={copier}>Instagram : copier le texte</button>
          </div>
          <div style={{ fontSize: 11, color: MUT, margin: '4px 0 10px' }}>
            Instagram : copiez le texte, téléchargez le visuel QR ci-dessous, puis publiez-le depuis l’application.
          </div>

          <Diffusion compact url={url} titre={s.nom} sousTitre="Scannez pour jouer" />

          <QrTraces eventId={s.id} module={s.module} titre={s.nom} mode={mode} />
        </div>
      )}
    </div>
  )
}

/* Export Mailchimp (referentiel 18) : les joueurs de l operation qui ont
   accepte d etre recontactes, au format d import Mailchimp. */
export function ExportMailchimp({ op }: { op: DonneesOperation }) {
  const [etat, setEtat] = useState<'' | 'charge' | 'vide' | 'ko'>('')
  async function exporter() {
    setEtat('charge')
    const ids = op.stations.map(s => s.id)
    const { data: parts, error } = await supabase.from('participations').select('joueur_id').in('event_id', ids).not('joueur_id', 'is', null)
    if (error) { setEtat('ko'); return }
    const jids = Array.from(new Set(((parts ?? []) as { joueur_id: string }[]).map(p => p.joueur_id)))
    if (!jids.length) { setEtat('vide'); return }
    const lignes: { email: string | null; prenom: string | null; nom: string | null; tel: string | null; code_postal: string | null }[] = []
    for (let i = 0; i < jids.length; i += 200) {
      const { data } = await supabase.from('joueurs').select('email,prenom,nom,tel,code_postal,optin').in('id', jids.slice(i, i + 200)).eq('optin', true)
      lignes.push(...((data ?? []) as typeof lignes))
    }
    const ok = lignes.filter(l => l.email)
    if (!ok.length) { setEtat('vide'); return }
    const esc = (v: string | null) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = ['Email Address,First Name,Last Name,Phone Number,Zip Code']
      .concat(ok.map(l => [l.email, l.prenom, l.nom, l.tel, l.code_postal].map(esc).join(',')))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `mailchimp-${op.id}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    setEtat('')
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 12, paddingTop: 10, borderTop: `1px solid ${BRD}` }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontWeight: 700, fontSize: 12.5 }}>Multi-publication (Mailchimp)</div>
        <div style={{ fontSize: 11, color: MUT }}>Contacts de l’opération ayant accepté d’être recontactés, prêts à importer dans Mailchimp. Le texte de diffusion ci-dessus sert de base au message.</div>
      </div>
      <button style={btn} disabled={etat === 'charge'} onClick={exporter}>{etat === 'charge' ? 'Préparation…' : '⬇ Exporter les contacts (CSV)'}</button>
      {etat === 'vide' && <span style={{ fontSize: 11.5, color: MUT }}>Aucun contact opt-in sur cette opération.</span>}
      {etat === 'ko' && <span style={{ fontSize: 11.5, color: '#B45309' }}>Export impossible, réessayez.</span>}
    </div>
  )
}
