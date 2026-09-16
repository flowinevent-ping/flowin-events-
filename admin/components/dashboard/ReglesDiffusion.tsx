'use client'

/**
 * REGLES DE DIFFUSION DES LOTS — referentiel 44 (et 8, 34).
 *
 * Dans la fiche d un event, le SA voit et modifie :
 *   - pour chaque lot : tirage au sort ou gain immediat (lots.note), quantite,
 *     conditions ;
 *   - la regle du gain immediat (events.cfg.regleRecompense : tous les X
 *     joueurs, ou probabilite en %), appliquee par les jeux
 *     (appliquer_regle_gain).
 * Une station de super event reste en tirage au sort uniquement : la regle
 * est affichee, pas modifiable.
 */

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { SectionHeader } from './DashboardUI'

interface LotLigne { id: string; titre: string | null; nom: string | null; quantite: number | null; conditions: string | null; note: string | null }
type Regle = { mode: 'tousLesX' | 'aleatoire'; everyX: number; probabilite: number }

const estInstant = (note: string | null) => /instantan/i.test(note ?? '')

export default function ReglesDiffusion({ eventId, superEventId }: { eventId: string; superEventId: string | null }) {
  const [lots, setLots] = useState<LotLigne[] | null>(null)
  const [regle, setRegle] = useState<Regle>({ mode: 'aleatoire', everyX: 10, probabilite: 15 })
  const [etat, setEtat] = useState<'' | 'envoi' | 'ok' | 'ko'>('')

  useEffect(() => {
    let vivant = true
    setLots(null); setEtat('')
    Promise.all([
      supabase.from('lots').select('id,titre,nom,quantite,conditions,note').eq('event_id', eventId).order('id'),
      supabase.from('events').select('cfg').eq('id', eventId).maybeSingle(),
    ]).then(([l, e]) => {
      if (!vivant) return
      setLots((l.data ?? []) as LotLigne[])
      const r = ((e.data as { cfg: Record<string, unknown> | null } | null)?.cfg?.regleRecompense ?? null) as Partial<Regle> | null
      if (r) setRegle({ mode: r.mode === 'tousLesX' ? 'tousLesX' : 'aleatoire', everyX: Number(r.everyX) || 10, probabilite: Number(r.probabilite) || 15 })
    })
    return () => { vivant = false }
  }, [eventId])

  if (lots === null) return <div className="sa-muted" style={{ fontSize: 12 }}>Chargement des règles…</div>

  if (superEventId) {
    return (
      <>
        <SectionHeader>Règles de diffusion</SectionHeader>
        <div className="sa-alert info" style={{ fontSize: 12.5, marginBottom: 12 }}>
          Station de super event : <b>tirage au sort uniquement</b>, piloté depuis la fiche du super event (onglet Lots &amp; tirages).
          {lots.length > 0 && ` ${lots.length} lot${lots.length > 1 ? 's' : ''} sur cette station.`}
        </div>
      </>
    )
  }

  const maj = (id: string, champ: keyof LotLigne, v: string | number | null) =>
    setLots(ls => (ls ?? []).map(l => (l.id === id ? { ...l, [champ]: v } : l)))
  const aInstant = lots.some(l => estInstant(l.note))

  async function enregistrer() {
    setEtat('envoi')
    let ko = false
    for (const l of lots ?? []) {
      const { error } = await supabase.from('lots')
        .update({ note: l.note, quantite: l.quantite, conditions: l.conditions }).eq('id', l.id)
      if (error) ko = true
    }
    const { data } = await supabase.from('events').select('cfg').eq('id', eventId).maybeSingle()
    const actuel = ((data as { cfg: Record<string, unknown> | null } | null)?.cfg) ?? {}
    const { error } = await supabase.from('events').update({
      cfg: { ...actuel, regleRecompense: aInstant ? regle : null },
      gain_ticket: (lots ?? []).some(l => !estInstant(l.note)),
    }).eq('id', eventId)
    if (error) ko = true
    setEtat(ko ? 'ko' : 'ok')
  }

  return (
    <>
      <SectionHeader>Règles de diffusion des lots</SectionHeader>
      {lots.length === 0 && <div className="sa-empty-inline">Aucun lot enregistré sur cet event.</div>}
      {lots.map(l => (
        <div key={l.id} style={{ border: '1px solid var(--sa-border)', borderRadius: 10, padding: 10, marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
            <b style={{ flex: 1, minWidth: 140, fontSize: 13 }}>{l.titre || l.nom || 'Lot'}</b>
            <label style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4 }}>
              Qté
              <input className="sa-input" type="number" min={1} style={{ width: 70 }} value={l.quantite ?? 1}
                onChange={e => maj(l.id, 'quantite', Math.max(1, parseInt(e.target.value) || 1))} />
            </label>
            <select className="sa-input" style={{ width: 'auto' }} value={estInstant(l.note) ? 'instantane' : 'tirage'}
              onChange={e => maj(l.id, 'note', e.target.value === 'instantane' ? 'Type : gain instantané' : 'Type : tirage au sort')}>
              <option value="tirage">Tirage au sort</option>
              <option value="instantane">Gain immédiat</option>
            </select>
          </div>
          <input className="sa-input" placeholder="Conditions d’utilisation" value={l.conditions ?? ''}
            onChange={e => maj(l.id, 'conditions', e.target.value || null)} />
        </div>
      ))}

      {aInstant && (
        <div style={{ border: '1px solid var(--sa-border)', borderRadius: 10, padding: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 6 }}>Gain immédiat : quand le joueur gagne-t-il ?</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="sa-input" style={{ width: 'auto' }} value={regle.mode}
              onChange={e => setRegle(r => ({ ...r, mode: e.target.value as Regle['mode'] }))}>
              <option value="aleatoire">Au hasard</option>
              <option value="tousLesX">Tous les X joueurs</option>
            </select>
            {regle.mode === 'aleatoire' ? (
              <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <input className="sa-input" type="number" min={0} max={100} style={{ width: 70 }} value={regle.probabilite}
                  onChange={e => setRegle(r => ({ ...r, probabilite: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))} />
                % de chances par partie
              </label>
            ) : (
              <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                un gagnant tous les
                <input className="sa-input" type="number" min={1} style={{ width: 70 }} value={regle.everyX}
                  onChange={e => setRegle(r => ({ ...r, everyX: Math.max(1, parseInt(e.target.value) || 1) }))} />
                joueurs
              </label>
            )}
          </div>
        </div>
      )}

      {lots.length > 0 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
          <button className="sa-btn sm primary" disabled={etat === 'envoi'} onClick={enregistrer}>
            {etat === 'envoi' ? '…' : '✓ Enregistrer les règles'}
          </button>
          {etat === 'ok' && <span style={{ fontSize: 12, color: '#2f7d4f', fontWeight: 700 }}>Enregistré.</span>}
          {etat === 'ko' && <span style={{ fontSize: 12, color: '#B45309', fontWeight: 700 }}>Échec partiel, réessayez.</span>}
        </div>
      )}
    </>
  )
}
