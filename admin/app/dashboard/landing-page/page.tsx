'use client'

/**
 * Landing pages — inventaire des landings de prospection.
 *
 * `published` et `statut` sont deux informations DISTINCTES : une landing peut etre
 * marquee prete sans etre en ligne. Les deux sont affichees separement, jamais fusionnees
 * en un seul indicateur.
 *
 * MAJ 30/08 -- Romain signale une regression : le monolithe legacy avait une preview
 * navigable en cadre telephone (iframe-landing-apercu, fleches precedent/suivant).
 * Restauree une premiere fois en ne couvrant que la table `landings` (2 lignes gerees) --
 * INCOMPLET : Romain a remarque l'absence de "Prospection". Verifie dans le legacy
 * (dashboard.html:4733, tableau `lands`) : la vraie liste couvre 12 pages, dont 9 pages
 * HTML statiques de presentation/prospection jamais suivies dans la table `landings`
 * (elle ne sert qu'aux 2 landings VRAIMENT pilotables : prix, statut, module de jeu).
 * Les 9 autres sont fusionnees ici en dur, comme dans le legacy -- fichiers verifies
 * presents sur le disque avant integration, pas supposes.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { PageHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { fetchLandings, type Landing } from '@/lib/administratif'
import { Ico } from '@/lib/proicons'
import { OutilCarte } from '@/components/dashboard/OutilCarte'
import { OUTILS as OUTILS_BASE, OUTILS_MANQUANTS, PUBLICS, urlProd, lireValides, ecrireValides, type Outil } from '@/lib/outilsCommerciaux'
import { BarreActionsOutil, type CibleBarre } from '@/components/dashboard/BarreActionsOutil'

/* MAJ 01/11 -- UNE seule page pour tout le materiel de diffusion (decision Romain) : les 12 pages de
   reference statiques qui vivaient ici en dur sont desormais dans le catalogue unique
   lib/outilsCommerciaux.ts, avec les plaquettes, le bon de commande, les CGV, l'inscription pro et les
   videos. Chaque outil garde ses actions (copier, WhatsApp, email, QR, canal ?src=) et ses regles de
   statut (valide / brouillon). Les landings gerees (table `landings`) restent inchangees. */

/** Une diapositive du carrousel d'apercu : landing geree OU outil du catalogue. */
interface Slide { id: string; nom: string; src: string; aVenir?: boolean; genre: 'geree' | 'outil' }

function PhoneApercu({ landing, onPrev, onNext, position }: { landing: Slide | null; onPrev: () => void; onNext: () => void; position: string }) {
  const W = 220, H = 442, SCALE = 0.586
  const IW = Math.round(W / SCALE), IH = Math.round(H / SCALE)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <button
        className="sa-btn icon" onClick={onPrev} disabled={!landing}
        aria-label="Landing précédente" style={{ fontSize: 18 }}
      >‹</button>

      <div style={{ width: W + 20, flexShrink: 0 }}>
        <div style={{ borderRadius: 32, padding: 9, background: '#0F172A', boxShadow: '0 20px 50px rgba(15,23,42,.25)' }}>
          <div style={{ borderRadius: 24, overflow: 'hidden', background: '#fff', width: W, height: H, position: 'relative' }}>
            {landing?.src ? (
              <iframe
                key={landing.id}
                src={landing.src}
                title={`Aperçu — ${landing.nom ?? landing.id}`}
                loading="lazy"
                style={{ width: IW, height: IH, border: 0, transform: `scale(${SCALE})`, transformOrigin: 'top left' }}
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 20, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                {landing?.aVenir ? 'Vidéo à venir : pas encore de fichier à prévisualiser.' : 'Aucune landing avec URL de déploiement à prévisualiser.'}
              </div>
            )}
          </div>
        </div>
        {landing && (
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <div style={{ fontWeight: 800, fontSize: 13 }}>{landing.nom ?? landing.id}</div>
            <div className="sa-muted" style={{ fontSize: 11, marginTop: 2 }}>{position}</div>
          </div>
        )}
      </div>

      <button
        className="sa-btn icon" onClick={onNext} disabled={!landing}
        aria-label="Landing suivante" style={{ fontSize: 18 }}
      >›</button>
    </div>
  )
}

function OrdiApercu({ landing, onPrev, onNext, position }: { landing: Slide | null; onPrev: () => void; onNext: () => void; position: string }) {
  const DW = 1280, DH = 800, W = 720, SCALE = W / DW, H = Math.round(DH * SCALE)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, maxWidth: '100%' }}>
      <button className="sa-btn icon" onClick={onPrev} disabled={!landing} aria-label="Landing précédente" style={{ fontSize: 18 }}>‹</button>
      <div style={{ width: W, maxWidth: 'calc(100vw - 120px)', flexShrink: 1 }}>
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--sa-border)', boxShadow: '0 20px 50px rgba(15,23,42,.18)', background: '#fff' }}>
          <div style={{ height: 22, background: '#E2E8F0', display: 'flex', alignItems: 'center', gap: 5, padding: '0 9px' }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: '#F87171' }} />
            <span style={{ width: 8, height: 8, borderRadius: 4, background: '#FBBF24' }} />
            <span style={{ width: 8, height: 8, borderRadius: 4, background: '#34D399' }} />
          </div>
          <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden' }}>
            {landing?.src ? (
              <iframe
                key={landing.id}
                src={landing.src}
                title={`Aperçu ordinateur — ${landing.nom ?? landing.id}`}
                loading="lazy"
                style={{ width: DW, height: DH, border: 0, transform: `scale(${SCALE})`, transformOrigin: 'top left' }}
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#64748B', fontSize: 13 }}>
                {landing?.aVenir ? 'Vidéo à venir : pas encore de fichier à prévisualiser.' : 'Aucune landing avec URL de déploiement à prévisualiser.'}
              </div>
            )}
          </div>
        </div>
        {landing && (
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <div style={{ fontWeight: 800, fontSize: 13 }}>{landing.nom ?? landing.id}</div>
            <div className="sa-muted" style={{ fontSize: 11, marginTop: 2 }}>{position}</div>
          </div>
        )}
      </div>
      <button className="sa-btn icon" onClick={onNext} disabled={!landing} aria-label="Landing suivante" style={{ fontSize: 18 }}>›</button>
    </div>
  )
}

export default function Page() {
  const [vue, setVue] = useState<'tel' | 'ordi'>('tel')
  const [list, setList] = useState<Landing[]>([])
  const [charge, setCharge] = useState(true)
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const [plein, setPlein] = useState(false)
  /* Validation faite par le Super Admin depuis l'apercu : stockage local (aucun SQL), voir lib/outilsCommerciaux.ts. */
  const [valides, setValides] = useState<string[]>([])
  useEffect(() => { setValides(lireValides()) }, [])
  const OUTILS = useMemo<Outil[]>(() => OUTILS_BASE.map(o => valides.indexOf(o.id) >= 0 ? { ...o, statut: 'validé' as const } : o), [valides])
  function basculerValidation(id: string, v: boolean) {
    const n = v ? (valides.indexOf(id) >= 0 ? valides : [...valides, id]) : valides.filter(x => x !== id)
    setValides(n); ecrireValides(n)
  }

  useEffect(() => {
    fetchLandings().then(setList).finally(() => setCharge(false))
  }, [])

  /* Romain (28/10) : la grille ci-dessous ne listait QUE les 2 landings
     pilotables de la table `landings` -- les 11 pages de reference statiques
     (PAGES_STATIQUES) n'etaient visibles/cliquables que via les fleches du
     petit carrousel en haut, jamais dans la grille ni la recherche. Priorite
     demandee : CHAQUE page listee a un lien direct qui ouvre la vraie page
     en plein ecran dans un nouvel onglet -- donc toutes les pages vivent
     maintenant dans la meme liste, filtree par la meme recherche. */
  const [filtre, setFiltre] = useState<'tous' | 'gerees' | 'commerce' | 'organisateur' | 'partenaire'>('tous')
  const haut = useRef<HTMLDivElement>(null)
  const t = q.trim().toLowerCase()

  const landingsFiltrees = useMemo(() =>
    (filtre === 'tous' || filtre === 'gerees') ? list.filter(l => !t || (l.nom ?? l.id).toLowerCase().includes(t)) : []
  , [list, filtre, t])
  const outilsFiltres = useMemo(() =>
    OUTILS.filter(o => filtre !== 'gerees' && (filtre === 'tous' || o.public.indexOf(filtre) >= 0)
      && (!t || (o.titre + ' ' + o.description).toLowerCase().includes(t)))
  , [OUTILS, filtre, t])

  /* Carrousel : landings gerees avec URL, puis tous les outils (les videos « a venir » y figurent). */
  const slides: Slide[] = useMemo(() => [
    ...list.filter(l => l.deploy_url).map(l => ({ id: l.id, nom: l.nom ?? l.id, src: l.deploy_url as string, genre: 'geree' as const })),
    ...OUTILS.map(o => ({ id: o.id, nom: o.titre, src: o.aVenir ? '' : o.chemin, aVenir: !!o.aVenir, genre: 'outil' as const })),
  ], [list, OUTILS])
  const avecUrl = slides
  const courant = slides[idx] ?? null
  const urlCourante = courant ? (courant.genre === 'outil' ? urlProd(OUTILS.find(o => o.id === courant.id) as Outil) : courant.src) : ''
  const libelle = (x: Slide | null) => x?.genre === 'outil' ? (x.aVenir ? ' · vidéo à venir' : ' · outil commercial') : ' · landing gérée'

  /* Cible de la barre d'actions : outil du catalogue (regle valide / brouillon) ou landing geree (en ligne ou non). */
  const outilCourant = courant?.genre === 'outil' ? OUTILS.find(o => o.id === courant.id) ?? null : null
  const landingCourante = courant?.genre === 'geree' ? list.find(l => l.id === courant.id) ?? null : null
  const cible: CibleBarre | null = outilCourant ? {
    titre: outilCourant.titre, url: urlCourante, message: outilCourant.message,
    partageable: outilCourant.statut === 'validé' && !outilCourant.aVenir,
    motif: 'Brouillon : à valider avant partage',
    valide: outilCourant.statut === 'validé',
    onValider: v => basculerValidation(outilCourant.id, v),
  } : landingCourante ? {
    titre: landingCourante.nom ?? landingCourante.id, url: urlCourante, message: 'Bonjour, voici une page Flowin :',
    partageable: landingCourante.published === true, motif: 'Landing hors ligne : à publier avant partage',
  } : null

  const enLigne = list.filter(l => l.published === true).length

  function ouvrirApercu(id: string) {
    const i = slides.findIndex(x => x.id === id)
    if (i !== -1) { setIdx(i); if (haut.current) haut.current.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  }

  return (
    <div className="sa-page">
      <PageHeader
        title="Landing pages & outils commerciaux"
        subtitle={`${list.length} landing${list.length > 1 ? 's' : ''} gérée${list.length > 1 ? 's' : ''} · ${enLigne} en ligne · ${OUTILS.length} outils commerciaux · ${avecUrl.length} aperçus au total`}
      />

      {!charge && avecUrl.length > 0 && (
        <div ref={haut} data-carrousel style={{ scrollMarginTop: 12, background: 'var(--sa-subtle)', borderRadius: 14, padding: '18px 14px', marginBottom: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <button className="sa-btn" onClick={() => setVue('tel')} style={{ fontSize: 12, fontWeight: 700, padding: '6px 12px', background: vue === 'tel' ? 'var(--sa-accent)' : undefined, color: vue === 'tel' ? '#fff' : undefined }}>Téléphone</button>
            <button className="sa-btn" onClick={() => setVue('ordi')} style={{ fontSize: 12, fontWeight: 700, padding: '6px 12px', background: vue === 'ordi' ? 'var(--sa-accent)' : undefined, color: vue === 'ordi' ? '#fff' : undefined }}>Ordinateur</button>
          </div>
          {vue === 'tel' ? (
            <PhoneApercu
              landing={courant}
              onPrev={() => setIdx(i => (i - 1 + avecUrl.length) % avecUrl.length)}
              onNext={() => setIdx(i => (i + 1) % avecUrl.length)}
              position={`${idx + 1} / ${avecUrl.length}${libelle(courant)}`}
            />
          ) : (
            <OrdiApercu
              landing={courant}
              onPrev={() => setIdx(i => (i - 1 + avecUrl.length) % avecUrl.length)}
              onNext={() => setIdx(i => (i + 1) % avecUrl.length)}
              position={`${idx + 1} / ${avecUrl.length}${libelle(courant)}`}
            />
          )}
          {urlCourante && (
            <a href={urlCourante} target="_blank" rel="noopener noreferrer" className="sa-btn" style={{ fontSize: 12, fontWeight: 700, padding: '6px 12px', marginTop: 4 }}>
              Ouvrir cette page en plein écran ↗
            </a>
          )}
          {urlCourante && (
            <button className="sa-btn" data-plein onClick={() => setPlein(true)} style={{ fontSize: 12, fontWeight: 700, padding: '6px 12px' }}>Aperçu plein écran avec envoi</button>
          )}
          {cible && <BarreActionsOutil cible={cible} />}
        </div>
      )}

      {plein && courant && courant.src && (
        <div role="dialog" aria-modal="true" aria-label="Aperçu plein écran" data-plein-vue
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#fff', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid var(--sa-border)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <strong style={{ fontSize: 14 }}>{courant.nom}</strong>
            <button className="sa-btn" data-plein-fermer onClick={() => setPlein(false)} style={{ fontSize: 12, fontWeight: 700, padding: '6px 12px' }}>Fermer</button>
          </div>
          {cible && <BarreActionsOutil cible={cible} />}
          <iframe src={courant.src} title={`Plein écran : ${courant.nom}`} style={{ flex: 1, border: 0, width: '100%' }} />
        </div>
      )}

      <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="sa-input"
          placeholder="Rechercher une landing ou un outil…"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        {([{ v: 'tous', label: 'Tous' }, { v: 'gerees', label: 'Landings gérées' }, ...PUBLICS] as { v: typeof filtre; label: string }[]).map(p => (
          <button key={p.v} className="sa-btn" aria-pressed={filtre === p.v} onClick={() => setFiltre(p.v)}
            style={{ fontSize: 12, fontWeight: 700, padding: '6px 12px', background: filtre === p.v ? 'var(--sa-accent)' : undefined, color: filtre === p.v ? '#fff' : undefined }}>{p.label}</button>
        ))}
      </div>

      {charge && <div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div>}

      {!charge && !landingsFiltrees.length && !outilsFiltres.length && (
        <EmptyState icon="globe" title="Aucune landing" desc={q ? 'Aucun résultat pour cette recherche.' : 'Aucune landing enregistrée.'} />
      )}

      {!charge && (landingsFiltrees.length > 0 || outilsFiltres.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,260px),1fr))', gap: 10, alignItems: 'start' }}>
          {landingsFiltrees.map(l => (
            <div
              key={l.id}
              data-landing={l.id} data-actif={courant?.id === l.id ? '1' : '0'}
              role="button" tabIndex={0} aria-pressed={courant?.id === l.id}
              onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget && l.deploy_url) { e.preventDefault(); ouvrirApercu(l.id) } }}
              onClick={() => l.deploy_url && ouvrirApercu(l.id)}
              style={{ background: 'var(--sa-card)', border: courant?.id === l.id ? '2px solid var(--sa-accent)' : '1px solid var(--sa-border)', borderRadius: 12, padding: courant?.id === l.id ? 9 : 10, cursor: l.deploy_url ? 'pointer' : 'default', boxShadow: courant?.id === l.id ? '0 0 0 3px #EFE9FC' : 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span
                  aria-hidden
                  style={{
                    width: 10, height: 10, borderRadius: 3, flexShrink: 0,
                    background: l.accent_color || 'var(--sa-border)',
                    border: '1px solid var(--sa-border)',
                  }}
                />
                <div style={{ fontSize: 13, fontWeight: 700 }}>{l.nom ?? l.id}</div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                {(
                  <span
                    className="sa-chip"
                    style={{
                      fontSize: 10, fontWeight: 700,
                      color: l.published ? '#2f7d4f' : 'var(--sa-muted)',
                      borderColor: l.published ? '#2f7d4f' : 'var(--sa-border)',
                    }}
                  >
                    {l.published ? 'En ligne' : 'Hors ligne'}
                  </span>
                )}
                {l.statut && <span className="sa-chip" style={{ fontSize: 10 }}>{l.statut}</span>}
                {l.module_jeu && <span className="sa-chip" style={{ fontSize: 10 }}><Ico k="game" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />{l.module_jeu}</span>}
              </div>

              {/* Lien direct, prioritaire sur l'apercu cadre-telephone (qui peut
                  rendre une page "ecrasee" selon le navigateur) : ouvre la vraie
                  page en plein ecran dans un nouvel onglet, sans scaling. Romain
                  (28/10) : "avoir acces aux landing pages dans les pleines pages
                  avec le lien visualisable directement". */}
              {l.deploy_url ? (
                <a
                  href={l.deploy_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="sa-btn"
                  style={{ fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px' }}
                >
                  Ouvrir la page ↗
                </a>
              ) : (
                <div className="sa-muted" style={{ fontSize: 11.5 }}>Aucune URL de déploiement</div>
              )}

              {l.updated_at && (
                <div className="sa-muted" style={{ fontSize: 10, marginTop: 4 }}>
                  modifiée le {new Date(l.updated_at).toLocaleDateString('fr-FR')}
                </div>
              )}
            </div>
          ))}
          {outilsFiltres.map(o => (
            <OutilCarte key={o.id} o={o} actif={courant?.id === o.id} onApercu={(x) => ouvrirApercu(x.id)} onSelect={(x) => ouvrirApercu(x.id)} />
          ))}
        </div>
      )}

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 15, margin: '0 0 8px' }}>Pas encore disponibles</h2>
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--sa-muted)', fontSize: 13, lineHeight: 1.6 }}>
          {OUTILS_MANQUANTS.map(m => <li key={m.titre}><strong style={{ color: 'var(--sa-text)' }}>{m.titre}</strong> ({PUBLICS.find(p => p.v === m.public)?.label}) : {m.note}</li>)}
        </ul>
      </section>
    </div>
  )
}
