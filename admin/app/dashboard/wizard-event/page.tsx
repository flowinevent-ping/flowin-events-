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
import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/DashboardUI'
import { useDashboard } from '@/contexts/DashboardContext'
import { useScope } from '@/contexts/ScopeContext'
import { fetchBanquesToutes, type Banque } from '@/lib/banques'
import Diffusion, { type LienDiffusion } from '@/components/dashboard/Diffusion'
import { fetchModeles, appliquerModele, type ModeleEvent } from '@/lib/modeles'
import {
  brouillonVide, controler, enregistrer, nbJours, statutDeduit, urlQr,
  type BrouillonEvent, type BrouillonLot,
} from '@/lib/wizard'
import type { Module } from '@/lib/types'

/**
 * Parcours aligne sur celui de l espace pro (CreerAnimationWizard) : une
 * decision a la fois, dans l ordre, avec Precedent / Suivant. Les trois etapes
 * que le wizard SA n avait pas et que le pro avait deja :
 *  - Contenu du jeu : c est la cause racine des « jeux vides » -- un quiz cree
 *    ici sortait sans banque de questions, il fallait y penser apres coup.
 *  - Recompenses typees : tirage vs gain immediat, comme cote pro.
 *  - Diffusion : ce que le terrain attend (QR imprime, lien, QR de tracking).
 * Plus l ecran de livraison, apres creation.
 */
const ETAPES = [
  { id: 'A', label: 'Identité' },
  { id: 'B', label: 'Module' },
  { id: 'C', label: 'Contenu du jeu' },
  { id: 'D', label: 'Récompenses' },
  { id: 'E', label: 'Réglages' },
  { id: 'F', label: 'Diffusion' },
  { id: 'G', label: 'Visibilité pro' },
  { id: 'H', label: 'Récapitulatif' },
] as const
type Etape = typeof ETAPES[number]['id']

const ICONES_MODULE: Record<Module, React.ReactNode> = {
  quiz: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="var(--sa-accent)" strokeWidth="1.8" />
      <path d="M9.5 9.2c0-1.4 1.1-2.4 2.5-2.4s2.5 1 2.5 2.2c0 1.6-2.5 1.8-2.5 3.6" stroke="var(--sa-accent)" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="16.3" r="1" fill="var(--sa-accent)" /></svg>
  ),
  quizsolo: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="7.5" r="3" stroke="var(--sa-accent)" strokeWidth="1.8" />
      <path d="M5.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" stroke="var(--sa-accent)" strokeWidth="1.8" strokeLinecap="round" /></svg>
  ),
  quizmaster: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="11" rx="3" stroke="var(--sa-accent)" strokeWidth="1.8" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V22M8.5 22h7" stroke="var(--sa-accent)" strokeWidth="1.8" strokeLinecap="round" /></svg>
  ),
  spin: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="var(--sa-accent)" strokeWidth="1.8" />
      <path d="M12 2v10l7 4" stroke="var(--sa-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="1.6" fill="var(--sa-accent)" /></svg>
  ),
  vote: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke="var(--sa-accent)" strokeWidth="1.8" />
      <path d="M8 12.5l2.5 2.5L16 9.5" stroke="var(--sa-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  tombola: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="11" rx="2" stroke="var(--sa-accent)" strokeWidth="1.8" />
      <path d="M9 7v11M15 7v11" stroke="var(--sa-accent)" strokeWidth="1.6" strokeDasharray="1.5 2.5" /><path d="M3 12h4M17 12h4" stroke="var(--sa-accent)" strokeWidth="1.8" /></svg>
  ),
}

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
  const { seId, superEvents } = useScope()
  const [d, setD] = useState<BrouillonEvent>(brouillonVide())
  const [etape, setEtape] = useState<Etape>('A')
  const [envoi, setEnvoi] = useState(false)
  const [retour, setRetour] = useState<{ ok: boolean; texte: string } | null>(null)
  const [banques, setBanques] = useState<Banque[]>([])
  /* Ecran de livraison : renseigne apres creation reussie. Tant qu il est nul,
     on est dans le wizard. Le SA repartait jusqu ici sur la liste des events
     apres 1,4 s, sans rien pour diffuser -- le pro, lui, avait cet ecran. */
  const [livre, setLivre] = useState<{ id: string; nom: string } | null>(null)

  const [modeles, setModeles] = useState<ModeleEvent[]>([])
  const [modeleApplique, setModeleApplique] = useState<string | null>(null)

  useEffect(() => { fetchBanquesToutes().then(setBanques) }, [])
  useEffect(() => { fetchModeles().then(setModeles) }, [])

  /* Rattachement pre-rempli : ?se=<id> (lien « Ajouter un point de jeu » depuis
     l espace Super Event) sinon la portee globale courante. Fermait un vrai
     trou : le wizard n exposait AUCUN champ super event, il fallait creer
     l event puis le rattacher a la main dans son drawer.
     window.location plutot que useSearchParams : pas de rendu dynamique force,
     donc pas de <Suspense> a poser autour de la page. */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('se')
    const cible = p || seId
    if (cible) setD(x => (x.super_event_id ? x : { ...x, super_event_id: cible }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seId])

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
      if (r.eventId) setLivre({ id: r.eventId, nom: d.nom.trim() })
    } else {
      setRetour({ ok: false, texte: r.erreur ?? 'Échec de l\u2019enregistrement.' })
    }
  }

  /* Les cles ecrites dans cfg sont EXACTEMENT celles que lisent les parcours
     joueur et l onglet « Contenu du jeu » du drawer (verifie dans EventDrawer et
     dans les *Client.tsx) : un event cree ici s ouvre donc deja configure. */
  const cfgJeu = d.cfg as Record<string, unknown>
  const banquesSel = (cfgJeu.quizBanques as string[]) ?? []
  const nbQuestions = (cfgJeu.quizNbQuestions as number) ?? 5
  const chrono = cfgJeu.quizTimer
  const segments = (cfgJeu.spinSegments as { label: string; color: string; perdant?: boolean }[]) ?? []
  const voteItems = (cfgJeu.voteItems as { id: string; nom: string; emoji?: string }[]) ?? []
  const majCfg = (champs: Record<string, unknown>) => maj({ cfg: { ...cfgJeu, ...champs } })

  const familleQuiz = d.module === 'quiz' || d.module === 'quizsolo' || d.module === 'quizmaster'
  const questionsDispo = banques
    .filter(b => banquesSel.includes(b.id))
    .reduce((n, b) => n + (b.questions ?? []).filter(q => q.type === 'qcm').length, 0)

  const COULEURS_SEGMENT = ['#7C2D92', '#E0218A', '#F5A100', '#1D9E75', '#378ADD', '#9d4edd']

  const diffusion = (cfgJeu.diffusion_demandee as Record<string, unknown>) ?? {}
  const majDiffusion = (champs: Record<string, unknown>) =>
    majCfg({ diffusion_demandee: { ...diffusion, ...champs, statut: 'en_attente_sa' } })

  const iEtape = ETAPES.findIndex(e => e.id === etape)
  const precedente = iEtape > 0 ? ETAPES[iEtape - 1] : null
  const suivante = iEtape < ETAPES.length - 1 ? ETAPES[iEtape + 1] : null

  const ligne = (label: string, requis: boolean, champ: React.ReactNode) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>
        {label}{requis && <span style={{ color: '#c46a6a' }}> *</span>}
      </label>
      {champ}
    </div>
  )

  /* ── ECRAN DE LIVRAISON ──────────────────────────────────────────────────
     Le wizard pro finissait sur un ecran de remise (recapitulatif, visuel
     imprimable, texte d annonce, lien Gmail). Le wizard SA, lui, redirigeait
     vers la liste apres 1,4 s : l event etait cree, et il fallait ensuite
     retrouver ou recuperer son QR. C est ce trou-la qu on ferme. */
  if (livre) {
    const liens: LienDiffusion[] = [
      {
        cle: 'Parcours joueur',
        chemin: `/parcours/${d.module || 'quiz'}?ev=${livre.id}`,
        aide: "Le lien du QR. C'est celui qui part sur les affiches et les supports.",
      },
      ...(d.super_event_id ? [{
        cle: 'Page dans le super event',
        chemin: `/se/${d.super_event_id}/${livre.id}`,
        aide: "La fiche de ce point de jeu sur la page publique du super event.",
      }] : []),
    ]
    const annonce = [
      `${livre.nom} — ${d.lieu || 'sur place'}`,
      d.date_d ? `À partir du ${d.date_d}${d.date_f && d.date_f !== d.date_d ? ` et jusqu'au ${d.date_f}` : ''}.` : '',
      d.lots.length ? `À gagner : ${d.lots.filter(l => l.nom?.trim()).map(l => l.nom.trim()).join(', ')}.` : '',
      `Scannez le QR sur place, ou jouez ici : https://flowin-events.vercel.app/parcours/${d.module || 'quiz'}?ev=${livre.id}`,
    ].filter(Boolean).join('\n')

    return (
      <div className="sa-page">
        <PageHeader
          title="✅ Événement créé"
          subtitle={livre.nom}
          actions={
            <>
              <button className="sa-btn" onClick={() => { setLivre(null); setD(brouillonVide(d.super_event_id)); setEtape('A'); setRetour(null) }}>
                Créer un autre
              </button>
              <button className="sa-btn primary" onClick={() => router.push(`/dashboard/event/${livre.id}`)}>
                Ouvrir la fiche
              </button>
            </>
          }
        />

        <div style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 12, padding: 18 }}>
          <Diffusion
            liens={liens}
            nomFichier={livre.nom}
            titreAffiche={livre.nom}
            sousTitreAffiche={[d.lieu, d.date_d].filter(Boolean).join(' — ')}
          />

          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--sa-border)' }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--sa-muted)', marginBottom: 8 }}>
              Texte d&apos;annonce
            </div>
            <textarea className="sa-input" readOnly value={annonce}
              style={{ width: '100%', minHeight: 96, fontSize: 12.5, lineHeight: 1.5 }}
              onFocus={e => e.currentTarget.select()} />
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <button className="sa-btn sm" onClick={() => navigator.clipboard?.writeText(annonce)}>Copier le texte</button>
              <a
                className="sa-btn sm"
                target="_blank" rel="noreferrer"
                href={`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(livre.nom)}&body=${encodeURIComponent(annonce)}`}
              >
                Préparer un mail Gmail ↗
              </a>
            </div>
            <p className="sa-diff-aide" style={{ marginTop: 10 }}>
              Même mécanisme que pour les gagnants et les partenaires : un lien Gmail
              pré-rempli, pas de dépendance à un service d&apos;envoi.
            </p>
          </div>
        </div>
      </div>
    )
  }

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
            {/* Le rattachement au super event n existait dans AUCUN formulaire :
                il fallait creer l event, puis le rattacher a la main dans son
                drawer. Il se choisit desormais des la creation. */}
            {ligne('Super event', false,
              <select className="sa-input" style={{ width: '100%' }} value={d.super_event_id ?? ''}
                onChange={e => maj({ super_event_id: e.target.value || null })}>
                <option value="">Aucun (event autonome)</option>
                {superEvents.map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}
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
          <>
            {modeles.length > 0 && (
              <div style={{ marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid var(--sa-border)' }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 4 }}>Partir d&apos;un modèle</div>
                <div className="sa-muted" style={{ fontSize: 11.5, marginBottom: 10, lineHeight: 1.5 }}>
                  Reprend le module, le contenu du jeu, les lots et la visibilité pro d&apos;un
                  événement déjà réglé. Ton nom, ton pro client et tes dates sont conservés.
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {modeles.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      className={`sa-btn sm${modeleApplique === m.id ? ' primary' : ''}`}
                      onClick={() => { setD(x => appliquerModele(x, m)); setModeleApplique(m.id) }}
                      title={m.description ?? undefined}
                    >
                      {m.nom}
                      <span style={{ opacity: 0.6, marginLeft: 6 }}>{m.module}</span>
                    </button>
                  ))}
                </div>
                {modeleApplique && (
                  <div style={{ marginTop: 8, fontSize: 11.5, color: '#2f7d4f', fontWeight: 600 }}>
                    Modèle appliqué — vérifie le contenu du jeu et les lots aux étapes suivantes.
                  </div>
                )}
              </div>
            )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
            {MODULES.map(m => (
              <button key={m.id} type="button" onClick={() => maj({ module: m.id })}
                style={{
                  textAlign: 'center', cursor: 'pointer', padding: '18px 13px', borderRadius: 14,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  background: d.module === m.id ? 'var(--sa-subtle)' : 'transparent',
                  border: `2px solid ${d.module === m.id ? 'var(--sa-accent)' : 'var(--sa-border)'}`,
                }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--sa-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  {ICONES_MODULE[m.id]}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 800 }}>{m.nom}</div>
                <div className="sa-muted" style={{ fontSize: 11, marginTop: 3 }}>{m.desc}</div>
              </button>
            ))}
          </div>
          </>
        )}

        {etape === 'C' && (
          <>
            {!d.module && (
              <div className="sa-muted" style={{ fontSize: 12 }}>
                Choisis d&apos;abord un module à l&apos;étape précédente.
              </div>
            )}

            {familleQuiz && (
              <>
                <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 4 }}>Banques de questions</div>
                <div className="sa-muted" style={{ fontSize: 11.5, marginBottom: 10, lineHeight: 1.5 }}>
                  Sans banque, le jeu démarre vide. C&apos;est la cause des « jeux vides »
                  constatés : le wizard ne posait jamais la question.
                </div>
                {banques.length === 0 && <div className="sa-muted" style={{ fontSize: 11.5 }}>Chargement des banques…</div>}
                {banques.map(b => {
                  const coche = banquesSel.includes(b.id)
                  const n = (b.questions ?? []).filter(q => q.type === 'qcm').length
                  return (
                    <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={coche}
                        onChange={e => majCfg({
                          quizBanques: e.target.checked
                            ? [...banquesSel, b.id]
                            : banquesSel.filter(x => x !== b.id),
                        })}
                      />
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{b.nom}</span>
                      <span className="sa-muted" style={{ fontSize: 11 }}>{n} question{n > 1 ? 's' : ''}</span>
                    </label>
                  )
                })}
                <div style={{
                  marginTop: 10, padding: '9px 11px', borderRadius: 9, fontSize: 11.5,
                  border: `1px solid ${questionsDispo >= nbQuestions ? 'var(--sa-border)' : '#b4791f'}`,
                  background: questionsDispo >= nbQuestions ? 'transparent' : 'rgba(244,181,68,.10)',
                }}>
                  <b>{questionsDispo}</b> question{questionsDispo > 1 ? 's' : ''} disponible{questionsDispo > 1 ? 's' : ''}
                  {questionsDispo < nbQuestions && ` — moins que les ${nbQuestions} demandées par partie.`}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                  {ligne('Questions par partie', false,
                    <input type="number" min={1} className="sa-input" style={{ width: '100%' }} value={nbQuestions}
                      onChange={e => majCfg({ quizNbQuestions: Number(e.target.value) || 1 })} />)}
                  {ligne('Chronomètre', false,
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button type="button" className={`sa-btn sm${chrono !== false ? ' primary' : ''}`}
                        onClick={() => majCfg({ quizTimer: chrono === false ? 30 : chrono })}>Activé</button>
                      <button type="button" className={`sa-btn sm${chrono === false ? ' primary' : ''}`}
                        onClick={() => majCfg({ quizTimer: false })}>Sans</button>
                      {chrono !== false && (
                        <input type="number" min={5} className="sa-input" style={{ width: 80 }}
                          value={typeof chrono === 'number' ? chrono : 30}
                          onChange={e => majCfg({ quizTimer: Number(e.target.value) || 30 })} />
                      )}
                      {chrono !== false && <span className="sa-muted" style={{ fontSize: 11 }}>s</span>}
                    </div>)}
                </div>
              </>
            )}

            {d.module === 'spin' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800 }}>Segments de la roue ({segments.length})</div>
                  <button className="sa-btn sm primary" onClick={() => majCfg({
                    spinSegments: [...segments, { label: '', color: COULEURS_SEGMENT[segments.length % COULEURS_SEGMENT.length] }],
                  })}>+ Ajouter</button>
                </div>
                {segments.length === 0 && (
                  <div className="sa-muted" style={{ fontSize: 11.5 }}>
                    Une roue sans segment ne tourne sur rien. Ajoute au moins deux segments.
                  </div>
                )}
                {segments.map((sg, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 54px auto auto', gap: 8, alignItems: 'center', marginBottom: 7 }}>
                    <input className="sa-input" placeholder="Intitulé du segment" value={sg.label}
                      onChange={e => majCfg({ spinSegments: segments.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} />
                    <input type="color" className="sa-input" style={{ height: 34, padding: 2 }} value={sg.color}
                      onChange={e => majCfg({ spinSegments: segments.map((x, j) => j === i ? { ...x, color: e.target.value } : x) })} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, whiteSpace: 'nowrap' }}>
                      <input type="checkbox" checked={!!sg.perdant}
                        onChange={e => majCfg({ spinSegments: segments.map((x, j) => j === i ? { ...x, perdant: e.target.checked } : x) })} />
                      perdant
                    </label>
                    <button className="sa-btn sm" onClick={() => majCfg({ spinSegments: segments.filter((_, j) => j !== i) })}>Retirer</button>
                  </div>
                ))}
              </>
            )}

            {d.module === 'vote' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800 }}>Éléments à voter ({voteItems.length})</div>
                  <button className="sa-btn sm primary" onClick={() => majCfg({
                    voteItems: [...voteItems, { id: `v-${Date.now().toString(36)}`, nom: '' }],
                  })}>+ Ajouter</button>
                </div>
                {voteItems.length === 0 && (
                  <div className="sa-muted" style={{ fontSize: 11.5 }}>Sans élément, le public n&apos;a rien à départager.</div>
                )}
                {voteItems.map((it, i) => (
                  <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '64px 1fr auto', gap: 8, alignItems: 'center', marginBottom: 7 }}>
                    <input className="sa-input" placeholder="🎭" value={it.emoji ?? ''}
                      onChange={e => majCfg({ voteItems: voteItems.map((x, j) => j === i ? { ...x, emoji: e.target.value } : x) })} />
                    <input className="sa-input" placeholder="Nom" value={it.nom}
                      onChange={e => majCfg({ voteItems: voteItems.map((x, j) => j === i ? { ...x, nom: e.target.value } : x) })} />
                    <button className="sa-btn sm" onClick={() => majCfg({ voteItems: voteItems.filter((_, j) => j !== i) })}>Retirer</button>
                  </div>
                ))}
              </>
            )}

            {d.module === 'tombola' && (
              <div className="sa-muted" style={{ fontSize: 12, lineHeight: 1.55 }}>
                Rien à configurer ici : la tombola tire parmi les participants inscrits.
                Ce sont les lots, à l&apos;étape suivante, qui définissent ce qui est à gagner.
              </div>
            )}
          </>
        )}

        {etape === 'E' && (
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
                onClick={() => setD(x => ({ ...x, lots: [...x.lots, { nom: '', quantite: 1, valeur: 0, type: 'tirage' }] }))}>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {/* Typage aligne sur le wizard pro, qui distinguait deja les deux
                      alors que le wizard SA creait tout en tirage par defaut. */}
                  {ligne('Comment il se gagne', false,
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className={`sa-btn sm${(l.type ?? 'tirage') === 'tirage' ? ' primary' : ''}`}
                        onClick={() => majLot(i, { type: 'tirage' })}>🎟️ Tirage au sort</button>
                      <button type="button" className={`sa-btn sm${l.type === 'instantane' ? ' primary' : ''}`}
                        onClick={() => majLot(i, { type: 'instantane' })}>⚡ Gain immédiat</button>
                    </div>)}
                  {ligne('Partenaire (facultatif)', false,
                    <select className="sa-input" style={{ width: '100%' }} value={l.partenaire_id ?? ''}
                      onChange={e => majLot(i, { partenaire_id: e.target.value || null })}>
                      <option value="">— aucun —</option>
                      {partenaires.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                    </select>)}
                </div>
                {ligne('Conditions de retrait (facultatif)', false,
                  <input className="sa-input" style={{ width: '100%' }} value={l.conditions ?? ''}
                    placeholder="À retirer en boutique avant le 30/09, sur présentation du billet…"
                    onChange={e => majLot(i, { conditions: e.target.value || null })} />)}
              </div>
            ))}
          </>
        )}

        {etape === 'F' && (
          <>
            <div className="sa-muted" style={{ fontSize: 11.5, marginBottom: 12, lineHeight: 1.5 }}>
              Comment ce point de jeu sera porté sur le terrain. Même question que
              dans le wizard pro, qui la posait déjà — le wizard SA, non.
            </div>
            {([
              ['physique', 'QR imprimé sur place', 'Affiche, chevalet, sticker à poser au point de jeu.'],
              ['digital', 'Lien digital', 'Partagé en story, en newsletter, sur le site du commerce.'],
              ['qr_tracking', 'QR de tracking', "QR distinct par support, pour savoir d'où viennent les scans."],
            ] as const).map(([cle, titre, desc]) => (
              <label key={cle} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 0', cursor: 'pointer', borderBottom: '1px solid var(--sa-border)' }}>
                <input
                  type="checkbox"
                  style={{ marginTop: 3 }}
                  checked={!!diffusion[cle]}
                  onChange={e => majDiffusion({ [cle]: e.target.checked })}
                />
                <span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, display: 'block' }}>{titre}</span>
                  <span className="sa-muted" style={{ fontSize: 11.5 }}>{desc}</span>
                </span>
              </label>
            ))}
            <div className="sa-muted" style={{ fontSize: 11, marginTop: 12, lineHeight: 1.5 }}>
              Ce choix est enregistré comme une demande (<code>cfg.diffusion_demandee</code>),
              pas comme une commande : c&apos;est le même champ que celui rempli par les pros.
              Le QR téléchargeable, lui, est disponible dès la création.
            </div>
          </>
        )}

        {etape === 'G' && (
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

        {etape === 'H' && (
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

        {/* Navigation guidee : une decision a la fois, comme cote pro. Les
            pastilles d etapes restent cliquables pour revenir en arriere vite. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--sa-border)' }}>
          <button className="sa-btn" disabled={!precedente}
            onClick={() => precedente && setEtape(precedente.id)}>
            ← {precedente?.label ?? 'Début'}
          </button>
          <span className="sa-muted" style={{ fontSize: 11.5, marginLeft: 'auto' }}>
            Étape {iEtape + 1} sur {ETAPES.length}
          </span>
          {suivante ? (
            <button className="sa-btn primary" onClick={() => setEtape(suivante.id)}>
              {suivante.label} →
            </button>
          ) : (
            <button
              className="sa-btn primary"
              onClick={enregistrement}
              disabled={envoi || problemes.length > 0}
              title={problemes.length ? problemes[0].message : undefined}
            >
              {envoi ? 'Enregistrement…' : 'Créer l\u2019événement'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
