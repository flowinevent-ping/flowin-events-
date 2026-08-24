'use client'

import { useState, useMemo, useEffect } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import {
  upsertPro, deletePro,
  fetchQrStations, creerQrStation, publierQrStation,
  fetchLiensEphemeres, creerLienEphemere, publierLienEphemere,
  type QrStation, type LienEphemere,
} from '@/lib/dashboard'
import { DrawerTabs, FieldRow, SectionHeader, StatusChip, ModuleChip } from './DashboardUI'
import { TableauStations } from './TableauStations'
import type { FlowinPro } from '@/lib/types'

export default function ProDrawer() {
  const { drawer, closeDrawer, setDrawerTab, pros, setPros, events, openDrawer } = useDashboard()
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
    { id: 'qrliens', label: 'QR & Liens' },
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

      {p.partenaire_id && (
        <div
          onClick={() => openDrawer('partenaire', p.partenaire_id as string)}
          style={{ margin: '0 20px 14px', background: 'var(--sa-subtle)', border: '1px solid var(--sa-border)', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span style={{ fontSize: 12.5, fontWeight: 700 }}>🤝 Fiche partenaire liée — logo, kit com, billets, facture</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--sa-accent)' }}>Ouvrir →</span>
        </div>
      )}

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

        {drawer.tab === 'qrliens' && (
          <>
            <p className="sa-muted" style={{ fontSize: 11.5, marginBottom: 14 }}>
              Généré et publié par vous — le pro n&apos;y accède qu&apos;une fois « Publié » activé.
            </p>
            {proEvents.length === 0 && <div className="sa-empty-inline">Aucun event pour ce pro</div>}
            {proEvents.map(ev => <QrLiensEvent key={ev.id} eventId={ev.id} eventNom={ev.nom} />)}
          </>
        )}

        {drawer.tab === 'tracking' && (
          <>
            <SectionHeader>📡 Tracking de ses stations</SectionHeader>
            <TableauStations proId={p.id} titre={`Stations de ${p.nom}`} onStation={s => openDrawer('event', s.event_id)} />
          </>
        )}

        {drawer.tab === 'events' && (
          <>
            {liveEvents.length > 0 && (
              <div className="sa-alert live">🔴 {liveEvents.length} event{liveEvents.length > 1 ? 's' : ''} en cours</div>
            )}
            <SectionHeader>{proEvents.length} event{proEvents.length > 1 ? 's' : ''}</SectionHeader>
            <div className="sa-muted" style={{ fontSize: 11.5, marginBottom: 8 }}>Toucher un event ouvre sa fiche détaillée : stations, participants et gagnants.</div>
            {proEvents.length === 0 && <div className="sa-empty-inline">Aucun event</div>}
            {proEvents.map(ev => (
              <div key={ev.id} className="sa-list-item" onClick={() => openDrawer('event', ev.id, 'stats')} style={{ cursor: 'pointer' }}>
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

/** Bloc QR stations + liens ephemeres pour un event donne, dans l'onglet QR & Liens de la fiche Pro. */
function QrLiensEvent({ eventId, eventNom }: { eventId: string; eventNom: string }) {
  const [stations, setStations] = useState<QrStation[]>([])
  const [liens, setLiens] = useState<LienEphemere[]>([])
  const [nomStation, setNomStation] = useState('')
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
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--sa-border)' }}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(qrUrl(s.source_qr))}`} alt="" width={44} height={44} style={{ borderRadius: 6, border: '1px solid var(--sa-border)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 12.5 }}>{s.nom}</div>
            <div style={{ fontSize: 10.5, color: 'var(--sa-muted)' }}>?source={s.source_qr}</div>
          </div>
          <button className="sa-btn sm" onClick={() => navigator.clipboard?.writeText(qrUrl(s.source_qr))}>Copier</button>
          <button className={`sa-btn sm${s.publie ? ' primary' : ''}`} onClick={() => publierQrStation(s.id, !s.publie).then(charger)}>
            {s.publie ? '✓ Publié' : 'Publier'}
          </button>
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
