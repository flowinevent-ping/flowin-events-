'use client'

/**
 * GAGNANTS — dans la grammaire du dashboard pro.
 *
 * Romain, 04/09 : « tu as tout reuni en un seul spot de gestion ce qui est
 * bon, en revanche ca ne correspond a rien dans la logique visuelle de la
 * gestion du dashboard : les stats, les gagnants, les onglets d acces ».
 *
 * /pro/tirage rendait `ProClient` : une application MOBILE pleine page, avec sa
 * propre barre d onglets en bas (Stats · Gains · Tirage · Joueurs · Lots · QR ·
 * Export). Toutes les autres pages de l espace pro passent par `ProShell` —
 * sidebar a gauche, fil d Ariane, contenu en cartes. Deux grammaires visuelles
 * cohabitaient donc dans le meme espace, et celle-ci ne ressemblait a rien
 * d autre.
 *
 * Cet ecran reprend la grammaire commune. Il NE REIMPLEMENTE RIEN : les donnees
 * viennent de fetchProGains (corrige le 04/09 pour lire `tirages` et non plus
 * `se_gains`, vide depuis le 28/07), et la validation en caisse passe par le
 * RPC valider_lot(token, pin) deja en place, seul chemin qui verifie le PIN et
 * destocke reellement.
 *
 * REGLE DU RETIRAGE, donnee par Romain le 04/09 : « oui en autonomie pour les
 * events, en revanche pas pour les super events, SA reste pilote ». Un gain
 * rattache a un super event affiche donc que le retirage passe par Flowin,
 * au lieu d un bouton qui n aurait pas du exister.
 */

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchProGains, marquerGainUtilise, type ProGainRow } from '@/lib/dashboard'
import { CARD, MUTED, ACC } from '@/lib/proui'

const input: React.CSSProperties = {
  width: '100%', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '11px 13px',
  fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
}

interface EventLigne { id: string; nom: string; super_event_id: string | null }

export default function GagnantsClient({ proId, events }: { proId: string; events: EventLigne[] }) {
  /* Le choix explicite remplace le `find` qui prenait le premier event
     rattache a un super event, dans l ordre ou il arrivait — c est ce qui
     faisait afficher des zeros sur les pages qui devinaient. */
  const [evId, setEvId] = useState<string>(events[0]?.id ?? '')
  const ev = events.find(e => e.id === evId) ?? null

  const [gains, setGains] = useState<ProGainRow[] | null>(null)
  const [ouvert, setOuvert] = useState<ProGainRow | null>(null)
  const [pin, setPin] = useState('')
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null)
  const [envoi, setEnvoi] = useState(false)

  const recharger = () => {
    if (!evId) { setGains([]); return }
    fetchProGains([evId]).then(setGains).catch(() => setGains([]))
  }
  useEffect(recharger, [evId]) // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    const l = gains ?? []
    return { total: l.length, retires: l.filter(g => g.utilise).length, aRemettre: l.filter(g => !g.utilise).length }
  }, [gains])

  /* Validation en caisse : le PIN est verifie par la base, jamais ici. Le
     comparer cote navigateur reviendrait a l y exposer. */
  const validerAvecPin = async (g: ProGainRow) => {
    if (!g.retraitToken) { setMessage({ ok: false, texte: 'Ce gain n’a pas de jeton de retrait — validation impossible.' }); return }
    setEnvoi(true); setMessage(null)
    const { data, error } = await supabase.rpc('valider_lot', { p_token: g.retraitToken, p_pin: pin })
    setEnvoi(false)
    if (error) { setMessage({ ok: false, texte: `Validation refusée — ${error.message}` }); return }
    const ok = data === true || (Array.isArray(data) && data.length > 0)
    setMessage(ok
      ? { ok: true, texte: 'Billet validé. Le lot est décompté du stock.' }
      : { ok: false, texte: 'Code PIN incorrect, ou billet déjà validé.' })
    if (ok) { setPin(''); setOuvert(null); recharger() }
  }

  const basculerManuel = async (g: ProGainRow) => {
    setEnvoi(true)
    const ok = await marquerGainUtilise(g.id, !g.utilise)
    setEnvoi(false)
    setMessage(ok
      ? { ok: true, texte: g.utilise ? 'Gain remis en attente.' : 'Gain marqué comme remis.' }
      : { ok: false, texte: 'Échec de la mise à jour.' })
    if (ok) recharger()
  }

  const kpi = (n: number | string, l: string) => (
    <div style={{ flex: '1 1 150px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: ACC }}>{n}</div>
      <div style={{ fontSize: 11.5, ...MUTED, marginTop: 2 }}>{l}</div>
    </div>
  )

  return (
    <div>
      <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 4 }}>Gagnants &amp; tirage</div>
      <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 18 }}>
        Les gagnants de vos lots, leurs coordonnées, et la validation du billet en caisse.
      </div>

      <div style={{ ...CARD, marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Événement</label>
        <select style={input} value={evId} onChange={e => setEvId(e.target.value)}>
          {events.length === 0 && <option value="">Aucun événement</option>}
          {events.map(e => (
            <option key={e.id} value={e.id}>{e.nom}{e.super_event_id ? ' — super event' : ''}</option>
          ))}
        </select>
        {ev?.super_event_id && (
          <div style={{ fontSize: 11.5, ...MUTED, marginTop: 8 }}>
            Cet événement fait partie d’un super event. Le tirage et les remplacements sont pilotés par Flowin.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        {kpi(gains === null ? '—' : stats.total, 'gagnants')}
        {kpi(gains === null ? '—' : stats.aRemettre, 'lots à remettre')}
        {kpi(gains === null ? '—' : stats.retires, 'lots déjà remis')}
      </div>

      {message && (
        <div style={{
          marginBottom: 14, padding: '11px 13px', borderRadius: 10, fontSize: 12.5, fontWeight: 600,
          border: `1px solid ${message.ok ? '#15803D' : '#B45309'}`, color: message.ok ? '#15803D' : '#B45309',
        }}>{message.texte}</div>
      )}

      <div style={CARD}>
        {gains === null && <div style={{ fontSize: 12.5, ...MUTED }}>Chargement…</div>}
        {gains !== null && gains.length === 0 && (
          <div style={{ fontSize: 12.5, ...MUTED }}>
            Aucun gagnant pour l’instant. Les gagnants apparaissent après le tirage.
          </div>
        )}
        {(gains ?? []).map(g => (
          <div key={g.id} style={{ borderBottom: '1px solid #F1F5F9', padding: '12px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{g.joueur}</div>
                <div style={{ fontSize: 11.5, ...MUTED }}>
                  {g.libelle ?? 'Lot'}{g.valeur ? ` · ${g.valeur} €` : ''}{g.code ? ` · ticket ${g.code}` : ''}
                </div>
                {g.email && <div style={{ fontSize: 11.5, ...MUTED }}>{g.email}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 10.5, fontWeight: 800, padding: '4px 9px', borderRadius: 99,
                  color: g.utilise ? '#15803D' : '#B45309',
                  background: g.utilise ? 'rgba(21,128,61,.09)' : 'rgba(180,83,9,.09)',
                }}>{g.utilise ? 'REMIS' : 'À REMETTRE'}</span>
                <button
                  onClick={() => { setOuvert(ouvert?.id === g.id ? null : g); setPin(''); setMessage(null) }}
                  style={{ background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 9, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >{ouvert?.id === g.id ? 'Fermer' : 'Valider'}</button>
              </div>
            </div>

            {ouvert?.id === g.id && (
              <div style={{ marginTop: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Validation en caisse</div>
                <div style={{ fontSize: 11.5, ...MUTED, marginBottom: 10 }}>
                  Saisissez votre code PIN à 4 chiffres — celui de votre fiche de retrait. Le lot est alors décompté de votre stock.
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    style={{ ...input, maxWidth: 140, letterSpacing: '.25em', textAlign: 'center', fontWeight: 800 }}
                    value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••" inputMode="numeric"
                  />
                  <button
                    disabled={pin.length !== 4 || envoi}
                    onClick={() => validerAvecPin(g)}
                    style={{
                      background: ACC, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 18px',
                      fontWeight: 800, fontSize: 13, fontFamily: 'inherit',
                      cursor: pin.length === 4 && !envoi ? 'pointer' : 'not-allowed',
                      opacity: pin.length === 4 && !envoi ? 1 : 0.45,
                    }}
                  >{envoi ? 'Vérification…' : 'Valider le billet'}</button>
                  <button
                    onClick={() => basculerManuel(g)} disabled={envoi}
                    style={{ background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '11px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  >{g.utilise ? 'Remettre en attente' : 'Marquer remis sans PIN'}</button>
                </div>
                {g.superEventId && (
                  <div style={{ fontSize: 11.5, ...MUTED, marginTop: 10 }}>
                    Gagnant injoignable ? Le remplacement se demande à Flowin — sur un super event, le tirage reste piloté par l’organisateur.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
