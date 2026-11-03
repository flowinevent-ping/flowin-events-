'use client'

/**
 * Recapitulatif SA « Autres activites saisies » : ce que les pros ont ecrit
 * dans « Autre — precisez » (tag pros `secteur-autre:`) ou dans une demande
 * de rattachement (categorie « Autre : … »). Permet de promouvoir les valeurs
 * frequentes dans la liste commune (lib/activites.ts). Lecture seule.
 */
import { useEffect, useMemo, useState } from 'react'
import { supabasePublic } from '@/lib/supabase'
import { lireSecteurAutre } from '@/lib/proCreation'
import type { FlowinPro } from '@/lib/types'

export default function AutresActivites({ pros }: { pros: FlowinPro[] }) {
  const [demandes, setDemandes] = useState<string[]>([])
  useEffect(() => {
    let vivant = true
    supabasePublic.from('demandes_rattachement_super_event').select('categorie').like('categorie', 'Autre : %').limit(1000)
      .then(({ data }) => {
        if (vivant && data) setDemandes((data as { categorie: string | null }[]).map(d => (d.categorie || '').replace(/^Autre : /, '')))
      }, () => {})
    return () => { vivant = false }
  }, [])

  const lignes = useMemo(() => {
    const m = new Map<string, { valeur: string; nb: number }>()
    const ajoute = (v: string) => {
      const t = v.trim()
      if (!t) return
      const k = t.toLowerCase()
      const e = m.get(k)
      if (e) e.nb += 1; else m.set(k, { valeur: t, nb: 1 })
    }
    pros.forEach(p => ajoute(lireSecteurAutre(p.tags)))
    demandes.forEach(ajoute)
    return Array.from(m.values()).sort((a, b) => b.nb - a.nb || a.valeur.localeCompare(b.valeur))
  }, [pros, demandes])

  if (lignes.length === 0) return null
  return (
    <details data-autres-activites className="sa-card" style={{ margin: '0 0 14px', padding: '10px 14px' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 800 }}>
        Autres activités saisies ({lignes.length}) <span style={{ fontWeight: 500, opacity: .7 }}>· à promouvoir dans la liste si fréquentes</span>
      </summary>
      <table style={{ marginTop: 8, borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr><th style={{ textAlign: 'left', padding: '3px 14px 3px 0' }}>Valeur saisie</th><th style={{ textAlign: 'right' }}>Nombre</th></tr></thead>
        <tbody>
          {lignes.map(l => (
            <tr key={l.valeur}><td style={{ padding: '3px 14px 3px 0' }}>{l.valeur}</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{l.nb}</td></tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
