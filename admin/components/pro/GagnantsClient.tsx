'use client'

/**
 * GAGNANTS — un bloc par operation (event ou super event), jamais a plat.
 *
 * Romain (handoff 14/09) : « Un pro a plusieurs events et super events. Rien
 * ne s affiche a plat. » L ecran precedent choisissait UN event dans une liste
 * deroulante, et affichait pourtant TOUS les gains du commerce quel que soit
 * l event choisi (fetchProGains ne filtrait que sur le partenaire). Chaque
 * operation a maintenant son bloc, titre nom + date, avec ses seuls gagnants.
 *
 * REGLE DU RETIRAGE (Romain, 04/09) : « oui en autonomie pour les events, en
 * revanche pas pour les super events, SA reste pilote ». Le tirage n existe
 * donc que dans les blocs « event ».
 *
 * VALIDATION EN CAISSE : meme chemin que lot.html -- verifier_pin_pro(token,
 * pin) controle partenaires.code_pin, puis valider_lot(token) destocke.
 * L ancien appel passait le PIN a valider_lot, qui le compare au NUMERO DE
 * BILLET : le bon PIN etait refuse. Et le retour (jsonb {ok}) etait lu comme
 * un booleen : une validation reussie s affichait en echec.
 */

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { marquerGainUtilise, enregistrerTirage, envoyerTicketGagnant, fetchJoueursEligibles, type JoueurEligible } from '@/lib/dashboard'
import type { DonneesOperation, GagnantOperation, OperationsPro } from '@/lib/operations'
import { fetchOperationsPro, gagnantsParStation, libelleRemise } from '@/lib/operations'
import { operationsRangees } from '@/lib/rangementOperations'
import { BlocOperation, AucuneOperation, Vide, TitreStation, btn, btnPrimaire } from '@/components/operations/BlocsOperations'
import { CARD, MUTED, H1, SUB } from '@/lib/proui'

const input: React.CSSProperties = {
  border: '1.5px solid #efe9f2', borderRadius: 10, padding: '10px 12px',
  fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
}

type Msg = { ok: boolean; texte: string } | null

export default function GagnantsClient({ initial, cle, titre = true }: { initial: OperationsPro; cle?: string | null; titre?: boolean }) {
  const [data, setData] = useState<OperationsPro>(initial)
  const recharger = () => { fetchOperationsPro(initial.proId).then(setData) }

  return (
    <div>
      {titre && <h1 style={H1}>Gagnants &amp; tirage</h1>}
      {titre && <div style={{ ...SUB, marginBottom: 16 }}>
        Un bloc par opération : ses gagnants, leurs billets, la validation en caisse — et le tirage sur vos events.
      </div>}
      {data.operations.length === 0 && <div style={CARD}><AucuneOperation /></div>}
      {operationsRangees(data.operations, cle).map(op => (
        <BlocOperation key={op.cle} op={op}>
          <BlocGagnants op={op} data={data} onChange={recharger} />
        </BlocOperation>
      ))}
    </div>
  )
}

export function BlocGagnants({ op, data, onChange }: { op: DonneesOperation; data: OperationsPro; onChange: () => void }) {
  const [message, setMessage] = useState<Msg>(null)
  const remis = op.gagnants.filter(g => g.etat === 'retire').length
  const kpi = (n: number, l: string) => (
    <div style={{ flex: '1 1 110px', background: '#faf7fd', borderRadius: 10, padding: '9px 12px' }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: '#7C2D92' }}>{n}</div>
      <div style={{ fontSize: 11, ...MUTED }}>{l}</div>
    </div>
  )
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {kpi(op.gagnants.length, 'gagnants')}
        {kpi(op.gagnants.length - remis, 'lots à remettre')}
        {kpi(remis, 'lots déjà remis')}
      </div>

      {message && (
        <div style={{
          marginBottom: 12, padding: '10px 12px', borderRadius: 10, fontSize: 12.5, fontWeight: 600,
          border: `1px solid ${message.ok ? '#15803D' : '#B45309'}`, color: message.ok ? '#15803D' : '#B45309',
        }}>{message.texte}</div>
      )}

      {op.type === 'event'
        ? <Tirage op={op} data={data} setMessage={setMessage} onChange={onChange} />
        : (
          <div style={{ fontSize: 12, ...MUTED, marginBottom: 10 }}>
            Super event : le tirage et les remplacements sont pilotés par Flowin. Vous validez ici les billets présentés en caisse.
          </div>
        )}

      {op.gagnants.length === 0 && <Vide>Aucun gagnant sur cette opération.</Vide>}
      {gagnantsParStation(op).map(grp => (
        <div key={grp.cle}>
          {grp.nom && <TitreStation nom={grp.nom} n={grp.gagnants.length} />}
          {grp.gagnants.map(g => (
            <LigneGain key={g.id} g={g} superEvent={op.type === 'super'} setMessage={setMessage} onChange={onChange} />
          ))}
        </div>
      ))}
    </>
  )
}

function Tirage({ op, data, setMessage, onChange }: {
  op: DonneesOperation; data: OperationsPro; setMessage: (m: Msg) => void; onChange: () => void
}) {
  const ev = op.stations[0]
  const [eligibles, setEligibles] = useState<JoueurEligible[] | null>(null)
  const [propose, setPropose] = useState<JoueurEligible | null>(null)
  const [exclus, setExclus] = useState<string[]>([])
  const [envoi, setEnvoi] = useState(false)
  const [mail, setMail] = useState<'idle' | 'envoi' | 'ok' | 'echec'>('idle')
  const [dernierToken, setDernierToken] = useState<string | null>(null)
  /* Le lot tire : celui que le pro choisit parmi ceux de l event (le premier
     etait impose). Les lots epuises (quantite atteinte) ne sont pas proposes. */
  const lotsDispo = op.lots.filter(l => op.gagnants.filter(g => g.lotNom === l.nom).length < l.quantite)
  const [lotId, setLotId] = useState<string>('')
  const lotChoisi = lotsDispo.find(l => l.id === lotId) ?? lotsDispo[0] ?? null

  /* Le vivier : les joueurs qui ont REELLEMENT joue sur cet event (table
     participations), comptes de test exclus -- fetchJoueursEligibles. */
  useEffect(() => { fetchJoueursEligibles(ev.id).then(setEligibles) }, [ev.id])
  const dejaGagnants = useMemo(() => op.gagnants.map(g => g.joueurNom ?? ''), [op.gagnants])
  const vivier = (eligibles ?? []).filter(j => exclus.indexOf(j.id) < 0)

  const tirer = (liste = vivier) => {
    setMessage(null); setMail('idle'); setDernierToken(null)
    if (!liste.length) { setPropose(null); setMessage({ ok: false, texte: 'Aucun joueur éligible : personne n’a encore joué sur cet event.' }); return }
    setPropose(liste[Math.floor(Math.random() * liste.length)])
  }

  /* Rien n est ecrit tant que le gagnant n est pas confirme : aucun tirage fantome. */
  const confirmer = async () => {
    if (!propose) return
    setEnvoi(true)
    const lotNom = lotChoisi?.nom ?? `Lot — ${ev.nom}`
    const res = await enregistrerTirage({
      superEventId: null, eventId: ev.id, lotNom,
      lotValeur: lotChoisi?.valeur ?? null,
      partenaireId: data.partenaire?.id ?? null,
      joueur: { id: propose.id },
    })
    if (!res.ok) { setEnvoi(false); setMessage({ ok: false, texte: 'Le tirage n’a pas pu être enregistré.' }); return }
    setDernierToken(res.retraitToken)
    if (propose.email) {
      setMail('envoi')
      const r = await envoyerTicketGagnant({
        gagnantEmail: propose.email, gagnantNom: propose.nom || 'Gagnant', lotNom,
        code: res.code, retraitToken: res.retraitToken,
        partenaireNom: data.proNom ?? '', fromName: data.proNom ?? 'Flowin', replyTo: data.proEmail ?? undefined,
      })
      setMail(r.ok ? 'ok' : 'echec')
    } else setMail('echec')
    setEnvoi(false)
    setPropose(null)
    onChange()
  }

  return (
    <div style={{ background: '#faf7fd', border: '1px solid #efe9f2', borderRadius: 12, padding: 14, marginBottom: 12 }}>
      <div style={{ fontWeight: 800, fontSize: 13.5 }}>Tirage au sort</div>
      <div style={{ fontSize: 12, ...MUTED, margin: '2px 0 10px' }}>
        {eligibles === null ? 'Chargement du vivier…' : `${vivier.length} joueur${vivier.length > 1 ? 's' : ''} ayant joué`}
        {exclus.length > 0 && ` · ${exclus.length} écarté${exclus.length > 1 ? 's' : ''}`}
        {op.lots.length === 0 && ' · aucun lot enregistré sur cet event : le gain portera le nom de l’event.'}
        {op.lots.length > 0 && lotsDispo.length === 0 && ' · tous les lots ont été attribués.'}
      </div>
      {lotsDispo.length > 1 && (
        <select style={{ ...input, marginBottom: 10, maxWidth: 360 }} value={lotChoisi?.id ?? ''} onChange={e => setLotId(e.target.value)}>
          {lotsDispo.map(l => (
            <option key={l.id} value={l.id}>
              {l.nom} — {l.quantite - op.gagnants.filter(g => g.lotNom === l.nom).length} restant(s)
            </option>
          ))}
        </select>
      )}
      {!propose && (
        <button style={btnPrimaire} disabled={envoi || eligibles === null} onClick={() => tirer()}>Lancer le tirage</button>
      )}
      {propose && (
        <div style={{ background: '#fff', border: '1px solid #efe9f2', borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#8a7e93' }}>Gagnant proposé</div>
          <div style={{ fontWeight: 800, fontSize: 15, marginTop: 2 }}>{propose.nom}</div>
          <div style={{ fontSize: 12, ...MUTED }}>{propose.email ?? 'pas d’email'}{propose.tel ? ` · ${propose.tel}` : ''}</div>
          {dejaGagnants.indexOf(propose.nom) >= 0 && (
            <div style={{ fontSize: 11.5, color: '#B45309', marginTop: 4 }}>A déjà gagné sur cet event.</div>
          )}
          {!propose.email && (
            <div style={{ fontSize: 11.5, color: '#B45309', marginTop: 4 }}>Sans email, le billet ne peut pas lui être envoyé — il faudra le prévenir vous-même.</div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button style={btnPrimaire} onClick={confirmer} disabled={envoi}>{envoi ? 'Enregistrement…' : 'Confirmer et envoyer le billet'}</button>
            {/* LE RETIRAGE : on ecarte celui-la et on relance. Rien n a ete ecrit. */}
            <button style={btn} disabled={envoi} onClick={() => {
              const ex = exclus.concat([propose.id])
              setExclus(ex)
              tirer((eligibles ?? []).filter(j => ex.indexOf(j.id) < 0))
            }}>Injoignable — retirer au sort</button>
          </div>
        </div>
      )}
      {mail !== 'idle' && !propose && (
        <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: mail === 'ok' ? '#15803D' : mail === 'echec' ? '#B45309' : '#8a7e93' }}>
          {mail === 'envoi' && 'Envoi du billet…'}
          {mail === 'ok' && 'Billet envoyé par email au gagnant.'}
          {mail === 'echec' && 'Tirage enregistré, mais le billet n’a pas pu être envoyé par email.'}
          {dernierToken && <> · <a href={`/nds/billets-partenaires.html?t=${encodeURIComponent(dernierToken)}`} target="_blank" rel="noreferrer" style={{ color: '#7C2D92', fontWeight: 700 }}>voir le billet</a></>}
        </div>
      )}
    </div>
  )
}

function LigneGain({ g, superEvent, setMessage, onChange }: {
  g: GagnantOperation; superEvent: boolean; setMessage: (m: Msg) => void; onChange: () => void
}) {
  const [ouvert, setOuvert] = useState(false)
  const [pin, setPin] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const remis = g.etat === 'retire'

  const validerAvecPin = async () => {
    if (!g.retraitToken) { setMessage({ ok: false, texte: 'Ce gain n’a pas de jeton de retrait — validation impossible.' }); return }
    setEnvoi(true); setMessage(null)
    const { data: pinOk, error: e1 } = await supabase.rpc('verifier_pin_pro', { p_token: g.retraitToken, p_pin: pin })
    if (e1 || pinOk !== true) {
      setEnvoi(false)
      setMessage({ ok: false, texte: e1 ? `Vérification impossible — ${e1.message}` : 'Code PIN incorrect.' })
      return
    }
    const { data, error } = await supabase.rpc('valider_lot', { p_token: g.retraitToken })
    setEnvoi(false)
    const r = (Array.isArray(data) ? data[0] : data) as { ok?: boolean; raison?: string; avertissement?: string | null } | null
    if (error || !r) { setMessage({ ok: false, texte: `Validation refusée${error ? ` — ${error.message}` : ''}.` }); return }
    if (r.ok) {
      setMessage({ ok: true, texte: r.avertissement ? `Billet validé. ${r.avertissement}` : 'Billet validé. Le lot est décompté du stock.' })
      setPin(''); setOuvert(false); onChange()
    } else {
      setMessage({ ok: false, texte: r.raison === 'deja_utilise' ? 'Ce billet a déjà été validé.' : 'Billet introuvable.' })
    }
  }

  const basculerManuel = async () => {
    setEnvoi(true)
    const ok = await marquerGainUtilise(String(g.id), !remis)
    setEnvoi(false)
    setMessage(ok
      ? { ok: true, texte: remis ? 'Gain remis en attente.' : 'Gain marqué comme remis.' }
      : { ok: false, texte: 'Échec de la mise à jour.' })
    if (ok) onChange()
  }

  return (
    <div style={{ borderTop: '1px solid #F1F5F9', padding: '10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5 }}>{g.joueurNom ?? '—'}</div>
          <div style={{ fontSize: 11.5, ...MUTED }}>
            {g.lotNom ?? 'Lot'}{g.lotValeur ? ` · ${g.lotValeur} €` : ''}{g.ticketCode ? ` · billet ${g.ticketCode}` : ''}
          </div>
          {g.joueurEmail && <div style={{ fontSize: 11.5, ...MUTED }}>{g.joueurEmail}</div>}
          {g.retireAt && <div style={{ fontSize: 11.5, color: '#15803D', fontWeight: 700 }}>{libelleRemise(g.retireAt)}</div>}
          {g.retraitToken && (
            <a href={`/nds/billets-partenaires.html?t=${encodeURIComponent(g.retraitToken)}`} target="_blank" rel="noreferrer"
              style={{ fontSize: 11.5, color: '#7C2D92', fontWeight: 700, textDecoration: 'none' }}>Voir le billet ↗</a>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10.5, fontWeight: 800, padding: '4px 9px', borderRadius: 99,
            color: remis ? '#15803D' : '#B45309', background: remis ? 'rgba(21,128,61,.09)' : 'rgba(180,83,9,.09)',
          }}>{remis ? 'Remis' : 'À remettre'}</span>
          <button style={btn} onClick={() => { setOuvert(!ouvert); setPin(''); setMessage(null) }}>{ouvert ? 'Fermer' : remis ? 'Modifier' : 'Valider'}</button>
        </div>
      </div>
      {ouvert && (
        <div style={{ marginTop: 10, background: '#faf7fd', border: '1px solid #efe9f2', borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Validation en caisse</div>
          <div style={{ fontSize: 11.5, ...MUTED, marginBottom: 8 }}>
            Saisissez votre code PIN à 4 chiffres — celui de votre fiche de retrait. Le lot est alors décompté de votre stock.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              style={{ ...input, width: 120, letterSpacing: '.25em', textAlign: 'center', fontWeight: 800 }}
              value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••" inputMode="numeric"
            />
            <button style={{ ...btnPrimaire, opacity: pin.length === 4 && !envoi && !remis ? 1 : 0.45 }}
              disabled={pin.length !== 4 || envoi || remis} onClick={validerAvecPin}>
              {envoi ? 'Vérification…' : 'Valider le billet'}
            </button>
            <button style={btn} onClick={basculerManuel} disabled={envoi}>{remis ? 'Remettre en attente' : 'Marquer remis sans PIN'}</button>
          </div>
          {superEvent && (
            <div style={{ fontSize: 11.5, ...MUTED, marginTop: 8 }}>
              Gagnant injoignable ? Le remplacement se demande à Flowin — sur un super event, le tirage reste piloté par l’organisateur.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
