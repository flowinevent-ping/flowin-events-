'use client'

/**
 * Joueurs — gabarit unique des listes (ListeCRM, famille H) et filtre `?se=`.
 *
 * Colonnes demandees par Romain : date d entree, source, nom, prenom, adresse,
 * ville, tel, email, opt-in, gains.
 *
 * Filtre super event : les joueurs qui ont REELLEMENT joue sur une station de
 * l operation (table `participations`), pas `joueurs.events` (Pattern C).
 */
import { Suspense, useEffect, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import ListeCRM, { type ColonneCRM } from '@/components/dashboard/ListeCRM'
import type { FlowinJoueur } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { useFiltreSuperEvent } from '@/lib/filtreSuperEvent'
import { BandeauFiltreSE } from '@/components/dashboard/BandeauFiltreSE'

const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('fr-FR') : '—')

function JoueursContenu() {
  const { joueurs, openDrawer, openDrawerEdit } = useDashboard()
  const { seId, eventIds } = useFiltreSuperEvent()
  const [idsSe, setIdsSe] = useState<Set<string> | null>(null)

  useEffect(() => {
    if (!seId || !eventIds) { setIdsSe(null); return }
    let vivant = true
    const ids = Array.from(eventIds)
    if (!ids.length) { setIdsSe(new Set()); return }
    supabase.from('participations').select('joueur_id').in('event_id', ids).not('joueur_id', 'is', null)
      .then(({ data }) => {
        if (vivant) setIdsSe(new Set(((data ?? []) as { joueur_id: string }[]).map(p => p.joueur_id)))
      })
    return () => { vivant = false }
  }, [seId, eventIds])

  const lignes = seId ? (idsSe ? joueurs.filter(j => idsSe.has(j.id)) : null) : joueurs

  const lien = (href: string, texte: string) => (
    <a href={href} onClick={e => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none' }}>{texte}</a>
  )
  const colonnes: ColonneCRM<FlowinJoueur>[] = [
    { id: 'date', label: 'Date entrée', valeur: j => j.first_seen ?? j.ts ?? '', rendu: j => fmtDate(j.first_seen ?? j.ts), largeur: 100, horsRecherche: true },
    { id: 'source', label: 'Source', valeur: j => j.source, largeur: 110 },
    { id: 'nom', label: 'Nom', valeur: j => j.nom, rendu: j => <b>{j.nom || '—'}</b>, largeur: 140 },
    { id: 'prenom', label: 'Prénom', valeur: j => j.prenom, largeur: 120 },
    { id: 'adresse', label: 'Adresse', valeur: j => j.adresse, largeur: 170 },
    { id: 'ville', label: 'Ville', valeur: j => `${j.ville ?? ''}${j.code_postal ? ` (${j.code_postal})` : ''}`.trim(), largeur: 140 },
    { id: 'tel', label: 'Tél.', valeur: j => j.tel, rendu: j => (j.tel ? lien(`tel:${j.tel}`, j.tel) : '—'), largeur: 120 },
    { id: 'email', label: 'Email', valeur: j => j.email, rendu: j => (j.email ? lien(`mailto:${j.email}`, j.email) : '—'), largeur: 210 },
    { id: 'optin', label: 'Opt-in', valeur: j => (j.optin ? 1 : 0), rendu: j => (j.optin ? <span className="sa-chip live">✓</span> : <span className="sa-chip">—</span>), largeur: 70, aligne: 'centre', horsRecherche: true },
    { id: 'gains', label: 'Gains', valeur: j => j.gains ?? 0, largeur: 60, aligne: 'droite', horsRecherche: true },
    {
      id: 'actions', label: '', valeur: () => '', horsRecherche: true, nonTriable: true, largeur: 60, aligne: 'droite',
      rendu: j => <button className="sa-btn icon sm" title="Éditer" onClick={e => { e.stopPropagation(); openDrawerEdit('joueur', j.id) }}>✏</button>,
    },
  ]

  return (
    <div className="sa-content">
      <div className="sa-page">
        <ListeCRM<FlowinJoueur>
          titre="👥 Joueurs"
          lignes={lignes}
          colonnes={colonnes}
          cle={j => j.id}
          onLigne={j => openDrawer('joueur', j.id)}
          triDefaut="date"
          triDescendant
          placeholderRecherche="Rechercher (nom, email, ville, adresse, code postal)…"
          entete={seId ? <BandeauFiltreSE seId={seId} quoi="Joueurs" retour="/dashboard/joueurs" /> : undefined}
        />
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <JoueursContenu />
    </Suspense>
  )
}
