'use client'

/**
 * MODALE « PARTENAIRES & LOGOS » d'une operation (verification du 01/11).
 * Avant : les logos ne se changeaient que depuis la fiche partenaire du Super Admin,
 * et aucun ecran ne permettait d'AJOUTER un partenaire / sponsor a une animation ni
 * cote Super Admin ni cote pro. Cette modale est montee a cote de « Gerer les lots »
 * (components/operations/BlocsOperations.tsx : BoutonGererLots), donc elle est IDENTIQUE
 * et presente aux deux endroits (fiche pro du Super Admin, espace pro).
 *
 * Ce qu'elle ecrit (aucune donnee inventee) :
 *  - table `partenaires` : nom, image_url (logo), site_web, actif, visible ;
 *  - super event : la ligne porte super_event_id = l'operation (le parcours joueur
 *    lit « tous les partenaires du super event ») ;
 *  - animation autonome : l'id est ajoute a events.cfg.partenaires (liste lue par le parcours).
 * Logo : bucket Supabase Storage `logos` (lib/upload.ts) ; PNG, JPG, WebP ou SVG, 5 Mo max,
 * redimensionne a 512 px cote navigateur. Le bandeau « Nos partenaires » du jeu et la page
 * « Partenaires » du jeu les lisent immediatement.
 */
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { uploaderLogo, redimensionnerImage } from '@/lib/upload'
import type { DonneesOperation } from '@/lib/operations'
import { messageFr } from '@/lib/erreursFr'

interface Ligne { id: string; nom: string | null; image_url: string | null; site_web: string | null; actif: boolean | null }
const CHAMP: React.CSSProperties = { width: '100%', border: '1.5px solid #E3E9F8', borderRadius: 9, padding: '9px 11px', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }
const BTN: React.CSSProperties = { border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }

function slug(s: string) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'partenaire' }

export default function ModalPartenaires({ op, onClose, onChange }: { op: DonneesOperation; onClose: () => void; onChange?: () => void }) {
  const estSuper = op.type === 'super'
  const stationIds = op.stations.map(s => s.id)
  const evRef = stationIds[0] || ''
  const [lignes, setLignes] = useState<Ligne[] | null>(null)
  const [nom, setNom] = useState('')
  const [site, setSite] = useState('')
  const [logo, setLogo] = useState<File | null>(null)
  const [apercu, setApercu] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const [envoi, setEnvoi] = useState(false)

  const charger = useCallback(async () => {
    if (estSuper) {
      const { data } = await supabase.from('partenaires').select('id,nom,image_url,site_web,actif').eq('super_event_id', op.id).order('nom')
      setLignes((data ?? []) as Ligne[])
    } else {
      const { data: ev } = await supabase.from('events').select('cfg').eq('id', evRef).maybeSingle()
      const ids = (((ev as { cfg?: { partenaires?: string[] } } | null)?.cfg?.partenaires) ?? []) as string[]
      if (!ids.length) { setLignes([]); return }
      const { data } = await supabase.from('partenaires').select('id,nom,image_url,site_web,actif').in('id', ids)
      setLignes((data ?? []) as Ligne[])
    }
  }, [estSuper, op.id, evRef])
  useEffect(() => { charger() }, [charger])

  function choisirFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setMsg(null)
    if (!f) { setLogo(null); setApercu(''); return }
    if (['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].indexOf(f.type) < 0) { setLogo(null); setApercu(''); setMsg({ ok: false, t: 'Format non accepté (PNG, JPG, WebP ou SVG uniquement).' }); return }
    if (f.size > 5 * 1024 * 1024) { setLogo(null); setApercu(''); setMsg({ ok: false, t: 'Fichier trop lourd (5 Mo maximum).' }); return }
    setLogo(f); setApercu(URL.createObjectURL(f))
  }

  async function ajouter() {
    setMsg(null)
    if (!nom.trim()) { setMsg({ ok: false, t: 'Indiquez le nom du partenaire.' }); return }
    if (site.trim() && !/^https?:\/\/\S+\.\S+/.test(site.trim())) { setMsg({ ok: false, t: 'Le lien du site doit commencer par https://' }); return }
    setEnvoi(true)
    const id = `pt-${slug(nom)}-${Math.random().toString(36).slice(2, 6)}`
    let image_url: string | null = null
    if (logo) {
      const redim = await redimensionnerImage(logo).catch(() => logo)
      const r = await uploaderLogo(redim, `partenaires/${id}`)
      if ('erreur' in r) { setEnvoi(false); setMsg({ ok: false, t: r.erreur }); return }
      image_url = r.url
    }
    const ligne: Record<string, unknown> = { id, nom: nom.trim(), image_url, site_web: site.trim() || null, actif: true, visible: true, type: 'Sponsor' }
    if (estSuper) ligne.super_event_id = op.id
    const { error } = await supabase.from('partenaires').insert(ligne)
    if (error) { setEnvoi(false); setMsg({ ok: false, t: 'Partenaire non enregistré — ' + messageFr(error) }); return }
    if (!estSuper) {
      const { data: ev } = await supabase.from('events').select('cfg').eq('id', evRef).maybeSingle()
      const cfg = ((ev as { cfg?: Record<string, unknown> } | null)?.cfg ?? {}) as Record<string, unknown>
      const ids = ((cfg.partenaires ?? []) as string[]).concat([id])
      const { error: e2 } = await supabase.from('events').update({ cfg: { ...cfg, partenaires: ids } }).eq('id', evRef)
      if (e2) { setEnvoi(false); setMsg({ ok: false, t: 'Partenaire créé mais non rattaché à l’animation — ' + messageFr(e2) }); return }
    }
    setEnvoi(false); setNom(''); setSite(''); setLogo(null); setApercu('')
    setMsg({ ok: true, t: 'Partenaire ajouté : il apparaît dans le bandeau du jeu et sur la page Partenaires.' })
    await charger(); onChange?.()
  }

  async function changerLogo(l: Ligne, f: File | null) {
    if (!f) return
    setMsg(null)
    if (['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].indexOf(f.type) < 0) { setMsg({ ok: false, t: 'Format non accepté (PNG, JPG, WebP ou SVG uniquement).' }); return }
    if (f.size > 5 * 1024 * 1024) { setMsg({ ok: false, t: 'Fichier trop lourd (5 Mo maximum).' }); return }
    const redim = await redimensionnerImage(f).catch(() => f)
    const r = await uploaderLogo(redim, `partenaires/${l.id}`)
    if ('erreur' in r) { setMsg({ ok: false, t: r.erreur }); return }
    const { error } = await supabase.from('partenaires').update({ image_url: r.url }).eq('id', l.id)
    if (error) { setMsg({ ok: false, t: 'Logo non enregistré — ' + messageFr(error) }); return }
    setMsg({ ok: true, t: 'Logo remplacé.' }); await charger(); onChange?.()
  }

  async function retirer(l: Ligne) {
    if (!confirm(`Retirer « ${l.nom} » de cette animation ?`)) return
    setMsg(null)
    if (estSuper) {
      const { error } = await supabase.from('partenaires').update({ actif: false }).eq('id', l.id)
      if (error) { setMsg({ ok: false, t: messageFr(error) }); return }
    } else {
      const { data: ev } = await supabase.from('events').select('cfg').eq('id', evRef).maybeSingle()
      const cfg = ((ev as { cfg?: Record<string, unknown> } | null)?.cfg ?? {}) as Record<string, unknown>
      const ids = ((cfg.partenaires ?? []) as string[]).filter(x => x !== l.id)
      const { error } = await supabase.from('events').update({ cfg: { ...cfg, partenaires: ids } }).eq('id', evRef)
      if (error) { setMsg({ ok: false, t: messageFr(error) }); return }
    }
    setMsg({ ok: true, t: 'Partenaire retiré du jeu.' }); await charger(); onChange?.()
  }

  const actifs = (lignes ?? []).filter(l => l.actif !== false)
  return (
    <div role="dialog" aria-modal="true" aria-label="Partenaires et logos" data-modal-partenaires
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(27,58,92,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 560, maxHeight: '92dvh', overflow: 'auto', padding: 22, color: '#1B3A5C' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ fontSize: 19, fontWeight: 900, flex: 1 }}>Partenaires & logos</div>
          <button onClick={onClose} aria-label="Fermer" style={{ ...BTN, background: '#F4F6F9', color: '#1B3A5C', padding: '6px 12px' }}>×</button>
        </div>
        <div style={{ fontSize: 12.5, opacity: .7, marginBottom: 14 }}>{op.nom} — les partenaires s’affichent dans le bandeau « Nos partenaires » du jeu et sur la page Partenaires.</div>

        {msg && <div role="status" data-msg-partenaires style={{ fontSize: 13, fontWeight: 700, padding: '8px 12px', borderRadius: 10, marginBottom: 12, background: msg.ok ? '#DCFCE7' : '#FEE2E2', color: msg.ok ? '#166534' : '#991B1B' }}>{msg.t}</div>}

        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', opacity: .6, marginBottom: 6 }}>Partenaires actuels ({actifs.length})</div>
        {lignes === null && <div style={{ fontSize: 13, opacity: .6 }}>Chargement…</div>}
        {lignes && actifs.length === 0 && <div style={{ fontSize: 13, opacity: .6, marginBottom: 8 }}>Aucun partenaire pour l’instant.</div>}
        <div style={{ display: 'grid', gap: 8, marginBottom: 18 }}>
          {actifs.map(l => (
            <div key={l.id} data-partenaire-ligne={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #E3E9F8', borderRadius: 12, padding: '8px 10px' }}>
              <span style={{ width: 52, height: 40, display: 'grid', placeItems: 'center', background: '#F4F6F9', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                {l.image_url ? <img src={l.image_url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 11, opacity: .5 }}>logo</span>}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}><b style={{ fontSize: 14 }}>{l.nom}</b>{l.site_web ? <span style={{ display: 'block', fontSize: 11.5, opacity: .6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.site_web}</span> : null}</span>
              <label style={{ ...BTN, background: '#F4F6F9', color: '#1B3A5C', padding: '6px 10px', fontSize: 12 }}>Logo<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" data-changer-logo={l.id} style={{ display: 'none' }} onChange={e => { changerLogo(l, e.target.files?.[0] ?? null); e.target.value = '' }} /></label>
              <button onClick={() => retirer(l)} aria-label={'Retirer ' + l.nom} style={{ ...BTN, background: 'transparent', color: '#991B1B', padding: '6px 8px' }}>Retirer</button>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', opacity: .6, marginBottom: 6 }}>Ajouter un partenaire / sponsor</div>
        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ fontSize: 13, fontWeight: 700 }}>Nom<input style={{ ...CHAMP, marginTop: 4 }} value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom du commerce ou de la marque" data-champ-nom /></label>
          <label style={{ fontSize: 13, fontWeight: 700 }}>Site (facultatif)<input style={{ ...CHAMP, marginTop: 4 }} value={site} onChange={e => setSite(e.target.value)} placeholder="https://…" /></label>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Logo (PNG, JPG, WebP ou SVG — 5 Mo max)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 64, height: 48, display: 'grid', placeItems: 'center', background: '#F4F6F9', borderRadius: 8, overflow: 'hidden' }}>{apercu ? <img src={apercu} alt="Aperçu du logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 11, opacity: .5 }}>aperçu</span>}</span>
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={choisirFichier} data-champ-logo />
            </div>
          </div>
          <button onClick={ajouter} disabled={envoi} data-valider-partenaire style={{ ...BTN, background: '#7A4FE0', color: '#fff', opacity: envoi ? .6 : 1 }}>{envoi ? 'Enregistrement…' : 'Ajouter le partenaire'}</button>
        </div>
      </div>
    </div>
  )
}
