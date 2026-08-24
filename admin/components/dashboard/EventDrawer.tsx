'use client'

import { useState, useMemo, useEffect } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { upsertEvent, deleteEvent, fetchEventParticipants, fetchGagnants, type GagnantRow } from '@/lib/dashboard'
import { DrawerTabs, FieldRow, SectionHeader, StatusChip, ModuleChip } from './DashboardUI'
import type { FlowinEvent, FlowinJoueur, FlowinPartenaire } from '@/lib/types'

function fmt(d?: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('fr-FR')
}

export default function EventDrawer() {
  const { drawer, closeDrawer, setDrawerTab, events, setEvents, pros, lots, partenaires, openDrawer } = useDashboard()
  const [edit, setEdit] = useState(drawer.edit)
  const [form, setForm] = useState<Partial<FlowinEvent>>({})
  const [saving, setSaving] = useState(false)
  const [participants, setParticipants] = useState<FlowinJoueur[]>([])
  const [loadingPart, setLoadingPart] = useState(false)

  const ev = useMemo(() => events.find(x => x.id === drawer.id), [events, drawer.id])

  useEffect(() => {
    if (drawer.tab === 'participants' && ev && participants.length === 0) {
      setLoadingPart(true)
      fetchEventParticipants(ev.id).then(rows => {
        setParticipants(rows)
        setLoadingPart(false)
      })
    }
  }, [drawer.tab, ev])

  if (!ev) return (
    <div className="sa-drawer-empty">
      <button className="sa-drawer-close" onClick={closeDrawer}>×</button>
      <div>Event introuvable</div>
    </div>
  )

  const pro = pros.find(p => p.id === ev.pro_id)
  const evLots = lots.filter(l => l.event_id === ev.id)
  const [gagnants, setGagnants] = useState<GagnantRow[]>([])
  useEffect(() => {
    if (!pro?.partenaire_id) { setGagnants([]); return }
    let on = true
    fetchGagnants().then(all => { if (on) setGagnants(all.filter(g => g.partenaire_id === pro.partenaire_id)) })
    return () => { on = false }
  }, [pro?.partenaire_id])
  const evParts = ((ev.cfg?.partenaires ?? []) as string[]).map((id: string) => partenaires.find(p => p.id === id)).filter((x): x is FlowinPartenaire => !!x)
  const qrUrl = `https://flowin-events.vercel.app/parcours/${ev.module}?ev=${ev.id}`

  function enterEdit() { setForm({ ...ev }); setEdit(true) }

  async function save() {
    setSaving(true)
    const ok = await upsertEvent({ ...form, id: ev.id })
    if (ok) setEvents(events.map(x => x.id === ev.id ? { ...x, ...form } as FlowinEvent : x))
    setSaving(false)
    setEdit(false)
  }

  async function del() {
    if (!confirm(`Supprimer l'event "${ev.nom}" ? Action irréversible.`)) return
    await deleteEvent(ev.id)
    setEvents(events.filter(x => x.id !== ev.id))
    closeDrawer()
  }

  const f = (k: keyof FlowinEvent) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const tabs = [
    { id: 'infos', label: 'Infos' },
    { id: 'stats', label: 'Stats' },
    { id: 'participants', label: 'Participants', badge: ev.participants },
    { id: 'lots', label: 'Lots', badge: gagnants.length || evLots.length },
    { id: 'qr', label: 'QR' },
    { id: 'export', label: 'Export' },
  ]

  return (
    <>
      <div className="sa-drawer-h">
        <div>
          <div className="sa-drawer-title">📅 {ev.nom}</div>
          <div className="sa-drawer-sub" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusChip status={ev.status} />
            <ModuleChip module={ev.module} />
            <span>{pro?.nom ?? '-'}</span>
          </div>
        </div>
        <button className="sa-drawer-close" onClick={closeDrawer}>×</button>
      </div>

      <DrawerTabs tabs={tabs} active={drawer.tab} onSelect={setDrawerTab} />

      <div className="sa-drawer-body">
        {drawer.tab === 'infos' && !edit && (
          <>
            <FieldRow label="Nom" value={ev.nom} />
            <FieldRow label="Module" value={<ModuleChip module={ev.module} />} />
            <FieldRow label="Statut" value={<StatusChip status={ev.status} />} />
            <FieldRow label="Pro" value={pro?.nom ?? '-'} />
            <FieldRow label="Date début" value={fmt(ev.date_d)} />
            <FieldRow label="Date fin" value={fmt(ev.date_f)} />
            <FieldRow label="Lieu" value={ev.lieu} />
            <FieldRow label="Couleur" value={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: ev.couleur }} />
                <code className="sa-code">{ev.couleur}</code>
              </div>
            } />
            <SectionHeader>Partenaires ({evParts.length})</SectionHeader>
            {evParts.map(p => p && (
              <div key={p.id} className="sa-list-item">
                <span>{p.emoji ?? '🤝'}</span>
                <span>{p.nom}</span>
              </div>
            ))}
          </>
        )}

        {drawer.tab === 'infos' && edit && (
          <>
            <div className="sa-alert info">✏️ Mode édition</div>
            <div className="sa-field">
              <label className="sa-label">Nom</label>
              <input className="sa-input" value={form.nom ?? ''} onChange={f('nom')} />
            </div>
            <div className="sa-field">
              <label className="sa-label">Statut</label>
              <select className="sa-input" value={form.status ?? 'upcoming'} onChange={f('status')}>
                <option value="upcoming">À venir</option>
                <option value="live">En cours</option>
                <option value="past">Passé</option>
              </select>
            </div>
            <div className="sa-field">
              <label className="sa-label">Lieu</label>
              <input className="sa-input" value={form.lieu ?? ''} onChange={f('lieu')} />
            </div>
            <div className="sa-field">
              <label className="sa-label">Date début</label>
              <input className="sa-input" type="date" value={form.date_d ?? ''} onChange={f('date_d')} />
            </div>
            <div className="sa-field">
              <label className="sa-label">Date fin</label>
              <input className="sa-input" type="date" value={form.date_f ?? ''} onChange={f('date_f')} />
            </div>
            <div className="sa-field">
              <label className="sa-label">Couleur</label>
              <input className="sa-input" type="color" value={form.couleur ?? '#7C2D92'} onChange={f('couleur')} />
            </div>
            <div className="sa-field">
              <label className="sa-label">Description</label>
              <textarea className="sa-input" value={form.description ?? ''} onChange={f('description')} rows={3} />
            </div>
          </>
        )}

        {drawer.tab === 'stats' && (
          <div className="sa-kpi-grid-2">
            <div className="sa-kpi"><div className="sa-kpi-val">{ev.participants}</div><div className="sa-kpi-lbl">Participants</div></div>
            <div className="sa-kpi"><div className="sa-kpi-val">{ev.joueurs_optin}</div><div className="sa-kpi-lbl">Opt-in</div></div>
            <div className="sa-kpi"><div className="sa-kpi-val">{gagnants.length || ev.gagnants}</div><div className="sa-kpi-lbl">Gagnants</div></div>
            <div className="sa-kpi"><div className="sa-kpi-val">{gagnants.length || evLots.length}</div><div className="sa-kpi-lbl">Lots</div></div>
          </div>
        )}

        {drawer.tab === 'participants' && (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div className="sa-kpi-mini">{participants.length} <span>total</span></div>
              <div className="sa-kpi-mini">{participants.filter(j => j.optin).length} <span>opt-in</span></div>
              <div className="sa-kpi-mini">{participants.filter(j => !j.optin).length} <span>sans opt-in</span></div>
            </div>
            {loadingPart && <div className="sa-loading">Chargement…</div>}
            {!loadingPart && participants.length === 0 && <div className="sa-empty-inline">Aucun participant</div>}
            {participants.map(p => (
              <div key={p.id} className="sa-list-item" onClick={() => openDrawer('joueur', p.id)} style={{ cursor: 'pointer' }}>
                <div className="sa-avatar-sm">{((p.prenom?.[0] ?? '') + (p.nom?.[0] ?? '')).toUpperCase() || '?'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{p.prenom} {p.nom}</div>
                  <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>{p.email}</div>
                </div>
                {p.ticket_code && <code className="sa-code">{p.ticket_code}</code>}
                {p.optin && <span className="sa-chip live">opt-in</span>}
              </div>
            ))}
          </>
        )}

        {drawer.tab === 'lots' && (
          <>
            {pro?.partenaire_id ? (
              <>
                <div
                  onClick={() => openDrawer('partenaire', pro.partenaire_id as string)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--sa-subtle)', borderRadius: 10, padding: '10px 12px', marginBottom: 12, cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}
                >
                  🤝 Voir la fiche partenaire complète (billets, facture, com) →
                </div>
                <SectionHeader>{gagnants.length} gagnant{gagnants.length > 1 ? 's' : ''}</SectionHeader>
                {gagnants.length === 0 && <div className="sa-empty-inline">Aucun gagnant</div>}
                {gagnants.map(g => (
                  <a
                    key={g.id}
                    className="sa-list-item"
                    href={g.retrait_token ? `https://flowin-events.vercel.app/lot.html?t=${g.retrait_token}` : undefined}
                    target="_blank" rel="noreferrer"
                    style={{ textDecoration: 'none', color: 'inherit', cursor: g.retrait_token ? 'pointer' : 'default' }}
                  >
                    <span style={{ fontSize: 22 }}>🎁</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{g.joueur_nom ?? '—'} — {g.lot_nom ?? '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>{g.lot_valeur != null ? `${g.lot_valeur} €` : ''}{g.retrait_token ? ' · voir le billet' : ''}</div>
                    </div>
                    <span className={`sa-chip${g.statut === 'retire' ? ' live' : ''}`}>{g.statut === 'retire' ? 'Retiré' : 'Actif'}</span>
                  </a>
                ))}
              </>
            ) : (
              <>
                <SectionHeader>{evLots.length} lot{evLots.length > 1 ? 's' : ''}</SectionHeader>
                {evLots.length === 0 && <div className="sa-empty-inline">Aucun lot</div>}
                {evLots.map(l => (
                  <div key={l.id} className="sa-list-item">
                    <span style={{ fontSize: 22 }}>{l.emoji ?? '🎁'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{l.titre || l.nom}</div>
                      <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>{l.valeur} €</div>
                    </div>
                    {l.retire && <span className="sa-chip live">Retiré</span>}
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {drawer.tab === 'qr' && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: 'var(--sa-muted)' }}>QR CODE D&apos;ACCÈS</div>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
              alt="QR Code"
              style={{ width: 200, height: 200, margin: '0 auto', display: 'block', borderRadius: 12, border: '1px solid var(--sa-border)' }}
            />
            <div style={{ marginTop: 16, fontSize: 12, background: 'var(--sa-subtle)', padding: '8px 12px', borderRadius: 8, wordBreak: 'break-all' }}>
              {qrUrl}
            </div>
            <button className="sa-btn" style={{ marginTop: 12 }} onClick={() => navigator.clipboard?.writeText(qrUrl)}>
              📋 Copier le lien
            </button>
            {pro && (
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--sa-border)', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div
                  onClick={() => openDrawer('pro', pro.id, 'qrliens')}
                  style={{ background: 'var(--sa-subtle)', border: '1px solid var(--sa-border)', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}
                >
                  📱 QR multi-stations & liens à usage unique <span>→</span>
                </div>
                <a
                  href="/dashboard/nds-comm" target="_blank" rel="noreferrer"
                  style={{ background: 'var(--sa-subtle)', border: '1px solid var(--sa-border)', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, fontWeight: 700, display: 'flex', justifyContent: 'space-between', textDecoration: 'none', color: 'inherit' }}
                >
                  🖼️ Logo, kit com et visuels du partenaire <span>→</span>
                </a>
              </div>
            )}
          </div>
        )}

        {drawer.tab === 'export' && (
          <div style={{ padding: '0 4px' }}>
            <SectionHeader>Exports disponibles</SectionHeader>
            {[
              { label: '👥 Joueurs (CSV)', desc: `${participants.length} participants`, fn: () => telechargerCsv(`joueurs-${ev.id}.csv`, participants, ['prenom', 'nom', 'email', 'ticket_code', 'optin']) },
              { label: '✅ Opt-in (CSV)', desc: `${participants.filter(j => j.optin).length} contacts`, fn: () => telechargerCsv(`optin-${ev.id}.csv`, participants.filter(j => j.optin), ['prenom', 'nom', 'email']) },
              { label: '🎁 Gagnants (CSV)', desc: `${gagnants.length} gagnants`, fn: () => telechargerCsv(`gagnants-${ev.id}.csv`, gagnants, ['joueur_nom', 'joueur_email', 'lot_nom', 'lot_valeur', 'statut']) },
            ].map(item => (
              <div key={item.label} className="sa-list-item" style={{ cursor: 'pointer' }} onClick={item.fn}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>{item.desc}</div>
                </div>
                <span className="sa-btn" style={{ fontSize: 12, padding: '4px 10px' }}>↓</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sa-drawer-footer">
        {edit ? (
          <>
            <button className="sa-btn danger-ghost" onClick={del}>🗑 Supprimer</button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="sa-btn" onClick={() => setEdit(false)}>Annuler</button>
              <button className="sa-btn primary" onClick={save} disabled={saving}>
                {saving ? 'Enregistrement…' : '✓ Enregistrer'}
              </button>
            </div>
          </>
        ) : (
          <>
            <button className="sa-btn danger-ghost" onClick={del}>🗑 Supprimer</button>
            <button className="sa-btn primary" onClick={enterEdit}>✏ Éditer</button>
          </>
        )}
      </div>
    </>
  )
}

/** Genere un CSV en memoire et declenche son telechargement -- aucun backend requis. */
function telechargerCsv<T extends object>(nomFichier: string, lignes: T[], colonnes: (keyof T)[]) {
  const entete = colonnes.join(';')
  const corps = lignes.map(l => colonnes.map(c => {
    const v = l[c]
    const s = v == null ? '' : String(v)
    return s.includes(';') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
  }).join(';')).join('\n')
  const blob = new Blob(['\uFEFF' + entete + '\n' + corps], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = nomFichier
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
