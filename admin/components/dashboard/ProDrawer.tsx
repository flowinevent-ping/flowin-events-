'use client'

import { useState, useMemo, useEffect } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { upsertPro, deletePro } from '@/lib/dashboard'
import { DrawerTabs, FieldRow, SectionHeader } from './DashboardUI'
import { fetchSuperEvents, type SuperEvent } from '@/lib/nds'
import { grouperOperations } from '@/lib/operations'
import { OngletOperationsSA, ONGLETS_FICHE } from '@/components/operations/BlocsOperations'
import type { FlowinPro } from '@/lib/types'
import ActionsFichePro from './ActionsFichePro'

export default function ProDrawer() {
  const { drawer, closeDrawer, setDrawerTab, pros, setPros, events, openDrawer } = useDashboard()
  const [edit, setEdit] = useState(drawer.edit)
  const [form, setForm] = useState<Partial<FlowinPro>>({})
  const [saving, setSaving] = useState(false)
  /* Noms des super events, pour grouper les stations. Un pro peut en avoir 33
     reparties sur plusieurs operations : a plat, la liste est illisible. */
  const [supers, setSupers] = useState<SuperEvent[]>([])
  useEffect(() => { fetchSuperEvents().then(setSupers) }, [])

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

  /* RIEN A PLAT (Romain, handoff du 14/09). Les six onglets partent de la
     liste des events du pro et affichent un bloc par operation -- super event
     ou event autonome -- trie par date decroissante. Ils ne sont plus delegues
     a PartenaireDrawer, qui filtrait sur UNE fiche partenaire (Charvolin :
     « 0 lot » a cote de « 5 stations »). Ils existent donc pour tous les pros,
     avec ou sans fiche commerce. */
  const operations = grouperOperations(proEvents, supers)
  const nbStations = operations.reduce((n, o) => n + o.stations.length, 0)
  /* Memes onglets que la fiche partenaire rattachee (ONGLETS_FICHE, famille J). */
  const tabs = ONGLETS_FICHE.map(t => ({ id: t.id, label: t.label, badge: t.id === 'events' ? nbStations : undefined }))
  const ongletActif = ONGLETS_FICHE.find(t => t.id === drawer.tab)?.onglet

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
          onClick={() => openDrawer('partenaire', p.partenaire_id as string, 'infos')}
          style={{ margin: '0 20px 14px', background: 'var(--sa-subtle)', border: '1px solid var(--sa-border)', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span style={{ fontSize: 12.5, fontWeight: 700 }}>🤝 Fiche partenaire liée — logo, kit com, billets, facture</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--sa-accent)' }}>Ouvrir →</span>
        </div>
      )}

      <ActionsFichePro pro={p} />

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

        {drawer.tab === 'events' && liveEvents.length > 0 && (
          <div className="sa-alert live">🔴 {liveEvents.length} event{liveEvents.length > 1 ? 's' : ''} en cours</div>
        )}
        {drawer.tab === 'qrliens' && (
          <p className="sa-muted" style={{ fontSize: 11.5, marginBottom: 14 }}>
            Généré et publié par vous — le pro n&apos;y accède qu&apos;une fois « Publié » activé.
          </p>
        )}
        {ongletActif && (
          <OngletOperationsSA
            proId={p.id}
            onglet={ongletActif}
            onStation={id => openDrawer('event', id, 'stats')}
          />
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

