'use client'

import { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { upsertPartenaire, deletePartenaire } from '@/lib/dashboard'
import { DrawerTabs, FieldRow, SectionHeader } from './DashboardUI'
import type { FlowinPartenaire, FlowinEvent } from '@/lib/types'

export default function PartenaireDrawer() {
  const { drawer, closeDrawer, setDrawerTab, partenaires, setPartenaires, events, lots } = useDashboard()
  const [edit, setEdit] = useState(drawer.edit)
  const [form, setForm] = useState<Partial<FlowinPartenaire>>({})
  const [saving, setSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState('')

  const p = useMemo(() => partenaires.find(x => x.id === drawer.id), [partenaires, drawer.id])

  if (!p) return (
    <div className="sa-drawer-empty">
      <button className="sa-drawer-close" onClick={closeDrawer}>×</button>
      <div>Partenaire introuvable</div>
    </div>
  )

  const pLots  = lots.filter(l => l.partenaire_id === p.id)
  const pEvents = ((p.events ?? []) as string[]).map((eid: string) => events.find(e => e.id === eid)).filter((x): x is FlowinEvent => !!x)

  function enterEdit() {
    setForm({ ...p })
    setLogoPreview(p.image_url ?? '')
    setEdit(true)
  }

  function ff(k: keyof FlowinPartenaire) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))
  }

  async function save() {
    setSaving(true)
    const payload = { ...form, id: p.id }
    const ok = await upsertPartenaire(payload)
    if (ok) setPartenaires(partenaires.map(x => x.id === p.id ? { ...x, ...form } as FlowinPartenaire : x))
    setSaving(false)
    setEdit(false)
  }

  async function del() {
    if (!confirm(`Supprimer « ${p.nom} » ? Action irréversible.`)) return
    await deletePartenaire(p.id)
    setPartenaires(partenaires.filter(x => x.id !== p.id))
    closeDrawer()
  }

  const typeChip = p.type === 'National' ? 'purple' : p.type === 'Récurrent' ? 'live' : 'past'

  const tabs = [
    { id: 'infos', label: 'Infos' },
    { id: 'stats', label: 'Stats' },
    { id: 'lots', label: 'Lots', badge: pLots.length },
    { id: 'events', label: 'Events', badge: pEvents.length },
  ]

  return (
    <>
      <div className="sa-drawer-h">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {p.image_url
            ? <img src={p.image_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'contain', border: '1px solid var(--sa-border)' }} />
            : <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--sa-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{p.emoji ?? '🤝'}</div>
          }
          <div>
            <div className="sa-drawer-title">🤝 {p.nom}</div>
            <div className="sa-drawer-sub"><span className={`sa-chip ${typeChip}`}>{p.type ?? 'Local'}</span></div>
          </div>
        </div>
        <button className="sa-drawer-close" onClick={closeDrawer}>×</button>
      </div>

      <DrawerTabs tabs={tabs} active={drawer.tab} onSelect={setDrawerTab} />

      <div className="sa-drawer-body">
        {drawer.tab === 'infos' && !edit && (
          <>
            {p.image_url && (
              <div style={{ marginBottom: 16, textAlign: 'center' }}>
                <img src={p.image_url} alt="logo" style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain', borderRadius: 10 }} />
              </div>
            )}
            <FieldRow label="Nom" value={<strong>{p.nom}</strong>} />
            <FieldRow label="Type" value={<span className={`sa-chip ${typeChip}`}>{p.type ?? '-'}</span>} />
            <FieldRow label="Secteur" value={p.secteur} />
            <FieldRow label="Ville" value={p.ville} />
            <FieldRow label="Statut" value={
              <span>{p.actif !== false ? '✅ Actif' : '⭕ Inactif'} · {p.visible !== false ? 'Visible' : 'Masqué'}{(p.en_avant) ? ' · ⭐ En avant' : ''}</span>
            } />
            {p.description && <><SectionHeader>Description</SectionHeader><div className="sa-text-block">{p.description}</div></>}
            {p.promo_text && <><SectionHeader>Promo</SectionHeader><div className="sa-promo-block">{p.promo_text}</div></>}
            <SectionHeader>Liens</SectionHeader>
            <FieldRow label="Site web" value={p.site_web || p.url ? <a href={p.site_web ?? p.url ?? '#'} target="_blank" rel="noopener">{p.site_web ?? p.url}</a> : '-'} />
            <FieldRow label="Instagram" value={p.instagram ?? '-'} />
            <FieldRow label="Facebook" value={p.facebook ?? '-'} />
            <SectionHeader>Contact</SectionHeader>
            <FieldRow label="Nom" value={p.contact} />
            <FieldRow label="Email" value={p.email ? <a href={`mailto:${p.email}`}>{p.email}</a> : '-'} />
            <FieldRow label="Téléphone" value={p.tel} />
            <FieldRow label="SIRET" value={p.siret ? <code className="sa-code">{p.siret}</code> : '-'} />
          </>
        )}

        {drawer.tab === 'infos' && edit && (
          <>
            {/* Logo preview */}
            <SectionHeader>🖼 Logo & Identité</SectionHeader>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ width: 80, height: 80, flexShrink: 0, borderRadius: 10, border: '2px dashed var(--sa-border)', background: 'var(--sa-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {logoPreview
                  ? <img src={logoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={() => setLogoPreview('')} />
                  : <span style={{ fontSize: 28 }}>{form.emoji ?? p.emoji ?? '🖼'}</span>
                }
              </div>
              <div style={{ flex: 1 }}>
                <div className="sa-field">
                  <label className="sa-label">Logo (URL — PNG, SVG, JPG)</label>
                  <input className="sa-input" type="url" placeholder="https://…" value={form.image_url ?? ''} onChange={e => { ff('image_url')(e); setLogoPreview(e.target.value) }} />
                </div>
                <div className="sa-field">
                  <label className="sa-label">Emoji fallback</label>
                  <input className="sa-input" placeholder="🤝" value={form.emoji ?? ''} onChange={ff('emoji')} />
                </div>
              </div>
            </div>
            {(['nom'] as (keyof FlowinPartenaire)[]).map(k => (
              <div key={k} className="sa-field">
                <label className="sa-label">Nom *</label>
                <input className="sa-input" value={form[k] as string ?? ''} onChange={ff(k)} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="sa-field">
                <label className="sa-label">Type</label>
                <select className="sa-input" value={form.type ?? 'Local'} onChange={ff('type')}>
                  <option>Local</option><option>National</option><option>Récurrent</option>
                </select>
              </div>
              <div className="sa-field">
                <label className="sa-label">Secteur</label>
                <input className="sa-input" value={form.secteur ?? ''} onChange={ff('secteur')} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, padding: '8px 12px', background: 'var(--sa-subtle)', borderRadius: 8, marginBottom: 14 }}>
              {[['actif', 'Actif'], ['visible', 'Visible'], ['en_avant', '⭐ En avant']].map(([k, l]) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  <input type="checkbox" checked={(form[k as keyof FlowinPartenaire] as boolean) !== false}
                    onChange={e => setForm(prev => ({ ...prev, [k]: e.target.checked }))} />
                  {l}
                </label>
              ))}
            </div>
            <SectionHeader>📱 Présence parcours joueurs <span className="sa-badge-pill purple">bottom sheet</span></SectionHeader>
            <div className="sa-field"><label className="sa-label">Description</label><textarea className="sa-input" rows={2} value={form.description ?? ''} onChange={ff('description')} /></div>
            <div className="sa-field"><label className="sa-label">Texte promo (bandeau violet)</label><input className="sa-input" value={form.promo_text ?? ''} onChange={ff('promo_text')} /></div>
            <SectionHeader>🔗 Réseaux & contact <span className="sa-badge-pill green">liens parcours</span></SectionHeader>
            <div style={{ background: 'rgba(29,155,117,.06)', border: '1px solid rgba(29,155,117,.15)', borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
              {(['site_web', 'instagram', 'facebook'] as (keyof FlowinPartenaire)[]).map(k => (
                <div key={k} className="sa-field">
                  <label className="sa-label">{k === 'site_web' ? '🌐 Site web' : k === 'instagram' ? '📸 Instagram' : '🔵 Facebook'}</label>
                  <input className="sa-input" value={form[k] as string ?? ''} onChange={ff(k)} />
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="sa-field"><label className="sa-label">📧 Email</label><input className="sa-input" type="email" value={form.email ?? ''} onChange={ff('email')} /></div>
              <div className="sa-field"><label className="sa-label">📞 Tél</label><input className="sa-input" type="tel" value={form.tel ?? ''} onChange={ff('tel')} /></div>
            </div>
            <SectionHeader>Administratif</SectionHeader>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="sa-field"><label className="sa-label">Contact</label><input className="sa-input" value={form.contact ?? ''} onChange={ff('contact')} /></div>
              <div className="sa-field"><label className="sa-label">Ville</label><input className="sa-input" value={form.ville ?? ''} onChange={ff('ville')} /></div>
            </div>
            <div className="sa-field"><label className="sa-label">Adresse</label><input className="sa-input" value={form.adresse ?? ''} onChange={ff('adresse')} /></div>
            <div className="sa-field"><label className="sa-label">Notes</label><textarea className="sa-input" rows={2} value={form.notes ?? ''} onChange={ff('notes')} /></div>
          </>
        )}

        {drawer.tab === 'stats' && (
          <div className="sa-kpi-grid-2">
            <div className="sa-kpi"><div className="sa-kpi-val">{pLots.length}</div><div className="sa-kpi-lbl">Lots fournis</div></div>
            <div className="sa-kpi"><div className="sa-kpi-val">{pLots.reduce((s, l) => s + (l.valeur ?? 0) * (l.quantite ?? 1), 0)} €</div><div className="sa-kpi-lbl">Valeur</div></div>
            <div className="sa-kpi"><div className="sa-kpi-val">{pEvents.length}</div><div className="sa-kpi-lbl">Events</div></div>
          </div>
        )}

        {drawer.tab === 'lots' && (
          <>
            <SectionHeader>{pLots.length} lot{pLots.length > 1 ? 's' : ''}</SectionHeader>
            {pLots.length === 0 && <div className="sa-empty-inline">Aucun lot</div>}
            {pLots.map(l => (
              <div key={l.id} className="sa-list-item">
                <span style={{ fontSize: 22 }}>{l.emoji ?? '🎁'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{l.titre || l.nom}</div>
                  <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>{l.valeur} €</div>
                </div>
              </div>
            ))}
          </>
        )}

        {drawer.tab === 'events' && (
          <>
            <SectionHeader>{pEvents.length} event{pEvents.length > 1 ? 's' : ''} sponsorisé{pEvents.length > 1 ? 's' : ''}</SectionHeader>
            {pEvents.length === 0 && <div className="sa-empty-inline">Aucun event</div>}
            {pEvents.map((ev: FlowinEvent) => ev && (
              <div key={ev.id} className="sa-list-item">
                <div style={{ flex: 1, fontWeight: 700 }}>{(ev as { nom: string }).nom}</div>
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
              <button className="sa-btn primary" onClick={save} disabled={saving}>{saving ? 'Enregistrement…' : '✓ Enregistrer'}</button>
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
