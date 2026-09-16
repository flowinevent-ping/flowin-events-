'use client'

/**
 * TIRAGE AU SORT D UN SUPER EVENT — referentiel 34 et 35.
 *
 * « Super event : tirage au sort uniquement », piloté par le SA. Le tirage
 * n existait que dans tirage-nds.html, ecrit pour Nuits du Sud. Ici, depuis la
 * fiche du super event : ses lots, rangés par station, ce qu il en reste, et
 * un bouton de tirage (RPC tirage_super_event). Les gagnants sortent « a
 * confirmer » : le SA les appelle, puis confirme depuis la liste des gagnants.
 */

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { SectionHeader } from './DashboardUI'

interface LotSE { id: string; event_id: string; titre: string | null; nom: string | null; quantite: number | null; valeur: number | null }
interface Station { id: string; nom: string | null }
interface Tire { id: number; joueur_nom: string | null; lot_nom: string | null; event_id: string | null; statut: string | null }

export default function TirageSuperEvent({ seId, stations }: { seId: string; stations: Station[] }) {
  const [global, setGlobal] = useState<boolean | null>(null)
  const [lots, setLots] = useState<LotSE[]>([])
  const [tires, setTires] = useState<Tire[]>([])
  const [nb, setNb] = useState<Record<string, number>>({})
  const [occupe, setOccupe] = useState<string | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null)
  const ids = stations.map(s => s.id)
  const cle = ids.join(',')

  async function charger() {
    if (!ids.length) { setLots([]); setTires([]); return }
    const [{ data: l }, { data: t }, { data: se }] = await Promise.all([
      supabase.from('lots').select('id,event_id,titre,nom,quantite,valeur').in('event_id', ids),
      supabase.from('tirages').select('id,joueur_nom,lot_nom,event_id,statut').eq('super_event_id', seId).neq('statut', 'annule'),
      supabase.from('super_events').select('tirage_global').eq('id', seId).maybeSingle(),
    ])
    setGlobal((se as { tirage_global: boolean | null } | null)?.tirage_global ?? null)
    setLots((l ?? []) as LotSE[])
    setTires((t ?? []) as Tire[])
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { charger() }, [seId, cle])

  const nomLot = (l: LotSE) => (l.titre || l.nom || 'Lot')
  const dejaTires = (l: LotSE) => tires.filter(t => t.event_id === l.event_id && t.lot_nom === nomLot(l)).length

  async function tirer(l: LotSE) {
    const n = Math.max(1, nb[l.id] ?? 1)
    setOccupe(l.id); setMessage(null)
    const { data, error } = await supabase.rpc('tirage_super_event', { p_lot_id: l.id, p_nb: n })
    setOccupe(null)
    if (error) { setMessage({ ok: false, texte: `Tirage impossible — ${error.message}` }); return }
    const sortis = (data ?? []) as Tire[]
    setMessage(sortis.length
      ? { ok: true, texte: `${sortis.length} gagnant${sortis.length > 1 ? 's' : ''} tiré${sortis.length > 1 ? 's' : ''} pour « ${nomLot(l)} » : ${sortis.map(s => s.joueur_nom).join(', ')}. À appeler puis confirmer dans la liste des gagnants.` }
      : { ok: false, texte: 'Aucun gagnant tiré : lot épuisé, ou plus aucun joueur éligible.' })
    charger()
  }

  return (
    <>
      <SectionHeader>Tirage au sort</SectionHeader>
      <div style={{ fontSize: 12, color: 'var(--sa-muted)', marginBottom: 10, lineHeight: 1.5 }}>
        {global === false
          ? 'Tirage par station : chaque lot est tiré parmi les joueurs de sa station.'
          : 'Tirage global : chaque lot est tiré parmi tous les joueurs de l’opération.'}
        {' '}Chances proportionnelles aux tickets · un joueur ne gagne qu’une fois par opération · comptes de test exclus.
      </div>
      {message && (
        <div className={`sa-alert ${message.ok ? 'info' : 'warn'}`} style={{ fontSize: 12.5, marginBottom: 10 }}>{message.texte}</div>
      )}
      {lots.length === 0 && (
        <div style={{ fontSize: 12.5, color: 'var(--sa-muted)' }}>Aucun lot enregistré sur les stations de ce super event.</div>
      )}
      {stations.filter(s => lots.some(l => l.event_id === s.id)).map(s => (
        <div key={s.id} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--sa-muted)', margin: '10px 0 2px' }}>
            📍 {s.nom ?? s.id}
          </div>
          {lots.filter(l => l.event_id === s.id).map(l => {
            const reste = Math.max(0, (l.quantite ?? 1) - dejaTires(l))
            return (
              <div key={l.id} className="sa-list-item">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{nomLot(l)}</div>
                  <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>
                    {l.valeur ? `${l.valeur} € · ` : ''}{dejaTires(l)} tiré{dejaTires(l) > 1 ? 's' : ''} sur {l.quantite ?? 1} · {reste} restant{reste > 1 ? 's' : ''}
                  </div>
                </div>
                {reste > 0 && (
                  <>
                    <input
                      className="sa-input" type="number" min={1} max={reste} style={{ width: 70 }}
                      value={Math.min(nb[l.id] ?? 1, reste)}
                      onChange={e => setNb(x => ({ ...x, [l.id]: Math.max(1, Math.min(reste, parseInt(e.target.value) || 1)) }))}
                    />
                    <button className="sa-btn sm primary" disabled={occupe === l.id} onClick={() => tirer(l)}>
                      {occupe === l.id ? '…' : '🎲 Tirer'}
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </>
  )
}
