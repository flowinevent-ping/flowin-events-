'use client'

/**
 * Wizard de creation et d edition d evenement.
 *
 * CHEMIN D ECRITURE EN PRODUCTION. Porte depuis le monolithe a comportement identique.
 * La logique d ecriture vit dans `lib/wizard.ts` — cette vue ne fait que collecter la
 * saisie et afficher les problemes.
 *
 * Deux choix assumes, differents du monolithe et volontaires :
 *  - le statut est DEDUIT des dates, jamais saisi : un statut saisi diverge des dates
 *    des le lendemain, et c est exactement ce qui a produit des events « a venir »
 *    encore affiches ainsi apres leur fin.
 *  - l enregistrement est REFUSE tant qu un controle echoue, plutot que d ecrire un
 *    event a moitie defini qu il faudra corriger a la main ensuite.
 */
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/DashboardUI'
import { useDashboard } from '@/contexts/DashboardContext'
import {
  brouillonVide, controler, enregistrer, nbJours, statutDeduit, urlQr,
  type BrouillonEvent, type BrouillonLot,
} from '@/lib/wizard'
import type { Module } from '@/lib/types'

const ETAPES = [
  { id: 'A', label: 'Identité' },
  { id: 'B', label: 'Module' },
  { id: 'C', label: 'Configuration' },
  { id: 'D', label: 'Lots' },
  { id: 'E', label: 'Visibilité pro' },
  { id: 'F', label: 'Récapitulatif' },
] as const
type Etape = typeof ETAPES[number]['id']

const MODULES: { id: Module; nom: string; desc: string; emoji: string }[] = [
  { id: 'quiz', nom: 'Quiz', desc: 'Questions à choix multiple', emoji: '❓' },
  { id: 'quizsolo', nom: 'Quiz solo', desc: 'Parcours individuel', emoji: '🧍' },
  { id: 'quizmaster', nom: 'Quiz master', desc: 'Animé en direct', emoji: '🎤' },
  { id: 'spin', nom: 'Roue', desc: 'Tirage instantané', emoji: '🎡' },
  { id: 'vote', nom: 'Vote', desc: 'Sondage du public', emoji: '🗳️' },
  { id: 'tombola', nom: 'Tombola', desc: 'Tirage différé', emoji: '🎟️' },
]

const VISIBILITES: { cle: string; label: string }[] = [
  { cle: 'stats', label: 'Statistiques' },
  { cle: 'participants', label: 'Liste des participants' },
  { cle: 'lots', label: 'Lots et stock' },
  { cle: 'qr', label: 'QR code' },
  { cle: 'export', label: 'Export des données' },
  { cle: 'activite', label: 'Activité en direct' },
]

export default function Page() {
  const router = useRouter()
  const { pros, partenaires } = useDashboard()
  const [d, setD] = useState<BrouillonEvent>(brouillonVide())
  const [etape, setEtape] = useState<Etape>('A')
  const [envoi, setEnvoi] = useState(false)
  const [retour, setRetour] = useState<{ ok: boolean; texte: string } | null>(null)

  const maj = (champs: Partial<BrouillonEvent>) => setD(x => ({ ...x, ...champs }))
  const problemes = useMemo(() => controler(d), [d])
  const jours = nbJours(d)

  const majLot = (i: number, champs: Partial<BrouillonLot>) =>
    setD(x => ({ ...x, lots: x.lots.map((l, j) => (j === i ? { ...l, ...champs } : l)) }))

  const enregistrement = async () => {
    setEnvoi(true)
    setRetour(null)
    const r = await enregistrer(d, 'create')
    setEnvoi(false)
    if (r.ok) {
      setRetour({ ok: true, texte: `Événement créé — ${r.partiel?.join(', ')}.` })
      setTimeout(() => router.push('/dashboard/events'), 1400)
    } else {
      setRetour({ ok: false, texte: r.erreur ?? 'Échec de l\u2019enregistrement.' })
    }
  }

  const ligne = (label: string, requis: boolean, champ: React.ReactNode) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>
        {label}{requis && <span style={{ color: '#c46a6a' }}> *</span>}
      </label>
      {champ}
    </div>
  )

  return (
    <div className="sa-page">
      <PageHeader
        title="Nouvel événement"
        subtitle={d.nom || 'Brouillon'}
        actions={
          <>
            <button className="sa-btn" onClick={() => router.push('/dashboard/events')}>Annuler</button>
            <button
              className="sa-btn primary"
              onClick={enregistrement}
              disabled={envoi || problemes.length > 0}
              title={problemes.length ? problemes[0].message : undefined}
            >
              {envoi ? 'Enregistrement…' : 'Créer l\u2019événement'}
            </button>
          </>
        }
      />

      {retour && (
        <div style={{
          marginBottom: 12, padding: '10px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600,
          border: `1px solid ${retour.ok ? '#2f7d4f' : '#c46a6a'}`,
          color: retour.ok ? '#2f7d4f' : '#c46a6a',
        }}>
          {retour.texte}
        </div>
      )}

      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
        {ETAPES.map((s, i) => (
          <button
            key={s.id}
            className={`sa-btn sm${etape === s.id ? ' primary' : ''}`}
            onClick={() => setEtape(s.id)}
          >
            <span style={{ opacity: 0.6, marginRight: 5 }}>{i + 1}</span>{s.label}
          </button>
        ))}
      </div>

      {problemes.length > 0 && (
        <div style={{
          marginBottom: 14, padding: '10px 12px', borderRadius: 10,
          border: '1px solid #b4791f', background: 'rgba(244,181,68,.10)', fontSize: 11.5, lineHeight: 1.6,
        }}>
          <b>{problemes.length} point{problemes.length > 1 ? 's' : ''} à compléter</b> avant enregistrement :
          <ul style={{ margin: '5px 0 0', paddingLeft: 18 }}>
            {problemes.map((p, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setEtape(p.etape === 'E' ? 'D' : (p.etape as Etape))}
                  style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {p.message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 12, padding: 16 }}>

        {etape === 'A' && (
          <>
            {jours > 1 && (
              <div style={{ marginBottom: 12, padding: '9px 11px', borderRadius: 9, border: '1px solid var(--sa-border)', fontSize: 11.5 }}>
                📆 <b>Événement sur {jours} jours</b> — du {d.date_d} au {d.date_f}.
              </div>
            )}
            {ligne("Nom de l'événement", true,
              <input className="sa-input" style={{ width: '100%' }} value={d.nom}
                onChange={e => maj({ nom: e.target.value })} placeholder="Nuits du Sud 2027…" />)}
            {ligne('Pro client', true,
              <select className="sa-input" style={{ width: '100%' }} value={d.pro_id}
                onChange={e => maj({ pro_id: e.target.value })}>
                <option value="">— choisir —</option>
                {pros.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </select>)}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {ligne('Date de début', true,
                <input type="date" className="sa-input" style={{ width: '100%' }} value={d.date_d ?? ''}
                  onChange={e => maj({ date_d: e.target.value || null })} />)}
              {ligne('Date de fin', false,
                <input type="date" className="sa-input" style={{ width: '100%' }} value={d.date_f ?? ''}
                  onChange={e => maj({ date_f: e.target.value || null })} />)}
              {ligne('Heure de début', false,
                <input type="time" className="sa-input" style={{ width: '100%' }} value={d.h_start ?? ''}
                  onChange={e => maj({ h_start: e.target.value || null })} />)}
              {ligne('Heure de fin', false,
                <input type="time" className="sa-input" style={{ width: '100%' }} value={d.h_end ?? ''}
                  onChange={e => maj({ h_end: e.target.value || null })} />)}
            </div>
            {ligne('Lieu', false,
              <input className="sa-input" style={{ width: '100%' }} value={d.lieu}
                onChange={e => maj({ lieu: e.target.value })} />)}
            {ligne('Adresse', false,
              <input className="sa-input" style={{ width: '100%' }} value={d.adresse}
                onChange={e => maj({ adresse: e.target.value })} />)}
            {ligne('Type de public', false,
              <div style={{ display: 'flex', gap: 8 }}>
                {(['btoc', 'btob'] as const).map(t => (
                  <button key={t} className={`sa-btn sm${d.client_type === t ? ' primary' : ''}`}
                    onClick={() => maj({ client_type: t })}>
                    {t === 'btoc' ? '👤 Grand public' : '🏢 Professionnels'}
                  </button>
                ))}
              </div>)}
            <div className="sa-muted" style={{ fontSize: 11, marginTop: 6 }}>
              Statut à la création : <b>{statutDeduit(d)}</b> — déduit des dates, jamais saisi.
            </div>
          </>
        )}

        {etape === 'B' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 9 }}>
            {MODULES.map(m => (
              <button key={m.id} type="button" onClick={() => maj({ module: m.id })}
                style={{
                  textAlign: 'left', cursor: 'pointer', padding: 13, borderRadius: 10,
                  background: 'transparent',
                  border: `2px solid ${d.module === m.id ? 'var(--sa-accent, #f4b544)' : 'var(--sa-border)'}`,
                }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{m.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{m.nom}</div>
                <div className="sa-muted" style={{ fontSize: 11 }}>{m.desc}</div>
              </button>
            ))}
          </div>
        )}

        {etape === 'C' && (
          <>
            {ligne('Description', false,
              <textarea className="sa-input" style={{ width: '100%', minHeight: 90 }} value={d.description}
                onChange={e => maj({ description: e.target.value })} />)}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {ligne('Couleur', false,
                <input type="color" className="sa-input" style={{ width: '100%', height: 38, padding: 3 }}
                  value={d.couleur} onChange={e => maj({ couleur: e.target.value })} />)}
              {ligne('Score minimum pour gagner', false,
                <input type="number" min={0} className="sa-input" style={{ width: '100%' }} value={d.score_min}
                  onChange={e => maj({ score_min: Number(e.target.value) || 0 })} />)}
            </div>
            <div className="sa-muted" style={{ fontSize: 11, lineHeight: 1.5, marginTop: 4 }}>
              La configuration fine du parcours passe par <code>cfg</code> et se règle après création.
              Les modules du parcours joueur ne sont jamais modifiés depuis ici.
            </div>
          </>
        )}

        {etape === 'D' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>
                {d.lots.length} lot{d.lots.length > 1 ? 's' : ''}
              </div>
              <button className="sa-btn sm primary"
                onClick={() => setD(x => ({ ...x, lots: [...x.lots, { nom: '', quantite: 1, valeur: 0 }] }))}>
                + Ajouter un lot
              </button>
            </div>

            {!d.lots.length && (
              <div className="sa-muted" style={{ fontSize: 11.5 }}>
                Aucun lot. Les lots peuvent aussi être ajoutés après création, depuis la fiche de l&apos;événement.
              </div>
            )}

            {d.lots.map((l, i) => (
              <div key={i} style={{ border: '1px solid var(--sa-border)', borderRadius: 10, padding: 11, marginBottom: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                  {ligne('Nom du lot', true,
                    <input className="sa-input" style={{ width: '100%' }} value={l.nom}
                      onChange={e => majLot(i, { nom: e.target.value })} />)}
                  {ligne('Valeur (€)', false,
                    <input type="number" min={0} className="sa-input" style={{ width: '100%' }} value={l.valeur ?? 0}
                      onChange={e => majLot(i, { valeur: Number(e.target.value) || 0 })} />)}
                  {ligne('Quantité', false,
                    <input type="number" min={1} className="sa-input" style={{ width: '100%' }} value={l.quantite ?? 1}
                      onChange={e => majLot(i, { quantite: Number(e.target.value) || 1 })} />)}
                  <button className="sa-btn sm" style={{ marginBottom: 12 }}
                    onClick={() => setD(x => ({ ...x, lots: x.lots.filter((_, j) => j !== i) }))}>
                    Retirer
                  </button>
                </div>
                {ligne('Partenaire (facultatif)', false,
                  <select className="sa-input" style={{ width: '100%' }} value={l.partenaire_id ?? ''}
                    onChange={e => majLot(i, { partenaire_id: e.target.value || null })}>
                    <option value="">— aucun —</option>
                    {partenaires.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                  </select>)}
              </div>
            ))}
          </>
        )}

        {etape === 'E' && (
          <>
            <div className="sa-muted" style={{ fontSize: 11.5, marginBottom: 10, lineHeight: 1.5 }}>
              Ce que le pro client voit depuis son espace. Chaque bloc est indépendant.
            </div>
            {VISIBILITES.map(v => (
              <label key={v.cle} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={d.pro_visib[v.cle] !== false}
                  onChange={e => maj({ pro_visib: { ...d.pro_visib, [v.cle]: e.target.checked } })}
                />
                <span style={{ fontSize: 12.5 }}>{v.label}</span>
              </label>
            ))}
          </>
        )}

        {etape === 'F' && (
          <>
            <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 10 }}>Récapitulatif</div>
            {([
              ['Nom', d.nom || '—'],
              ['Pro client', pros.find(p => p.id === d.pro_id)?.nom ?? '—'],
              ['Module', MODULES.find(m => m.id === d.module)?.nom ?? '—'],
              ['Dates', d.date_d ? `${d.date_d}${d.date_f && d.date_f !== d.date_d ? ` → ${d.date_f}` : ''} (${jours} j)` : '—'],
              ['Lieu', d.lieu || '—'],
              ['Public', d.client_type === 'btoc' ? 'Grand public' : 'Professionnels'],
              ['Statut déduit', statutDeduit(d)],
              ['Lots', d.lots.length ? `${d.lots.length} — ${d.lots.reduce((a, l) => a + (l.quantite ?? 1), 0)} unités` : 'aucun'],
            ] as const).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: '1px solid var(--sa-border)' }}>
                <span className="sa-muted" style={{ fontSize: 11.5 }}>{k}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, textAlign: 'right' }}>{v}</span>
              </div>
            ))}
            <div className="sa-muted" style={{ fontSize: 11, marginTop: 12, lineHeight: 1.5 }}>
              Le QR sera généré sur l&apos;identifiant définitif après création — jamais avant, sinon il
              pointerait dans le vide et l&apos;erreur ne se verrait qu&apos;une fois les affiches posées.
              <br />
              Forme : <code>{urlQr(d.module, 'ev-…')}</code>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
