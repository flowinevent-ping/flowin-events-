'use client'

/**
 * DATA D UNE OPERATION — referentiel 19 et 23.
 *
 *  - ContenuCrm : les contacts de l operation (ceux qui ont REELLEMENT joue sur
 *    ses stations, table participations), avec opt-in, export CSV. Le CRM
 *    etait une liste unique ou toutes les operations se melangeaient.
 *  - ContenuReponses : reponses aux questions, par question (taux de bonnes
 *    reponses), par question bonus (repartition), et par participant
 *    (RPC operation_reponses, source se_reponses).
 */

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { DonneesOperation } from '@/lib/operations'
import { Camembert } from '@/components/dashboard/Camembert'

const BRD = '#E2E8F0'
const MUT = '#64748B'
const ACC = '#7C2D92'
const btn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 8,
  border: `1.5px solid ${BRD}`, background: '#fff', color: '#0F172A', fontSize: 12, fontWeight: 700,
  cursor: 'pointer', textDecoration: 'none', fontFamily: 'inherit', whiteSpace: 'nowrap',
}
const th: React.CSSProperties = { textAlign: 'left', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: MUT, padding: '6px 8px', borderBottom: `1px solid ${BRD}` }
const td: React.CSSProperties = { fontSize: 12.5, padding: '7px 8px', borderBottom: `1px solid ${BRD}`, verticalAlign: 'top' }
const mini = (v: React.ReactNode, l: string) => (
  <div style={{ flex: '1 1 110px', background: '#F8FAFC', borderRadius: 10, padding: '8px 12px' }}>
    <div style={{ fontSize: 18, fontWeight: 900, color: ACC }}>{v}</div>
    <div style={{ fontSize: 11, color: MUT }}>{l}</div>
  </div>
)

interface Contact {
  id: string; prenom: string | null; nom: string | null; email: string | null; tel: string | null
  ville: string | null; code_postal: string | null; optin: boolean | null; first_seen: string | null
  parties: number; derniere: string | null; stations: string[]
}

async function chargerContacts(op: DonneesOperation): Promise<Contact[]> {
  const ids = op.stations.map(s => s.id)
  if (!ids.length) return []
  const { data: parts } = await supabase.from('participations')
    .select('joueur_id,event_id,created_at').in('event_id', ids).not('joueur_id', 'is', null)
  const agg = new Map<string, { parties: number; derniere: string | null; stations: Set<string> }>()
  ;((parts ?? []) as { joueur_id: string; event_id: string; created_at: string | null }[]).forEach(p => {
    const a = agg.get(p.joueur_id) ?? { parties: 0, derniere: null, stations: new Set<string>() }
    a.parties += 1
    if (p.created_at && (!a.derniere || p.created_at > a.derniere)) a.derniere = p.created_at
    a.stations.add(p.event_id)
    agg.set(p.joueur_id, a)
  })
  const jids = Array.from(agg.keys())
  const out: Contact[] = []
  for (let i = 0; i < jids.length; i += 200) {
    const { data } = await supabase.from('joueurs')
      .select('id,prenom,nom,email,tel,ville,code_postal,optin,first_seen').in('id', jids.slice(i, i + 200))
    ;((data ?? []) as Omit<Contact, 'parties' | 'derniere' | 'stations'>[]).forEach(j => {
      const a = agg.get(j.id)!
      const noms = Array.from(a.stations).map(id => op.stations.find(s => s.id === id)?.nom ?? id)
      out.push({ ...j, parties: a.parties, derniere: a.derniere, stations: noms })
    })
  }
  return out.sort((a, b) => String(b.derniere ?? '').localeCompare(String(a.derniere ?? '')))
}

export function ContenuCrm({ op }: { op: DonneesOperation }) {
  const [liste, setListe] = useState<Contact[] | null>(null)
  const [q, setQ] = useState('')
  const [tous, setTous] = useState(false)
  const cle = op.stations.map(s => s.id).join(',')
  useEffect(() => {
    let vivant = true
    setListe(null)
    chargerContacts(op).then(l => { if (vivant) setListe(l) })
    return () => { vivant = false }
  }, [cle]) // eslint-disable-line react-hooks/exhaustive-deps

  if (liste === null) return <div style={{ fontSize: 12.5, color: MUT }}>Chargement…</div>
  const t = q.trim().toLowerCase()
  const filtres = t ? liste.filter(c => [c.prenom, c.nom, c.email, c.tel, c.ville, c.code_postal].some(v => String(v ?? '').toLowerCase().includes(t))) : liste
  const visibles = tous ? filtres : filtres.slice(0, 50)
  const optin = liste.filter(c => c.optin).length

  function exporter() {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const entete = ['Prénom', 'Nom', 'Email', 'Tél', 'Ville', 'Code postal', 'Opt-in', 'Parties', 'Dernière partie', op.type === 'super' ? 'Stations' : 'Event']
    const csv = '﻿' + [entete.map(esc).join(',')].concat(filtres.map(c => [
      c.prenom, c.nom, c.email, c.tel, c.ville, c.code_postal, c.optin ? 'oui' : 'non', c.parties,
      c.derniere ? new Date(c.derniere).toLocaleString('fr-FR') : '', c.stations.join(' / '),
    ].map(esc).join(','))).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `crm-${op.id}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {mini(liste.length, 'contacts')}
        {mini(optin, 'opt-in (recontactables)')}
        {mini(liste.reduce((s, c) => s + c.parties, 0), 'parties')}
      </div>
      {liste.length === 0 ? (
        <div style={{ fontSize: 12.5, color: MUT }}>Aucun joueur sur cette opération pour l’instant.</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <input
              value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher un contact…"
              style={{ flex: 1, minWidth: 180, border: `1.5px solid ${BRD}`, borderRadius: 8, padding: '7px 10px', fontSize: 13, fontFamily: 'inherit' }}
            />
            <button style={btn} onClick={exporter}>⬇ CSV ({filtres.length})</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={th}>Contact</th><th style={th}>Coordonnées</th><th style={th}>Lieu</th>
                <th style={th}>Parties</th><th style={th}>Opt-in</th>
              </tr></thead>
              <tbody>
                {visibles.map(c => (
                  <tr key={c.id}>
                    <td style={td}>
                      <div style={{ fontWeight: 700 }}>{[c.prenom, c.nom].filter(Boolean).join(' ') || '—'}</div>
                      {op.type === 'super' && <div style={{ fontSize: 11, color: MUT }}>{c.stations.join(' · ')}</div>}
                    </td>
                    <td style={td}>
                      <div>{c.email ?? '—'}</div>
                      {c.tel && <div style={{ fontSize: 11, color: MUT }}>{c.tel}</div>}
                    </td>
                    <td style={td}>{[c.code_postal, c.ville].filter(Boolean).join(' ') || '—'}</td>
                    <td style={td}>
                      <b>{c.parties}</b>
                      {c.derniere && <div style={{ fontSize: 11, color: MUT }}>{new Date(c.derniere).toLocaleDateString('fr-FR')}</div>}
                    </td>
                    <td style={td}>{c.optin ? '✓' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtres.length > visibles.length && (
            <button style={{ ...btn, marginTop: 8 }} onClick={() => setTous(true)}>Afficher les {filtres.length} contacts</button>
          )}
        </>
      )}
    </>
  )
}

interface Reponses {
  total: number
  questions: { qid: string; texte: string | null; reponses: number; justes: number }[]
  bonus: { cle: string; valeurs: { valeur: string; n: number }[] }[]
  participants: {
    joueur: string; ts: string | null; event_id: string; score: number | null
    quiz: { qid?: string; texte?: string; reponse?: string; correct?: boolean }[]
    bonus: Record<string, unknown>
  }[]
}

const libelleCle = (k: string) => k.replace(/^rse_/, '').replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())

export function ContenuReponses({ op }: { op: DonneesOperation }) {
  const [r, setR] = useState<Reponses | null | undefined>(undefined)
  const [ouvert, setOuvert] = useState<number | null>(null)
  const [vue, setVue] = useState<'questions' | 'participants'>('questions')
  const cle = op.stations.map(s => s.id).join(',')
  useEffect(() => {
    let vivant = true
    setR(undefined)
    supabase.rpc('operation_reponses', { p_events: op.stations.map(s => s.id) }).then(({ data, error }) => {
      if (!vivant) return
      if (error) { console.error('[operation_reponses]', error.message); setR(null); return }
      setR(data as Reponses)
    })
    return () => { vivant = false }
  }, [cle]) // eslint-disable-line react-hooks/exhaustive-deps

  if (r === undefined) return <div style={{ fontSize: 12.5, color: MUT }}>Chargement des réponses…</div>
  if (r === null) return <div style={{ fontSize: 12.5, color: MUT }}>Réponses indisponibles.</div>
  if (!r.total) return <div style={{ fontSize: 12.5, color: MUT }}>Aucune réponse enregistrée sur cette opération.</div>
  const onglet = (id: typeof vue, l: string) => (
    <button style={{ ...btn, ...(vue === id ? { background: ACC, borderColor: ACC, color: '#fff' } : {}) }} onClick={() => setVue(id)}>{l}</button>
  )
  return (
    <>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {onglet('questions', 'Par question')}
        {onglet('participants', `Par participant (${r.participants.length}${r.total > r.participants.length ? ` derniers sur ${r.total}` : ''})`)}
      </div>

      {vue === 'questions' && (
        <>
          {r.questions.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
              <thead><tr><th style={th}>Question</th><th style={th}>Réponses</th><th style={th}>Bonnes réponses</th></tr></thead>
              <tbody>
                {r.questions.map(q => {
                  const pct = q.reponses ? Math.round((q.justes / q.reponses) * 100) : 0
                  return (
                    <tr key={q.qid}>
                      <td style={td}>{q.texte ?? q.qid}</td>
                      <td style={td}>{q.reponses}</td>
                      <td style={{ ...td, minWidth: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 7, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: pct >= 50 ? '#15803D' : '#B45309' }} />
                          </div>
                          <b style={{ fontSize: 12 }}>{pct}%</b>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          {r.bonus.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10 }}>
              {r.bonus.map(b => (
                <Camembert key={b.cle} titre={libelleCle(b.cle)} parts={b.valeurs} unite="réponses" />
              ))}
            </div>
          )}
        </>
      )}

      {vue === 'participants' && r.participants.map((p, i) => {
        const justes = p.quiz.filter(x => x.correct).length
        const station = op.stations.find(s => s.id === p.event_id)?.nom
        return (
          <div key={i} style={{ borderTop: `1px solid ${BRD}`, padding: '7px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', cursor: 'pointer' }} onClick={() => setOuvert(o => (o === i ? null : i))}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontWeight: 700, fontSize: 12.5 }}>{p.joueur}</div>
                <div style={{ fontSize: 11, color: MUT }}>
                  {p.ts ? new Date(p.ts).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                  {op.type === 'super' && station ? ` · ${station}` : ''}
                </div>
              </div>
              {p.quiz.length > 0 && <span style={{ fontSize: 12 }}><b>{justes}</b> / {p.quiz.length}</span>}
              <span style={{ color: ACC, fontWeight: 800, fontSize: 12 }}>{ouvert === i ? '▲' : '▼'}</span>
            </div>
            {ouvert === i && (
              <div style={{ padding: '6px 0 2px 10px', borderLeft: `3px solid ${BRD}`, marginTop: 6 }}>
                {p.quiz.map((x, k) => (
                  <div key={k} style={{ fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: x.correct ? '#15803D' : '#B45309', fontWeight: 800 }}>{x.correct ? '✓' : '✗'}</span>{' '}
                    {x.texte ?? x.qid} — <i>{x.reponse ?? '—'}</i>
                  </div>
                ))}
                {Object.keys(p.bonus).map(k => (
                  <div key={k} style={{ fontSize: 12, marginBottom: 4 }}>
                    <b>{libelleCle(k)}</b> : {Array.isArray(p.bonus[k]) ? (p.bonus[k] as unknown[]).join(', ') : String(p.bonus[k] ?? '—')}
                  </div>
                ))}
                {p.quiz.length === 0 && Object.keys(p.bonus).length === 0 && <div style={{ fontSize: 12, color: MUT }}>Aucune réponse détaillée.</div>}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
