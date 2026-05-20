'use client'

import { useState, useMemo, useEffect } from 'react'
import { fetchProDashboard, getQrUrl, type ProDashboardData } from '@/lib/pro'
import type { FlowinEvent, FlowinJoueur, FlowinLot } from '@/lib/types'

type Tab = 'live' | 'participants' | 'lots' | 'qr' | 'export'

interface Props {
  initialData: ProDashboardData
  proId: string
  defaultEvId?: string
}

export default function ProClient({ initialData, proId, defaultEvId }: Props) {
  const [data, setData] = useState(initialData)
  const [tab, setTab] = useState<Tab>('live')
  const [selectedEvId, setSelectedEvId] = useState(
    defaultEvId ?? initialData.events[0]?.id ?? ''
  )
  const [refreshing, setRefreshing] = useState(false)
  const [tirageDone, setTirageDone] = useState(false)
  const [gagnant, setGagnant] = useState<FlowinJoueur | null>(null)

  const ev = useMemo(
    () => data.events.find(e => e.id === selectedEvId) ?? data.events[0] ?? null,
    [data.events, selectedEvId]
  )

  const evJoueurs = useMemo(
    () => data.joueurs.filter(j => j.events?.includes(selectedEvId)),
    [data.joueurs, selectedEvId]
  )

  const evLots = useMemo(
    () => data.lots.filter(l => l.event_id === selectedEvId),
    [data.lots, selectedEvId]
  )

  const stats = useMemo(() => {
    const total = evJoueurs.length
    const optins = evJoueurs.filter(j => j.optin).length
    const gagnants = evLots.filter(l => (l as unknown as { assigne_a?: string }).assigne_a).length
    const conv = total ? Math.round((optins / total) * 100) : 0
    return { total, optins, gagnants, conv }
  }, [evJoueurs, evLots])

  async function refresh() {
    if (!proId) return
    setRefreshing(true)
    const fresh = await fetchProDashboard(proId)
    setData(fresh)
    setRefreshing(false)
  }

  /* Auto-refresh toutes les 30s si event live */
  useEffect(() => {
    if (ev?.status !== 'live') return
    const t = setInterval(refresh, 30_000)
    return () => clearInterval(t)
  }, [ev?.status, proId])

  function lancerTirage() {
    const eligibles = evJoueurs.filter(j => j.ticket_code)
    if (!eligibles.length) return
    const winner = eligibles[Math.floor(Math.random() * eligibles.length)]
    setGagnant(winner)
    setTirageDone(true)
  }

  function exportCSV() {
    const rows = [
      ['Prénom', 'Nom', 'Email', 'Téléphone', 'Ville', 'Opt-in', 'Ticket', 'Date'],
      ...evJoueurs.map(j => [
        j.prenom ?? '', j.nom ?? '', j.email,
        j.tel ?? '', j.ville ?? '',
        j.optin ? 'oui' : 'non',
        j.ticket_code ?? '',
        j.first_seen ?? '',
      ]),
    ]
    const csv = '\uFEFF' + rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `flowin-${ev?.nom ?? 'export'}-${new Date().toLocaleDateString('fr-FR')}.csv`
    a.click()
  }

  const qrUrl = ev ? getQrUrl(ev) : ''

  if (!data.pro && !proId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', flexDirection: 'column', gap: 16, fontFamily: 'system-ui', padding: 24 }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Accès Pro requis</div>
        <div style={{ fontSize: 13, color: '#888', textAlign: 'center' }}>
          Ouvrez ce lien depuis votre dashboard Flowin<br />
          ou contactez votre organisateur.
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', height: '100dvh', display: 'flex', flexDirection: 'column', background: '#f4f6f9', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --teal: #1D9E75; --teal-light: #5DD4AC; --accent: #7C2D92; --bg: #f4f6f9; --card: #fff; --text: #0F172A; --muted: #64748B; --border: #E2E8F0; }
        .pro-scroll { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }
        .pro-card { background: var(--card); border-radius: 16px; padding: 16px; box-shadow: 0 2px 12px rgba(0,0,0,.06); }
        .pro-kpi { flex: 1; border-radius: 14px; padding: 14px; }
        .pro-kpi .val { font-size: 32px; font-weight: 900; line-height: 1; }
        .pro-kpi .lbl { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; margin-top: 4px; }
        .pro-kpi .sub { font-size: 10px; margin-top: 3px; }
        .nav { display: flex; background: var(--card); border-top: 1px solid var(--border); flex-shrink: 0; }
        .nav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 8px 4px; border: none; background: none; cursor: pointer; font-size: 10px; font-weight: 700; color: var(--muted); gap: 2px; }
        .nav-btn.active { color: var(--teal); }
        .nav-btn .ico { font-size: 18px; }
        .chip { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 100px; font-size: 11px; font-weight: 700; }
        .chip-live { background: rgba(34,197,94,.12); color: #15803D; }
        .chip-past { background: #f1f5f9; color: #64748B; }
        .chip-up { background: rgba(245,158,11,.1); color: #B45309; }
        .btn-teal { background: var(--teal); color: #fff; border: none; border-radius: 12px; padding: 14px; font-size: 15px; font-weight: 800; width: 100%; cursor: pointer; }
        .btn-ghost { background: none; border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 16px; font-size: 13px; font-weight: 700; color: var(--text); cursor: pointer; width: 100%; }
        .j-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--border); }
        .j-av { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, var(--teal), var(--accent)); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 12px; flex-shrink: 0; }
      `}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a2a4a, #0f172a)', padding: '16px 18px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'system-ui', fontWeight: 900, fontSize: 18, color: '#fff', letterSpacing: '-.5px' }}>
              Flow<span style={{ color: '#5DD4AC' }}>in</span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>
              {data.pro?.nom ?? 'Dashboard Pro'}
            </div>
          </div>
          {/* Sélecteur event */}
          <select
            value={selectedEvId}
            onChange={e => setSelectedEvId(e.target.value)}
            style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 8, color: '#fff', fontSize: 11, padding: '4px 8px', cursor: 'pointer', maxWidth: 160 }}
          >
            {data.events.map(ev => (
              <option key={ev.id} value={ev.id} style={{ background: '#1a2a4a' }}>
                {ev.nom.length > 20 ? ev.nom.slice(0, 18) + '…' : ev.nom}
              </option>
            ))}
          </select>
        </div>

        {ev && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.status === 'live' ? '#4ADE80' : '#94A3B8', boxShadow: ev.status === 'live' ? '0 0 8px #4ADE80' : 'none' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', fontWeight: 700 }}>
              {ev.status === 'live' ? 'EN DIRECT' : ev.status === 'upcoming' ? 'À VENIR' : 'TERMINÉ'} · {ev.lieu || 'Lieu'}
            </span>
            {refreshing && <span style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>↻</span>}
          </div>
        )}
      </div>

      {/* Contenu scrollable */}
      <div className="pro-scroll" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── TAB LIVE ── */}
        {tab === 'live' && (
          <>
            {/* KPI grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="pro-kpi" style={{ background: '#1E3A5F', color: '#fff' }}>
                <div style={{ fontSize: 14, marginBottom: 4 }}>👥</div>
                <div className="val">{stats.total}</div>
                <div className="lbl" style={{ color: 'rgba(255,255,255,.6)' }}>Participants</div>
                {ev?.status === 'live' && <div className="sub" style={{ color: '#5DD4AC' }}>↑ event en cours</div>}
              </div>
              <div className="pro-kpi" style={{ background: stats.conv >= 70 ? '#E8F8F2' : '#FFF7ED', color: stats.conv >= 70 ? '#0F6E56' : '#B45309' }}>
                <div style={{ fontSize: 14, marginBottom: 4 }}>{stats.conv >= 70 ? '✅' : '⚠️'}</div>
                <div className="val">{stats.conv}%</div>
                <div className="lbl">Conversion</div>
                <div className="sub">{stats.conv >= 70 ? 'Excellent' : stats.conv >= 50 ? 'Bon' : 'À améliorer'}</div>
              </div>
              <div className="pro-kpi" style={{ background: '#FFF8EC', color: '#B45309' }}>
                <div style={{ fontSize: 14, marginBottom: 4 }}>📋</div>
                <div className="val">{stats.optins}</div>
                <div className="lbl">RGPD Opt-in</div>
                <div className="sub">{stats.total ? stats.optins + ' inscrits' : '—'}</div>
              </div>
              <div className="pro-kpi" style={{ background: '#FFFBEC', color: '#92400E' }}>
                <div style={{ fontSize: 14, marginBottom: 4 }}>🏆</div>
                <div className="val">{stats.gagnants}</div>
                <div className="lbl">Gagnants</div>
                <div className="sub">{evLots.length} lots total</div>
              </div>
            </div>

            {/* Flux récents */}
            {evJoueurs.length > 0 && (
              <div className="pro-card">
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>
                  Derniers participants
                </div>
                {evJoueurs.slice(0, 5).map(j => (
                  <div key={j.id} className="j-row">
                    <div className="j-av">
                      {((j.prenom?.[0] ?? '') + (j.nom?.[0] ?? '')).toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{j.prenom} {j.nom}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{j.email}</div>
                    </div>
                    {j.ticket_code && (
                      <code style={{ fontSize: 10, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, color: 'var(--accent)' }}>{j.ticket_code}</code>
                    )}
                  </div>
                ))}
                {evJoueurs.length > 5 && (
                  <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                    + {evJoueurs.length - 5} autres
                  </div>
                )}
              </div>
            )}

            {/* Tirage */}
            <div className="pro-card">
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>
                Tirage au sort
              </div>
              {tirageDone && gagnant ? (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
                  <div style={{ fontFamily: 'system-ui', fontWeight: 900, fontSize: 20, marginBottom: 4 }}>
                    {gagnant.prenom} {gagnant.nom}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>{gagnant.email}</div>
                  {gagnant.ticket_code && (
                    <code style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', background: 'rgba(124,45,146,.08)', padding: '4px 12px', borderRadius: 8 }}>
                      {gagnant.ticket_code}
                    </code>
                  )}
                  <button className="btn-ghost" style={{ marginTop: 12 }} onClick={() => { setTirageDone(false); setGagnant(null) }}>
                    Relancer le tirage
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
                    {evJoueurs.filter(j => j.ticket_code).length} participants éligibles
                  </div>
                  <button
                    className="btn-teal"
                    onClick={lancerTirage}
                    disabled={evJoueurs.filter(j => j.ticket_code).length === 0}
                  >
                    🎰 Lancer le tirage
                  </button>
                </>
              )}
            </div>

            <button className="btn-ghost" onClick={refresh} disabled={refreshing}>
              {refreshing ? '↻ Actualisation…' : '↻ Actualiser les données'}
            </button>
          </>
        )}

        {/* ── TAB PARTICIPANTS ── */}
        {tab === 'participants' && (
          <div className="pro-card">
            <div style={{ fontWeight: 800, marginBottom: 12 }}>
              {evJoueurs.length} participant{evJoueurs.length > 1 ? 's' : ''}
            </div>
            {evJoueurs.length === 0 && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>Aucun participant</div>
            )}
            {evJoueurs.map(j => (
              <div key={j.id} className="j-row">
                <div className="j-av">
                  {((j.prenom?.[0] ?? '') + (j.nom?.[0] ?? '')).toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{j.prenom} {j.nom}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{j.email}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                  {j.ticket_code && <code style={{ fontSize: 10, background: '#f1f5f9', padding: '1px 5px', borderRadius: 3, color: 'var(--accent)' }}>{j.ticket_code}</code>}
                  {j.optin && <span style={{ fontSize: 9, background: 'rgba(29,158,117,.1)', color: 'var(--teal)', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>opt-in</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB LOTS ── */}
        {tab === 'lots' && (
          <div className="pro-card">
            <div style={{ fontWeight: 800, marginBottom: 12 }}>
              {evLots.length} lot{evLots.length > 1 ? 's' : ''}
            </div>
            {evLots.length === 0 && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>Aucun lot configuré</div>
            )}
            {evLots.map(l => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 28 }}>{l.emoji ?? '🎁'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{l.titre || l.nom}</div>
                  {l.valeur ? <div style={{ fontSize: 11, color: 'var(--muted)' }}>{l.valeur} €</div> : null}
                </div>
                {(l as FlowinLot & { retire?: boolean }).retire
                  ? <span style={{ fontSize: 10, background: 'rgba(34,197,94,.1)', color: '#15803D', padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>Retiré ✓</span>
                  : <span style={{ fontSize: 10, background: '#f1f5f9', color: 'var(--muted)', padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>Disponible</span>
                }
              </div>
            ))}
          </div>
        )}

        {/* ── TAB QR ── */}
        {tab === 'qr' && ev && (
          <div style={{ textAlign: 'center' }}>
            <div className="pro-card" style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12 }}>
                QR Code de participation
              </div>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrUrl)}`}
                alt="QR Code"
                style={{ width: 240, height: 240, borderRadius: 12, display: 'block', margin: '0 auto 14px' }}
              />
              <div style={{ fontSize: 11, wordBreak: 'break-all', color: 'var(--muted)', background: '#f8fafc', padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>
                {qrUrl}
              </div>
              <button className="btn-teal" onClick={() => navigator.clipboard?.writeText(qrUrl)}>
                📋 Copier le lien
              </button>
            </div>
            <div className="pro-card">
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>
                Partager
              </div>
              <a
                href={`https://wa.me/?text=${encodeURIComponent('Participez à ' + ev.nom + ' : ' + qrUrl)}`}
                target="_blank" rel="noopener"
                style={{ display: 'block', background: '#25D366', color: '#fff', borderRadius: 10, padding: '12px', fontWeight: 800, fontSize: 14, textDecoration: 'none', marginBottom: 8 }}
              >
                📲 WhatsApp
              </a>
              <a
                href={`sms:?body=${encodeURIComponent('Participez à ' + ev.nom + ' : ' + qrUrl)}`}
                style={{ display: 'block', background: '#007AFF', color: '#fff', borderRadius: 10, padding: '12px', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}
              >
                💬 SMS
              </a>
            </div>
          </div>
        )}

        {/* ── TAB EXPORT ── */}
        {tab === 'export' && (
          <div className="pro-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📥</div>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Export CSV</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              {evJoueurs.length} participants · {evJoueurs.filter(j => j.optin).length} opt-in
            </div>
            <button className="btn-teal" onClick={exportCSV} disabled={evJoueurs.length === 0}>
              ↓ Télécharger le CSV
            </button>
            {evJoueurs.length === 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>Aucun participant à exporter</div>
            )}
          </div>
        )}
      </div>

      {/* Navigation bottom */}
      <nav className="nav">
        {([
          { id: 'live',         icon: '📊', label: 'Stats' },
          { id: 'participants', icon: '👥', label: 'Participants' },
          { id: 'lots',        icon: '🎁', label: 'Lots' },
          { id: 'qr',          icon: '📱', label: 'QR' },
          { id: 'export',      icon: '📥', label: 'Export' },
        ] as { id: Tab; icon: string; label: string }[]).map(t => (
          <button
            key={t.id}
            className={`nav-btn${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="ico">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
