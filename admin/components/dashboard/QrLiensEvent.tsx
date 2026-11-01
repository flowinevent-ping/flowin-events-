'use client'

import { useState, useEffect } from 'react'
import {
  fetchLiensEphemeres, creerLienEphemere, publierLienEphemere,
  type LienEphemere,
} from '@/lib/dashboard'
import QrTraces from '@/components/operations/QrTraces'

/** Bloc QR traces + liens ephemeres pour un event donne, dans l'onglet QR & Liens de la fiche Pro. */
export default function QrLiensEvent({ eventId, eventNom, module }: { eventId: string; eventNom: string; module?: string | null }) {
  /* Referentiel 28 : le lien porte le jeu REEL de l event (il etait toujours
     construit sur « Quiz + bonus »). */
  const jeu = module || 'nds2026'
  const [liens, setLiens] = useState<LienEphemere[]>([])
  const [nomLien, setNomLien] = useState('')
  const [busy, setBusy] = useState(false)

  const charger = () => {
    fetchLiensEphemeres(eventId).then(setLiens)
  }
  useEffect(() => { charger() }, [eventId]) // eslint-disable-line react-hooks/exhaustive-deps

  const lienUrl = (token: string) =>
    `https://flowin-events.vercel.app/parcours/${jeu}?ev=${encodeURIComponent(eventId)}&token=${token}`

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

      {/* QR traces (lot QR, 31/10) : memes QR, meme ecran que cote pro, publies
          des leur creation ; le SA peut en masquer un. */}
      <QrTraces eventId={eventId} module={module} titre={eventNom} mode="sa" />

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
