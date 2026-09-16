'use client'

import { useState, useEffect } from 'react'
import {
  fetchQrStations, creerQrStation, publierQrStation,
  fetchLiensEphemeres, creerLienEphemere, publierLienEphemere,
  type QrStation, type LienEphemere,
} from '@/lib/dashboard'
import Diffusion from './Diffusion'

/** Bloc QR stations + liens ephemeres pour un event donne, dans l'onglet QR & Liens de la fiche Pro. */
export default function QrLiensEvent({ eventId, eventNom }: { eventId: string; eventNom: string }) {
  const [stations, setStations] = useState<QrStation[]>([])
  const [liens, setLiens] = useState<LienEphemere[]>([])
  const [nomStation, setNomStation] = useState('')
  const [ouvert, setOuvert] = useState('')
  const [nomLien, setNomLien] = useState('')
  const [busy, setBusy] = useState(false)

  const charger = () => {
    fetchQrStations(eventId).then(setStations)
    fetchLiensEphemeres(eventId).then(setLiens)
  }
  useEffect(() => { charger() }, [eventId]) // eslint-disable-line react-hooks/exhaustive-deps

  const qrUrl = (source: string) =>
    `https://flowin-events.vercel.app/parcours/nds2026?ev=${encodeURIComponent(eventId)}&source=${encodeURIComponent(source)}`
  const lienUrl = (token: string) =>
    `https://flowin-events.vercel.app/parcours/nds2026?ev=${encodeURIComponent(eventId)}&token=${token}`

  async function ajouterStation() {
    if (!nomStation.trim()) return
    setBusy(true)
    await creerQrStation(eventId, nomStation.trim())
    setNomStation('')
    charger()
    setBusy(false)
  }
  async function ajouterLien() {
    setBusy(true)
    await creerLienEphemere(eventId, nomLien.trim() || null as unknown as string)
    setNomLien('')
    charger()
    setBusy(false)
  }

  return (
    <div style={{ border: '1px solid var(--sa-border)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>{eventNom}</div>

      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--sa-muted)', marginBottom: 6 }}>
        QR fixes ({stations.length})
      </div>
      {stations.map(s => (
        <div key={s.id} style={{ padding: '7px 0', borderBottom: '1px solid var(--sa-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* La vignette existait avant (via api.qrserver.com) : elle est
                conservee, mais generee localement comme le reste. */}
            <Diffusion vignette={44} url={qrUrl(s.source_qr)} titre={s.nom} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>{s.nom}</div>
              <div style={{ fontSize: 10.5, color: 'var(--sa-muted)' }}>?source={s.source_qr}</div>
            </div>
            {/* Les supports (QR telechargeable, affiche A4) se deplient : la liste reste lisible. */}
            <button className="sa-btn sm" onClick={() => setOuvert(o => (o === s.id ? '' : s.id))}>
              {ouvert === s.id ? '▲ Supports' : '▼ Supports'}
            </button>
            <button className="sa-btn sm" onClick={() => navigator.clipboard?.writeText(qrUrl(s.source_qr))}>Copier</button>
            <button className={`sa-btn sm${s.publie ? ' primary' : ''}`} onClick={() => publierQrStation(s.id, !s.publie).then(charger)}>
              {s.publie ? '✓ Publié' : 'Publier'}
            </button>
          </div>
          {ouvert === s.id && (
            <div style={{ padding: '10px 0 4px' }}>
              <Diffusion compact url={qrUrl(s.source_qr)} titre={`${eventNom} — ${s.nom}`} sousTitre={s.nom} />
            </div>
          )}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input className="sa-input" placeholder="Nom de la station — ex. Caisse 1" value={nomStation} onChange={e => setNomStation(e.target.value)} style={{ flex: 1 }} />
        <button className="sa-btn sm" disabled={busy || !nomStation.trim()} onClick={ajouterStation}>+ Ajouter</button>
      </div>

      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--sa-muted)', margin: '16px 0 6px' }}>
        Liens à usage unique ({liens.length})
      </div>
      {liens.map(l => (
        <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--sa-border)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 12.5 }}>{l.nom || l.token.slice(0, 8)}</div>
            <div style={{ fontSize: 10.5, color: l.used_at ? '#B45309' : 'var(--sa-muted)' }}>
              {l.used_at ? `Utilisé le ${new Date(l.used_at).toLocaleString('fr-FR')}` : 'Non utilisé'}
            </div>
          </div>
          <button className="sa-btn sm" disabled={!!l.used_at} onClick={() => navigator.clipboard?.writeText(lienUrl(l.token))}>Copier</button>
          <button className={`sa-btn sm${l.publie ? ' primary' : ''}`} onClick={() => publierLienEphemere(l.id, !l.publie).then(charger)}>
            {l.publie ? '✓ Publié' : 'Publier'}
          </button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input className="sa-input" placeholder="Nom (optionnel) — ex. Post Facebook" value={nomLien} onChange={e => setNomLien(e.target.value)} style={{ flex: 1 }} />
        <button className="sa-btn sm" disabled={busy} onClick={ajouterLien}>+ Générer</button>
      </div>
      <p className="sa-muted" style={{ fontSize: 10.5, marginTop: 6 }}>
        Le lien porte un jeton unique consommable (RPC prête). La vérification côté parcours joueur n&apos;est pas encore branchée — voir note de session.
      </p>
    </div>
  )
}
