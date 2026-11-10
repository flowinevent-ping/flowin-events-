'use client'

/** Carte publique (sans login) des commerces qui ont une animation active. Lecture seule. */
import { useEffect, useState } from 'react'
import CarteCommerces from '@/components/carte/CarteCommerces'
import { fetchCarteCommercesPublique, type CommerceCarte } from '@/lib/carteReseau'

export default function CarteCommercesPublique() {
  const [l, setL] = useState<CommerceCarte[] | null>(null)
  useEffect(() => { fetchCarteCommercesPublique().then(setL) }, [])
  return (
    <main style={{ minHeight: '100vh', background: '#F4F6F9', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Arial,sans-serif', color: '#1B3A5C' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px 32px' }}>
        <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '.02em', color: '#3B5CC4' }}>Flowin</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: '4px 0 4px' }}>Où jouer ?</h1>
        <p style={{ fontSize: 14, color: '#5a6b80', margin: '0 0 14px' }}>Flashez le QR en magasin, jouez, gagnez.</p>
        {l === null ? <div style={{ fontSize: 13, color: '#5a6b80' }}>Chargement…</div> : <CarteCommerces commerces={l} mode="public" hauteur={360} />}
      </div>
    </main>
  )
}
