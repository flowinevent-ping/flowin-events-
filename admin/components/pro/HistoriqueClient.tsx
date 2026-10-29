'use client'

/**
 * HISTORIQUE — detail d'une operation : QR + PIN, stock des lots (conditions
 * et eligibilite), gagnants et relance. Voir app/pro/historique/page.tsx pour
 * le contexte complet de la demande (Romain, 28/10).
 *
 * Composition pure : chaque bloc est une brique DEJA CONSTRUITE et utilisee
 * ailleurs dans l espace pro, jamais reecrite ici --
 *   - EncartPin, ContenuLots, BoutonGererLots : components/operations/BlocsOperations.tsx
 *     (deja utilises par l onglet « Lots » de /pro/operation et par le SA) ;
 *   - Diffusion (QR a telecharger/imprimer) + lienJeuStation : le MEME
 *     mecanisme que l onglet « Diffusion » de /pro/operation, pas un second
 *     generateur de QR ;
 *   - BlocGagnants : components/pro/GagnantsClient.tsx (deja l onglet
 *     « Gagnants & tirage » de /pro/operation et de /pro/donnees) -- porte
 *     deja le bouton Relancer (texte unique mail-gagnant.js).
 *
 * Kanban (plusieurs operations) : memes classes CSS que le planning SA
 * (.sa-kb-*, styles/sa-kanban.css, chargee par ProShell cote pro).
 */
import { useState } from 'react'
import Link from 'next/link'
import {
  fetchOperationsPro, libelleDates, libelleModule,
  type DonneesOperation, type OperationsPro,
} from '@/lib/operations'
import { rangerParPeriode, type GroupePeriode } from '@/lib/rangementOperations'
import { ContenuLots, EncartPin, BoutonGererLots, Vide } from '@/components/operations/BlocsOperations'
import { lienJeuStation } from '@/components/operations/DiffusionOperation'
import Diffusion from '@/components/dashboard/Diffusion'
import { BlocGagnants } from '@/components/pro/GagnantsClient'
import { chiffresOperation } from '@/components/pro/GrilleOperations'
import { CHARTE_PRO as C, ACCENT_ANIM, ACCENT_SUPER } from '@/lib/charte'
import { H1, SUB, CARD, MUTED } from '@/lib/proui'
import { Ico } from '@/lib/proicons'

export default function HistoriqueClient({ initial, cle: cleInitiale }: { initial: OperationsPro; cle?: string | null }) {
  const [data, setData] = useState<OperationsPro>(initial)
  const uneSeule = initial.operations.length === 1
  const [cle, setCle] = useState<string>(cleInitiale || (uneSeule ? initial.operations[0].cle : ''))
  const recharger = () => { fetchOperationsPro(initial.proId).then(setData) }
  const op = data.operations.find(o => o.cle === cle)
  const q = `?pro=${encodeURIComponent(initial.proId)}`

  function selectionner(c: string) {
    setCle(c)
    try {
      const u = new URL(window.location.href)
      if (c) u.searchParams.set('op', c); else u.searchParams.delete('op')
      window.history.replaceState(null, '', u.toString())
    } catch { /* rien */ }
  }

  return (
    <div>
      <h1 style={H1}>Historique</h1>
      <div style={{ ...SUB, marginBottom: 16 }}>
        QR et PIN à télécharger ou imprimer, stock de vos lots, vos gagnants et vos relances — par opération.
      </div>

      {data.operations.length === 0 && (
        <div style={{ ...CARD, textAlign: 'center', padding: 26 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Aucune opération pour le moment</div>
          <div style={{ fontSize: 13.5, ...MUTED, margin: '6px 0 14px' }}>Créez votre animation ou rejoignez un super event.</div>
          <Link href={`/pro/nouvelle${q}`} style={{ display: 'inline-block', background: C.degrade, color: '#fff', borderRadius: 999, padding: '12px 26px', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>Commencer</Link>
        </div>
      )}

      {op && (
        <>
          {!uneSeule && (
            <button onClick={() => selectionner('')}
              style={{ fontSize: 13, fontWeight: 800, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 10, fontFamily: 'inherit' }}>
              ← Toutes mes opérations
            </button>
          )}
          <DetailOperation op={op} data={data} onChange={recharger} proQuery={q} />
        </>
      )}

      {!op && data.operations.length > 1 && (
        <Kanban groupes={rangerParPeriode(data.operations)} onOuvrir={o => selectionner(o.cle)} />
      )}
    </div>
  )
}

/* ── Detail d une operation ───────────────────────────────────────────────── */

function DetailOperation({ op, data, onChange, proQuery }: {
  op: DonneesOperation; data: OperationsPro; onChange: () => void; proQuery: string
}) {
  const pt = data.partenaire

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>{op.nom}</div>
        <span style={{ fontSize: 12, ...MUTED }}>
          {libelleDates(op.dateD, op.dateF)} · {libelleModule(op.stations[0]?.module)}
        </span>
        <Link href={`/pro/operation${proQuery}&op=${encodeURIComponent(op.cle)}`}
          style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 800, color: C.accent, textDecoration: 'none' }}>
          Jeu, diffusion, trafic, CRM, contrat →
        </Link>
      </div>

      <div style={CARD}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 10 }}>QR &amp; PIN</div>
        {pt?.code_pin && <EncartPin pin={pt.code_pin} />}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 16 }}>
          {op.stations.map(s => (
            <div key={s.id} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>{s.nom}</div>
              <Diffusion compact url={lienJeuStation(s)}
                titre={op.type === 'super' ? `${op.nom} — ${s.nom}` : s.nom} sousTitre="Scannez pour jouer" />
            </div>
          ))}
        </div>
      </div>

      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 15, flex: 1 }}>Stock des lots</div>
          <BoutonGererLots op={op} partenaire={pt} onChange={onChange} />
        </div>
        <ContenuLots op={op} partenaireNom={pt?.nom ?? data.proNom ?? ''} partenaireEmail={pt?.email ?? data.proEmail} onChange={onChange} />
      </div>

      <div style={CARD}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 10 }}>Gagnants &amp; retraits</div>
        <BlocGagnants op={op} data={data} onChange={onChange} />
      </div>
    </div>
  )
}

/* ── Kanban de cartes (plusieurs operations) ──────────────────────────────── */

function Kanban({ groupes, onOuvrir }: {
  groupes: GroupePeriode<DonneesOperation>[]
  onOuvrir: (op: DonneesOperation) => void
}) {
  if (groupes.length === 0) return <div style={CARD}><Vide>Aucune opération.</Vide></div>
  return (
    <>
      <div className="sa-kanban">
        {groupes.map(g => (
          <section key={g.periode} className="sa-kb-col">
            <header className="sa-kb-tete">
              <span className="t">{g.titre}</span>
              <span className="n">{g.n}</span>
            </header>
            <div className="sa-kb-corps">
              {g.mois.flatMap(m => m.ops).map(op => (
                <CarteOperation key={op.cle} op={op} onClick={() => onOuvrir(op)} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}

function CarteOperation({ op, onClick }: { op: DonneesOperation; onClick: () => void }) {
  const accent = op.type === 'super' ? ACCENT_SUPER : ACCENT_ANIM
  const k = chiffresOperation(op)
  const sous: string[] = []
  if (op.type === 'super') sous.push(`${op.stations.length} station${op.stations.length > 1 ? 's' : ''}`)
  sous.push(`${k.parties} participant${k.parties > 1 ? 's' : ''}`)
  if (k.aRemettre > 0) sous.push(`${k.aRemettre} lot${k.aRemettre > 1 ? 's' : ''} à remettre`)
  return (
    <button className="sa-kb-vignette" onClick={onClick} title={`Ouvrir ${op.nom}`}>
      <div className="sa-kb-ligne">
        <span className="sa-kb-pastille" style={{ background: `${accent}20`, color: accent }}>
          <Ico k={op.type === 'super' ? 'star' : 'ticket'} size={14} />
        </span>
        <span className="sa-kb-nom">{op.nom}</span>
        {op.dateD && <span className="sa-kb-date">{libelleDates(op.dateD, op.dateF)}</span>}
      </div>
      <div className="sa-kb-sub">{sous.join(' · ')}</div>
    </button>
  )
}
