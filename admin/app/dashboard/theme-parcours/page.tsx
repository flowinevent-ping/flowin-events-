'use client'

/**
 * EDITEUR DE THEME DES PARCOURS — niveau B (par event), sur la base posee par
 * lib/parcoursTheme.ts.
 *
 * Rappel du systeme a deux niveaux (voir lib/parcoursTheme.ts pour le detail) :
 *  - Niveau A, « master » par module : PARCOURS_THEME_DEFAULTS, en dur dans
 *    le code. Pas touche par cet ecran — une vraie edition du master demande
 *    une migration SQL, deja documentee en commentaire dans ce fichier, pas
 *    appliquee (connecteur Supabase de cette session sur le mauvais compte).
 *  - Niveau B, surcharge par event : stockee dans `events.cfg.theme`. C'EST
 *    ce que cet ecran edite, champ par champ, sans jamais ecraser le reste de
 *    `cfg` (meme lecture-fusion-ecriture que EventDrawer.tsx partout
 *    ailleurs : upsertEvent({ id, cfg }) avec le cfg complet reconstruit).
 *
 * Modules themables : tous ceux dont le parcours lit reellement
 * resolveParcoursTheme a ce jour -- verifie par recherche de code au moment
 * d'ecrire cet ecran : Vote, Quiz, Quiz solo, Tombola, Spin (VoteClient.tsx,
 * QuizClient.tsx, QuizsoloClient.tsx, TombolaClient.tsx, SpinClient.tsx).
 * Quiz master et NDS2026 ne lisent pas (encore) ce theme -- exclus du
 * selecteur pour ne pas laisser croire qu'une surcharge aurait un effet.
 *
 * L'apercu reutilise le cadre telephone existant (components/parcours/
 * ApercuJeu.tsx, deja utilise par le wizard event et l espace pro) : il
 * charge la VRAIE page du jeu, sur l event reellement choisi, en mode preview
 * (rien n est ecrit, aucune visite ni participation n est tracee -- voir
 * lib/apercu.ts). La saisie en cours remplace `cfg.theme` en entier dans
 * cette page de preview, exactement comme ce que « Enregistrer » ecrira.
 */
import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/dashboard/DashboardUI'
import ApercuJeu from '@/components/parcours/ApercuJeu'
import '@/components/dashboard/apercu.css'
import { useDashboard } from '@/contexts/DashboardContext'
import { usePorteeInitiale } from '@/lib/portee'
import { upsertEvent } from '@/lib/dashboard'
import { PARCOURS_THEME_DEFAULTS, resolveParcoursTheme, type ParcoursTheme } from '@/lib/parcoursTheme'
import { libelleModule } from '@/lib/operations'
import type { EventCfg, Module } from '@/lib/types'

/** Modules dont le parcours lit reellement resolveParcoursTheme a ce jour. */
const MODULES_THEMABLES: Module[] = ['vote', 'quiz', 'quizsolo', 'tombola', 'spin']

/** Libelle humain des cles de `texts` connues des modules ci-dessus (lib/parcoursTheme.ts).
    Aucune cle inventee : uniquement celles deja presentes dans PARCOURS_THEME_DEFAULTS. */
const LABELS_TEXTES: Record<string, string> = {
  landingSubtitle: "Sous-titre de l'écran d'accueil",
  ctaLanding: 'Texte du bouton de démarrage',
}

type ChampTexte = keyof Pick<ParcoursTheme, 'bgImage' | 'logoUrl' | 'logoSvg' | 'logoEmoji'>

export default function Page() {
  const { events, setEvents } = useDashboard()
  const portee = usePorteeInitiale()

  const evsThemables = useMemo(
    () => events.filter(e => MODULES_THEMABLES.indexOf(e.module) !== -1)
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr')),
    [events],
  )

  const [eventId, setEventId] = useState('')
  useEffect(() => {
    if (portee.event && evsThemables.some(e => e.id === portee.event)) setEventId(portee.event)
  }, [portee.event, evsThemables])

  const ev = evsThemables.find(e => e.id === eventId) || null
  const module = (ev?.module as Module | undefined) || null
  const master = module ? PARCOURS_THEME_DEFAULTS[module] : null

  /* Brouillon d edition = la surcharge niveau B telle qu elle existe deja sur
     l event (cfg.theme), copiee pour ne rien modifier avant "Enregistrer".
     Reinitialise a chaque changement d event. */
  const [draft, setDraft] = useState<Partial<ParcoursTheme>>({})
  useEffect(() => {
    const existant = (ev?.cfg?.theme ?? {}) as Partial<ParcoursTheme>
    setDraft({ ...existant, texts: { ...(existant.texts ?? {}) } })
  }, [eventId]) // eslint-disable-line react-hooks/exhaustive-deps

  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; texte: string } | null>(null)

  const effectif = module ? resolveParcoursTheme(module, { theme: draft }) : null

  function setChamp<K extends ChampTexte>(cle: K, valeur: string) {
    setMsg(null)
    setDraft(d => {
      const n = { ...d }
      if (valeur.trim() === '') delete n[cle]
      else n[cle] = valeur
      return n
    })
  }
  function setCouleur(valeur: string) {
    setMsg(null)
    setDraft(d => ({ ...d, bgColor: valeur }))
  }
  function reinitialiserCouleur() {
    setMsg(null)
    setDraft(d => { const n = { ...d }; delete n.bgColor; return n })
  }
  function setTexte(cle: string, valeur: string) {
    setMsg(null)
    setDraft(d => {
      const texts = { ...(d.texts ?? {}) }
      if (valeur.trim() === '') delete texts[cle]
      else texts[cle] = valeur
      return { ...d, texts }
    })
  }
  function toutReinitialiser() {
    setMsg(null)
    setDraft({})
  }

  async function enregistrer() {
    if (!ev) return
    setSaving(true)
    setMsg(null)
    const theme: Partial<ParcoursTheme> = { ...draft }
    if (theme.texts && Object.keys(theme.texts).length === 0) delete theme.texts
    const cfg = { ...((ev.cfg ?? {}) as EventCfg) }
    if (Object.keys(theme).length === 0) delete cfg.theme
    else cfg.theme = theme
    const ok = await upsertEvent({ id: ev.id, cfg: cfg as typeof ev.cfg })
    if (ok) setEvents(events.map(x => x.id === ev.id ? { ...x, cfg: cfg as typeof x.cfg } : x))
    setMsg(ok ? { ok: true, texte: 'Thème enregistré.' } : { ok: false, texte: "Erreur à l'enregistrement — réessayez." })
    setSaving(false)
  }

  const clesTextes = master ? Object.keys(master.texts) : []
  const estPersonnalise = Object.keys(draft).length > 0 || (draft.texts ? Object.keys(draft.texts).length > 0 : false)

  return (
    <div className="sa-page">
      <PageHeader
        title="Thème des parcours"
        subtitle="Personnalise l'apparence d'un event (fond, logo, textes) sans toucher au code — niveau B du système de thème"
      />

      <div style={{ padding: '0 24px 24px' }}>
        <div className="sa-field" style={{ maxWidth: 480 }}>
          <label className="sa-label">Event à personnaliser</label>
          <select className="sa-input" value={eventId} onChange={e => setEventId(e.target.value)}>
            <option value="">— Choisir —</option>
            {evsThemables.map(e => (
              <option key={e.id} value={e.id}>
                {e.nom} — {libelleModule(e.module)}{e.status === 'live' ? ' (live)' : ''}
              </option>
            ))}
          </select>
          {evsThemables.length === 0 && (
            <div className="sa-muted" style={{ fontSize: 11.5, marginTop: 6 }}>
              Aucun event Vote / Quiz / Quiz solo / Tombola / Spin pour le moment.
            </div>
          )}
          <div className="sa-muted" style={{ fontSize: 11.5, marginTop: 6, lineHeight: 1.5 }}>
            Vote, Quiz, Quiz solo, Tombola et Spin lisent ce thème aujourd&apos;hui — Quiz master et
            NDS2026 gardent pour l&apos;instant leur habillage d&apos;origine, non modifiable ici.
          </div>
        </div>

        {!ev && (
          <div className="sa-muted" style={{ fontSize: 13, padding: '20px 0' }}>
            Choisissez un event ci-dessus pour voir et modifier son thème.
          </div>
        )}

        {ev && module && master && effectif && (
          <div className="sa-parc-avec-apercu" style={{ marginTop: 18 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {estPersonnalise ? 'Thème personnalisé pour cet event' : "Thème par défaut du module — aucune personnalisation sur cet event"}
                </div>
                {estPersonnalise && (
                  <button type="button" className="sa-btn sm" onClick={toutReinitialiser}>Tout réinitialiser</button>
                )}
              </div>

              <div className="sa-field">
                <label className="sa-label">Couleur de fond</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="color" className="sa-input" style={{ width: 56, height: 38, padding: 3, flexShrink: 0 }}
                    value={effectif.bgColor} onChange={e => setCouleur(e.target.value)}
                  />
                  <input
                    className="sa-input" value={effectif.bgColor} onChange={e => setCouleur(e.target.value)}
                    placeholder={master.bgColor}
                  />
                  {draft.bgColor !== undefined && (
                    <button type="button" className="sa-btn sm" onClick={reinitialiserCouleur} style={{ flexShrink: 0 }}>
                      Défaut
                    </button>
                  )}
                </div>
                <div className="sa-muted" style={{ fontSize: 11, marginTop: 4 }}>Défaut du module : {master.bgColor}</div>
              </div>

              <div className="sa-field">
                <label className="sa-label">Image de fond (URL, optionnel)</label>
                <input
                  className="sa-input" type="url" placeholder="https://… (remplace la couleur de fond si renseignée)"
                  value={draft.bgImage ?? ''} onChange={e => setChamp('bgImage', e.target.value)}
                />
              </div>

              <div className="sa-field">
                <label className="sa-label">Logo — image (URL)</label>
                <input
                  className="sa-input" type="url" placeholder="https://… (prioritaire sur l'emoji, mais pas sur le SVG ci-dessous)"
                  value={draft.logoUrl ?? ''} onChange={e => setChamp('logoUrl', e.target.value)}
                />
              </div>

              <div className="sa-field">
                <label className="sa-label">Logo — emoji (si aucune image)</label>
                <input
                  className="sa-input" maxLength={8} style={{ maxWidth: 160 }} placeholder="un caractère emoji"
                  value={draft.logoEmoji ?? ''} onChange={e => setChamp('logoEmoji', e.target.value)}
                />
              </div>

              <div className="sa-field">
                <label className="sa-label">Logo — SVG personnalisé (optionnel, avancé)</label>
                <textarea
                  className="sa-input" rows={3} placeholder="<svg>…</svg> — prioritaire sur l'image et l'emoji"
                  value={draft.logoSvg ?? ''} onChange={e => setChamp('logoSvg', e.target.value)}
                />
                <div className="sa-muted" style={{ fontSize: 11, marginTop: 4 }}>
                  Code SVG affiché tel quel sur l&apos;écran du joueur — à réserver à un visuel de confiance.
                </div>
              </div>

              {clesTextes.length > 0 && (
                <>
                  <div className="sa-label" style={{ marginTop: 18, marginBottom: 8 }}>Textes</div>
                  {clesTextes.map(cle => (
                    <div className="sa-field" key={cle}>
                      <label className="sa-label">{LABELS_TEXTES[cle] ?? cle}</label>
                      <input
                        className="sa-input" placeholder={master.texts[cle]}
                        value={draft.texts?.[cle] ?? ''} onChange={e => setTexte(cle, e.target.value)}
                      />
                    </div>
                  ))}
                </>
              )}

              {msg && (
                <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: msg.ok ? '#2f7d4f' : '#c46a6a' }}>
                  {msg.texte}
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <button type="button" className="sa-btn primary" disabled={saving} onClick={enregistrer}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>

            <ApercuJeu module={module} eventId={ev.id} saisie={{ cfg: { theme: draft } }} titre="Aperçu en direct" />
          </div>
        )}
      </div>
    </div>
  )
}
