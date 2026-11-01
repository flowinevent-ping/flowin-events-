'use client'

import { useEffect, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader } from '@/components/dashboard/DashboardUI'
import PageMasters from './PageMasters'
import { libelleModule } from '@/lib/operations'
import {
  fetchModeles, creerModeleDepuisEvent, supprimerModele, resumeModele,
  type EventModele,
} from '@/lib/modeles'

/* ── LES MODELES ────────────────────────────────────────────────────────────
   « Template de jeux, meme frame, personnalisable depuis SA » (Romain, 04/09).

   Un modele se FABRIQUE a partir d un event qui tourne deja — c est le sens de
   la colonne `origine_event_id` de `event_modeles`. On ne redecrit pas un
   gabarit a la main : on prend NDS 2026, on en fait le point de depart, et le
   parcours de creation d event le propose ensuite a l etape « Module ».

   La table existait deja en base, vide et sans aucun ecran (constat 13 de
   docs/audit-parcours.html). C est son ecran, pas une table de plus. */
function Modeles() {
  const { events } = useDashboard()
  const [liste, setListe] = useState<EventModele[] | null>(null)
  const [source, setSource] = useState('')
  const [nom, setNom] = useState('')
  const [desc, setDesc] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [retour, setRetour] = useState<{ ok: boolean; texte: string } | null>(null)

  const recharger = () => fetchModeles().then(setListe).catch(() => setListe([]))
  useEffect(() => { recharger() }, [])

  /* Le nom du modele est propose depuis l event choisi, jamais impose : le SA
     le reecrit s il veut, mais il ne part pas d un champ vide. */
  const choisirSource = (id: string) => {
    setSource(id)
    const ev = events.find(e => e.id === id)
    if (ev && !nom.trim()) setNom(ev.nom)
  }

  const creer = async () => {
    setEnvoi(true); setRetour(null)
    const r = await creerModeleDepuisEvent(source, nom, desc)
    setEnvoi(false)
    if (r.ok) {
      setRetour({ ok: true, texte: 'Modèle enregistré — il apparaît désormais à l’étape « Module » du parcours de création.' })
      setNom(''); setDesc(''); setSource('')
      recharger()
    } else {
      setRetour({ ok: false, texte: r.erreur ?? 'Échec de l’enregistrement.' })
    }
  }

  const retirer = async (m: EventModele) => {
    const r = await supprimerModele(m.id)
    if (r.ok) recharger()
    else setRetour({ ok: false, texte: r.erreur ?? 'Échec de la suppression.' })
  }

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <div style={{ background: 'var(--sa-subtle)', borderRadius: 12, padding: 20, border: '1px solid var(--sa-border)' }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Modèles de jeu</div>
        <div style={{ fontSize: 12, color: 'var(--sa-muted)', marginBottom: 16 }}>
          Un modèle se fabrique à partir d’un événement existant : il en reprend le module, la
          configuration du jeu, les lots, la visibilité pro et la couleur. Le parcours de création
          le propose ensuite à l’étape « Module ». Le QR et les partenaires de l’événement d’origine
          ne sont pas repris — ils appartiennent à cet événement, pas au gabarit.
        </div>

        {retour && (
          <div style={{
            marginBottom: 12, padding: '10px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600,
            border: `1px solid ${retour.ok ? '#2f7d4f' : '#c46a6a'}`,
            color: retour.ok ? '#2f7d4f' : '#c46a6a',
          }}>{retour.texte}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1.2fr) auto', gap: 10, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>Événement source</label>
            <select className="sa-input" style={{ width: '100%' }} value={source} onChange={e => choisirSource(e.target.value)}>
              <option value="">— choisir —</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.nom} · {libelleModule(ev.module)}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>Nom du modèle</label>
            <input className="sa-input" style={{ width: '100%' }} value={nom}
              onChange={e => setNom(e.target.value)} placeholder="Quiz + bonus — marque blanche" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>Description</label>
            <input className="sa-input" style={{ width: '100%' }} value={desc}
              onChange={e => setDesc(e.target.value)} placeholder="Le gabarit de référence tiré de NDS 2026" />
          </div>
          <button className="sa-btn primary" disabled={!source || !nom.trim() || envoi} onClick={creer}>
            {envoi ? 'Enregistrement…' : 'Créer le modèle'}
          </button>
        </div>

        <div style={{ marginTop: 18, borderTop: '1px solid var(--sa-border)', paddingTop: 14 }}>
          {liste === null && <div style={{ fontSize: 12, color: 'var(--sa-muted)' }}>Chargement…</div>}
          {liste !== null && liste.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--sa-muted)' }}>
              Aucun modèle enregistré. Choisissez un événement ci-dessus pour en fabriquer le premier.
            </div>
          )}
          {(liste ?? []).map(m => {
            const origine = events.find(e => e.id === m.origine_event_id)
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 8, padding: '10px 12px', marginBottom: 6 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12.5 }}>{m.nom}</div>
                  <div style={{ fontSize: 11, color: 'var(--sa-muted)', marginTop: 2 }}>
                    {libelleModule(m.module)}
                    {resumeModele(m).length > 0 && ` · ${resumeModele(m).join(' · ')}`}
                    {origine && ` · tiré de « ${origine.nom} »`}
                  </div>
                </div>
                <button className="sa-btn sm" onClick={() => retirer(m)}>Supprimer</button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function JeuxPage() {
  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader title="Jeux" subtitle="Les masters de jeux : gabarits de référence, aperçus fidèles aux maquettes, création d’une animation en un clic" />
        <div style={{ padding: 24 }}>
          <PageMasters />
        </div>
        <Modeles />
      </div>
    </div>
  )
}
