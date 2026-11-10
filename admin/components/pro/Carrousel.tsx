'use client'

/**
 * CARROUSEL DU PARCOURS PRO (10/11/2026, règle d'interface absolue de Romain : « carrousel, pas de scroll »).
 * Un écran = une idée. Précédent / Suivant, points cliquables, glisser du doigt sur mobile.
 * Contrôlé (i, setI) pour que le parcours décide du dernier bouton (publier, valider…).
 * - `Carrousel` : rend l'écran courant + la navigation.
 * - `NavCarrousel` + `glisser` : navigation seule, quand les écrans sont déjà rendus par le parcours.
 */
import { useRef, type ReactNode, type TouchEvent } from 'react'
import { CHARTE_PRO as C } from '@/lib/charte'
import { BTN, BTN2 } from '@/lib/proui'

/** Gestes de glisser (gauche = suivant, droite = précédent). */
export function useGlisser(avancer: (sens: 1 | -1) => void) {
  const x0 = useRef<number | null>(null)
  return {
    onTouchStart: (e: TouchEvent) => { x0.current = e.touches[0].clientX },
    onTouchEnd: (e: TouchEvent) => {
      if (x0.current === null) return
      const dx = e.changedTouches[0].clientX - x0.current; x0.current = null
      if (Math.abs(dx) > 50) avancer(dx < 0 ? 1 : -1)
    },
  }
}

export function NavCarrousel({ n, i, setI, dernier, suivantBloque, onAvant, onTenter }: {
  n: number
  i: number
  setI: (k: number) => void
  /** Bouton affiché à la place de « Suivant » sur le dernier écran. */
  dernier?: ReactNode
  /** Message qui empêche d'avancer (affiché après une tentative). */
  suivantBloque?: string | null
  /** « Précédent » sur le premier écran (retour à l'étape d'avant du parcours). */
  onAvant?: () => void
  /** Appelé quand le pro tente d'avancer alors que c'est bloqué. */
  onTenter?: () => void
}) {
  const cur = Math.min(Math.max(i, 0), n - 1)
  const aller = (k: number) => {
    if (k < 0) { onAvant?.(); return }
    if (k >= n) return
    if (k > cur && suivantBloque) { onTenter?.(); return }
    setI(k)
  }
  return (
    <div data-nav-carrousel>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '16px 0 12px' }}>
        {Array.from({ length: n }, (_, k) => (
          <button key={k} type="button" aria-label={`Écran ${k + 1} sur ${n}`} aria-current={k === cur}
            onClick={() => aller(k)}
            style={{ width: k === cur ? 22 : 9, height: 9, borderRadius: 9, border: 'none', padding: 0, cursor: 'pointer', background: k === cur ? C.violet : C.bordureChamp, transition: 'width .2s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <button type="button" style={{ ...BTN2, visibility: cur > 0 || onAvant ? 'visible' : 'hidden' }} onClick={() => aller(cur - 1)}>← Précédent</button>
        {cur < n - 1
          ? <button type="button" data-suivant style={{ ...BTN, opacity: suivantBloque ? 0.5 : 1 }} onClick={() => aller(cur + 1)}>Suivant →</button>
          : dernier ?? <span />}
      </div>
    </div>
  )
}

export default function Carrousel({ ecrans, i, setI, dernier, nom = 'Étapes' }: {
  ecrans: { cle: string; contenu: ReactNode }[]
  i: number
  setI: (n: number) => void
  dernier?: ReactNode
  nom?: string
}) {
  const n = ecrans.length
  const cur = Math.min(Math.max(i, 0), n - 1)
  const g = useGlisser(s => { const k = cur + s; if (k >= 0 && k < n) setI(k) })
  return (
    <div data-carrousel role="region" aria-roledescription="carrousel" aria-label={nom} {...g}>
      <div data-ecran={ecrans[cur].cle} aria-live="polite">{ecrans[cur].contenu}</div>
      {n > 1 && <NavCarrousel n={n} i={cur} setI={setI} dernier={dernier} />}
      {n <= 1 && dernier && <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>{dernier}</div>}
    </div>
  )
}
