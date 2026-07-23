'use client'

import { useState, useMemo, useEffect } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { upsertPartenaire, deletePartenaire } from '@/lib/dashboard'
import { DrawerTabs, FieldRow, SectionHeader } from './DashboardUI'
import {
  fetchGagnantsPartenaire, fetchEtatPartenaire, confirmerGagnant,
  lienBillet, packEnvoi,
  type GagnantPartenaire, type EtatPartenaire,
} from '@/lib/nds'
import type { FlowinPartenaire, FlowinEvent } from '@/lib/types'

export default function PartenaireDrawer() {
  const { drawer, closeDrawer, setDrawerTab, partenaires, setPartenaires, events, lots } = useDashboard()
  const [edit, setEdit] = useState(drawer.edit)
  const [form, setForm] = useState<Partial<FlowinPartenaire>>({})
  const [saving, setSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState('')
  /* Gagnants du partenaire : charges a l ouverture de l onglet, jamais au montage,
     pour ne pas alourdir le tiroir quand on ne consulte que les infos. */
  const [gagnants, setGagnants] = useState<GagnantPartenaire[] | null>(null)
  const [etatG, setEtatG] = useState<EtatPartenaire | null>(null)
  const [chargeG, setChargeG] = useState(false)

  const p = useMemo(() => partenaires.find(x => x.id === drawer.id), [partenaires, drawer.id])

  const pid = drawer.id
  const ongletGagnants = drawer.tab === 'gagnants' || drawer.tab === 'comm'
  useEffect(() => {
    if (!pid || !ongletGagnants || chargeG) return
    let vivant = true
    setChargeG(true)
    Promise.all([fetchGagnantsPartenaire(pid), fetchEtatPartenaire(pid)])
      .then(([g, e]) => { if (vivant) { setGagnants(g); setEtatG(e) } })
      .finally(() => { if (vivant) setChargeG(false) })
    return () => { vivant = false }
  }, [pid, ongletGagnants, chargeG])

  async function onConfirmer(tirageId: number) {
    if (!pid) return
    if (!confirm('Confirmer ce gagnant ?\n\nIl apparaîtra alors dans la liste et les billets du partenaire, et son nom s\'inscrira sur le billet.')) return
    const ok = await confirmerGagnant(tirageId)
    if (!ok) { alert('La confirmation a échoué.'); return }
    const [g, e] = await Promise.all([fetchGagnantsPartenaire(pid), fetchEtatPartenaire(pid)])
    setGagnants(g); setEtatG(e)
  }

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

  async function setPaiement(statut: string) {
    const ok = await upsertPartenaire({ id: p.id, statut_paiement: statut })
    if (ok) setPartenaires(partenaires.map(x => x.id === p.id ? { ...x, statut_paiement: statut } as FlowinPartenaire : x))
  }

  async function setFacture(v: boolean) {
    const ok = await upsertPartenaire({ id: p.id, facture_emise: v })
    if (ok) setPartenaires(partenaires.map(x => x.id === p.id ? { ...x, facture_emise: v } as FlowinPartenaire : x))
  }

  const PAIEMENT_MODES: Record<string, string> = {
    lydia_wero: 'Lydia / Wero', paypal: 'PayPal', sepa: 'Virement SEPA', virement: 'Virement bancaire', especes: 'Espèces',
  }
  const modeLabel = (m?: string | null) => (m ? (PAIEMENT_MODES[m] || m) : '—')

  const typeChip = p.type === 'National' ? 'purple' : p.type === 'Récurrent' ? 'live' : 'past'

  /* Meme decoupage que le monolithe : 6 onglets, sans doublon.
     Les events sont dans Infos (ils decrivent le partenaire, pas une action a part). */
  const tabs = [
    { id: 'infos',    label: 'Infos' },
    { id: 'stats',    label: 'Stats' },
    { id: 'lots',     label: 'Lots & stock', badge: pLots.length },
    { id: 'gagnants', label: 'Gagnants & billets', badge: etatG?.tires },
    { id: 'comm',     label: 'Emails & com' },
    { id: 'contrat',  label: 'Contrat' },
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
            <SectionHeader>💶 Sponsoring &amp; facturation</SectionHeader>
            <div className="sa-field">
              <label className="sa-label">Formule / offre choisie</label>
              <input className="sa-input" placeholder="ex. visibilite_lots, sponsoring loterie…" value={form.offre ?? ''} onChange={ff('offre')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="sa-field">
                <label className="sa-label">Montant (€)</label>
                <input className="sa-input" type="number" min="0" value={form.montant_sponsoring ?? ''} onChange={e => setForm(prev => ({ ...prev, montant_sponsoring: e.target.value === '' ? null : Number(e.target.value) }))} />
              </div>
              <div className="sa-field">
                <label className="sa-label">Mode de paiement</label>
                <select className="sa-input" value={form.paiement_mode ?? ''} onChange={ff('paiement_mode')}>
                  <option value="">—</option>
                  <option value="lydia_wero">Lydia / Wero</option>
                  <option value="paypal">PayPal</option>
                  <option value="sepa">Virement SEPA</option>
                  <option value="virement">Virement bancaire</option>
                  <option value="especes">Espèces</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="sa-field">
                <label className="sa-label">Statut paiement</label>
                <select className="sa-input" value={form.statut_paiement ?? 'en_attente'} onChange={ff('statut_paiement')}>
                  <option value="en_attente">En attente</option>
                  <option value="valide">Validé</option>
                </select>
              </div>
              <div className="sa-field" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '10px 0' }}>
                  <input type="checkbox" checked={form.facture_emise === true} onChange={e => setForm(prev => ({ ...prev, facture_emise: e.target.checked }))} />
                  🧾 Facture émise
                </label>
              </div>
            </div>
          </>
        )}

        {drawer.tab === 'stats' && (
          <>
            <div className="sa-kpi-grid-2">
              <div className="sa-kpi"><div className="sa-kpi-val">{pLots.length}</div><div className="sa-kpi-lbl">Lots fournis</div></div>
              <div className="sa-kpi"><div className="sa-kpi-val">{pLots.reduce((s, l) => s + (l.valeur ?? 0) * (l.quantite ?? 1), 0)} €</div><div className="sa-kpi-lbl">Valeur</div></div>
              <div className="sa-kpi"><div className="sa-kpi-val">{pEvents.length}</div><div className="sa-kpi-lbl">Events</div></div>
            </div>

            <SectionHeader>💶 Sponsoring &amp; facturation</SectionHeader>
            <FieldRow label="Formule choisie" value={p.offre ? <strong>{p.offre}</strong> : '—'} />
            <FieldRow label="Montant" value={p.montant_sponsoring != null ? <strong>{p.montant_sponsoring} €</strong> : '—'} />
            <FieldRow label="Mode de paiement" value={modeLabel(p.paiement_mode)} />
            <FieldRow label="Paiement" value={
              p.statut_paiement === 'valide'
                ? <span className="sa-chip live">✅ Reçu</span>
                : <span className="sa-chip">⏳ En attente</span>
            } />
            <FieldRow label="Facture" value={
              p.facture_emise
                ? <span className="sa-chip live">🧾 Émise</span>
                : <span className="sa-chip">— Non émise</span>
            } />
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {p.statut_paiement === 'valide'
                ? <button className="sa-btn" onClick={() => setPaiement('en_attente')}>↩ Paiement en attente</button>
                : <button className="sa-btn primary" onClick={() => setPaiement('valide')}>✓ Valider le paiement</button>}
              {p.facture_emise
                ? <button className="sa-btn" onClick={() => setFacture(false)}>↩ Facture non émise</button>
                : <button className="sa-btn" onClick={() => setFacture(true)}>🧾 Marquer facture émise</button>}
            </div>
          </>
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

        {drawer.tab === 'gagnants' && (
          <>
            <SectionHeader>🏆 Gagnants &amp; billets</SectionHeader>
            {chargeG && <div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div>}
            {!chargeG && etatG && (
              <>
                <div className="sa-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
                  {([['Tirés', etatG.tires], ['À appeler', etatG.a_confirmer], ['Confirmés', etatG.confirmes], ['Retirés', etatG.retires]] as [string, number][]).map(([lib, val]) => (
                    <div key={lib} style={{ background: 'var(--sa-subtle)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 800 }}>{val}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--sa-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{lib}</div>
                    </div>
                  ))}
                </div>
                {etatG.a_confirmer > 0 && (
                  <div className="sa-alert warn" style={{ marginBottom: 10, fontSize: 12.5 }}>
                    ☎ {etatG.a_confirmer} gagnant{etatG.a_confirmer > 1 ? 's' : ''} à appeler. Le partenaire ne les verra qu&apos;une fois confirmés.
                  </div>
                )}
              </>
            )}
            {!chargeG && gagnants?.length === 0 && <div className="sa-muted" style={{ fontSize: 13 }}>Aucun gagnant tiré pour ce partenaire.</div>}
            {!chargeG && (gagnants ?? []).map(g => (
              <div key={g.tirage_id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '8px 10px', background: 'var(--sa-subtle)', borderRadius: 9, marginBottom: 6 }}>
                <span style={{ flex: 1, minWidth: 150 }}>
                  <b style={{ fontSize: 13 }}>{g.etat === 'a_confirmer' ? 'À attribuer' : (g.joueur_nom ?? '—')}</b>
                  <span style={{ fontSize: 11.5, color: 'var(--sa-muted)' }}> · {g.lot_nom}</span>
                </span>
                <span style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 11.5, fontWeight: 700, color: '#7C2D92' }}>{g.ticket_code ?? '—'}</span>
                <span className={`sa-chip ${g.etat === 'retire' ? 'live' : g.etat === 'confirme' ? 'live' : 'past'}`}>
                  {g.etat === 'retire' ? '✓ Retiré' : g.etat === 'confirme' ? '✓ Confirmé' : '☎ À appeler'}
                </span>
                {g.retrait_token && (
                  <a className="sa-btn sm" href={lienBillet(g.retrait_token, true)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>📄 Billet</a>
                )}
                {g.etat === 'a_confirmer' && (
                  <button className="sa-btn sm primary" onClick={() => onConfirmer(g.tirage_id)}>✓ Confirmer</button>
                )}
              </div>
            ))}
          </>
        )}

        {drawer.tab === 'comm' && (
          <>
            <SectionHeader>📦 Pack d&apos;envoi</SectionHeader>
            <div className="sa-alert info" style={{ marginBottom: 10, fontSize: 12.5 }}>
              Tout ce que le commerçant doit recevoir, réuni ici.
            </div>
            {packEnvoi(p.id).map(el => (
              <div key={el.libelle} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--sa-subtle)', borderRadius: 8, marginBottom: 6 }}>
                <span>{el.icone}</span>
                <span style={{ flex: 1, fontSize: 12.5 }}>{el.libelle}</span>
                <a className="sa-btn sm" href={el.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>Ouvrir</a>
                <button className="sa-btn sm" onClick={() => navigator.clipboard?.writeText(el.url)}>Copier</button>
              </div>
            ))}
          </>
        )}

        {drawer.tab === 'contrat' && (
          <>
            <SectionHeader>🔐 Code de validation en caisse</SectionHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff8ea', border: '1px solid #f2e1b6', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase', color: '#a1690a' }}>PIN du commerce</div>
                <div style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 26, fontWeight: 800, letterSpacing: 7, color: '#23142c', marginTop: 4 }}>
                  {(p as unknown as Record<string, string>).code_pin ?? '—'}
                </div>
              </div>
              {(p as unknown as Record<string, string>).code_pin && (
                <button className="sa-btn sm" style={{ marginLeft: 'auto' }}
                  onClick={() => navigator.clipboard?.writeText(String((p as unknown as Record<string, string>).code_pin))}>📋 Copier</button>
              )}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--sa-muted)', marginBottom: 16 }}>
              Confidentiel. Le commerçant le saisit pour valider un billet. À ne jamais afficher côté client.
            </div>
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
