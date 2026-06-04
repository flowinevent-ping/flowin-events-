'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type SE = { id: string; nom: string; description?: string | null; date_d?: string | null; date_f?: string | null; frais_pro?: number | null }

const MODULES = [
  { v: 'spin', label: 'Roue de la chance 🎡', c: '#F59E0B' },
  { v: 'quiz', label: 'Quiz 🧠', c: '#3B5CC4' },
  { v: 'quizsolo', label: 'Quiz solo 🎯', c: '#0EA5A4' },
  { v: 'quizmaster', label: 'Quiz Master 👑', c: '#4F46E5' },
  { v: 'vote', label: 'Vote ⭐', c: '#0EA5A4' },
  { v: 'tombola', label: 'Tombola 🎟️', c: '#E11D48' },
]
const CATEGORIES = ['Boulangerie', 'Restaurant', 'Bar · Café', 'Caviste', 'Fleuriste', 'Librairie', 'Épicerie fine', 'Mode', 'Beauté · Coiffure', 'Décoration', 'Autre']

const SPIN_DEFAULT = [
  { label: '🎁 Surprise', color: '#0F9E73' },
  { label: 'Rejoue', color: '#64748B', perdant: true },
  { label: '-10%', color: '#F59E0B' },
  { label: '🎟️ +1 ticket', color: '#3B5CC4' },
  { label: 'Pas cette fois', color: '#64748B', perdant: true },
  { label: 'Cadeau', color: '#E11D48' },
]

const HERO = '#2746A6'

function slug(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28)
}

export default function RejoindreClient({ se }: { se: SE }) {
  const frais = se.frais_pro ?? 49
  const [done, setDone] = useState<{ evId: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')
  const [f, setF] = useState({
    commerce: '', categorie: '', adresse: '',
    prenom: '', nom: '', email: '', tel: '',
    module: 'spin', gain: '',
  })

  function set<K extends keyof typeof f>(k: K, v: string) { setF(p => ({ ...p, [k]: v })) }

  async function submit() {
    setErr('')
    if (!f.commerce.trim() || !f.categorie || !f.adresse.trim() || !f.prenom.trim() || !f.nom.trim() || !f.email.includes('@') || f.tel.replace(/\s/g, '').length < 8 || !f.module) {
      setErr('Merci de remplir tous les champs obligatoires.')
      return
    }
    setSubmitting(true)
    try {
      const emailLower = f.email.toLowerCase().trim()
      const proId = 'pro-' + slug(emailLower)
      const evId = 'ev-' + slug(se.id).replace(/^se-/, '') + '-' + Math.random().toString(36).slice(2, 7)
      const mod = MODULES.find(m => m.v === f.module) ?? MODULES[0]

      await supabase.from('pros').upsert({
        id: proId, nom: f.commerce.trim(), adresse: f.adresse.trim(), secteur: f.categorie,
        contact: `${f.prenom.trim()} ${f.nom.trim()}`, email: emailLower, tel: f.tel.trim(),
      }, { onConflict: 'id' })

      const { error: evErr } = await supabase.from('events').insert({
        id: evId, nom: f.commerce.trim(), module: f.module, super_event_id: se.id, pro_id: proId,
        status: 'pending', categorie: f.categorie, adresse: f.adresse.trim(),
        gain_immediat: f.gain.trim() || null, gain_ticket: true, couleur: mod.c,
        cfg: f.module === 'spin' ? { subtitle: 'Tente ta chance !', spinSegments: SPIN_DEFAULT } : {},
      })
      if (evErr) { setErr("Une erreur est survenue. Réessayez."); setSubmitting(false); return }

      setDone({ evId })
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
        <div style={{ background: `linear-gradient(135deg,${HERO},#3B7DE0)`, color: '#fff', padding: '54px 18px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 54, marginBottom: 10 }}>🎉</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>Demande envoyée !</div>
        </div>
        <div style={{ ...card, marginTop: -18 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '24px 22px', boxShadow: '0 6px 24px rgba(20,26,38,.08)' }}>
            <div style={{ fontSize: 15.5, lineHeight: 1.6, color: '#374151' }}>
              Merci <strong>{f.prenom}</strong> ! Le commerce <strong>{f.commerce}</strong> est enregistré pour l&apos;opération <strong>{se.nom}</strong>.
            </div>
            <div style={{ background: '#EFF3FE', borderRadius: 14, padding: '15px 16px', margin: '18px 0', fontSize: 14.5, lineHeight: 1.6, color: '#2c3a63' }}>
              Nous validons votre commerce sous 24–48h. Votre <strong>QR à afficher en boutique</strong> et votre <strong>tableau de bord</strong> seront activés à ce moment-là.
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', border: '1px solid #eee', borderRadius: 14 }}>
              <span style={{ fontSize: 14, color: '#5a6071' }}>Frais de participation</span>
              <span style={{ fontSize: 18, fontWeight: 800 }}>{frais} € HT</span>
            </div>
            <div style={{ fontSize: 12.5, color: '#9aa0ad', marginTop: 10, lineHeight: 1.5 }}>
              Déductible si vous souscrivez ensuite à un abonnement Flowin. Les modalités de règlement vous seront communiquées par email.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={wrap}>
      <div style={{ background: `linear-gradient(135deg,${HERO},#3B7DE0)`, color: '#fff', padding: '46px 18px 38px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.85, letterSpacing: '.04em', textTransform: 'uppercase' }}>Devenez commerce partenaire</div>
        <div style={{ fontSize: 27, fontWeight: 800, marginTop: 8, lineHeight: 1.15 }}>{se.nom}</div>
        <div style={{ fontSize: 14.5, opacity: 0.9, marginTop: 8, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
          Animez votre boutique, captez de nouveaux clients et offrez-leur une chance de gagner.
        </div>
      </div>

      <div style={{ ...card, marginTop: -16 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '22px 20px 26px', boxShadow: '0 6px 24px rgba(20,26,38,.08)' }}>

          <div style={{ fontSize: 13, fontWeight: 800, color: HERO, marginBottom: 13 }}>🏪 Votre commerce</div>
          <div style={field}><label style={label}>Nom du commerce *</label><input style={input} value={f.commerce} onChange={e => set('commerce', e.target.value)} /></div>
          <div style={field}>
            <label style={label}>Catégorie *</label>
            <select style={input} value={f.categorie} onChange={e => set('categorie', e.target.value)}>
              <option value="">Choisir…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={field}><label style={label}>Adresse *</label><input style={input} value={f.adresse} onChange={e => set('adresse', e.target.value)} placeholder="N°, rue, code postal, ville" /></div>

          <div style={{ fontSize: 13, fontWeight: 800, color: HERO, margin: '22px 0 13px' }}>👤 Votre contact</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11, marginBottom: 15 }}>
            <div><label style={label}>Prénom *</label><input style={input} value={f.prenom} onChange={e => set('prenom', e.target.value)} /></div>
            <div><label style={label}>Nom *</label><input style={input} value={f.nom} onChange={e => set('nom', e.target.value)} /></div>
          </div>
          <div style={field}><label style={label}>Email *</label><input style={input} type="email" inputMode="email" autoCapitalize="none" value={f.email} onChange={e => set('email', e.target.value)} /></div>
          <div style={field}><label style={label}>Téléphone *</label><input style={input} type="tel" inputMode="tel" value={f.tel} onChange={e => set('tel', e.target.value)} /></div>

          <div style={{ fontSize: 13, fontWeight: 800, color: HERO, margin: '22px 0 13px' }}>🎮 Votre jeu</div>
          <div style={field}>
            <label style={label}>Module de jeu *</label>
            <select style={input} value={f.module} onChange={e => set('module', e.target.value)}>
              {MODULES.map(m => <option key={m.v} value={m.v}>{m.label}</option>)}
            </select>
          </div>
          <div style={field}>
            <label style={label}>Gain immédiat offert (optionnel)</label>
            <input style={input} value={f.gain} onChange={e => set('gain', e.target.value)} placeholder="ex : 1 café offert, -10%…" />
            <div style={{ fontSize: 12, color: '#9aa0ad', marginTop: 6 }}>Laissez vide pour ne proposer qu&apos;un ticket pour le tirage final.</div>
          </div>

          {err && <div style={{ background: '#FEECEC', color: '#B42318', borderRadius: 12, padding: '11px 14px', fontSize: 13.5, marginBottom: 14 }}>{err}</div>}

          <button onClick={submit} disabled={submitting} style={{ width: '100%', background: HERO, color: '#fff', fontWeight: 800, fontSize: 16.5, padding: '16px', borderRadius: 16, border: 'none', cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Envoi…' : `Rejoindre l'opération · ${frais} € HT →`}
          </button>
          <div style={{ fontSize: 12, color: '#9aa0ad', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
            Sans engagement. Validation sous 24–48h. Données jamais cédées.
          </div>
        </div>
      </div>
    </div>
  )
}
