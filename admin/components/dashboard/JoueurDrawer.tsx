'use client'

import { useState, useMemo, useEffect } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { updateJoueur, deleteJoueur, fetchJoueurTicketsGains, type SeTicketRow, type SeGainRow } from '@/lib/dashboard'
import { DrawerTabs, FieldRow, SectionHeader, StatusChip } from './DashboardUI'
import type { FlowinJoueur } from '@/lib/types'

function fmt(d?: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('fr-FR')
}

export default function JoueurDrawer() {
  const { drawer, closeDrawer, setDrawerTab, joueurs, setJoueurs, events, lots } = useDashboard()
  const [edit, setEdit] = useState(drawer.edit)
  const [form, setForm] = useState<Partial<FlowinJoueur>>({})
  const [saving, setSaving] = useState(false)
  const [seTickets, setSeTickets] = useState<SeTicketRow[]>([])
  const [seGains, setSeGains] = useState<SeGainRow[]>([])

  const j = useMemo(() => joueurs.find(x => x.id === drawer.id), [joueurs, drawer.id])

  useEffect(() => {
    if (!drawer.id) return
    let on = true
    fetchJoueurTicketsGains(drawer.id).then(r => { if (on) { setSeTickets(r.tickets); setSeGains(r.gains) } })
    return () => { on = false }
  }, [drawer.id])

  if (!j) return (
    <div className="sa-drawer-empty">
      <button className="sa-drawer-close" onClick={closeDrawer}>×</button>
      <div>Joueur introuvable</div>
    </div>
  )

  const joueurEvents = (j.events ?? []).map(eid => events.find(e => e.id === eid)).filter(Boolean)
  const joueurLots   = lots.filter(l => (l as unknown as { assigne_a: string }).assigne_a === j.id)
  const ticketsByEvent = Array.from(
    seTickets.reduce((m, t) => { if (t.event_id) m.set(t.event_id, (m.get(t.event_id) || 0) + 1); return m }, new Map<string, number>())
  )

  function enterEdit() {
    setForm({ ...j })
    setEdit(true)
  }

  async function save() {
    if (!j) return
    setSaving(true)
    const ok = await updateJoueur(j.id, form)
    if (ok) {
      setJoueurs(joueurs.map(x => x.id === j.id ? { ...x, ...form } as FlowinJoueur : x))
    }
    setSaving(false)
    setEdit(false)
  }

  async function del() {
    if (!confirm(`Supprimer ${j.prenom} ${j.nom} ? Action irréversible.`)) return
    await deleteJoueur(j.id)
    setJoueurs(joueurs.filter(x => x.id !== j.id))
    closeDrawer()
  }

  const f = (k: keyof FlowinJoueur) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const tabs = [
    { id: 'infos', label: 'Infos' },
    { id: 'events', label: 'Events', badge: joueurEvents.length },
    { id: 'lots', label: 'Lots', badge: joueurLots.length },
    { id: 'se', label: 'Tickets', badge: seTickets.length },
  ]

  const initials = ((j.prenom?.[0] ?? '') + (j.nom?.[0] ?? '')).toUpperCase() || '?'

  return (
    <>
      <div className="sa-drawer-h">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="sa-avatar">{initials}</div>
          <div>
            <div className="sa-drawer-title">{j.prenom} {j.nom}</div>
            <div className="sa-drawer-sub">{j.email} · {j.optin ? '✅ Opt-in' : '⭕ No opt-in'}</div>
          </div>
        </div>
        <button className="sa-drawer-close" onClick={closeDrawer}>×</button>
      </div>

      <DrawerTabs tabs={tabs} active={drawer.tab} onSelect={setDrawerTab} />

      <div className="sa-drawer-body">
        {drawer.tab === 'infos' && !edit && (
          <>
            <FieldRow label="Prénom" value={j.prenom} />
            <FieldRow label="Nom" value={j.nom} />
            <FieldRow label="Email" value={<a href={`mailto:${j.email}`}>{j.email}</a>} />
            <FieldRow label="Téléphone" value={j.tel ? <a href={`tel:${j.tel}`}>{j.tel}</a> : '-'} />
            <FieldRow label="Ville" value={j.ville} />
            <FieldRow label="Code postal" value={j.code_postal} />
            <SectionHeader>Participation</SectionHeader>
            <FieldRow label="Ticket" value={j.ticket_code ? <code className="sa-code">{j.ticket_code}</code> : '-'} />
            <FieldRow label="Score" value={j.score_moy ?? '-'} />
            <FieldRow label="Gains" value={j.gains ?? 0} />
            <FieldRow label="Opt-in" value={j.optin ? '✅ Oui' : 'Non'} />
            <FieldRow label="Première visite" value={fmt(j.first_seen)} />
            <FieldRow label="Dernière visite" value={fmt(j.last_seen)} />
            <FieldRow label="Source" value={j.source} />
          </>
        )}

        {drawer.tab === 'infos' && edit && (
          <>
            <div className="sa-alert info">✏️ Mode édition</div>
            {(['prenom', 'nom', 'tel', 'ville', 'code_postal'] as (keyof FlowinJoueur)[]).map(k => (
              <div key={k} className="sa-field">
                <label className="sa-label">{k}</label>
                <input className="sa-input" value={(form[k] as string) ?? ''} onChange={f(k)} />
              </div>
            ))}
            <div className="sa-field">
              <label className="sa-label">Opt-in</label>
              <select className="sa-input" value={form.optin ? '1' : '0'}
                onChange={e => setForm(p => ({ ...p, optin: e.target.value === '1' }))}>
                <option value="1">Oui</option>
                <option value="0">Non</option>
              </select>
            </div>
          </>
        )}

        {drawer.tab === 'events' && (
          <>
            <SectionHeader>{joueurEvents.length} event{joueurEvents.length > 1 ? 's' : ''}</SectionHeader>
            {joueurEvents.length === 0 && <div className="sa-empty-inline">Aucun event</div>}
            {joueurEvents.map(ev => ev && (
              <div key={ev.id} className="sa-list-item">
                <div style={{ fontWeight: 700 }}>{ev.nom}</div>
                <StatusChip status={ev.status} />
              </div>
            ))}
          </>
        )}

        {drawer.tab === 'lots' && (
          <>
            <SectionHeader>{joueurLots.length} lot{joueurLots.length > 1 ? 's' : ''} gagné{joueurLots.length > 1 ? 's' : ''}</SectionHeader>
            {joueurLots.length === 0 && <div className="sa-empty-inline">Aucun lot gagné</div>}
            {joueurLots.map(l => (
              <div key={l.id} className="sa-list-item">
                <span style={{ fontSize: 20 }}>{l.emoji ?? '🎁'}</span>
                <div>{l.titre || l.nom} — {l.valeur} €</div>
              </div>
            ))}
          </>
        )}

        {drawer.tab === 'se' && (
          <>
            <SectionHeader>{seTickets.length} ticket{seTickets.length > 1 ? 's' : ''} Super Event</SectionHeader>
            {ticketsByEvent.length === 0 && <div className="sa-empty-inline">Aucun ticket Super Event</div>}
            {ticketsByEvent.map(([eid, n]) => {
              const ev = events.find(e => e.id === eid)
              return (
                <div key={eid} className="sa-list-item">
                  <span style={{ fontSize: 18 }}>🎟️</span>
                  <div style={{ flex: 1 }}>{ev?.nom ?? eid}</div>
                  <strong>{n}</strong>
                </div>
              )
            })}

            <SectionHeader>{seGains.length} gain{seGains.length > 1 ? 's' : ''} immédiat{seGains.length > 1 ? 's' : ''}</SectionHeader>
            {seGains.length === 0 && <div className="sa-empty-inline">Aucun gain immédiat</div>}
            {seGains.map(g => (
              <div key={g.id} className="sa-list-item">
                <span style={{ fontSize: 18 }}>🎁</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{g.libelle ?? 'Lot'}</div>
                  {g.code && <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>{g.code}</div>}
                </div>
                {g.utilise
                  ? <span className="sa-chip">Utilisé</span>
                  : <span className="sa-chip live">À récupérer</span>}
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
