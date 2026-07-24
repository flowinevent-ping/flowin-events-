'use client'

import { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { upsertPro, deletePro } from '@/lib/dashboard'
import { DrawerTabs, FieldRow, SectionHeader, StatusChip, ModuleChip } from './DashboardUI'
import { TableauStations } from './TableauStations'
import type { FlowinPro } from '@/lib/types'

export default function ProDrawer() {
  const { drawer, closeDrawer, setDrawerTab, pros, setPros, events } = useDashboard()
  const [edit, setEdit] = useState(drawer.edit)
  const [form, setForm] = useState<Partial<FlowinPro>>({})
  const [saving, setSaving] = useState(false)

  const p = useMemo(() => pros.find(x => x.id === drawer.id), [pros, drawer.id])

  if (!p) return (
    <div className="sa-drawer-empty">
      <button className="sa-drawer-close" onClick={closeDrawer}>×</button>
      <div>Pro introuvable</div>
    </div>
  )

  const proEvents = events.filter(e => e.pro_id === p.id)
  const liveEvents = proEvents.filter(e => e.status === 'live')

  function enterEdit() { setForm({ ...p }); setEdit(true) }

  function ff(k: keyof FlowinPro) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))
  }

  async function save() {
    setSaving(true)
    const ok = await upsertPro({ ...form, id: p.id })
    if (ok) setPros(pros.map(x => x.id === p.id ? { ...x, ...form } as FlowinPro : x))
    setSaving(false)
    setEdit(false)
  }

  async function del() {
    if (!confirm(`Supprimer le pro « ${p.nom} » ?`)) return
    await deletePro(p.id)
    setPros(pros.filter(x => x.id !== p.id))
    closeDrawer()
  }

  const tabs = [
    { id: 'infos', label: 'Infos' },
    { id: 'events', label: 'Events', badge: proEvents.length },
    { id: 'tracking', label: 'Tracking' },
  ]

  const initials = p.nom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      <div className="sa-drawer-h">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="sa-avatar">{initials}</div>
          <div>
            <div className="sa-drawer-title">🏢 {p.nom}</div>
            <div className="sa-drawer-sub">{p.ville} · {p.secteur}</div>
          </div>
        </div>
        <button className="sa-drawer-close" onClick={closeDrawer}>×</button>
      </div>

      <DrawerTabs tabs={tabs} active={drawer.tab} onSelect={setDrawerTab} />

      <div className="sa-drawer-body">
        {drawer.tab === 'infos' && !edit && (
          <>
            <FieldRow label="Nom" value={<strong>{p.nom}</strong>} />
            <FieldRow label="Secteur" value={p.secteur} />
            <FieldRow label="Ville" value={p.ville} />
            <FieldRow label="Code postal" value={p.code_postal} />
            <FieldRow label="Adresse" value={p.adresse} />
            <FieldRow label="SIRET" value={p.siret ? <code className="sa-code">{p.siret}</code> : '-'} />
            <SectionHeader>Contact</SectionHeader>
            <FieldRow label="Nom" value={p.contact} />
            <FieldRow label="Rôle" value={p.role_contact} />
            <FieldRow label="Email" value={p.email ? <a href={`mailto:${p.email}`}>{p.email}</a> : '-'} />
            <FieldRow label="Téléphone" value={p.tel ? <a href={`tel:${p.tel}`}>{p.tel}</a> : '-'} />
            <SectionHeader>Notes</SectionHeader>
            <div className="sa-text-block">{p.notes || '-'}</div>
          </>
        )}

        {drawer.tab === 'infos' && edit && (
          <>
            <div className="sa-alert info">✏️ Mode édition</div>
            {(['nom', 'secteur', 'ville', 'code_postal', 'adresse', 'siret'] as (keyof FlowinPro)[]).map(k => (
              <div key={k} className="sa-field">
                <label className="sa-label">{k.replace(/_/g, ' ')}</label>
                <input className="sa-input" value={form[k] as string ?? ''} onChange={ff(k)} />
              </div>
            ))}
            <SectionHeader>Contact</SectionHeader>
            {(['contact', 'role_contact', 'email', 'tel'] as (keyof FlowinPro)[]).map(k => (
              <div key={k} className="sa-field">
                <label className="sa-label">{k.replace(/_/g, ' ')}</label>
                <input className="sa-input" value={form[k] as string ?? ''} onChange={ff(k)} />
              </div>
            ))}
            <div className="sa-field">
              <label className="sa-label">Notes</label>
              <textarea className="sa-input" rows={3} value={form.notes ?? ''} onChange={ff('notes')} />
            </div>
          </>
        )}

        {drawer.tab === 'tracking' && (
          <>
            <SectionHeader>📡 Tracking de ses stations</SectionHeader>
            <TableauStations proId={p.id} titre={`Stations de ${p.nom}`} />
          </>
        )}

        {drawer.tab === 'events' && (
          <>
            {liveEvents.length > 0 && (
              <div className="sa-alert live">🔴 {liveEvents.length} event{liveEvents.length > 1 ? 's' : ''} en cours</div>
            )}
            <SectionHeader>{proEvents.length} event{proEvents.length > 1 ? 's' : ''}</SectionHeader>
            {proEvents.length === 0 && <div className="sa-empty-inline">Aucun event</div>}
            {proEvents.map(ev => (
              <div key={ev.id} className="sa-list-item">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{ev.nom}</div>
                  <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>{ev.date_d ?? '-'}</div>
                </div>
                <StatusChip status={ev.status} />
                <ModuleChip module={ev.module} />
              </div>
            ))}
          </>
        )}
      </div>

      <div className="sa-drawer-footer">
        {edit ? (
          <>
            <button className="sa-btn danger-ghost" onClick={del}>🗑 Supprimer</button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="sa-btn" onClick={() => setEdit(false)}>Annuler</button>
              <button className="sa-btn primary" onClick={save} disabled={saving}>{saving ? '…' : '✓ Enregistrer'}</button>
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
