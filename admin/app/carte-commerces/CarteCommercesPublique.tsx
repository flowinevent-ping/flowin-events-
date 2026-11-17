'use client'

/**
 * Carte publique (sans login) des commerces qui ont un jeu actif. Lecture seule.
 * Plein écran : la carte occupe la page, les fiches défilent en carrousel par-dessus.
 * Mode démo (?demo=1) : quelques commerces « Démo » s'ajoutent, clairement nommés comme tels.
 */
import { useEffect, useState } from 'react'
import CarteCommerces from '@/components/carte/CarteCommerces'
import { fetchCarteCommercesPublique, type CommerceCarte } from '@/lib/carteReseau'
import { estDemo } from '@/lib/demo'

/** Points de démonstration autour de la place du Grand Jardin (Vence). Aucun vrai commerce. */
const DEMO: CommerceCarte[] = [
  { cle: 'demo-a', nom: 'Commerce démo A', adresse: 'Adresse démo', lat: 43.7232, lng: 7.1125, logo: null, type: 'animation', jeux: ['spin'], lien_jeu: null, lot: 'Démo : un café offert', horaires: null, en_cours: true },
  { cle: 'demo-b', nom: 'Commerce démo B', adresse: 'Adresse démo', lat: 43.7218, lng: 7.1098, logo: null, type: 'super_event', jeux: ['nds2026'], lien_jeu: '/nds', lot: 'Démo : deux places de concert', horaires: null, en_cours: true },
  { cle: 'demo-c', nom: 'Commerce démo C', adresse: 'Adresse démo', lat: 43.7245, lng: 7.1140, logo: null, type: 'les_deux', jeux: ['tombola', 'nds2026'], lien_jeu: '/nds', lot: null, horaires: '[horaires à compléter]', en_cours: false },
  { cle: 'demo-d', nom: 'Commerce démo D', adresse: 'Adresse démo', lat: 43.7205, lng: 7.1150, logo: null, type: 'animation', jeux: ['quiz'], lien_jeu: null, lot: null, horaires: null, en_cours: false },
]

export default function CarteCommercesPublique() {
  const [l, setL] = useState<CommerceCarte[] | null>(null)
  useEffect(() => { fetchCarteCommercesPublique().then(r => setL(estDemo() ? r.concat(DEMO) : r)) }, [])
  return (
    <main style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#F4F6F9', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Arial,sans-serif', color: '#1B3A5C' }}>
      <header style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'baseline', gap: 10, maxWidth: 1200, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: '#3B5CC4' }}>Flowin</span>
        <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, whiteSpace: 'nowrap' }}>Où jouer ?</h1>
        <span style={{ fontSize: 12.5, color: '#5a6b80', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Flashez le QR en magasin, jouez, gagnez.</span>
      </header>
      <div style={{ flex: 1, minHeight: 0, padding: '0 8px 8px', maxWidth: 1200, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {l === null
          ? <div style={{ fontSize: 13, color: '#5a6b80', padding: 16 }}>Chargement…</div>
          : <CarteCommerces commerces={l} mode="public" hauteur="100%" />}
      </div>
    </main>
  )
}
