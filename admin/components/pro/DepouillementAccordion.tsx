'use client'

import { useState } from 'react'
import { MUTED, ACC } from '@/lib/proui'
import type { SondageLanding } from '@/lib/nds'

/**
 * Resume visuel -- vue d'ensemble avant de plonger dans l'accordeon question par question.
 * Une carte par question : sa reponse dominante + le poids en un coup d'oeil. Demande
 * explicite (29/07/2026) : donner un panorama immediat, l'accordeon reste pour le detail.
 */
export function ResumeVisuelDepouillement({ questions }: { questions: SondageLanding['questions'] }) {
  if (!questions?.length) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10 }}>
      {questions.map(q => {
        const top = (q.reponses ?? []).slice().sort((a, b) => b.n - a.n)[0]
        if (!top) return null
        const pct = top.pct ?? 0
        return (
          <div key={q.cle} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 13px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 7, lineHeight: 1.35, minHeight: 27 }}>{q.libelle}</div>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6, lineHeight: 1.3 }}>{top.reponse}</div>
            <div style={{ width: '100%', height: 5, borderRadius: 99, background: '#E2E8F0', overflow: 'hidden', marginBottom: 5 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,#A855F7,${ACC})`, borderRadius: 99 }} />
            </div>
            <div style={{ fontSize: 11, color: '#64748B' }}>{pct} % · {q.repondants} réponse{q.repondants > 1 ? 's' : ''}</div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Depouillement en accordeon -- une question ouverte a la fois, plutot que la grille
 * qui affichait toutes les questions (et toutes leurs reponses) simultanement.
 * Demande explicite de Romain (28/07/2026) : "trop d'informations d'un coup", "des
 * sous-onglets qu'on clique dessus et qu'on voit derouler".
 */
export default function DepouillementAccordion({ questions }: { questions: SondageLanding['questions'] }) {
  const [ouvert, setOuvert] = useState<string | null>(questions?.[0]?.cle ?? null)

  if (!questions?.length) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {questions.map(q => {
        const estOuvert = ouvert === q.cle
        return (
          <div key={q.cle} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
            <button
              onClick={() => setOuvert(estOuvert ? null : q.cle)}
              style={{
                width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit',
              }}
            >
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: 800, lineHeight: 1.35 }}>{q.libelle}</span>
              <span style={{ fontSize: 11, ...MUTED, flexShrink: 0 }}>{q.repondants} réponse{q.repondants > 1 ? 's' : ''}</span>
              <span style={{ fontSize: 14, color: ACC, transform: estOuvert ? 'rotate(90deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }}>›</span>
            </button>
            {estOuvert && (
              <div style={{ padding: '0 14px 14px' }}>
                {q.choix_multiple && (
                  <div style={{ fontSize: 11, ...MUTED, marginBottom: 8 }}>Choix multiple</div>
                )}
                {q.reponses.map(r => {
                  const pct = r.pct ?? 0
                  return (
                  <div key={r.code} style={{ marginBottom: 7 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, marginBottom: 3 }}>
                      <span style={r.libelle_trouve ? undefined : { fontStyle: 'italic', color: '#94A3B8' }}>{r.reponse}</span>
                      <span style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{r.n} <span style={MUTED}>({pct} %)</span></span>
                    </div>
                    <div style={{ width: '100%', height: 6, borderRadius: 99, background: '#E2E8F0', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,#A855F7,${ACC})`, borderRadius: 99 }} />
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
