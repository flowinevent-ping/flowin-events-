'use client'

import { useEffect, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader, ModuleChip, StatusChip } from '@/components/dashboard/DashboardUI'
import ParcoursMobil from '@/components/pro/ParcoursMobil'
import {
  GABARIT_MODULE, GABARIT_NOM, GABARIT_DESC,
  deroulePour, reglesPour, BLOCS_MULTISTATION,
} from '@/lib/gabarit'
import {
  fetchModeles, creerModeleDepuisEvent, supprimerModele, resumeModele,
  type EventModele,
} from '@/lib/modeles'

const MODULES = [
  /* Le gabarit de reference, tire de NDS 2026 (voir lib/gabarit.ts). Il est en
     tete parce que c est celui a partir duquel on cree, plutot que de repartir
     de zero. Son identifiant en base est `nds2026` — inchange, ce sont les
     events du festival. */
  { id: GABARIT_MODULE, icon: '🎯', name: GABARIT_NOM, desc: GABARIT_DESC, gabarit: true },
  { id: 'tombola', icon: '🎟️', name: 'Tombola', desc: 'Inscription CRM + tirage au sort' },
  { id: 'quiz', icon: '🧠', name: 'Quiz', desc: 'QCM avec bonus + 2 tickets' },
  { id: 'quizmaster', icon: '🎮', name: 'Quiz Master', desc: 'Quiz en direct sur grand écran' },
  { id: 'quizsolo', icon: '⏱️', name: 'Quiz Solo', desc: 'Quiz timed en autonomie' },
  { id: 'spin', icon: '🎡', name: 'Roue', desc: 'Roue de la fortune' },
  { id: 'vote', icon: '⭐', name: 'Vote', desc: 'Vote artistes / produits' },
]

/* Le deroule et les regles du gabarit, aux deux portees. Une seule source :
   lib/gabarit.ts — la meme que lit le parcours de creation. */
function FicheGabarit() {
  const [portee, setPortee] = useState<'super' | 'event'>('super')
  const multi = portee === 'super'
  return (
    <div style={{ marginTop: 14, borderTop: '1px solid var(--sa-border)', paddingTop: 14 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--sa-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
          Portée
        </span>
        <button className={`sa-btn sm${multi ? ' primary' : ''}`} onClick={() => setPortee('super')}>Super event · multi-stations</button>
        <button className={`sa-btn sm${!multi ? ' primary' : ''}`} onClick={() => setPortee('event')}>Event · station seule</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.15fr) minmax(0,1fr)', gap: 18 }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 8 }}>Le déroulé</div>
          {deroulePour(multi).map((e, i) => (
            <div key={e.ecran} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--sa-border)' }}>
              <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, background: 'var(--sa-accent)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 800 }}>{e.titre}</div>
                <div style={{ fontSize: 11.5, color: 'var(--sa-muted)', lineHeight: 1.45 }}>{e.detail}</div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 8 }}>Les règles</div>
          {reglesPour(multi).map(r => (
            <div key={r.titre} style={{ padding: '7px 0', borderBottom: '1px solid var(--sa-border)' }}>
              <div style={{ fontSize: 12.5, fontWeight: 800 }}>{r.titre}</div>
              <div style={{ fontSize: 11.5, color: 'var(--sa-muted)', lineHeight: 1.45 }}>{r.texte}</div>
            </div>
          ))}
          {!multi && (
            <div className="sa-alert info" style={{ marginTop: 12, fontSize: 11.5, lineHeight: 1.5 }}>
              Une station seule n’a rien à cumuler : {BLOCS_MULTISTATION.join(', ')} ne
              font pas partie de son parcours. Tout le reste est identique.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>🧩 Modèles de jeu</div>
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
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.nom} · {ev.module}</option>)}
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
                    {m.module}
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
  const { events, openDrawer } = useDashboard()
  const [ouvert, setOuvert] = useState<string | null>(null)

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader title="🎮 Jeux" subtitle="Le gabarit de référence et les modules — cliquer une carte affiche son déroulé et ses events" />
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {MODULES.map(m => {
            const moduleEvents = events.filter(e => e.module === m.id)
            const live = moduleEvents.filter(e => e.status === 'live')
            const actif = ouvert === m.id
            return (
              <div
                key={m.id}
                onClick={() => setOuvert(actif ? null : m.id)}
                style={{ background: 'var(--sa-subtle)', borderRadius: 12, padding: 20, border: actif ? '2px solid var(--sa-accent)' : '1px solid var(--sa-border)', cursor: 'pointer', gridColumn: actif ? 'span 3' : undefined }}
              >
                <div style={{ fontSize: 36, marginBottom: 10 }}>{m.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--sa-muted)', marginBottom: 12 }}>{m.desc}</div>
                <div style={{ fontSize: 12, display: 'flex', gap: 8 }}>
                  <ModuleChip module={m.id} />
                  {live.length > 0 && <StatusChip status="live" />}
                </div>
                {moduleEvents.length > 0 && (
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--sa-muted)' }}>
                    {moduleEvents.length} event{moduleEvents.length > 1 ? 's' : ''} associé{moduleEvents.length > 1 ? 's' : ''} — {actif ? 'toucher pour refermer' : 'toucher pour voir'}
                  </div>
                )}
                {actif && m.gabarit && (
                  <div onClick={e => e.stopPropagation()}><FicheGabarit /></div>
                )}
                {actif && (
                  <div style={{ marginTop: 14, borderTop: '1px solid var(--sa-border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }} onClick={e => e.stopPropagation()}>
                    {moduleEvents.length === 0 && <div style={{ fontSize: 12, color: 'var(--sa-muted)' }}>Aucun event sur ce module.</div>}
                    {moduleEvents.map(ev => (
                      <div
                        key={ev.id}
                        onClick={() => openDrawer('event', ev.id)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}
                      >
                        <span style={{ fontWeight: 600, fontSize: 12.5 }}>{ev.nom}</span>
                        <StatusChip status={ev.status} />
                      </div>
                    ))}
                  </div>
                )}
                {actif && moduleEvents.length > 0 && (
                  <div style={{ marginTop: 16, borderTop: '1px solid var(--sa-border)', paddingTop: 14 }} onClick={e => e.stopPropagation()}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--sa-muted)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>
                      👁 Aperçu navigable — le vrai parcours joueur
                    </div>
                    <ParcoursMobil
                      events={moduleEvents.map(ev => ({ id: ev.id, module: ev.module, nom: ev.nom }))}
                      seId={moduleEvents.find(ev => ev.super_event_id)?.super_event_id ?? undefined}
                      showTitle={false}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <Modeles />
      </div>
    </div>
  )
}
