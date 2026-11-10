'use client'

/**
 * Carte des commerces : sélecteur Animation (bleu) / Super Event (orange) / Les deux
 * (violet, couleur de donnée), carte Leaflet (SuperEventMap, même bibliothèque que
 * les pages /se), et fiches en carrousel horizontal (jamais de longue liste).
 * Un clic sur un marqueur affiche la fiche du commerce.
 * Utilisée par /dashboard/carte-reseau (SA) et /carte-commerces (public, sans login).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import SuperEventMap, { type Lieu } from '@/app/se/_components/SuperEventMap'
import { COULEUR_TYPE, LIBELLE_TYPE, filtrer, type CommerceCarte, type FiltreCarte } from '@/lib/carteReseau'
import { libelleModule } from '@/lib/operations'

const FILTRES: FiltreCarte[] = ['animation', 'super_event', 'les_deux']

export default function CarteCommerces({ commerces, mode, hauteur = 420 }: {
  commerces: CommerceCarte[]; mode: 'sa' | 'public'; hauteur?: number | string
}) {
  const [filtre, setFiltre] = useState<FiltreCarte>('les_deux')
  const [choisi, setChoisi] = useState<string>('')
  const rail = useRef<HTMLDivElement>(null)
  const visibles = useMemo(() => filtrer(commerces, filtre), [commerces, filtre])
  const lieux: Lieu[] = useMemo(() => visibles.map(c => ({
    id: c.cle, nom: c.nom ?? 'Commerce', lat: c.lat, lng: c.lng, couleur: COULEUR_TYPE[c.type],
  })), [visibles])

  useEffect(() => {
    if (!choisi || !rail.current) return
    const el = rail.current.querySelector(`[data-cle="${choisi}"]`) as HTMLElement | null
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [choisi])

  const couleurFiltre = (f: FiltreCarte) => COULEUR_TYPE[f]

  return (
    <div>
      <div role="radiogroup" aria-label="Type de commerce" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {FILTRES.map(f => {
          const actif = filtre === f
          const n = filtrer(commerces, f).length
          return (
            <button key={f} type="button" role="radio" aria-checked={actif} onClick={() => { setFiltre(f); setChoisi('') }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 99, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
                border: `2px solid ${couleurFiltre(f)}`, background: actif ? couleurFiltre(f) : '#fff', color: actif ? '#fff' : couleurFiltre(f),
              }}>
              <span aria-hidden style={{ width: 10, height: 10, borderRadius: 99, background: actif ? '#fff' : couleurFiltre(f) }} />
              {LIBELLE_TYPE[f]} <span style={{ opacity: .8 }}>{n}</span>
            </button>
          )
        })}
      </div>

      <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #DCE3EC' }}>
        <SuperEventMap key={filtre} lieux={lieux} height={hauteur} onSelect={id => setChoisi(id)} />
      </div>

      {visibles.length === 0 && (
        <div style={{ marginTop: 12, fontSize: 13, color: '#5a6b80' }}>
          {mode === 'public' ? 'Aucun commerce ne joue en ce moment. Revenez bientôt.' : 'Aucun commerce géolocalisé pour ce filtre.'}
        </div>
      )}

      <div ref={rail} style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '12px 2px 6px' }}>
        {visibles.map(c => (
          <FicheCommerce key={c.cle} c={c} mode={mode} actif={choisi === c.cle} onClick={() => setChoisi(c.cle)} />
        ))}
      </div>
    </div>
  )
}

function FicheCommerce({ c, mode, actif, onClick }: { c: CommerceCarte; mode: 'sa' | 'public'; actif: boolean; onClick: () => void }) {
  const coul = COULEUR_TYPE[c.type]
  const dir = `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`
  return (
    <div data-cle={c.cle} onClick={onClick}
      style={{
        flex: '0 0 260px', scrollSnapAlign: 'center', background: '#fff', borderRadius: 12, padding: 12, cursor: 'pointer',
        border: actif ? `2px solid ${coul}` : '1px solid #DCE3EC', boxShadow: actif ? `0 0 0 3px ${coul}22` : 'none',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {c.logo
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={c.logo} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
          : <span aria-hidden style={{ width: 40, height: 40, borderRadius: 10, background: `${coul}1A`, color: coul, fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{(c.nom ?? '?').slice(0, 1).toUpperCase()}</span>}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#1B3A5C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nom ?? 'Commerce'}</div>
          <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: coul }}>{LIBELLE_TYPE[c.type]}</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#5a6b80', minHeight: 16 }}>{c.adresse ?? 'Adresse non renseignée'}</div>
      {c.jeux.length > 0 && <div style={{ fontSize: 12, color: '#1B3A5C', fontWeight: 700 }}>{c.jeux.map(libelleModule).join(' · ')}</div>}
      {mode === 'sa' && (
        <div style={{ fontSize: 11.5, color: '#5a6b80' }}>
          {c.nb_animations ?? 0} animation{(c.nb_animations ?? 0) > 1 ? 's' : ''} · {c.nb_super_events ?? 0} super event{(c.nb_super_events ?? 0) > 1 ? 's' : ''}{c.actif ? ' · en cours' : ''}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
        <a href={dir} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
          style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', background: coul, borderRadius: 8, padding: '7px 11px', textDecoration: 'none' }}>Itinéraire</a>
        {mode === 'sa' && c.pro_id && (
          <a href={`/dashboard/pros?pro=${encodeURIComponent(c.pro_id)}`} onClick={e => e.stopPropagation()}
            style={{ fontSize: 12.5, fontWeight: 800, color: '#3B5CC4', border: '1.5px solid #3B5CC4', borderRadius: 8, padding: '6px 11px', textDecoration: 'none' }}>Fiche pro</a>
        )}
      </div>
    </div>
  )
}
