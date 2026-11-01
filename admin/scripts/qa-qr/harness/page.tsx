'use client'

/**
 * BANC D'ESSAI (tests uniquement, jamais deploye) : affiche le VRAI composant QrTraces de
 * plusieurs animations sur une page, pour que le test Playwright clique ses boutons
 * (lien, copie, PNG, SVG, affiche A4) et decode les fichiers produits.
 * Copie temporairement dans app/qa-qr-harness/ par run-e2e.sh, puis supprimee.
 *   /qa-qr-harness?evs=ev-a,ev-b[&mode=grille]
 */
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import QrTraces from '@/components/operations/QrTraces'

type Ev = { id: string; nom: string; module: string | null }

export default function Page() {
  const [evs, setEvs] = useState<Ev[]>([])
  const [grille, setGrille] = useState(false)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const ids = (p.get('evs') || '').split(',').filter(Boolean)
    setGrille(p.get('mode') === 'grille')
    supabase.from('events').select('id,nom,module').in('id', ids).then(({ data }) => {
      const l = (data ?? []) as Ev[]
      setEvs(ids.map(i => l.find(e => e.id === i)).filter(Boolean) as Ev[])
    })
  }, [])
  return (
    <div style={{ padding: 16, maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {evs.map(e => (
        <section key={e.id} data-ev={e.id} style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16 }}>{e.nom}</h2>
          <QrTraces eventId={e.id} module={e.module} titre={e.nom} mode="sa" grille={grille} />
        </section>
      ))}
    </div>
  )
}
