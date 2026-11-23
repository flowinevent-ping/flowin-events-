'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Carte Flowin des commerces (audit 17/11/2026).
 * - Fond : MapLibre GL + tuiles vectorielles OpenFreeMap (gratuit, sans clé, lisible).
 * - Marqueurs : bleu = Animation, orange = Super Event, violet = les deux ; halo animé
 *   quand un jeu est en cours ; le commerce choisi grossit.
 * - « Autour de moi » : la géolocalisation n'est demandée qu'au geste du joueur ; elle
 *   affiche la position, la distance de chaque commerce et trie le carrousel.
 * - Carrousel horizontal synchronisé avec les marqueurs (jamais de longue liste).
 * - Itinéraire en un geste : Plans (iOS) / Google Maps + Waze.
 * Utilisée par /dashboard/carte-reseau (SA) et /carte-commerces (public, sans login).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { COULEUR_TYPE, LIBELLE_TYPE, filtrer, type CommerceCarte, type FiltreCarte } from '@/lib/carteReseau'
import { libelleModule } from '@/lib/operations'
import { CENTRE_VENCE, STYLE_CARTE, chargerMapLibre, distanceM, itineraires, libelleDistance, minutesAPied } from './maplibre'

const FILTRES: FiltreCarte[] = ['les_deux', 'animation', 'super_event']
const LIBELLE_FILTRE: Record<FiltreCarte, string> = { les_deux: 'Tous', animation: 'Animation', super_event: 'Super Event' }
const NAVY = '#1B3A5C'
const GRIS = '#5a6b80'

type Pos = { lat: number; lng: number }
type Etat = 'attente' | 'ok' | 'erreur'

export default function CarteCommerces({ commerces, mode, hauteur = 420 }: {
  commerces: CommerceCarte[]; mode: 'sa' | 'public'; hauteur?: number | string
}) {
  const [filtre, setFiltre] = useState<FiltreCarte>('les_deux')
  const [choisi, setChoisi] = useState<string>('')
  const [moi, setMoi] = useState<Pos | null>(null)
  const [geo, setGeo] = useState<'' | 'cherche' | 'refus'>('')
  const [etat, setEtat] = useState<Etat>('attente')
  const boite = useRef<HTMLDivElement>(null)
  const rail = useRef<HTMLDivElement>(null)
  const carte = useRef<any>(null)
  const marqueurs = useRef<Record<string, { m: any; el: HTMLElement }>>({})
  const moiMarqueur = useRef<any>(null)
  const parProgramme = useRef(false)

  const visibles = useMemo(() => {
    const l = filtrer(commerces, filtre).map(c => ({ c, d: moi ? distanceM(moi.lat, moi.lng, c.lat, c.lng) : null as number | null }))
    if (moi) l.sort((a, b) => (a.d ?? 0) - (b.d ?? 0))
    else l.sort((a, b) => Number(!!b.c.en_cours) - Number(!!a.c.en_cours))
    return l
  }, [commerces, filtre, moi])

  /* Création de la carte (une fois). */
  useEffect(() => {
    let annule = false
    chargerMapLibre().then((ml) => {
      if (annule || !boite.current) return
      if (!ml) { setEtat('erreur'); return }
      try {
        const map = new ml.Map({
          container: boite.current, style: STYLE_CARTE, center: CENTRE_VENCE, zoom: 14.5,
          attributionControl: { compact: true }, cooperativeGestures: false, dragRotate: false, pitchWithRotate: false,
        })
        map.touchZoomRotate.disableRotation()
        map.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right')
        carte.current = map
        map.on('load', () => { if (!annule) setEtat('ok') })
        map.on('error', () => { /* tuile manquante : sans effet sur l'usage */ })
      } catch { setEtat('erreur') }
    })
    return () => {
      annule = true
      if (carte.current) { carte.current.remove(); carte.current = null }
      marqueurs.current = {}
    }
  }, [])

  /* Marqueurs (à chaque filtre). */
  useEffect(() => {
    const map = carte.current, ml = typeof window !== 'undefined' ? window.maplibregl : null
    if (!map || !ml || etat !== 'ok') return
    Object.values(marqueurs.current).forEach(x => x.m.remove())
    marqueurs.current = {}
    visibles.forEach(({ c }) => {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'flpin' + (c.en_cours ? ' flpin-vif' : '')
      el.setAttribute('aria-label', c.nom ?? 'Commerce')
      el.style.setProperty('--c', COULEUR_TYPE[c.type])
      el.innerHTML = `<span>${(c.nom ?? '?').slice(0, 1).toUpperCase().replace(/[<>&"]/g, '')}</span>`
      el.addEventListener('click', (e) => { e.stopPropagation(); setChoisi(c.cle); defilerVers(c.cle) })
      const m = new ml.Marker({ element: el, anchor: 'bottom' }).setLngLat([c.lng, c.lat]).addTo(map)
      el.setAttribute('aria-label', c.nom ?? 'Commerce')
      marqueurs.current[c.cle] = { m, el }
    })
    if (!moi && visibles.length > 1) {
      const b = new ml.LngLatBounds()
      visibles.forEach(({ c }) => b.extend([c.lng, c.lat]))
      map.fitBounds(b, { padding: { top: 70, bottom: 190, left: 40, right: 40 }, maxZoom: 16, duration: 0 })
    } else if (!moi && visibles.length === 1) {
      map.jumpTo({ center: [visibles[0].c.lng, visibles[0].c.lat], zoom: 16 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat, visibles])

  /* Marqueur choisi : mis en avant + recentrage doux. */
  useEffect(() => {
    Object.entries(marqueurs.current).forEach(([k, x]) => x.el.classList.toggle('flpin-on', k === choisi))
    const x = marqueurs.current[choisi]
    if (x && carte.current) carte.current.easeTo({ center: x.m.getLngLat(), offset: [0, -60], duration: 450 })
  }, [choisi])

  function defilerVers(cle: string) {
    const el = rail.current?.querySelector(`[data-cle="${cle}"]`) as HTMLElement | null
    if (!el || !rail.current) return
    parProgramme.current = true
    rail.current.scrollTo({ left: el.offsetLeft - (rail.current.clientWidth - el.clientWidth) / 2, behavior: 'smooth' })
    window.setTimeout(() => { parProgramme.current = false }, 600)
  }

  /* Carrousel → carte : la fiche centrée devient le commerce choisi. */
  useEffect(() => {
    const r = rail.current
    if (!r) return
    let t = 0
    const surDefilement = () => {
      window.clearTimeout(t)
      t = window.setTimeout(() => {
        if (parProgramme.current) return
        const milieu = r.scrollLeft + r.clientWidth / 2
        let meilleur = '', ecart = Infinity
        r.querySelectorAll<HTMLElement>('[data-cle]').forEach(el => {
          const d = Math.abs(el.offsetLeft + el.clientWidth / 2 - milieu)
          if (d < ecart) { ecart = d; meilleur = el.dataset.cle || '' }
        })
        if (meilleur) setChoisi(meilleur)
      }, 140)
    }
    r.addEventListener('scroll', surDefilement, { passive: true })
    return () => { r.removeEventListener('scroll', surDefilement); window.clearTimeout(t) }
  }, [])

  /* Autour de moi : géolocalisation au geste seulement. */
  function autourDeMoi() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { setGeo('refus'); return }
    setGeo('cherche')
    navigator.geolocation.getCurrentPosition((p) => {
      const pos = { lat: p.coords.latitude, lng: p.coords.longitude }
      setMoi(pos); setGeo('')
      const map = carte.current, ml = window.maplibregl
      if (!map || !ml) return
      if (!moiMarqueur.current) {
        const el = document.createElement('div')
        el.className = 'flmoi'
        el.setAttribute('aria-label', 'Vous êtes ici')
        moiMarqueur.current = new ml.Marker({ element: el }).setLngLat([pos.lng, pos.lat]).addTo(map)
      } else moiMarqueur.current.setLngLat([pos.lng, pos.lat])
      const proches = filtrer(commerces, filtre)
        .map(c => ({ c, d: distanceM(pos.lat, pos.lng, c.lat, c.lng) }))
        .sort((a, b) => a.d - b.d)
      const b = new ml.LngLatBounds([pos.lng, pos.lat], [pos.lng, pos.lat])
      proches.slice(0, 3).forEach(({ c }) => b.extend([c.lng, c.lat]))
      map.fitBounds(b, { padding: { top: 80, bottom: 200, left: 50, right: 50 }, maxZoom: 16.5, duration: 600 })
      if (proches[0]) { setChoisi(proches[0].c.cle); window.setTimeout(() => { if (rail.current) rail.current.scrollTo({ left: 0, behavior: 'smooth' }) }, 50) }
    }, () => setGeo('refus'), { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 })
  }

  const h = typeof hauteur === 'number' ? `${hauteur}px` : hauteur

  return (
    <div className="flcarte" style={{ position: 'relative', height: h, borderRadius: 16, overflow: 'hidden', background: '#E9EEF3', border: '1px solid #DCE3EC' }}>
      <style>{CSS}</style>
      <div ref={boite} style={{ position: 'absolute', inset: 0 }} />

      {etat !== 'ok' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GRIS, fontSize: 13, fontWeight: 700, pointerEvents: 'none' }}>
          {etat === 'erreur' ? 'Carte indisponible : la liste des commerces reste ci-dessous.' : 'Chargement de la carte…'}
        </div>
      )}

      {/* Filtres (haut) */}
      <div role="radiogroup" aria-label="Type de commerce" className="flfiltres">
        {FILTRES.map(f => {
          const actif = filtre === f
          const coul = f === 'les_deux' ? NAVY : COULEUR_TYPE[f]
          return (
            <button key={f} type="button" role="radio" aria-checked={actif} onClick={() => { setFiltre(f); setChoisi('') }}
              style={{ border: `2px solid ${coul}`, background: actif ? coul : '#fff', color: actif ? '#fff' : coul }}>
              {f !== 'les_deux' && <span aria-hidden className="flpt" style={{ background: actif ? '#fff' : coul }} />}
              {LIBELLE_FILTRE[f]} <span style={{ opacity: .75 }}>{filtrer(commerces, f).length}</span>
            </button>
          )
        })}
      </div>

      {/* Autour de moi */}
      <button type="button" className="flmoi-btn" onClick={autourDeMoi} aria-label="Autour de moi">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9 3h-2.07A7 7 0 0 0 13 5.07V3h-2v2.07A7 7 0 0 0 5.07 11H3v2h2.07A7 7 0 0 0 11 18.93V21h2v-2.07A7 7 0 0 0 18.93 13H21v-2Zm-9 6a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" /></svg>
        {geo === 'cherche' ? 'Recherche…' : moi ? 'Recentrer' : 'Autour de moi'}
      </button>
      {geo === 'refus' && (
        <div className="flavis" role="status">Position non disponible : autorisez la localisation dans le navigateur.</div>
      )}

      {/* Carrousel (bas) */}
      <div ref={rail} className="flrail">
        {visibles.length === 0 && (
          <div className="flfiche" style={{ color: GRIS, fontSize: 13, justifyContent: 'center' }}>
            {mode === 'public' ? 'Aucun commerce ne joue en ce moment. Revenez bientôt.' : 'Aucun commerce géolocalisé pour ce filtre.'}
          </div>
        )}
        {visibles.map(({ c, d }) => (
          <FicheCommerce key={c.cle} c={c} d={d} mode={mode} actif={choisi === c.cle}
            onClick={() => { setChoisi(c.cle); defilerVers(c.cle) }} />
        ))}
      </div>
    </div>
  )
}

function Manette() {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0 }}><path fill="currentColor" d="M7 6h10a5 5 0 0 1 4.9 6l-1 5a2.5 2.5 0 0 1-4.3 1.2L14.2 16H9.8l-2.4 2.2A2.5 2.5 0 0 1 3.1 17l-1-5A5 5 0 0 1 7 6Zm1 3v2H6v2h2v2h2v-2h2v-2h-2V9H8Zm8.5 1a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm-2 2.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z" /></svg>
}

function Cadeau() {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0 }}><path fill="currentColor" d="M20 7h-2.2A3 3 0 0 0 12 3.8 3 3 0 0 0 6.2 7H4a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8h1a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1Zm-5-2a1 1 0 1 1 0 2h-2a2 2 0 0 1 2-2ZM9 5a2 2 0 0 1 2 2H9a1 1 0 1 1 0-2Zm2 15H7v-8h4v8Zm0-10H5V9h6v1Zm6 10h-4v-8h4v8Zm2-10h-6V9h6v1Z" /></svg>
}

function FicheCommerce({ c, d, mode, actif, onClick }: { c: CommerceCarte; d: number | null; mode: 'sa' | 'public'; actif: boolean; onClick: () => void }) {
  const coul = COULEUR_TYPE[c.type]
  const itis = itineraires(c.lat, c.lng)
  return (
    <div data-cle={c.cle} onClick={onClick} className="flfiche"
      style={{ border: actif ? `2px solid ${coul}` : '1px solid #DCE3EC', boxShadow: actif ? `0 6px 22px ${coul}33` : '0 4px 14px rgba(27,58,92,.12)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {c.logo
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={c.logo} alt="" loading="lazy" style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
          : <span aria-hidden style={{ width: 42, height: 42, borderRadius: 10, background: `${coul}1A`, color: coul, fontWeight: 900, fontSize: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{(c.nom ?? '?').slice(0, 1).toUpperCase()}</span>}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 14.5, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nom ?? 'Commerce'}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: coul }}>
            {LIBELLE_TYPE[c.type]}
            {c.en_cours && <span className="flencours">En cours</span>}
          </div>
        </div>
        {d !== null && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: NAVY }}>{libelleDistance(d)}</div>
            <div style={{ fontSize: 10.5, color: GRIS }}>{minutesAPied(d)} min à pied</div>
          </div>
        )}
      </div>

      {c.lot && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12.5, fontWeight: 800, color: '#3B5CC4', background: '#3B5CC414', borderRadius: 8, padding: '5px 8px', overflow: 'hidden' }}>
          <Cadeau /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Lot du moment : {c.lot}</span>
        </div>
      )}
      {c.jeux.length > 0 && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: NAVY, fontWeight: 700, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          <Manette /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.jeux.map(libelleModule).join(' · ')}</span>
        </div>
      )}
      <div style={{ fontSize: 11.5, color: GRIS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {[c.adresse, c.horaires].filter(Boolean).join(' · ') || 'Adresse non renseignée'}
      </div>
      {mode === 'sa' && (
        <div style={{ fontSize: 11.5, color: GRIS }}>
          {c.nb_animations ?? 0} animation{(c.nb_animations ?? 0) > 1 ? 's' : ''} · {c.nb_super_events ?? 0} super event{(c.nb_super_events ?? 0) > 1 ? 's' : ''}{c.actif ? ' · en cours' : ''}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 'auto', flexWrap: 'nowrap' }}>
        {c.lien_jeu
          ? <a href={c.lien_jeu} onClick={e => e.stopPropagation()} className="flbtn" style={{ background: coul, color: '#fff', flex: 1.2 }}>Jouer</a>
          : mode === 'public' && <span className="flbtn" style={{ background: '#F4F6F9', color: GRIS, flex: 1.2, fontSize: 11 }}>QR en magasin</span>}
        {itis.slice(0, 2).map(i => (
          <a key={i.cle} href={i.url} target={i.cle === 'plans' ? undefined : '_blank'} rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            className="flbtn" aria-label={`Itinéraire avec ${i.libelle}`} style={{ background: '#fff', color: NAVY, border: '1.5px solid #C9D3DF', flex: 1 }}>{i.libelle}</a>
        ))}
        {mode === 'sa' && c.pro_id && (
          <a href={`/dashboard/pros?pro=${encodeURIComponent(c.pro_id)}`} onClick={e => e.stopPropagation()}
            className="flbtn" style={{ color: '#3B5CC4', border: '1.5px solid #3B5CC4', background: '#fff' }}>Fiche</a>
        )}
      </div>
    </div>
  )
}

const CSS = `
.flcarte .maplibregl-ctrl-top-right{top:52px}
.flcarte .maplibregl-ctrl-bottom-right,.flcarte .maplibregl-ctrl-bottom-left{bottom:184px}
.flfiltres{position:absolute;top:10px;left:10px;right:10px;display:flex;gap:6px;overflow-x:auto;z-index:2;scrollbar-width:none}
.flfiltres::-webkit-scrollbar{display:none}
.flfiltres button{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:99px;cursor:pointer;font:inherit;font-size:12.5px;font-weight:800;box-shadow:0 2px 8px rgba(27,58,92,.15)}
.flpt{width:9px;height:9px;border-radius:99px;display:inline-block}
.flmoi-btn{position:absolute;right:10px;bottom:222px;z-index:2;display:inline-flex;align-items:center;gap:6px;padding:10px 14px;border-radius:99px;border:0;background:#1B3A5C;color:#fff;font:inherit;font-size:13px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(27,58,92,.35)}
.flavis{position:absolute;left:10px;right:10px;bottom:270px;z-index:2;background:#fff;border-radius:10px;padding:8px 10px;font-size:12px;color:#1B3A5C;box-shadow:0 2px 8px rgba(27,58,92,.15)}
.flrail{position:absolute;left:0;right:0;bottom:0;z-index:2;display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding:10px 12px 12px;scrollbar-width:none}
.flrail::-webkit-scrollbar{display:none}
.flfiche{flex:0 0 min(300px,84%);min-height:168px;scroll-snap-align:center;background:#fff;border-radius:14px;padding:11px 12px;cursor:pointer;display:flex;flex-direction:column;gap:6px;box-sizing:border-box}
.flbtn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 8px;border-radius:10px;font-size:12.5px;font-weight:800;text-decoration:none;white-space:nowrap;box-sizing:border-box}
.flencours{background:#1D9E75;color:#fff;border-radius:99px;padding:1px 6px;font-size:9.5px;letter-spacing:.03em}
.flpin{position:relative;width:32px;height:40px;border:0;padding:0;background:transparent;cursor:pointer;transition:transform .18s ease;transform-origin:50% 100%}
.flpin::before{content:"";position:absolute;left:2px;top:0;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg) translate(-3px,3px);background:var(--c);border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);box-sizing:border-box}
.flpin span{position:absolute;left:0;top:5px;width:32px;text-align:center;color:#fff;font:900 13px/18px -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}
.flpin-vif::after{content:"";position:absolute;left:4px;top:2px;width:24px;height:24px;border-radius:50%;background:var(--c);opacity:.5;animation:flpouls 1.8s ease-out infinite;z-index:-1}
.flpin-on{transform:scale(1.35);z-index:3}
@keyframes flpouls{0%{transform:scale(1);opacity:.5}100%{transform:scale(2.6);opacity:0}}
@media (prefers-reduced-motion:reduce){.flpin-vif::after{animation:none}}
.flmoi{width:18px;height:18px;border-radius:50%;background:#378ADD;border:3px solid #fff;box-shadow:0 0 0 6px rgba(55,138,221,.25);box-sizing:border-box}
`
