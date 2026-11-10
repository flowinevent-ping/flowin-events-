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
import { SECTEURS_PRO, SECTEUR_AUTRE, lireSecteurAutre, lireActivite, nettoyerPrecision, tagsAvecSecteurAutre } from '@/lib/proCreation'
import SelectActivite from '@/components/creation/SelectActivite'
import PrecisionAutre from '@/components/creation/PrecisionAutre'
import { CARD, ACC } from '@/lib/proui'
import { uploaderLogo, redimensionnerImage } from '@/lib/upload'
import { Ico } from '@/lib/proicons'
import { messageFr } from '@/lib/erreursFr'

type Pro = { id: string; nom: string | null; secteur: string | null; adresse: string | null; code_postal: string | null; ville: string | null; siret: string | null; contact: string | null; email: string | null; tel: string | null; partenaire_id: string | null
  /* Fiche entreprise de « Ma premiere fois » (sql/02-pros-entreprise-onboarding.sql) : presents seulement si la migration est appliquee. */
  nom_commercial?: string | null; forme_juridique?: string | null; siren?: string | null; code_naf?: string | null; activite_naf?: string | null; produits_services?: string | null; nb_points_vente?: string | number | null
  /** Tags du pro (la precision du secteur « Autre » y est rangee, voir lib/proCreation). */
  tags?: string[] | null }
type Fiche = { image_url: string | null; site_web: string | null; instagram: string | null; facebook: string | null }

const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#5a6b80', marginBottom: 5, display: 'block' }
const inp: React.CSSProperties = { width: '100%', border: '1.5px solid #E3E8EF', borderRadius: 12, padding: '11px 13px', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 12, background: '#fff' }

export default function EntrepriseForm({ initial, avecFicheEntreprise = false }: { initial: Pro; /** Colonnes du SQL 02 presentes en base : on affiche et on enregistre la fiche entreprise complete. */ avecFicheEntreprise?: boolean }) {
  const [p, setP] = useState<Pro>(initial)
  const [f, setF] = useState<Fiche>({ image_url: null, site_web: null, instagram: null, facebook: null })
  const [etat, setEtat] = useState<'' | 'envoi' | 'ok' | 'ko'>('')
  const [messageKo, setMessageKo] = useState('')
  const [autre, setAutre] = useState(lireSecteurAutre(initial.tags))
  const [activite, setActivite] = useState(lireActivite(initial.tags))
  const [uploadEnCours, setUploadEnCours] = useState(false)
  const [uploadErreur, setUploadErreur] = useState('')

  useEffect(() => {
    if (!initial.partenaire_id) return
    supabase.from('partenaires').select('image_url,site_web,instagram,facebook').eq('id', initial.partenaire_id).maybeSingle()
      .then(({ data }) => { if (data) setF(data as Fiche) })
  }, [initial.partenaire_id])

  async function onFichierLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0]
    e.target.value = ''
    if (!fichier || !p.partenaire_id) return
    setUploadErreur('')
    setUploadEnCours(true)
    const redim = await redimensionnerImage(fichier).catch(() => fichier)
    const res = await uploaderLogo(redim, `partenaires/${p.partenaire_id}`)
    setUploadEnCours(false)
    if ('erreur' in res) { setUploadErreur(res.erreur); return }
    setF(x => ({ ...x, image_url: res.url }))
    setEtat('')
  }

  const champ = (k: keyof Pro, l: string, ph = '') => (
    <label>
      <span style={lbl}>{l}</span>
      <input style={inp} value={String(p[k] ?? '')} placeholder={ph} onChange={e => { setP(x => ({ ...x, [k]: e.target.value })); setEtat('') }} />
    </label>
  )
  const champF = (k: keyof Fiche, l: string, ph = '') => (
    <label>
      <span style={lbl}>{l}</span>
      <input style={inp} value={f[k] ?? ''} placeholder={ph} onChange={e => { setF(x => ({ ...x, [k]: e.target.value })); setEtat('') }} />
    </label>
  )

  async function enregistrer() {
    if (!(p.nom ?? '').trim()) { setMessageKo('Enregistrement impossible : le nom de l’établissement est obligatoire.'); setEtat('ko'); return }
    if ((p.secteur === SECTEUR_AUTRE || (p.secteur === 'Commerce & Négoce' && activite === SECTEUR_AUTRE)) && nettoyerPrecision(autre).length < 3) { setMessageKo('Précisez votre activité (3 lettres minimum) puisque vous avez choisi « Autre ».'); setEtat('ko'); return }
    setEtat('envoi'); setMessageKo('')
    const vide = (v: string | null | undefined) => ((v ?? '').trim() || null)
    const nbPv = parseInt(String(p.nb_points_vente ?? ''), 10)
    const entreprise = avecFicheEntreprise ? {
      nom_commercial: vide(p.nom_commercial), forme_juridique: vide(p.forme_juridique), siren: vide(p.siren),
      code_naf: vide(p.code_naf), activite_naf: vide(p.activite_naf), produits_services: vide(p.produits_services),
      nb_points_vente: nbPv > 0 ? nbPv : null,
    } : {}
    const { error } = await supabase.from('pros').update({
      nom: (p.nom ?? '').trim(), secteur: vide(p.secteur), adresse: vide(p.adresse), code_postal: vide(p.code_postal),
      ville: vide(p.ville), siret: vide(p.siret), contact: vide(p.contact), email: vide(p.email)?.toLowerCase() ?? null, tel: vide(p.tel),
      ...entreprise,
      /* Tags : seulement si la colonne est lue par la page (jamais d'ecrasement a l'aveugle). */
      ...(initial.tags !== undefined ? { tags: tagsAvecSecteurAutre(p.tags ?? initial.tags, p.secteur ?? '', autre, p.secteur === 'Commerce & Négoce' ? activite : '') } : {}),
    }).eq('id', p.id)
    if (error) setMessageKo(`Enregistrement impossible : ${messageFr(error)}`)
    let ko = !!error
    if (p.partenaire_id) {
      const r = await supabase.from('partenaires').update({
        image_url: vide(f.image_url), site_web: vide(f.site_web), instagram: vide(f.instagram), facebook: vide(f.facebook),
        adresse: vide(p.adresse), code_postal: vide(p.code_postal), ville: vide(p.ville), tel: vide(p.tel),
      }).eq('id', p.partenaire_id)
      if (r.error) { ko = true; setMessageKo(m => m || `Fiche commerce non enregistrée : ${messageFr(r.error)}`) }
    }
    setEtat(ko ? 'ko' : 'ok')
  }

  return (
    <>
      {p.partenaire_id && (
        <div style={{ ...CARD, display: 'flex', gap: 18, alignItems: 'center', marginBottom: 14 }}>
          <div style={{ width: 96, height: 96, flexShrink: 0, borderRadius: 16, border: '2px dashed #E3E8EF', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {f.image_url
              ? <img src={f.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={() => setF(x => ({ ...x, image_url: null }))} />
              : <span style={{ fontSize: 34, fontWeight: 900, color: '#B8C4D6' }}>{(p.nom ?? '?').trim().charAt(0).toUpperCase()}</span>}
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <span style={lbl}>Logo de l&apos;établissement</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ background: uploadEnCours ? '#E3E8EF' : ACC, color: uploadEnCours ? '#5a6b80' : '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 800, fontSize: 13, cursor: uploadEnCours ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                {uploadEnCours ? 'Envoi…' : <><Ico k="upload" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Choisir un fichier</>}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display: 'none' }}
                  disabled={uploadEnCours} onChange={onFichierLogo} />
              </label>
              <input style={{ ...inp, flex: 1, minWidth: 180, marginBottom: 0 }} placeholder="ou coller une URL https://…/logo.png"
                value={f.image_url ?? ''} onChange={e => { setF(x => ({ ...x, image_url: e.target.value })); setEtat('') }} />
            </div>
            {uploadErreur && <div style={{ fontSize: 12, color: '#B45309', marginTop: 6, fontWeight: 700 }}>{uploadErreur}</div>}
            <div style={{ fontSize: 11.5, color: '#5a6b80', marginTop: 6 }}>PNG, JPG, WebP ou SVG — 5 Mo max. Affiché sur vos jeux, la carte et les billets.</div>
          </div>
        </div>
      )}
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
          <PrecisionAutre secteur={p.secteur ?? ''} valeur={autre} onChange={v => { setAutre(v); setEtat('') }} id="ent-secteur-autre" style={{ border: '1.5px solid #E3E8EF', fontSize: 14 }} />
          {p.secteur === 'Commerce & Négoce' && (
            <div style={{ marginBottom: 12 }}>
              <span style={lbl}>Votre activité (facultatif)</span>
              <SelectActivite id="ent-activite" valeur={activite} onChange={v => { setActivite(v); setEtat('') }} style={{ ...inp, marginBottom: 0 }} />
              <PrecisionAutre secteur={activite} valeur={autre} onChange={v => { setAutre(v); setEtat('') }} id="ent-activite-autre" style={{ border: '1.5px solid #E3E8EF', fontSize: 14 }} />
            </div>
          )}
          {champ('adresse', 'Adresse', 'N°, rue')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
            {champ('code_postal', 'Code postal')}
            {champ('ville', 'Ville')}
          </div>
          {champ('siret', 'SIRET')}
        </div>
        {avecFicheEntreprise && (
          <div style={CARD}>
            <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 8 }}>Fiche entreprise</div>
            {champ('nom_commercial', 'Nom commercial (enseigne)')}
            {champ('forme_juridique', 'Forme juridique')}
            {champ('siren', 'SIREN')}
            {champ('code_naf', 'Code NAF', 'ex. 10.71C')}
            {champ('activite_naf', 'Activité (libellé NAF)')}
            {champ('produits_services', 'Ce que vous proposez')}
            {champ('nb_points_vente', 'Nombre de points de vente')}
          </div>
        )}
        <div style={CARD}>
          {champ('contact', 'Contact')}
          {champ('email', 'Email')}
          {champ('tel', 'Téléphone')}
          {p.partenaire_id ? (
            <>
              <div style={{ fontSize: 12.5, fontWeight: 800, margin: '6px 0 8px' }}>Liens (affichés sur vos jeux et QR)</div>
              {champF('site_web', 'Site web', 'https://…')}
              {champF('instagram', 'Instagram', '@votrecompte')}
              {champF('facebook', 'Facebook', 'https://facebook.com/…')}
            </>
          ) : (
            <div style={{ fontSize: 12.5, color: '#5a6b80' }}>Logo et liens : votre fiche commerce sera créée par Flowin.</div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14 }}>
        <button onClick={enregistrer} disabled={etat === 'envoi'}
          style={{ background: ACC, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
          {etat === 'envoi' ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {etat === 'ok' && <span style={{ fontSize: 13, color: '#15803D', fontWeight: 700 }}>Coordonnées enregistrées.</span>}
        {etat === 'ko' && <span role="alert" style={{ fontSize: 13, color: '#B45309', fontWeight: 700 }}>{messageKo || 'Enregistrement impossible. Réessayez dans un instant.'}</span>}
      </div>
    </>
  )
}
