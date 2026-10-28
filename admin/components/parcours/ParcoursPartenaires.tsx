'use client'

import type { FlowinPartenaire } from '@/lib/types'

/* Fiche partenaire partagée par tous les parcours jeu.
   Avant ce commit, Tombola était le seul module à avoir une vraie grille +
   fiche partenaire (logo, description, promo, site web, réseaux sociaux) ;
   chaque autre module n'avait rien ou un stub non fonctionnel. Extrait et
   généralisé ici pour que Vote/QuizSolo/Quiz/Spin partagent la même brique
   plutôt que de la réécrire chacun à leur façon (Romain : « le même cadre
   sur l'ensemble des jeux »).
   Pas d'emoji : un partenaire sans logo affiche l'initiale de son nom,
   jamais une icône de substitution. */

function Avatar({ p, size }: { p: FlowinPartenaire; size: number }) {
  if (p.image_url) {
    return <img src={p.image_url} alt={p.nom} style={{ width: size, height: size, objectFit: 'contain', borderRadius: size > 60 ? '50%' : 12 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
  }
  return <span>{(p.nom || '?').trim().slice(0, 1).toUpperCase()}</span>
}

export function ParcoursPartenairesGrid({ partenaires, onSelect }: { partenaires: FlowinPartenaire[]; onSelect: (i: number) => void }) {
  return (
    <div className="grid2" style={{ marginBottom: 16 }}>
      {partenaires.map((p, i) => (
        <div key={p.id} className="part-tile" onClick={() => onSelect(i)}>
          <div className="part-tile-avatar"><Avatar p={p} size={52} /></div>
          <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3 }}>{p.nom}</div>
        </div>
      ))}
    </div>
  )
}

export function ParcoursPartenaireSheet({ p, onClose }: { p: FlowinPartenaire; onClose: () => void }) {
  const adresseLigne = [p.adresse, p.code_postal, p.ville].filter(Boolean).join(' ')
  return (
    <div className="part-sheet-overlay" onClick={onClose}>
      <div className="part-sheet" onClick={e => e.stopPropagation()}>
        <div className="part-sheet-avatar"><Avatar p={p} size={72} /></div>
        <div style={{ fontSize: 20, fontWeight: 900, textAlign: 'center', marginBottom: 4 }}>{p.nom}</div>
        {p.description && <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', textAlign: 'center', lineHeight: 1.5, marginBottom: 12 }}>{p.description}</div>}
        {(adresseLigne || p.tel) && (
          <div style={{ textAlign: 'center', fontSize: 12.5, color: 'rgba(255,255,255,.6)', marginBottom: 12 }}>
            {adresseLigne && <div>{adresseLigne}</div>}
            {p.tel && <div>{p.tel}</div>}
          </div>
        )}
        {p.promo_text && (
          <div style={{ background: 'rgba(124,45,146,.18)', border: '1px solid rgba(224,33,138,.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fff', marginBottom: 12, textAlign: 'center' }}>
            {p.promo_text}
          </div>
        )}
        {(p.site_web || p.url) && (
          <a href={p.site_web ?? p.url!} target="_blank" rel="noopener" className="link-btn"><span>Site web</span></a>
        )}
        {p.instagram && (
          <a href={p.instagram.startsWith('http') ? p.instagram : `https://instagram.com/${p.instagram.replace('@', '')}`} target="_blank" rel="noopener" className="link-btn"><span>Instagram</span></a>
        )}
        {p.facebook && (
          <a href={p.facebook.startsWith('http') ? p.facebook : `https://facebook.com/${p.facebook}`} target="_blank" rel="noopener" className="link-btn"><span>Facebook</span></a>
        )}
        {p.jeu_event_id && p.jeu_module && (
          <a href={`/parcours/${p.jeu_module}?ev=${p.jeu_event_id}`} target="_blank" rel="noopener" className="link-btn"><span>Jouer au jeu de {p.nom}</span></a>
        )}
        <button className="btn-ghost" onClick={onClose}>Retour</button>
      </div>
    </div>
  )
}
