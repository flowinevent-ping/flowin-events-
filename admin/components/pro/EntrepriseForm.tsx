'use client'

/**
 * MON ENTREPRISE — referentiel 1 : les coordonnees de l etablissement,
 * saisies a l inscription, sont modifiables ici.
 *   - pros : nom, secteur, adresse, code postal, ville, SIRET, contact, email, tel ;
 *   - fiche commerce (partenaires) : logo, site web, Instagram, Facebook — ce
 *     qui s affiche sur les jeux, la carte et les billets.
 */

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { SECTEURS_PRO } from '@/lib/proCreation'
import { CARD, ACC } from '@/lib/proui'

type Pro = { id: string; nom: string | null; secteur: string | null; adresse: string | null; code_postal: string | null; ville: string | null; siret: string | null; contact: string | null; email: string | null; tel: string | null; partenaire_id: string | null }
type Fiche = { image_url: string | null; site_web: string | null; instagram: string | null; facebook: string | null }

const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#8a7e93', marginBottom: 5, display: 'block' }
const inp: React.CSSProperties = { width: '100%', border: '1.5px solid #efe9f2', borderRadius: 12, padding: '11px 13px', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 12, background: '#fff' }

export default function EntrepriseForm({ initial }: { initial: Pro }) {
  const [p, setP] = useState<Pro>(initial)
  const [f, setF] = useState<Fiche>({ image_url: null, site_web: null, instagram: null, facebook: null })
  const [etat, setEtat] = useState<'' | 'envoi' | 'ok' | 'ko'>('')

  useEffect(() => {
    if (!initial.partenaire_id) return
    supabase.from('partenaires').select('image_url,site_web,instagram,facebook').eq('id', initial.partenaire_id).maybeSingle()
      .then(({ data }) => { if (data) setF(data as Fiche) })
  }, [initial.partenaire_id])

  const champ = (k: keyof Pro, l: string, ph = '') => (
    <label>
      <span style={lbl}>{l}</span>
      <input style={inp} value={(p[k] as string) ?? ''} placeholder={ph} onChange={e => { setP(x => ({ ...x, [k]: e.target.value })); setEtat('') }} />
    </label>
  )
  const champF = (k: keyof Fiche, l: string, ph = '') => (
    <label>
      <span style={lbl}>{l}</span>
      <input style={inp} value={f[k] ?? ''} placeholder={ph} onChange={e => { setF(x => ({ ...x, [k]: e.target.value })); setEtat('') }} />
    </label>
  )

  async function enregistrer() {
    if (!(p.nom ?? '').trim()) { setEtat('ko'); return }
    setEtat('envoi')
    const vide = (v: string | null) => ((v ?? '').trim() || null)
    const { error } = await supabase.from('pros').update({
      nom: (p.nom ?? '').trim(), secteur: vide(p.secteur), adresse: vide(p.adresse), code_postal: vide(p.code_postal),
      ville: vide(p.ville), siret: vide(p.siret), contact: vide(p.contact), email: vide(p.email)?.toLowerCase() ?? null, tel: vide(p.tel),
    }).eq('id', p.id)
    let ko = !!error
    if (p.partenaire_id) {
      const r = await supabase.from('partenaires').update({
        image_url: vide(f.image_url), site_web: vide(f.site_web), instagram: vide(f.instagram), facebook: vide(f.facebook),
        adresse: vide(p.adresse), code_postal: vide(p.code_postal), ville: vide(p.ville), tel: vide(p.tel),
      }).eq('id', p.partenaire_id)
      if (r.error) ko = true
    }
    setEtat(ko ? 'ko' : 'ok')
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
        <div style={CARD}>
          {champ('nom', 'Établissement *')}
          <label>
            <span style={lbl}>Secteur</span>
            <select style={inp} value={p.secteur ?? ''} onChange={e => { setP(x => ({ ...x, secteur: e.target.value })); setEtat('') }}>
              <option value="">— Choisir —</option>
              {(p.secteur && (SECTEURS_PRO as readonly string[]).indexOf(p.secteur) < 0 ? [p.secteur] : []).concat(SECTEURS_PRO as readonly string[]).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          {champ('adresse', 'Adresse', 'N°, rue')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
            {champ('code_postal', 'Code postal')}
            {champ('ville', 'Ville')}
          </div>
          {champ('siret', 'SIRET')}
        </div>
        <div style={CARD}>
          {champ('contact', 'Contact')}
          {champ('email', 'Email')}
          {champ('tel', 'Téléphone')}
          {p.partenaire_id ? (
            <>
              <div style={{ fontSize: 12.5, fontWeight: 800, margin: '6px 0 8px' }}>Logo &amp; liens (affichés sur vos jeux et QR)</div>
              {champF('image_url', 'Logo (adresse de l’image)', 'https://…/logo.png')}
              {f.image_url && <img src={f.image_url} alt="" style={{ maxHeight: 48, marginBottom: 12 }} />}
              {champF('site_web', 'Site web', 'https://…')}
              {champF('instagram', 'Instagram', '@votrecompte')}
              {champF('facebook', 'Facebook', 'https://facebook.com/…')}
            </>
          ) : (
            <div style={{ fontSize: 12.5, color: '#8a7e93' }}>Logo et liens : votre fiche commerce sera créée par Flowin.</div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14 }}>
        <button onClick={enregistrer} disabled={etat === 'envoi'}
          style={{ background: ACC, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
          {etat === 'envoi' ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {etat === 'ok' && <span style={{ fontSize: 13, color: '#15803D', fontWeight: 700 }}>Coordonnées enregistrées.</span>}
        {etat === 'ko' && <span style={{ fontSize: 13, color: '#B45309', fontWeight: 700 }}>Enregistrement impossible — le nom est obligatoire.</span>}
      </div>
    </>
  )
}
