'use client'

/**
 * APERCU DU VRAI JEU (P3) — le cadre telephone des parcours de creation.
 *
 * Il charge la vraie page du jeu choisi, sur l event de demonstration de ce
 * jeu (ou sur une station reelle du super event rejoint), avec la saisie en
 * cours : nom, lots, contenu du jeu (lib/apercu.ts). Rien n est ecrit : la
 * page est en `preview`.
 */
import { useEffect, useMemo, useState } from 'react'
import { Phone } from '@/components/pro/ParcoursMobil'
/* La grille « saisie a gauche, telephone a droite » des parcours SA. */
import '@/components/dashboard/apercu.css'
import { encoderApercu, type SaisieApercu } from '@/lib/apercu'
import { libelleModule } from '@/lib/operations'

/** Events de demonstration, un par jeu (sql/evenements_demo_apercu.sql). */
export const EVENT_DEMO: Record<string, string> = {
  nds2026: 'ev-demo-nds2026',
  quiz: 'ev-demo-quiz',
  quizsolo: 'ev-demo-quizsolo',
  quizmaster: 'ev-demo-quizmaster',
  spin: 'ev-demo-spin',
  vote: 'ev-demo-vote',
  tombola: 'ev-demo-tombola',
}

export default function ApercuJeu({ module, eventId, saisie, titre }: {
  module: string | null
  /** Station reelle a montrer (rejoindre un super event). A defaut, l event demo du jeu. */
  eventId?: string | null
  saisie: SaisieApercu
  titre?: string
}) {
  const ev = eventId || (module ? EVENT_DEMO[module] : '')
  const cle = useMemo(() => encoderApercu(saisie), [saisie])
  /* La page se recharge a chaque changement : on attend une courte pause de saisie. */
  const [cleStable, setCleStable] = useState(cle)
  useEffect(() => {
    const t = setTimeout(() => setCleStable(cle), 700)
    return () => clearTimeout(t)
  }, [cle])
  const src = module && ev
    ? `/parcours/${module}?ev=${encodeURIComponent(ev)}&preview=1&bar=0&apercu=${cleStable}`
    : undefined
  return (
    <div style={{ position: 'sticky', top: 16, alignSelf: 'start' }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#8a7e93', marginBottom: 4 }}>
        {titre ?? 'Ce que verra le joueur'}
      </div>
      <div style={{ fontSize: 12, color: '#8a7e93', marginBottom: 10 }}>
        {module ? `${libelleModule(module)} — le vrai jeu, avec votre saisie` : 'Choisissez un jeu pour le voir ici'}
      </div>
      <Phone src={src} empty="Choisissez un jeu : il s’affiche ici, tel que vos clients le verront." />
      {src && (
        <a href={src.replace('&bar=0', '')} target="_blank" rel="noreferrer"
          style={{ display: 'inline-block', marginTop: 10, fontSize: 12.5, fontWeight: 700, color: '#7C2D92', textDecoration: 'none' }}>
          Ouvrir en plein écran ↗
        </a>
      )}
    </div>
  )
}
