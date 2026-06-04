'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type SE = { id: string; nom: string; description?: string | null; date_d?: string | null; date_f?: string | null; pct_flowin?: number | null }
type Lot = { rang: number | null; valeur: number | null; libelle?: string | null }

const HERO = '#0F9E73'
const SECTEURS = ['Grande distribution', 'Banque · Assurance', 'Automobile', 'Immobilier', 'Restauration', 'Commerce', 'Collectivité', 'Association', 'Tourisme', 'Énergie', 'Autre']

function slug(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28)
}

export default function SponsorClient({ se, lots }: { se: SE; lots: Lot[] }) {
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')
  const [f, setF] = useState({
    structure: '', secteur: '', ville: '',
    prenom: '', nom: '', email: '', tel: '',
    montant: '', logo: '', message: '',
  })
  function set<K extends keyof typeof f>(k: K, v: string) { setF(p => ({ ...p, [k]: v })) }

  const totalLots = lots.reduce((s, l) => s + (l.valeur ?? 0), 0)

  async function submit() {
    setErr('')
    const montant = Number(f.montant)
    if (!f.structure.trim() || !f.secteur || !f.prenom.trim() || !f.nom.trim() || !f.email.includes('@') || f.tel.replace(/\s/g, '').length < 8 || !montant || montant <= 0) {
      setErr('Merci de remplir tous les champs obligatoires (dont un montant valide).')
      return
    }
    setSubmitting(true)
    try {
      const emailLower = f.email.toLowerCase().trim()
      const id = 'part-' + slug(emailLower)
      const { error } = await supabase.from('partenaires').upsert({
        id, nom: f.structure.trim(), description: 'Secteur : ' + f.secteur, ville: f.ville.trim() || null,
        contact: `${f.prenom.trim()} ${f.nom.trim()}`, email: emailLower, tel: f.tel.trim(),
        image_url: f.logo.trim() || null, notes: f.message.trim() || null,
        super_event_id: se.id, montant_sponsoring: montant, statut_paiement: 'en_attente',
        type: 'National', actif: false, visible: false,
      }, { onConflict: 'id' })
      if (error) { setErr("Une erreur est survenue. Réessayez."); setSubmitting(false); return }
      setDone(true)
    } catch {
      setErr("Une erreur est survenue. Réessayez.")
    }
    setSubmitting(false)
  }

  const wrap: React.CSSProperties = { minHeight: '100dvh', background: '#f1ede6', fontFamily: 'system-ui, sans-serif', color: '#141a26', padding: '0 0 40px' }
  const card: React.CSSProperties = { maxWidth: 540, margin: '0 auto', padding: '0 18px' }
  const label: React.CSSProperties = { fontSize: 12.5, fontWeight: 800, letterSpacing: '.03em', color: '#5a6071', textTransform: 'uppercase', marginBottom: 6, display: 'block' }
  const input: React.CSSProperties = { width: '100%', padding: '13px 14px', borderRadius: 13, border: '1px solid #d9dde6', background: '#fff', fontSize: 15.5, fontFamily: 'inherit', outline: 'none' }
  const field: React.CSSProperties = { marginBottom: 15 }

  if (done) {
    return (
      <div style={wrap}>
        <div style={{ background: `linear-gradient(135deg,${HERO},#0B6E50)`, color: '#fff', padding: '54px 18px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 54, marginBottom: 10 }}>🤝</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>Merci !</div>
        </div>
        <div style={{ ...card, marginTop: -18 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '24px 22px', boxShadow: '0 6px 24px rgba(20,26,38,.08)' }}>
            <div style={{ fontSize: 15.5, lineHeight: 1.6, color: '#374151' }}>
              Votre soutien à l&apos;opération <strong>{se.nom}</strong> est enregistré (<strong>{Number(f.montant)} €</strong>).
            </div>
            <div style={{ background: '#E9F7F0', borderRadius: 14, padding: '15px 16px', margin: '18px 0', fontSize: 14.5, lineHeight: 1.6, color: '#0B6E50' }}>
              Votre logo apparaîtra auprès des joueurs <strong>dès réception du virement</strong>. Les coordonnées de paiement vous seront communiquées par email.
            </div>
            <div style={{ fontSize: 12.5, color: '#9aa0ad', lineHeight: 1.5 }}>
              Flowin perçoit {se.pct_flowin ?? 20}% du sponsoring au titre de l&apos;organisation ; le reste finance les lots mutualisés de l&apos;opération.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={wrap}>
      <div style={{ background: `linear-gradient(135deg,${HERO},#0B6E50)`, color: '#fff', padding: '46px 18px 38px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.85, letterSpacing: '.04em', textTransform: 'uppercase' }}>Devenez sponsor</div>
        <div style={{ fontSize: 27, fontWeight: 800, marginTop: 8, lineHeight: 1.15 }}>{se.nom}</div>
        <div style={{ fontSize: 14.5, opacity: 0.9, marginTop: 8, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
          Associez votre marque à une opération locale et offrez de la visibilité à votre enseigne.
        </div>
        {totalLots > 0 && (
          <div style={{ display: 'inline-block', marginTop: 14, background: 'rgba(255,255,255,.18)', borderRadius: 100, padding: '7px 16px', fontSize: 13.5, fontWeight: 700 }}>
            🎁 {totalLots} € de lots mutualisés
          </div>
        )}
      </div>

      <div style={{ ...card, marginTop: -16 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '22px 20px 26px', boxShadow: '0 6px 24px rgba(20,26,38,.08)' }}>

          <div style={{ fontSize: 13, fontWeight: 800, color: HERO, marginBottom: 13 }}>🏢 Votre structure</div>
          <div style={field}><label style={label}>Raison sociale *</label><input style={input} value={f.structure} onChange={e => set('structure', e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11, marginBottom: 15 }}>
            <div>
              <label style={label}>Secteur *</label>
              <select style={input} value={f.secteur} onChange={e => set('secteur', e.target.value)}>
                <option value="">Choisir…</option>
                {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={label}>Ville</label><input style={input} value={f.ville} onChange={e => set('ville', e.target.value)} /></div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 800, color: HERO, margin: '22px 0 13px' }}>👤 Votre contact</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11, marginBottom: 15 }}>
            <div><label style={label}>Prénom *</label><input style={input} value={f.prenom} onChange={e => set('prenom', e.target.value)} /></div>
            <div><label style={label}>Nom *</label><input style={input} value={f.nom} onChange={e => set('nom', e.target.value)} /></div>
          </div>
          <div style={field}><label style={label}>Email *</label><input style={input} type="email" inputMode="email" autoCapitalize="none" value={f.email} onChange={e => set('email', e.target.value)} /></div>
          <div style={field}><label style={label}>Téléphone *</label><input style={input} type="tel" inputMode="tel" value={f.tel} onChange={e => set('tel', e.target.value)} /></div>

          <div style={{ fontSize: 13, fontWeight: 800, color: HERO, margin: '22px 0 13px' }}>💶 Votre soutien</div>
          <div style={field}><label style={label}>Montant du sponsoring (€) *</label><input style={input} type="number" min="0" inputMode="numeric" value={f.montant} onChange={e => set('montant', e.target.value)} /></div>
          <div style={field}><label style={label}>Logo (URL, optionnel)</label><input style={input} type="url" value={f.logo} onChange={e => set('logo', e.target.value)} placeholder="https://…" /></div>
          <div style={field}><label style={label}>Message (optionnel)</label><input style={input} value={f.message} onChange={e => set('message', e.target.value)} /></div>

          {err && <div style={{ background: '#FEECEC', color: '#B42318', borderRadius: 12, padding: '11px 14px', fontSize: 13.5, marginBottom: 14 }}>{err}</div>}

          <button onClick={submit} disabled={submitting} style={{ width: '100%', background: HERO, color: '#fff', fontWeight: 800, fontSize: 16.5, padding: '16px', borderRadius: 16, border: 'none', cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Envoi…' : 'Devenir sponsor →'}
          </button>
          <div style={{ fontSize: 12, color: '#9aa0ad', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
            Visibilité auprès des joueurs après réception du virement. Données jamais cédées.
          </div>
        </div>
      </div>
    </div>
  )
}
