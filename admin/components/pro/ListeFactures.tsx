'use client'

/**
 * FACTURES & BONS DE COMMANDE -- tableau, pas une pile de cartes (Romain,
 * 18/09) : « ranger les factures par type tableur, listing, avec les
 * informations nécessaires dessus, avec le filtre... pour pouvoir payer et
 * avoir la facilité d'aller chercher les informations... comme pour le
 * CRM... plusieurs projets, plusieurs factures, plusieurs bons de commande,
 * il faut pouvoir ne pas être fouillis ».
 * Même registre visuel que CrmPro.tsx (tuiles, barre de filtres, table,
 * ligne cliquable sans colonne « Fiche ») -- « il faut qu'on puisse gérer
 * les factures de la même manière ».
 */
import { useMemo, useState } from 'react'
import type { DonneesOperation } from '@/lib/operations'
import { libelleDates } from '@/lib/operations'
import { CHARTE_PRO as C } from '@/lib/charte'
import { CHAMP } from '@/lib/proui'

const petit: React.CSSProperties = { ...CHAMP, padding: '8px 11px', fontSize: 13, borderRadius: 10, width: 'auto' }
const th: React.CSSProperties = { textAlign: 'left', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: C.attenue, padding: '8px 10px', borderBottom: `1px solid ${C.bordure}`, background: C.subtil, whiteSpace: 'nowrap' }
const td: React.CSSProperties = { padding: '9px 10px', borderBottom: `1px solid ${C.bordure}`, fontSize: 12.5, verticalAlign: 'top' }
const dateFr = (d: string | null) => d ? new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString('fr-FR') : '—'

function Tuile({ v, l }: { v: React.ReactNode; l: string }) {
  return (
    <div style={{ flex: '1 1 120px', background: '#fff', border: `1px solid ${C.bordure}`, borderRadius: 14, padding: '10px 14px' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.accent, lineHeight: 1.1 }}>{v}</div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: C.attenue }}>{l}</div>
    </div>
  )
}
function Pastille({ ok, texte }: { ok: boolean; texte: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 800, color: ok ? '#15803D' : '#B45309', background: ok ? 'rgba(21,128,61,.09)' : 'rgba(180,83,9,.09)', borderRadius: 99, padding: '3px 8px', whiteSpace: 'nowrap' }}>
      {texte}
    </span>
  )
}

interface Ligne {
  cleLigne: string
  opNom: string
  opDates: string
  date: string | null
  montant: number | null
  paye: boolean
  bonId: string | null
  factureNumero: string | null
  lien: string | null
}

function construireLignes(operations: DonneesOperation[]): Ligne[] {
  const out: Ligne[] = []
  for (const op of operations) {
    const c = op.contrat
    if (!c) continue
    const paye = c.statutPaiement === 'valide' || c.statutPaiement === 'paye'
    if (c.bons.length === 0) {
      out.push({
        cleLigne: op.cle, opNom: op.nom, opDates: libelleDates(op.dateD, op.dateF),
        date: op.dateD, montant: c.montant, paye, bonId: null, factureNumero: null, lien: null,
      })
      continue
    }
    for (const bn of c.bons) {
      out.push({
        cleLigne: `${op.cle}:${bn.id}`, opNom: op.nom, opDates: libelleDates(op.dateD, op.dateF),
        date: bn.date, montant: bn.montantTtc ?? c.montant, paye,
        bonId: bn.id, factureNumero: bn.factureNumero,
        lien: bn.factureNumero ? `/facture-nds.html?num=${encodeURIComponent(bn.factureNumero)}` : `/bon-commande-nds.html?id=${encodeURIComponent(bn.id)}`,
      })
    }
  }
  return out
}

export default function ListeFactures({ operations }: { operations: DonneesOperation[] }) {
  const [q, setQ] = useState('')
  const [paiement, setPaiement] = useState<'' | 'paye' | 'attente'>('')
  const [facture, setFacture] = useState<'' | 'oui' | 'non'>('')

  const toutes = useMemo(() => construireLignes(operations), [operations])

  const lignes = useMemo(() => {
    const t = q.trim().toLowerCase()
    return toutes.filter(l =>
      (!t || [l.opNom, l.bonId, l.factureNumero].some(v => String(v ?? '').toLowerCase().includes(t))) &&
      (!paiement || (paiement === 'paye' ? l.paye : !l.paye)) &&
      (!facture || (facture === 'oui' ? !!l.factureNumero : !l.factureNumero)),
    )
  }, [toutes, q, paiement, facture])

  const nbPayees = toutes.filter(l => l.paye).length
  const nbFacturees = toutes.filter(l => l.factureNumero).length
  const montantTotal = toutes.reduce((s, l) => s + (l.montant ?? 0), 0)

  if (toutes.length === 0) {
    return <div style={{ background: '#fff', border: `1px solid ${C.bordure}`, borderRadius: 14, padding: 16, fontSize: 13, color: C.attenue }}>Aucun bon de commande ni facture pour le moment.</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <Tuile v={toutes.length} l="bons / opérations" />
        <Tuile v={nbFacturees} l="facturés" />
        <Tuile v={nbPayees} l="payés" />
        <Tuile v={`${montantTotal.toLocaleString('fr-FR')} €`} l="montant total" />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', background: '#fff', border: `1px solid ${C.bordure}`, borderRadius: 14, padding: 10, marginBottom: 12 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher : opération, n° bon, n° facture…" style={{ ...petit, flex: '1 1 220px' }} />
        <select value={paiement} onChange={e => setPaiement(e.target.value as typeof paiement)} style={petit}>
          <option value="">Tous les paiements</option>
          <option value="paye">Payés</option>
          <option value="attente">En attente</option>
        </select>
        <select value={facture} onChange={e => setFacture(e.target.value as typeof facture)} style={petit}>
          <option value="">Toutes les factures</option>
          <option value="oui">Facturées</option>
          <option value="non">Non facturées</option>
        </select>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${C.bordure}`, borderRadius: 14, overflowX: 'auto' }}>
        {lignes.length === 0 ? <div style={{ padding: 16, fontSize: 13, color: C.attenue }}>Aucun résultat avec ces filtres.</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
            <thead>
              <tr>
                <th style={th}>Opération</th><th style={th}>Date</th><th style={th}>Bon</th>
                <th style={th}>Facture</th><th style={th}>Montant</th><th style={th}>Paiement</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map(l => (
                <tr key={l.cleLigne}
                  style={{ cursor: l.lien ? 'pointer' : 'default' }}
                  onClick={() => { if (l.lien) window.open(l.lien, '_blank', 'noopener') }}
                >
                  <td style={td}>
                    <div style={{ fontWeight: 800 }}>{l.opNom}</div>
                    <div style={{ fontSize: 11.5, color: C.attenue }}>{l.opDates}</div>
                  </td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>{dateFr(l.date)}</td>
                  <td style={td}>{l.bonId ? <code style={{ fontSize: 12 }}>{l.bonId}</code> : <span style={{ color: C.attenue }}>—</span>}</td>
                  <td style={td}>{l.factureNumero ? <code style={{ fontSize: 12 }}>{l.factureNumero}</code> : <span style={{ color: C.attenue }}>Non émise</span>}</td>
                  <td style={{ ...td, fontWeight: 800, whiteSpace: 'nowrap' }}>{l.montant != null ? `${l.montant.toLocaleString('fr-FR')} €` : '—'}</td>
                  <td style={td}><Pastille ok={l.paye} texte={l.paye ? 'Payé' : 'En attente'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
