'use client'
/**
 * Espace organisateur (/pro/super) : passages et tickets par phase du Super Event
 * (deux phases, décision de Romain du 19/11/2026). Chiffres réels (participations),
 * coupés à la date de début de l'événement. Affiché si les phases sont actives, ou en démo.
 */
import { useEffect, useState } from 'react'
import { estDemo } from '@/lib/demo'
import { LIBELLE_PHASE, ORANGE_SE, periodePhase, type Phase, type PhasesSE } from '@/lib/superEventPhases'

export default function PhasesOrganisateur({ phases, compte }: { phases: PhasesSE; compte: Record<Phase, { passages: number; tickets: number }> }) {
  const [demo, setDemo] = useState(false)
  useEffect(() => { setDemo(estDemo()) }, [])
  if (!phases.dateD || !(phases.actif || demo)) return null
  return (
    <div data-phases-orga style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
      {(['avant', 'pendant'] as Phase[]).map(ph => (
        <div key={ph} data-phase-orga={ph} style={{ flex: '1 1 200px', border: `1.5px solid ${ORANGE_SE}`, borderRadius: 14, padding: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 900, color: ORANGE_SE }}>{LIBELLE_PHASE[ph]}{demo && !phases.actif ? ' · DÉMO' : ''}</div>
          <div style={{ fontSize: 12, color: '#8a7e93', marginBottom: 6 }}>{periodePhase(phases, ph) || '—'}</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div><div style={{ fontSize: 22, fontWeight: 900 }}>{compte[ph].passages}</div><div style={{ fontSize: 12, color: '#8a7e93' }}>passages</div></div>
            <div><div style={{ fontSize: 22, fontWeight: 900 }}>{compte[ph].tickets}</div><div style={{ fontSize: 12, color: '#8a7e93' }}>tickets</div></div>
          </div>
        </div>
      ))}
    </div>
  )
}
