'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CARD, TH, TD, MUTED, ACC, kpiGrid } from '@/lib/proui'
import { Ico } from '@/lib/proicons'
import { Camembert } from '@/components/dashboard/Camembert'

type Onglet = 'contacts' | 'villes' | 'sources' | 'stats'
const ONGLETS: { key: Onglet; label: string }[] = [
  { key: 'contacts', label: 'Contacts' },
  { key: 'villes', label: 'Par ville' },
  { key: 'sources', label: 'Par source' },
  { key: 'stats', label: 'Stats globales' },
]

/**
 * Onglets de la page CRM. Ajout demande (29/07/2026) : la liste seule ne donnait aucune
 * vue d'ensemble. 4 onglets : Contacts (liste existante), Par ville, Par source,
 * Stats globales (4e onglet demande explicitement -- repartition sexe/age + taux d'opt-in).
 */
export default function CrmTabs({ joueurs, proId }: { joueurs: any[]; proId: string }) {
  const [onglet, setOnglet] = useState<Onglet>('contacts')
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''
  const optin = joueurs.filter(x => x.optin).length

  const tabBtn = (o: { key: Onglet; label: string }) => (
    <button
      key={o.key}
      onClick={() => setOnglet(o.key)}
      style={{
        border: 'none', borderRadius: 10, padding: '9px 15px', fontWeight: 800, fontSize: 13, cursor: 'pointer',
        background: onglet === o.key ? ACC : '#fff', color: onglet === o.key ? '#fff' : '#0F172A',
        boxShadow: onglet === o.key ? 'none' : 'inset 0 0 0 1.5px #E2E8F0',
      }}
    >{o.label}</button>
  )

  return (
    <div>
      <div style={{ ...kpiGrid(), marginTop: 16 }}>
        <div style={CARD}><div style={{ fontSize: 26, fontWeight: 900, color: ACC }}>{joueurs.length}</div><div style={{ fontSize: 12, ...MUTED }}>contacts</div></div>
        <div style={CARD}><div style={{ fontSize: 26, fontWeight: 900 }}>{optin}</div><div style={{ fontSize: 12, ...MUTED }}>opt-in (recontactables)</div></div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {ONGLETS.map(tabBtn)}
      </div>

      {onglet === 'contacts' && <OngletContacts joueurs={joueurs} q={q} />}
      {onglet === 'villes' && <OngletRepartition joueurs={joueurs} champ="ville" titre="Contacts par ville" />}
      {onglet === 'sources' && <OngletRepartition joueurs={joueurs} champ="source" titre="Contacts par source" />}
      {onglet === 'stats' && <OngletStatsGlobales joueurs={joueurs} />}
    </div>
  )
}

function OngletContacts({ joueurs, q }: { joueurs: any[]; q: string }) {
  const rows = joueurs.slice(0, 200)
  return (
    <div style={{ ...CARD, overflowX: 'auto' }}>
      {rows.length === 0 ? <div style={{ fontSize: 13, ...MUTED }}>Aucun contact pour ce compte.</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead><tr><th style={TH}>Contact</th><th style={TH}>Email</th><th style={TH}>Ville</th><th style={TH}>Source</th><th style={TH}>Opt-in</th><th style={TH}></th></tr></thead>
          <tbody>
            {rows.map((x: any, i: number) => (
              <tr key={x.id ?? i}>
                <td style={TD}><b>{`${x.prenom ?? ''} ${x.nom ?? ''}`.trim() || '—'}</b></td>
                <td style={{ ...TD, ...MUTED }}>{x.email || '—'}</td>
                <td style={{ ...TD, ...MUTED }}>{x.ville || '—'}</td>
                <td style={{ ...TD, ...MUTED }}>{x.source || '—'}</td>
                <td style={TD}>{x.optin ? <Ico k="check" size={14} style={{ color: '#15803D' }} /> : <span style={MUTED}>—</span>}</td>
                <td style={TD}>{x.id && <Link href={`/pro/crm/${x.id}${q}`} style={{ color: ACC, fontWeight: 700, textDecoration: 'none', fontSize: 12 }}>Voir →</Link>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function OngletRepartition({ joueurs, champ, titre }: { joueurs: any[]; champ: 'ville' | 'source'; titre: string }) {
  const compte = new Map<string, number>()
  joueurs.forEach(j => {
    const v = (j[champ] as string | null)?.trim() || 'Non renseigné'
    compte.set(v, (compte.get(v) ?? 0) + 1)
  })
  const lignes = Array.from(compte.entries()).sort((a, b) => b[1] - a[1])
  const max = Math.max(1, ...lignes.map(l => l[1]))
  return (
    <div style={CARD}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B', marginBottom: 12 }}>{titre}</div>
      {lignes.length === 0 ? <div style={{ fontSize: 13, ...MUTED }}>Aucune donnée.</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={TH}>{champ === 'ville' ? 'Ville' : 'Source'}</th><th style={TH}>Contacts</th><th style={TH}>Poids</th></tr></thead>
          <tbody>
            {lignes.map(([v, n]) => (
              <tr key={v}>
                <td style={{ ...TD, fontWeight: 700 }}>{v}</td>
                <td style={TD}>{n}</td>
                <td style={TD}>
                  <span style={{ display: 'inline-block', width: 130, height: 8, borderRadius: 99, background: '#E2E8F0', overflow: 'hidden', verticalAlign: 'middle' }}>
                    <span style={{ display: 'block', height: '100%', width: `${Math.max(4, Math.round(n / max * 100))}%`, background: `linear-gradient(90deg,#A855F7,${ACC})`, borderRadius: 99 }} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function OngletStatsGlobales({ joueurs }: { joueurs: any[] }) {
  const total = joueurs.length
  const optin = joueurs.filter(x => x.optin).length
  const nF = joueurs.filter(j => j.genre === 'F').length
  const nH = joueurs.filter(j => j.genre === 'H').length
  const sexeParts = [{ valeur: 'Femmes', n: nF }, { valeur: 'Hommes', n: nH }]

  const tranches = ['-18', '18-25', '26-35', '36-50', '51-65', '65+']
  const ageParts = tranches
    .map(t => ({ valeur: t, n: joueurs.filter(j => j.age_tranche === t).length }))
    .filter(p => p.n > 0)

  const optinParts = [{ valeur: 'Opt-in', n: optin }, { valeur: 'Sans opt-in', n: total - optin }]

  return (
    <div>
      <div style={{ ...kpiGrid(), marginBottom: 4 }}>
        <div style={CARD}><div style={{ fontSize: 26, fontWeight: 900, color: ACC }}>{total}</div><div style={{ fontSize: 12, ...MUTED }}>contacts au total</div></div>
        <div style={CARD}><div style={{ fontSize: 26, fontWeight: 900 }}>{total ? Math.round((optin / total) * 100) : 0}%</div><div style={{ fontSize: 12, ...MUTED }}>taux d&apos;opt-in</div></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 }}>
        <Camembert titre="Sexe" parts={sexeParts} unite="contacts" />
        <Camembert titre="Tranches d'âge" parts={ageParts} unite="contacts" />
        <Camembert titre="Opt-in" parts={optinParts} unite="contacts" />
      </div>
    </div>
  )
}
