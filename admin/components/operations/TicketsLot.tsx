'use client'

/**
 * TICKETS ÉDITÉS D'UN LOT — Romain (29/10) : « une fois validé, on peut
 * accéder à la liste des tickets édités avec leur QR code et leur numéro et
 * éventuellement les supprimer ». Même composant côté SA et côté pro (il vit
 * dans ModalGererLots, partagé) ; les droits sont vérifiés en base
 * (peut_gerer_lot : un pro n'agit que sur les lots de ses stations).
 *
 * Le QR contient le code du ticket, imprimé en clair dessous : c'est ce code
 * que le commerce retrouve dans sa liste. Le gagnant, lui, présente son
 * billet (lien reçu par email) ; à la validation en caisse, une unité du lot
 * passe en « remis » avec le numéro de billet du gagnant.
 */
import { useCallback, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Ico } from '@/lib/proicons'
import {
  emettreTickets, listerTickets, supprimerTicket, ajouterStock, retirerStock,
  etatTicket, type TicketLot, type EtatTicket,
} from '@/lib/stock'

const BRD = 'var(--sa-border, #E2E8F0)'
const MUT = 'var(--sa-muted, #64748B)'
const ACC = 'var(--sa-accent, #2563EB)'

const LIBELLE: Record<EtatTicket, { t: string; c: string; bg: string }> = {
  emis: { t: 'Émis', c: '#1D4ED8', bg: 'rgba(37,99,235,.1)' },
  attribue: { t: 'Attribué', c: '#B45309', bg: 'rgba(245,158,11,.13)' },
  remis: { t: 'Remis', c: '#15803D', bg: 'rgba(34,197,94,.1)' },
}

const btn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5, border: `1px solid ${BRD}`, background: '#fff',
  borderRadius: 8, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
}

function QrMini({ code, taille = 44 }: { code: string; taille?: number }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let vivant = true
    QRCode.toDataURL(code, { margin: 1, width: taille * 2 }).then(u => { if (vivant) setSrc(u) }).catch(() => {})
    return () => { vivant = false }
  }, [code, taille])
  return src
    ? <img src={src} alt={`QR ${code}`} width={taille} height={taille} style={{ display: 'block', borderRadius: 4, border: `1px solid ${BRD}` }} />
    : <span style={{ display: 'block', width: taille, height: taille, borderRadius: 4, background: '#F1F5F9' }} />
}

async function imprimerPlanche(lotNom: string, tickets: TicketLot[]) {
  const libres = tickets.filter(t => etatTicket(t) !== 'remis')
  if (!libres.length) return
  const imgs = await Promise.all(libres.map(t => QRCode.toDataURL(t.code, { margin: 1, width: 240 })))
  const w = window.open('', '_blank')
  if (!w) return
  const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Tickets — ${esc(lotNom)}</title>
<style>body{font-family:system-ui,sans-serif;margin:16px}h1{font-size:16px;margin:0 0 12px}
.g{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.t{border:1px dashed #94A3B8;border-radius:8px;padding:8px;text-align:center;break-inside:avoid}
.t img{width:110px;height:110px}.n{font-weight:800;font-size:13px;margin-top:4px}.c{font-size:10px;color:#475569;word-break:break-all}</style></head>
<body><h1>${esc(lotNom)} — ${libres.length} ticket${libres.length > 1 ? 's' : ''}</h1><div class="g">
${libres.map((t, i) => `<div class="t"><img src="${imgs[i]}" alt=""><div class="n">N° ${t.numero ?? i + 1}</div><div class="c">${esc(t.code)}</div></div>`).join('')}
</div><script>window.onload=function(){window.print()}</script></body></html>`)
  w.document.close()
}

export default function TicketsLot({ lotId, lotNom, quantite, onChange }: {
  lotId: string; lotNom: string; quantite: number | null
  /** Appelé après une émission / un retrait, pour rafraîchir les compteurs autour. */
  onChange?: (emis: number) => void
}) {
  const [tickets, setTickets] = useState<TicketLot[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const [ouvert, setOuvert] = useState(false)
  const [n, setN] = useState('1')

  const charger = useCallback(async (apresAction = false) => {
    const l = await listerTickets(lotId)
    setTickets(l)
    if (apresAction) onChange?.(l.length)
  }, [lotId]) // eslint-disable-line react-hooks/exhaustive-deps -- onChange lu au moment de l'action
  useEffect(() => { charger() }, [charger])

  async function emettre() {
    setBusy('emettre'); setMsg(null)
    const r = await emettreTickets(lotId)
    setBusy(null)
    if (!r.ok) {
      setMsg({ ok: false, t: r.raison === 'indisponible'
        ? "L'émission automatique n'est pas encore activée sur la base (migration en attente)."
        : r.raison === 'lot_introuvable' ? "Enregistrez d'abord le lot, puis émettez ses tickets."
        : r.raison === 'non_autorise' ? "Ce lot n'appartient pas à vos stations." : "L'émission a échoué, réessayez." })
      return
    }
    const emis = r.emis ?? 0
    setMsg({ ok: true, t: r.ajoutes || r.retires
      ? `${emis} ticket${emis > 1 ? 's' : ''} — ${r.ajoutes ? `${r.ajoutes} émis` : ''}${r.ajoutes && r.retires ? ', ' : ''}${r.retires ? `${r.retires} retirés` : ''}.`
      : `Déjà à jour : ${emis} ticket${emis > 1 ? 's' : ''}, aucun doublon créé.` })
    await charger(true)
  }

  async function ajuster(sens: 1 | -1) {
    const q = Math.max(1, parseInt(n) || 1)
    setBusy(sens > 0 ? 'ajout' : 'retrait'); setMsg(null)
    const ok = sens > 0 ? await ajouterStock(lotId, q) : (await retirerStock(lotId, q)) > 0
    setBusy(null)
    if (!ok) setMsg({ ok: false, t: sens > 0 ? 'Réapprovisionnement impossible pour ce lot.' : 'Aucun ticket libre à retirer (les tickets attribués ou remis sont conservés).' })
    await charger(true)
  }

  async function supprimer(t: TicketLot) {
    if (!window.confirm(`Supprimer le ticket ${t.code} ? La quantité du lot baisse d'une unité.`)) return
    setBusy(t.id); setMsg(null)
    const r = await supprimerTicket(t.id)
    setBusy(null)
    if (!r.ok) {
      setMsg({ ok: false, t: r.raison === 'remis' ? 'Ce ticket a déjà été remis à un gagnant : il est conservé.'
        : r.raison === 'attribue' ? 'Ce ticket est attribué à un gagnant : il est conservé.'
        : r.raison === 'indisponible' ? "La suppression n'est pas encore activée sur la base (migration en attente)."
        : 'Suppression impossible, réessayez.' })
      return
    }
    await charger(true)
  }

  const liste = tickets ?? []
  const compte = { emis: 0, attribue: 0, remis: 0 } as Record<EtatTicket, number>
  liste.forEach(t => { compte[etatTicket(t)]++ })
  const ecart = quantite != null && liste.length !== quantite

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 800 }}>{tickets === null ? '…' : liste.length}</span>
        <span style={{ fontSize: 11.5, color: MUT }}>ticket{liste.length > 1 ? 's' : ''} édité{liste.length > 1 ? 's' : ''}{quantite != null ? ` / quantité ${quantite}` : ''}</span>
        {(['emis', 'attribue', 'remis'] as EtatTicket[]).map(e => compte[e] > 0 && (
          <span key={e} style={{ fontSize: 10.5, fontWeight: 700, color: LIBELLE[e].c, background: LIBELLE[e].bg, borderRadius: 99, padding: '2px 8px' }}>
            {compte[e]} {LIBELLE[e].t.toLowerCase()}{compte[e] > 1 ? 's' : ''}
          </span>
        ))}
      </div>
      {ecart && tickets !== null && (
        <div style={{ fontSize: 11, color: '#B45309', marginTop: 4 }}>
          Le nombre de tickets ne correspond pas à la quantité : cliquez sur « Émettre les tickets » pour les aligner.
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
        <button style={{ ...btn, background: ACC, color: '#fff', borderColor: ACC }} disabled={busy !== null} onClick={emettre}>
          <Ico k="ticket" size={13} /> {busy === 'emettre' ? 'Émission…' : 'Émettre les tickets'}
        </button>
        <button style={btn} disabled={!liste.length} onClick={() => setOuvert(o => !o)}>
          <Ico k="list" size={13} /> {ouvert ? 'Masquer la liste' : 'Voir la liste'}
        </button>
        <button style={btn} disabled={!liste.some(t => etatTicket(t) !== 'remis')} onClick={() => imprimerPlanche(lotNom, liste)}>
          <Ico k="download" size={13} /> Imprimer les QR
        </button>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
          <input type="number" min={1} value={n} onChange={e => setN(e.target.value)}
            style={{ width: 48, border: `1px solid ${BRD}`, borderRadius: 8, padding: '4px 6px', fontSize: 12, fontFamily: 'inherit' }} />
          <button style={btn} disabled={busy !== null} onClick={() => ajuster(1)}><Ico k="plus" size={12} /> {busy === 'ajout' ? '…' : 'Réappro'}</button>
          <button style={btn} disabled={busy !== null} onClick={() => ajuster(-1)}>{busy === 'retrait' ? '…' : '− Retirer'}</button>
        </span>
      </div>

      {msg && <div style={{ fontSize: 11.5, marginTop: 6, color: msg.ok ? '#15803D' : '#B45309', fontWeight: 700 }}>{msg.t}</div>}

      {ouvert && liste.length > 0 && (
        <div style={{ marginTop: 8, border: `1px solid ${BRD}`, borderRadius: 10, maxHeight: 300, overflowY: 'auto', background: '#fff' }}>
          {liste.map((t, i) => {
            const e = etatTicket(t)
            const verrouille = e !== 'emis'
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderTop: i ? `1px solid ${BRD}` : 'none' }}>
                <QrMini code={t.code} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800 }}>N° {t.numero ?? i + 1}</div>
                  <div style={{ fontSize: 11, color: MUT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.code}</div>
                  {t.attribue_a && <div style={{ fontSize: 10.5, color: MUT }}>Billet {t.attribue_a}{t.utilise_at ? ` · ${new Date(t.utilise_at).toLocaleDateString('fr-FR')}` : ''}</div>}
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: LIBELLE[e].c, background: LIBELLE[e].bg, borderRadius: 99, padding: '2px 8px', flexShrink: 0 }}>{LIBELLE[e].t}</span>
                <button
                  style={{ ...btn, padding: '4px 7px', color: verrouille ? MUT : '#B3261E', cursor: verrouille ? 'not-allowed' : 'pointer' }}
                  disabled={verrouille || busy !== null}
                  title={verrouille ? 'Attribué ou remis à un gagnant : conservé.' : 'Supprimer ce ticket'}
                  onClick={() => supprimer(t)}>
                  <Ico k="trash" size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}
      {ouvert && liste.some(t => etatTicket(t) !== 'emis') && (
        <div style={{ fontSize: 10.5, color: MUT, marginTop: 4 }}>Les tickets attribués ou remis à un gagnant ne peuvent pas être supprimés.</div>
      )}
    </div>
  )
}
