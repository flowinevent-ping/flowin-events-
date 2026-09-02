'use client'

/**
 * CRM PARTICIPANTS — le gabarit de liste unique, range par portee.
 *
 * Romain, 02/09 : « participants super events doit etre range par super event
 * en sous-categorie par event, ou acces total appele CRM participants avec les
 * identifiants sources (nds, paques, etc.). Attention tu as regresse encore, le
 * CRM n est pas conforme a ce qui a ete demande et decide : toutes les listes
 * nommees CRM ou listes d info type Excel doivent etre presentees de la meme
 * maniere. »
 *
 * Cette page passe donc de ses cartes flex maison au composant <ListeCRM>,
 * c est-a-dire au format de la Liste des gagnants : tableau, entetes triables
 * par fleche, recherche, boutons de filtre, clic ligne -> fiche joueur.
 *
 * CONSERVE a l identique : les tuiles de stats, les filtres Tous / Opt-in /
 * 3 parties et +, l export CSV, le clic vers le drawer joueur.
 * AJOUTE : le rangement super event -> event, la colonne SOURCE, le selecteur
 * de pro, et l acces total (« Tout Flowin ») qui n existait pas — on ne pouvait
 * voir qu un super event a la fois.
 *
 * Les dates affichees restent des jours d exploitation : une partie jouee a 3h
 * du matin appartient a la soiree de la veille.
 *
 * PIEGE DE LECTURE, ecrit a l ecran : une ligne = un joueur SUR UNE STATION. Un
 * joueur passe a trois stations compte trois lignes. Le nombre de personnes
 * distinctes est donc affiche a part, pour qu on ne lise jamais le nombre de
 * lignes comme un nombre de gens.
 */

import { useEffect, useMemo, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import ListeCRM, { type ColonneCRM } from '@/components/dashboard/ListeCRM'
import { fetchCrmParticipants, fetchSuperEvents, type CrmParticipant, type SuperEvent } from '@/lib/nds'

import { usePorteeInitiale } from '@/lib/portee'
const fr = (d: string | null) => {
  if (!d) return '—'
  const p = d.split('-')
  return p.length === 3 ? `${p[2]}/${p[1]}` : d
}
const nomComplet = (p: CrmParticipant) => [p.prenom, p.nom].filter(Boolean).join(' ')

export default function Page() {
  const { openDrawer } = useDashboard()
  const [liste, setListe] = useState<CrmParticipant[] | null>(null)
  const [supers, setSupers] = useState<SuperEvent[]>([])
  /* '' = acces total, toutes operations confondues. C est la vue « CRM
     participants » demandee : elle n existait pas, on etait force a un seul
     super event a la fois. */
  const [se, setSe] = useState('')
  /* Portee recue de la fiche qui nous a ouverts : on arrive DEJA cadre sur son
     super event. Sans ca, ouvrir ce module depuis « Jazz a Nice 2027 » affichait
     Nuits du Sud. Les boutons de l ecran restent maitres ensuite. */
  const porteeUrl = usePorteeInitiale()
  useEffect(() => { if (porteeUrl.se) setSe(porteeUrl.se) }, [porteeUrl.se])

  const [pro, setPro] = useState('')
  const [erreur, setErreur] = useState('')

  useEffect(() => { fetchSuperEvents().then(setSupers) }, [])
  useEffect(() => {
    let vivant = true
    setListe(null); setErreur('')
    fetchCrmParticipants(se || null)
      .then(l => { if (vivant) setListe(l) })
      // Sans ce message, un echec afficherait « aucun participant » — on
      // croirait l operation vide au lieu de voir qu elle n a pas repondu.
      .catch(e => { if (vivant) { setErreur(String(e?.message ?? e)); setListe([]) } })
    return () => { vivant = false }
  }, [se])

  const visibles = useMemo(
    () => (liste === null ? null : (pro ? liste.filter(p => p.pro_id === pro) : liste)),
    [liste, pro])

  /* La recherche et les boutons de filtre vivent DANS <ListeCRM>. Sans ce
     rappel, les tuiles et l export CSV porteraient sur la liste complete
     pendant qu on en voit trois lignes a l ecran — et un CSV faux part chez
     un partenaire. `affichees` est donc ce que l utilisateur voit vraiment. */
  const [affichees, setAffichees] = useState<CrmParticipant[]>([])

  const pros = useMemo(() => {
    const vus: Record<string, string> = {}
    ;(liste ?? []).forEach(p => { if (p.pro_id && p.pro_nom) vus[p.pro_id] = p.pro_nom })
    return Object.keys(vus)
      .map(id => ({ id, label: vus[id] }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'))
  }, [liste])

  const stats = useMemo(() => {
    const l = affichees
    const parJoueur: Record<string, { optin: boolean; parties: number }> = {}
    l.forEach(p => {
      const j = parJoueur[p.joueur_id] ?? { optin: false, parties: 0 }
      j.optin = j.optin || !!p.optin
      j.parties += p.nb_parties ?? 0
      parJoueur[p.joueur_id] = j
    })
    const ids = Object.keys(parJoueur)
    const optin = ids.filter(id => parJoueur[id].optin).length
    const parties = ids.reduce((n, id) => n + parJoueur[id].parties, 0)
    return {
      lignes: l.length,
      joueurs: ids.length,
      optin,
      pct: ids.length ? Math.round(optin / ids.length * 100) : 0,
      moyenne: ids.length ? (parties / ids.length).toFixed(1) : '0',
    }
  }, [affichees])

  function exporterCsv() {
    const l = affichees
    if (!l.length) return
    const entetes = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Code postal', 'Ville', 'Opt-in',
      'Source', 'Super event', 'Station', 'Pro', 'Parties', 'Tickets', 'Première', 'Dernière']
    const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lignes = l.map(p => [p.prenom, p.nom, p.email, p.tel, p.code_postal, p.ville,
      p.optin ? 'oui' : 'non', p.source, p.super_event_nom, p.event_nom, p.pro_nom,
      p.nb_parties, p.nb_tickets, p.premiere, p.derniere].map(q).join(';'))
    // BOM UTF-8 : sans lui, Excel affiche « Prnom » et casse les accents.
    const csv = '﻿' + [entetes.map(q).join(';')].concat(lignes).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `crm-participants-${se || 'tout'}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  }

  const colonnes: ColonneCRM<CrmParticipant>[] = [
    {
      id: 'nom', label: 'Participant',
      valeur: p => nomComplet(p) || p.email || p.joueur_id,
      rendu: p => (
        <>
          <div style={{ fontWeight: 700 }}>{nomComplet(p) || '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>{p.email ?? '—'}</div>
        </>
      ),
    },
    { id: 'code_postal', label: 'Code postal', valeur: p => p.code_postal, style: { fontSize: 12.5 } },
    { id: 'tel', label: 'Téléphone', valeur: p => p.tel, style: { fontSize: 12.5 } },
    {
      /* L identifiant SOURCE demande : d ou vient ce participant. En acces
         total, c est ce qui distingue un joueur NDS d un joueur Paques. */
      id: 'source', label: 'Source',
      valeur: p => p.source ?? p.super_event_id ?? p.event_id,
      rendu: p => <code className="sa-code">{p.source ?? p.super_event_id ?? p.event_id}</code>,
    },
    { id: 'pro_nom', label: 'Pro', valeur: p => p.pro_nom, style: { fontSize: 12.5 } },
    {
      id: 'nb_parties', label: 'Parties', valeur: p => p.nb_parties,
      rendu: p => <span className="sa-chip">{p.nb_parties}</span>,
    },
    {
      id: 'derniere', label: 'Activité', valeur: p => p.derniere, horsRecherche: true,
      rendu: p => <span style={{ fontSize: 11.5, color: 'var(--sa-muted)' }}>{fr(p.premiere)} → {fr(p.derniere)}</span>,
    },
    {
      id: 'optin', label: 'Contact', valeur: p => (p.optin ? 1 : 0), horsRecherche: true,
      rendu: p => (p.optin
        ? <span className="sa-chip live">✓ Contact</span>
        : <span style={{ color: 'var(--sa-muted)' }}>—</span>),
    },
  ]

  return (
    <div className="sa-content">
      <div className="sa-page">
        <ListeCRM<CrmParticipant>
          titre="👥 CRM Participants"
          sousTitre={liste === null ? undefined
            : `${stats.joueurs} participant${stats.joueurs > 1 ? 's' : ''} · ${stats.lignes} passage${stats.lignes > 1 ? 's' : ''} en station`}
          lignes={visibles}
          colonnes={colonnes}
          cle={p => `${p.joueur_id}/${p.event_id}`}
          onLigne={p => openDrawer('joueur', p.joueur_id)}
          triDefaut="derniere"
          triDescendant
          placeholderRecherche="Rechercher un nom, un email, un code postal, un pro…"
          filtres={[
            { id: 'tous', label: 'Tous' },
            { id: 'optin', label: 'Opt-in', test: p => !!p.optin },
            { id: 'fideles', label: '3 parties et +', test: p => (p.nb_parties ?? 0) >= 3 },
          ]}
          selecteurs={pros.length > 1 ? [{
            id: 'pro', libelleTout: 'Tous les pros', options: pros, valeur: pro, onChange: setPro,
          }] : undefined}
          categorie={p => ({ id: p.super_event_id ?? '_hors', label: p.super_event_nom })}
          sousCategorie={p => ({ id: p.event_id, label: p.event_nom })}
          onVisibles={setAffichees}
          actions={<button className="sa-btn sm" onClick={exporterCsv} disabled={!affichees.length}>⬇ Export CSV</button>}
          legende={
            <>
              Une ligne = <b>un participant sur une station</b>. Quelqu&apos;un passé à trois
              stations compte trois lignes — d&apos;où l&apos;écart entre les {stats.lignes} passages
              et les <b>{stats.joueurs} personnes distinctes</b>.
            </>
          }
          entete={
            <>
              {erreur && (
                <div className="sa-alert warn" style={{ marginBottom: 12, fontSize: 12.5 }}>
                  La liste n&apos;a pas pu être chargée — {erreur}
                </div>
              )}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--sa-muted)', marginRight: 4 }}>
                  Portée
                </span>
                <button className={`sa-btn sm${se === '' ? ' primary' : ''}`} onClick={() => { setSe(''); setPro('') }}>
                  Tout Flowin
                </button>
                {supers.map(x => (
                  <button key={x.id} className={`sa-btn sm${se === x.id ? ' primary' : ''}`} onClick={() => { setSe(x.id); setPro('') }}>
                    {x.nom}
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
                {([['Personnes distinctes', stats.joueurs], ['Acceptent le contact', stats.optin],
                   ['Taux d’opt-in', `${stats.pct} %`], ['Parties par joueur', stats.moyenne]] as [string, string | number][])
                  .map(([lib, val]) => (
                  <div key={lib} style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 12, padding: '16px 14px' }}>
                    <div style={{ fontSize: 24, fontWeight: 800 }}>{val}</div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--sa-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 4 }}>{lib}</div>
                  </div>
                ))}
              </div>
            </>
          }
          videTitre="Aucun participant pour cette sélection"
        />
      </div>
    </div>
  )
}
