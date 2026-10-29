'use client'

/**
 * PARCOURS DE CREATION — cote Super Admin.
 *
 * Le SA cree une animation pour onboarder un pro : il choisit d abord le pro
 * (existant, ou inscrit ici — l etape « Inscription » de la maquette), puis il
 * voit EXACTEMENT le parcours du pro (components/creation/ParcoursCreation),
 * avec ses droits a lui : rattachement direct a un super event, creation de
 * super event. Pour un super event, le choix du pro est saute : les pros
 * participants se cochent dans le parcours.
 *
 * Pre-saisie par l URL : ?pro= ?se= ?nom= ?d= ?f= ?module=
 */

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDashboard } from '@/contexts/DashboardContext'
import { supabase } from '@/lib/supabase'
import { fetchBanquesToutes, type Banque } from '@/lib/banques'
import { upsertPro } from '@/lib/dashboard'
import { ficheProVide, identifiantPro, lignePro, SECTEURS_PRO, type FichePro } from '@/lib/proCreation'
import type { FlowinPro } from '@/lib/types'
import { CHARTE_PRO as C, ACCENT_ANIM } from '@/lib/charte'
import { CARD, CHAMP, LABEL, BTN, BTN2, MUTED, choix } from '@/lib/proui'
import { Ico } from '@/lib/proicons'
import ParcoursCreation, { PC_CSS, PastillesEtapes, type ProNouvelle, type SuperOuvert, type ProCatalogue } from './ParcoursCreation'

const versPro = (x: FlowinPro): ProNouvelle => ({
  id: x.id, nom: x.nom ?? null, secteur: x.secteur ?? null, adresse: x.adresse ?? null,
  code_postal: x.code_postal ?? null, ville: x.ville ?? null, email: x.email ?? null, tel: x.tel ?? null,
  contact: x.contact ?? null, partenaire_id: x.partenaire_id ?? null, statut: x.statut ?? null,
})

/** Super events ouverts aux rattachements : meme lecture que /pro/nouvelle (sans
 *  le geocodage, qui ecrit en base : la carte prend les coordonnees deja connues). */
async function chargerSupers(): Promise<SuperOuvert[]> {
  const { data: ses } = await supabase.from('super_events').select('id,nom,status,date_d,date_f,description,logo_url,module,cfg_jeu,pro_id,frais_pro,events')
    .neq('id', 'se-master-superevent').not('status', 'in', '("past","pending")').order('date_d', { ascending: false })
  const liste = (ses ?? []) as (SuperOuvert & { events: string[] | null })[]
  const premieres = liste.map(s => (s.events ?? [])[0]).filter(Boolean) as string[]
  const { data: st } = premieres.length
    ? await supabase.from('events').select('id,lat,lng').in('id', premieres)
    : { data: [] as { id: string; lat: number | null; lng: number | null }[] }
  const parId = new Map(((st ?? []) as { id: string; lat: number | null; lng: number | null }[]).map(e => [e.id, e]))
  return liste.map(s => {
    const premiere = (s.events ?? [])[0] ?? null
    const station = premiere ? parId.get(premiere) : null
    return { ...s, station: premiere, lat: station?.lat ?? null, lng: station?.lng ?? null }
  })
}

export default function ParcoursCreationSA({ typeInitial = null }: { typeInitial?: 'animation' | 'super' | null }) {
  const params = useSearchParams()
  const { pros, setPros } = useDashboard()
  const proParam = params.get('pro') ?? ''
  const seParam = params.get('se') ?? ''
  const prefill = useMemo(() => ({
    nom: params.get('nom') ?? undefined, dateD: params.get('d') ?? undefined,
    dateF: params.get('f') ?? undefined, module: params.get('module') ?? undefined,
  }), [params])

  const [banques, setBanques] = useState<Banque[]>([])
  const [supers, setSupers] = useState<SuperOuvert[]>([])
  useEffect(() => {
    fetchBanquesToutes().then(setBanques)
    chargerSupers().then(setSupers).catch(() => setSupers([]))
  }, [])

  const [proId, setProId] = useState(proParam)
  const [ecran, setEcran] = useState<'choix' | 'liste' | 'nouveau'>('choix')
  const [recherche, setRecherche] = useState('')
  const [f, setF] = useState<FichePro>(ficheProVide())
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState('')
  useEffect(() => { if (proParam) setProId(proParam) }, [proParam])

  const pro = pros.find(x => x.id === proId) ?? null
  const catalogue: ProCatalogue[] = useMemo(() => pros.map(x => ({
    id: x.id, nom: x.nom ?? null, contact: x.contact ?? null, ville: x.ville ?? null,
    tel: x.tel ?? null, email: x.email ?? null, secteur: x.secteur ?? null,
  })), [pros])

  /* Super event : pas de choix de pro prealable, les participants se cochent
     dans le parcours (le pro de l URL, s il y en a un, est pre-coche). */
  if (typeInitial === 'super') {
    return (
      <ParcoursCreation mode="sa" pro={pro ? versPro(pro) : null} banques={banques} supers={supers} packs={[]}
        typeInitial="super" prefill={prefill} prosCatalogue={catalogue} />
    )
  }

  if (pro) {
    return (
      <ParcoursCreation key={pro.id} mode="sa" pro={versPro(pro)} banques={banques} supers={supers} packs={[]}
        typeInitial={seParam ? 'rejoindre' : prefill.module ? 'animation' : typeInitial} seInitial={seParam || null}
        prefill={prefill} prosCatalogue={catalogue} onChangerPro={() => { setProId(''); setEcran('choix') }} />
    )
  }

  const id = identifiantPro(f)
  const idPris = !!id && pros.some(x => x.id === id)
  const nomPris = !!f.nom.trim() && pros.some(x => (x.nom ?? '').trim().toLowerCase() === f.nom.trim().toLowerCase())
  const bloque = !f.nom.trim() ? 'Indiquez le nom de l’établissement.'
    : idPris ? 'Ce pro existe déjà : choisissez-le dans la liste.'
    : !f.secteur ? 'Choisissez le secteur.'
    : !f.ville.trim() ? 'Indiquez la ville.'
    : !f.email.includes('@') && !f.tel.trim() ? 'Un email ou un téléphone.' : null
  const maj = (c: Partial<FichePro>) => setF(x => ({ ...x, ...c }))

  async function inscrire() {
    setOccupe(true); setErreur('')
    const ligne = lignePro(f, 'sa', 'valide')
    const ok = await upsertPro(ligne)
    setOccupe(false)
    if (!ok) { setErreur('L’enregistrement a échoué. Rien n’a été écrit.'); return }
    setPros([...pros, { ...ligne, entree_p: null, tags: [], partenaire_id: null, auth_id: null } as unknown as FlowinPro])
    setProId(ligne.id)
  }

  const filtres = (() => {
    const t = recherche.trim().toLowerCase()
    const l = t ? pros.filter(x => [x.nom, x.contact, x.ville, x.secteur].some(v => (v ?? '').toLowerCase().includes(t))) : pros
    return l.slice().sort((a, b) => (a.nom ?? '').localeCompare(b.nom ?? '', 'fr'))
  })()

  return (
    <div style={{ maxWidth: 1000 }}>
      <style dangerouslySetInnerHTML={{ __html: PC_CSS }} />
      <div style={{ marginBottom: 16 }}>
        <PastillesEtapes etapes={['Inscription', 'Créer ou rejoindre', 'Jeu', 'Lots', 'Diffusion & QR']} courante={0} />
      </div>

      {ecran === 'choix' && (
        <>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Pour quel pro ?</div>
          <div style={{ fontSize: 13.5, ...MUTED, margin: '4px 0 18px' }}>Vous créez pour un pro : choisissez-le, ou inscrivez-le. Il retrouvera tout dans son espace.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
            {[
              { k: 'liste' as const, t: 'Un pro déjà inscrit', s: `Choisir dans le CRM pro (${pros.length} pro${pros.length > 1 ? 's' : ''}).`, i: 'users', cta: 'Choisir' },
              { k: 'nouveau' as const, t: 'Inscrire un nouveau pro', s: 'Ses coordonnées en 2 minutes : la suite se pré-remplit ensuite.', i: 'plus', cta: 'Inscrire' },
            ].map(c => (
              <button key={c.k} className="nop-carte" onClick={() => setEcran(c.k)}
                style={{ ...choix(false), padding: '34px 26px 28px', background: '#fff', ['--acc' as string]: ACCENT_ANIM, ['--acc-tint' as string]: `${ACCENT_ANIM}17` } as React.CSSProperties}>
                <span className="nop-filet" />
                <div className="nop-halo"><Ico k={c.i} size={32} /></div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{c.t}</div>
                <div style={{ fontSize: 13, ...MUTED, marginTop: 8, lineHeight: 1.55, maxWidth: 260 }}>{c.s}</div>
                <div className="nop-spacer" />
                <span className="nop-cta">{c.cta} <span className="nop-fleche">→</span></span>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12.5, ...MUTED, marginTop: 16 }}>
            Pour créer un super event, passez par <a href="/dashboard/wizard-super-event" style={{ color: C.accent, fontWeight: 700 }}>Créer un super event</a> : les pros participants s’y cochent.
          </div>
        </>
      )}

      {ecran === 'liste' && (
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Choisir le pro</div>
            <button style={{ ...BTN2, marginLeft: 'auto', padding: '8px 14px', fontSize: 12.5 }} onClick={() => setEcran('choix')}>← Retour</button>
          </div>
          <input style={{ ...CHAMP, marginBottom: 12 }} value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher (nom, contact, ville, secteur)…" />
          <div style={{ maxHeight: 520, overflowY: 'auto', paddingRight: 4 }}>
            {filtres.map(x => (
              <button key={x.id} type="button" className="pc-ligne-pro" onClick={() => setProId(x.id)}>
                <span style={{ width: 34, height: 34, borderRadius: 999, background: `${ACCENT_ANIM}14`, color: ACCENT_ANIM, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Ico k="shop" size={16} /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ display: 'block', fontSize: 13.5 }}>{x.nom || x.id}</b>
                  <span style={{ fontSize: 12, ...MUTED }}>{[x.contact, x.ville, x.secteur].filter(Boolean).join(' · ') || '—'}</span>
                </span>
                <span style={{ fontSize: 12, ...MUTED, textAlign: 'right' }}>{[x.tel, x.email].filter(Boolean).join(' · ')}</span>
              </button>
            ))}
            {filtres.length === 0 && <div style={{ fontSize: 13, ...MUTED }}>Aucun pro ne correspond.</div>}
          </div>
        </div>
      )}

      {ecran === 'nouveau' && (
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Inscrire un nouveau pro</div>
            <button style={{ ...BTN2, marginLeft: 'auto', padding: '8px 14px', fontSize: 12.5 }} onClick={() => setEcran('choix')}>← Retour</button>
          </div>
          <div style={{ fontSize: 13, ...MUTED, marginBottom: 16 }}>Ses coordonnées : le reste se pré-remplit ensuite.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
            <label style={{ display: 'block' }}><span style={LABEL}>Nom de l’établissement</span><input style={CHAMP} value={f.nom} onChange={e => maj({ nom: e.target.value })} placeholder="Ex. Pizzeria Bellini" /></label>
            <label style={{ display: 'block' }}><span style={LABEL}>Secteur</span>
              <select style={CHAMP} value={f.secteur} onChange={e => maj({ secteur: e.target.value })}>
                <option value="">— Choisir —</option>
                {(SECTEURS_PRO as readonly string[]).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <label style={{ display: 'block', marginTop: 12 }}><span style={LABEL}>Adresse</span><input style={CHAMP} value={f.adresse} onChange={e => maj({ adresse: e.target.value })} placeholder="N°, rue" /></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginTop: 12 }}>
            <label style={{ display: 'block' }}><span style={LABEL}>Code postal</span><input style={CHAMP} value={f.codePostal} onChange={e => maj({ codePostal: e.target.value })} /></label>
            <label style={{ display: 'block' }}><span style={LABEL}>Ville</span><input style={CHAMP} value={f.ville} onChange={e => maj({ ville: e.target.value })} /></label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginTop: 12 }}>
            <label style={{ display: 'block' }}><span style={LABEL}>Contact</span><input style={CHAMP} value={f.contact} onChange={e => maj({ contact: e.target.value })} placeholder="Prénom Nom" /></label>
            <label style={{ display: 'block' }}><span style={LABEL}>Email</span><input style={CHAMP} type="email" value={f.email} onChange={e => maj({ email: e.target.value })} /></label>
            <label style={{ display: 'block' }}><span style={LABEL}>Téléphone</span><input style={CHAMP} type="tel" value={f.tel} onChange={e => maj({ tel: e.target.value })} /></label>
          </div>
          <div style={{ fontSize: 12, ...MUTED, marginTop: 10 }}>
            Identifiant : <b style={{ color: C.texte }}>{id || 'pro-…'}</b>{nomPris && !idPris ? ' · un pro porte déjà ce nom, vérifiez qu’il ne s’agit pas du même.' : ''}
          </div>
          {erreur && <div style={{ fontSize: 13, color: '#B91C1C', fontWeight: 700, marginTop: 10 }}>{erreur}</div>}
          {bloque && <div style={{ fontSize: 12.5, color: '#B45309', fontWeight: 700, marginTop: 12, textAlign: 'right' }}>{bloque}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
            <button style={{ ...BTN, opacity: bloque || occupe ? 0.45 : 1 }} disabled={!!bloque || occupe} onClick={inscrire}>{occupe ? 'Enregistrement…' : 'Inscrire et continuer →'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
