'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { libelleModule, iconeModule } from '@/lib/operations'
import { CHARTE, POLICE_ADMIN } from '@/lib/charte'

type SE = { id: string; nom: string; description?: string | null; date_d?: string | null; date_f?: string | null; frais_pro?: number | null; module?: string | null }

const CATEGORIES = ['Boulangerie', 'Restaurant', 'Bar · Café', 'Caviste', 'Fleuriste', 'Librairie', 'Épicerie fine', 'Mode', 'Beauté · Coiffure', 'Décoration', 'Autre']

/* Meme tendance graphique que le dashboard SA (lib/charte.ts), demande Romain
   le 17/09 : fond clair, cartes a bordure fine, police systeme — cette page
   publique de recrutement partenaire avait son propre style « app mobile »
   isole. Couleur : orange #C2410C, la teinte « super event » deja etablie
   dans app/dashboard/globals.css (.sa-parc.t-super) — cette page rejoint
   justement un super event, a garder bien distincte du bleu Flowin general. */
const ORANGE = '#C2410C'
const ORANGE2 = '#FF8A14'

function slug(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28)
}

export default function RejoindreClient({ se }: { se: SE }) {
  const frais = se.frais_pro ?? 49
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')
  const [f, setF] = useState({
    commerce: '', categorie: '', adresse: '',
    prenom: '', nom: '', email: '', tel: '',
    lot: '', quantite: '1', conditions: '',
  })

  function set<K extends keyof typeof f>(k: K, v: string) { setF(p => ({ ...p, [k]: v })) }

  async function submit() {
    setErr('')
    if (!f.commerce.trim() || !f.categorie || !f.adresse.trim() || !f.prenom.trim() || !f.nom.trim() || !f.email.includes('@') || f.tel.replace(/\s/g, '').length < 8) {
      setErr('Merci de remplir tous les champs obligatoires.')
      return
    }
    setSubmitting(true)
    try {
      const emailLower = f.email.toLowerCase().trim()
      const proId = 'pro-' + slug(emailLower)

      await supabase.from('pros').upsert({
        id: proId, nom: f.commerce.trim(), adresse: f.adresse.trim(), secteur: f.categorie,
        contact: `${f.prenom.trim()} ${f.nom.trim()}`, email: emailLower, tel: f.tel.trim(),
      }, { onConflict: 'id' })

      /* REFERENTIEL 24 — UN SEUL CHEMIN. Cette page creait directement une
         station avec un jeu choisi par le commerce (roue par defaut) : le jeu du
         super event etait ignore et la demande n apparaissait nulle part cote
         SA. Elle depose maintenant la meme demande que /pro/rejoindre ;
         l approbation SA cree la station avec le jeu du super event. */
      const { error: dErr } = await supabase.from('demandes_rattachement_super_event').insert({
        pro_id: proId, super_event_id: se.id, persona: 'commerce',
        nom_commerce: f.commerce.trim(), categorie: f.categorie, adresse: f.adresse.trim(),
        regle_jeu: se.module ?? 'nds2026',
        lots: f.lot.trim() ? [{ titre: f.lot.trim(), valeur_euros: 0, quantite: Number(f.quantite) || 1, conditions: f.conditions.trim() }] : [],
        statut: 'en_attente',
      })
      if (dErr) { setErr("Une erreur est survenue. Réessayez."); setSubmitting(false); return }

      setDone(true)
    } catch {
      setErr("Une erreur est survenue. Réessayez.")
    }
    setSubmitting(false)
  }

  const wrap: React.CSSProperties = { minHeight: '100dvh', background: CHARTE.fond, fontFamily: POLICE_ADMIN, color: CHARTE.texte, padding: '0 0 40px' }
  const card: React.CSSProperties = { maxWidth: 540, margin: '0 auto', padding: '0 18px' }
  const surface: React.CSSProperties = { background: CHARTE.carte, border: `1px solid ${CHARTE.bordure}`, borderRadius: 16, padding: '22px 20px 26px' }
  const label: React.CSSProperties = { fontSize: 11.5, fontWeight: 800, letterSpacing: '.05em', color: CHARTE.attenue, textTransform: 'uppercase', marginBottom: 6, display: 'block' }
  const input: React.CSSProperties = { width: '100%', padding: '11px 13px', borderRadius: 10, border: `1px solid ${CHARTE.bordure}`, background: CHARTE.subtil, fontSize: 15, fontFamily: 'inherit', color: CHARTE.texte, outline: 'none' }
  const field: React.CSSProperties = { marginBottom: 15 }
  const sectionTitre: React.CSSProperties = { fontSize: 13, fontWeight: 800, color: ORANGE, margin: '22px 0 13px' }
  const hero: React.CSSProperties = { background: `linear-gradient(135deg,${ORANGE},${ORANGE2})`, color: '#fff', textAlign: 'center' }

  if (done) {
    return (
      <div style={wrap}>
        <div style={{ ...hero, padding: '54px 18px 40px' }}>
          <div style={{ fontSize: 54, marginBottom: 10 }}>🎉</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>Demande envoyée !</div>
        </div>
        <div style={{ ...card, marginTop: -18 }}>
          <div style={surface}>
            <div style={{ fontSize: 15, lineHeight: 1.6 }}>
              Merci <strong>{f.prenom}</strong> ! La demande de <strong>{f.commerce}</strong> pour l&apos;opération <strong>{se.nom}</strong> est enregistrée.
            </div>
            <div style={{ background: 'rgba(194,65,12,.07)', borderRadius: 12, padding: '15px 16px', margin: '18px 0', fontSize: 14, lineHeight: 1.6, color: CHARTE.texte }}>
              Nous validons votre commerce sous 24–48h. Votre <strong>QR à afficher en boutique</strong> et votre <strong>tableau de bord</strong> seront activés à ce moment-là.
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', border: `1px solid ${CHARTE.bordure}`, borderRadius: 12 }}>
              <span style={{ fontSize: 13.5, color: CHARTE.attenue }}>Frais de participation</span>
              <span style={{ fontSize: 18, fontWeight: 800 }}>{frais} € HT</span>
            </div>
            <div style={{ fontSize: 12.5, color: CHARTE.attenue, marginTop: 10, lineHeight: 1.5 }}>
              Déductible si vous souscrivez ensuite à un abonnement Flowin. Les modalités de règlement vous seront communiquées par email.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={wrap}>
      <div style={{ ...hero, padding: '46px 18px 38px' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.9, letterSpacing: '.05em', textTransform: 'uppercase' }}>Devenez commerce partenaire</div>
        <div style={{ fontSize: 27, fontWeight: 800, marginTop: 8, lineHeight: 1.15 }}>{se.nom}</div>
        <div style={{ fontSize: 14, opacity: 0.92, marginTop: 8, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
          Animez votre boutique, captez de nouveaux clients et offrez-leur une chance de gagner.
        </div>
      </div>

      <div style={{ ...card, marginTop: -16 }}>
        <div style={surface}>

          <div style={{ ...sectionTitre, marginTop: 0 }}>🏪 Votre commerce</div>
          <div style={field}><label style={label}>Nom du commerce *</label><input style={input} value={f.commerce} onChange={e => set('commerce', e.target.value)} /></div>
          <div style={field}>
            <label style={label}>Catégorie *</label>
            <select style={input} value={f.categorie} onChange={e => set('categorie', e.target.value)}>
              <option value="">Choisir…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={field}><label style={label}>Adresse *</label><input style={input} value={f.adresse} onChange={e => set('adresse', e.target.value)} placeholder="N°, rue, code postal, ville" /></div>

          <div style={sectionTitre}>👤 Votre contact</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11, marginBottom: 15 }}>
            <div><label style={label}>Prénom *</label><input style={input} value={f.prenom} onChange={e => set('prenom', e.target.value)} /></div>
            <div><label style={label}>Nom *</label><input style={input} value={f.nom} onChange={e => set('nom', e.target.value)} /></div>
          </div>
          <div style={field}><label style={label}>Email *</label><input style={input} type="email" inputMode="email" autoCapitalize="none" value={f.email} onChange={e => set('email', e.target.value)} /></div>
          <div style={field}><label style={label}>Téléphone *</label><input style={input} type="tel" inputMode="tel" value={f.tel} onChange={e => set('tel', e.target.value)} /></div>

          <div style={sectionTitre}>🎮 Le jeu de l&apos;opération</div>
          <div style={{ ...field, background: 'rgba(194,65,12,.07)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: CHARTE.texte }}>
            <strong>{iconeModule(se.module)} {libelleModule(se.module ?? 'nds2026')}</strong>
            <div style={{ fontSize: 12.5, marginTop: 4, color: CHARTE.attenue }}>Choisi par l&apos;organisateur. Les gagnants sont désignés par tirage au sort.</div>
          </div>

          <div style={sectionTitre}>🎁 Votre lot pour le tirage</div>
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 11, marginBottom: 15 }}>
            <div><label style={label}>Lot offert</label><input style={input} value={f.lot} onChange={e => set('lot', e.target.value)} placeholder="ex : 1 bon d'achat de 20 €" /></div>
            <div><label style={label}>Quantité</label><input style={input} inputMode="numeric" value={f.quantite} onChange={e => set('quantite', e.target.value)} /></div>
          </div>
          <div style={field}>
            <label style={label}>Conditions d&apos;utilisation</label>
            <input style={input} value={f.conditions} onChange={e => set('conditions', e.target.value)} placeholder="ex : valable sur présentation du billet" />
            <div style={{ fontSize: 12, color: CHARTE.attenue, marginTop: 6 }}>Facultatif : vous pourrez compléter vos lots avec l&apos;équipe Flowin.</div>
          </div>

          {err && <div style={{ background: '#FEECEC', color: '#B42318', borderRadius: 10, padding: '11px 14px', fontSize: 13.5, marginBottom: 14 }}>{err}</div>}

          <button onClick={submit} disabled={submitting} style={{ width: '100%', background: ORANGE, color: '#fff', fontWeight: 800, fontSize: 16, padding: '15px', borderRadius: 12, border: 'none', cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Envoi…' : `Rejoindre l'opération · ${frais} € HT →`}
          </button>
          <div style={{ fontSize: 12, color: CHARTE.attenue, textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
            Sans engagement. Validation sous 24–48h. Données jamais cédées.
          </div>
        </div>
      </div>
    </div>
  )
}
