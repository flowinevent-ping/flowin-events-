'use client'

/**
 * /dashboard/jeux — LES MASTERS DE JEUX (refonte du 01/11).
 *
 * La liste des jeux EST la liste des masters (gabarits de reference valides sur
 * maquettes) : Quiz + bonus, Quiz solo, Roue, Tombola, Vote, Super event.
 * Chaque carte ouvre l'apercu fidele du master (le vrai /jouer, ecran par
 * ecran), son deroule, les animations qui l'utilisent et le bouton
 * « Créer une animation avec ce module » qui ouvre le parcours master.
 * Meme page /jouer que le joueur et l'espace pro : aucun apercu dessine a part.
 */
import { useRef, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { StatusChip } from '@/components/dashboard/DashboardUI'
import { Phone } from '@/components/pro/ParcoursMobil'
import { MASTERS, ORDRE_MASTERS } from '@/lib/masters/defs'
import { DEROULES } from '@/lib/masters/engine'
import { TITRES_ECRANS, urlApercuMaster } from '@/lib/masters/apercu'
import { libelleDates } from '@/lib/operations'
import type { MasterId } from '@/lib/masters/types'

/* Couleurs d'identite : jetons de public/flowin-theme.css (une seule source). */
const COULEUR: Record<MasterId, string> = {
  quiz: 'var(--fl-quiz, #3B5CC4)', quizsolo: 'var(--fl-solo, #8E3B6E)', spin: 'var(--fl-spin, #13A89E)',
  tombola: 'var(--fl-tombola, #0B9E6E)', vote: 'var(--fl-vote, #3A6FD8)', super: 'var(--fl-super-rouge, #E2231A)',
}

export default function PageMasters() {
  const { events, openDrawer } = useDashboard()
  const [ouvert, setOuvert] = useState<MasterId>('quiz')
  const [ecran, setEcran] = useState('s-accueil')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const m = MASTERS[ouvert]
  const ecrans = DEROULES[m.cle] || []
  const evs = events.filter(e => (e as { cfg?: { master?: { id?: string } } }).cfg?.master?.id === ouvert || (ouvert !== 'super' && e.module === ouvert && !(e as { cfg?: { masterOff?: boolean } }).cfg?.masterOff))
  const choisir = (id: MasterId) => { setOuvert(id); setEcran(id === 'super' ? 'sj-accueil' : 's-accueil') }
  const url = urlApercuMaster({ master: ouvert, ecran })
  const naviguer = (sens: 'next' | 'prev') => { try { iframeRef.current?.contentWindow?.postMessage({ flowinNav: sens }, window.location.origin) } catch { /* pas chargee */ } }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 14, marginBottom: 22 }}>
        {ORDRE_MASTERS.map(id => {
          const d = MASTERS[id], actif = id === ouvert
          const n = events.filter(e => (e as { cfg?: { master?: { id?: string } } }).cfg?.master?.id === id || (id !== 'super' && e.module === id)).length
          return (
            <button key={id} onClick={() => choisir(id)} aria-pressed={actif}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', background: '#fff', borderRadius: 20, padding: '16px 16px 14px', border: actif ? `2px solid ${COULEUR[id]}` : '1.5px solid var(--sa-border)', boxShadow: actif ? '0 10px 24px rgba(27,58,92,.10)' : 'none' }}>
              <span style={{ display: 'inline-block', width: 40, height: 40, borderRadius: 14, background: COULEUR[id], marginBottom: 10 }} />
              <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: '-.02em' }}>{d.nom}</div>
              <div style={{ fontSize: 12, color: 'var(--sa-muted)', margin: '4px 0 8px', lineHeight: 1.45 }}>{d.description}</div>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--sa-muted)' }}>{n} animation{n > 1 ? 's' : ''}</div>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 28, alignItems: 'start', background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 20, padding: 22 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ width: 14, height: 14, borderRadius: 99, background: COULEUR[ouvert] }} />
            <div style={{ fontSize: 21, fontWeight: 900, letterSpacing: '-.02em' }}>{m.nom}</div>
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--sa-muted)', lineHeight: 1.55, marginBottom: 14 }}>{m.description}</div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
            {ouvert !== 'super' && (
              <a href={`/dashboard/wizard-event?module=${encodeURIComponent(m.module)}`}
                style={{ display: 'inline-block', padding: '12px 20px', borderRadius: 100, background: 'var(--sa-accent)', color: '#fff', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
                + Créer une animation avec ce module
              </a>
            )}
            {ouvert === 'super' && (
              <a href="/dashboard/wizard-event" style={{ display: 'inline-block', padding: '12px 20px', borderRadius: 100, background: 'var(--sa-accent)', color: '#fff', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>+ Créer un super event</a>
            )}
            <a href="/dashboard.html#masters" style={{ display: 'inline-block', padding: '11px 18px', borderRadius: 100, border: '1.5px solid var(--sa-border)', color: 'var(--sa-text)', fontWeight: 700, fontSize: 13.5, textDecoration: 'none' }}>Modifier les valeurs par défaut</a>
          </div>

          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--sa-muted)', marginBottom: 8 }}>Le déroulé · touchez un écran pour l’afficher</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '4px 12px', marginBottom: 20 }}>
            {ecrans.map((id, i) => (
              <button key={id} onClick={() => setEcran(id)}
                style={{ display: 'flex', gap: 10, alignItems: 'center', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', padding: '8px 10px', borderRadius: 14, border: id === ecran ? `1.5px solid ${COULEUR[ouvert]}` : '1.5px solid transparent', background: id === ecran ? 'var(--sa-subtle)' : 'transparent' }}>
                <span style={{ width: 26, height: 26, borderRadius: 9, background: '#fff', border: '1.5px solid var(--sa-border)', display: 'grid', placeItems: 'center', fontSize: 11.5, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{TITRES_ECRANS[id] || id}</span>
              </button>
            ))}
          </div>

          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--sa-muted)', marginBottom: 8 }}>Animations qui l’utilisent ({evs.length})</div>
          {evs.length === 0 && <div style={{ fontSize: 13, color: 'var(--sa-muted)' }}>Aucune animation pour l’instant.</div>}
          <div style={{ display: 'grid', gap: 6 }}>
            {evs.slice(0, 12).map(ev => (
              <button key={ev.id} onClick={() => openDrawer('event', ev.id)} title={`Ouvrir ${ev.nom}`}
                style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', padding: '9px 12px', borderRadius: 14, border: '1.5px solid var(--sa-border)', background: '#fff' }}>
                <b style={{ flex: 1, fontSize: 13.5 }}>{ev.nom}</b>
                {ev.date_d && <span style={{ fontSize: 12, color: 'var(--sa-muted)' }}>{libelleDates(ev.date_d, ev.date_f)}</span>}
                <StatusChip status={ev.status} />
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--sa-muted)', marginTop: 16, lineHeight: 1.5 }}>
            Règle (à confirmer) : modifier un master met à jour toutes les animations qui l’utilisent, sauf les champs qu’elles ont personnalisés (logo, images, lots, questions, partenaires).
            Quiz Master et Nuits du Sud gardent leur parcours historique.
          </p>
        </div>

        <div style={{ position: 'sticky', top: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => naviguer('prev')} aria-label="Écran précédent" style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--sa-border)', background: '#fff', cursor: 'pointer', fontSize: 16 }}>‹</button>
          <Phone src={url} iframeRef={iframeRef} />
          <button onClick={() => naviguer('next')} aria-label="Écran suivant" style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--sa-border)', background: '#fff', cursor: 'pointer', fontSize: 16 }}>›</button>
        </div>
      </div>
    </>
  )
}
