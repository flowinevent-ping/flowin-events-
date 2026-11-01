'use client'

/**
 * COMPTEUR MENSUEL (lot QR, 31/10) — base de la facturation par palier :
 * joueurs DISTINCTS du mois civil, toutes animations du pro confondues.
 *
 * Source : RPC joueurs_uniques_par_mois(p_pro_id)
 * (sql/2026-11-01-tirage-auto-liste-gagnants.sql). Tant qu elle n est pas
 * appliquee, repli sur le meme calcul cote client (participations des events
 * du pro depuis le 1er du mois).
 */

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CARD, MUTED } from '@/lib/proui'
import { CHARTE_PRO as C } from '@/lib/charte'

type Mois = { mois: string; joueurs: number }

function cleMois(d: Date) { const m = d.getMonth() + 1; return `${d.getFullYear()}-${m < 10 ? '0' : ''}${m}` }

async function charger(proId: string): Promise<Mois[] | null> {
  const r = await supabase.rpc('joueurs_uniques_par_mois', { p_pro_id: proId })
  if (!r.error && Array.isArray(r.data)) {
    return (r.data as { mois: string; joueurs: number }[]).map(x => ({ mois: String(x.mois).slice(0, 7), joueurs: Number(x.joueurs) || 0 }))
  }
  /* Repli : mois courant seulement. */
  const { data: evs } = await supabase.from('events').select('id').eq('pro_id', proId)
  const ids = ((evs ?? []) as { id: string }[]).map(e => e.id)
  if (!ids.length) return [{ mois: cleMois(new Date()), joueurs: 0 }]
  const debut = new Date(); debut.setDate(1); debut.setHours(0, 0, 0, 0)
  const { data, error } = await supabase.from('participations').select('joueur_id').in('event_id', ids).gte('created_at', debut.toISOString()).limit(20000)
  if (error) return null
  const n = new Set(((data ?? []) as { joueur_id: string | null }[]).map(p => p.joueur_id).filter(Boolean)).size
  return [{ mois: cleMois(new Date()), joueurs: n }]
}

export default function CompteurMensuel({ proId }: { proId: string }) {
  const [mois, setMois] = useState<Mois[] | null | undefined>(undefined)
  useEffect(() => {
    if (!proId) return
    let vivant = true
    charger(proId).then(r => { if (vivant) setMois(r) })
    return () => { vivant = false }
  }, [proId])
  if (!proId || mois === null) return null
  const ici = cleMois(new Date())
  const prec = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return cleMois(d) })()
  const v = (k: string) => mois?.find(m => m.mois === k)?.joueurs ?? 0
  const libMois = (k: string) => new Date(`${k}-15T12:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return (
    <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '14px 18px', marginBottom: 14 }}>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', ...MUTED }}>Participants ce mois-ci</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: C.accent, lineHeight: 1.2 }}>{mois === undefined ? '…' : v(ici)}</div>
        <div style={{ fontSize: 12, ...MUTED }}>Joueurs distincts en {libMois(ici)}, toutes animations confondues.</div>
      </div>
      {mois !== undefined && mois.some(m => m.mois === prec) && (
        <div style={{ fontSize: 12.5, ...MUTED }}>{libMois(prec)} : <b style={{ color: C.texte }}>{v(prec)}</b></div>
      )}
    </div>
  )
}
