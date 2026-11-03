'use client'

/**
 * MES COMMANDES ET FACTURES (31/10/2026) — historique complet des commandes du pro :
 * date, numero de commande et de facture, offre, kit, options, montants HT / TTC, mode de
 * paiement, statut (en attente de paiement / paye / documents envoyes), telechargement du
 * contrat signe et de la facture en PDF, rappel des coordonnees de virement.
 *
 * Charte et composants Flowin uniquement (lib/charte, lib/proui). Lecture sous la session
 * du pro (RLS) ; « bientot disponible » tant que les SQL ne sont pas appliques.
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { CHARTE_PRO as C } from '@/lib/charte'
import { CARD, BTN, BTN2, MUTED } from '@/lib/proui'
import {
  type CommandeAnimation, type StatutAffiche, LIBELLE_PAIEMENT, LIBELLE_STATUT, NOM_OFFRE, VIREMENT,
  chargerCommandes, dateFr, dateHeureFr, eur, lignesCommande, montantAVirer, statutAffiche,
} from '@/lib/commandesPro'
import LienBonCommande from './LienBonCommande'
import { telechargerContrat, telechargerFacture } from '@/lib/pdfCommande'
import type { Facture } from '@/lib/documentsAnimation'

import { GARANTIE_ACTIVE } from '@/lib/flowinConfig'
const TEINTE: Record<StatutAffiche, { fond: string; texte: string }> = {
  attente: { fond: '#FFF4E0', texte: '#9A5B00' },
  paye: { fond: '#E6F7F4', texte: C.ok },
  documents: { fond: '#EAEFFB', texte: C.bleu },
  a_reprendre: { fond: '#FDECEC', texte: C.ko },
  annulee: { fond: '#EEF1F5', texte: C.attenue },
}

export function Pastille({ s }: { s: StatutAffiche }) {
  const t = TEINTE[s]
  return <span style={{ display: 'inline-block', background: t.fond, color: t.texte, borderRadius: 99, padding: '4px 11px', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>{LIBELLE_STATUT[s]}</span>
}

const resumeOffre = (c: CommandeAnimation) => {
  const p = [NOM_OFFRE[c.offre] ?? c.offre]
  p.push(c.kit === 'physique' ? `kit physique × ${c.nb_boutiques}` : 'kit digital')
  if (c.opt_quiz_qte > 0) p.push(`quiz × ${c.opt_quiz_qte}`)
  if (c.opt_bonus_qte > 0) p.push(`bonus × ${c.opt_bonus_qte}`)
  return p.join(' · ')
}

export default function HistoriqueCommandes({ proId }: { proId: string }) {
  const [etat, setEtat] = useState<'charge' | 'ok' | 'sans-session' | 'indisponible' | 'erreur'>('charge')
  const [liste, setListe] = useState<CommandeAnimation[]>([])
  const [factures, setFactures] = useState<Record<string, Facture[]>>({})
  const [message, setMessage] = useState('')
  const [ouvert, setOuvert] = useState<string | null>(null)
  const [info, setInfo] = useState<Record<string, string>>({})
  const [copie, setCopie] = useState('')

  const recharger = useCallback(async () => {
    const r = await chargerCommandes(proId)
    setEtat(r.etat); setListe(r.commandes); setFactures(r.factures); setMessage(r.message ?? '')
    if (r.commandes.length === 1) setOuvert(o => o ?? r.commandes[0].id)
  }, [proId])
  useEffect(() => { recharger() }, [recharger])

  async function copier(txt: string, cle: string) {
    try { await navigator.clipboard.writeText(txt); setCopie(cle) } catch { setCopie('') }
    setTimeout(() => setCopie(''), 2000)
  }
  async function pdf(c: CommandeAnimation, f?: Facture) {
    setInfo(i => ({ ...i, [c.id]: '' }))
    try {
      if (f) await telechargerFacture(f)
      else await telechargerContrat(c)
    } catch {
      setInfo(i => ({ ...i, [c.id]: 'Le générateur PDF n’a pas pu se charger. Vérifiez la connexion et réessayez.' }))
    }
  }
  async function relancer(c: CommandeAnimation) {
    const { error } = await supabase.rpc('relancer_paiement_virement', { p_commande: c.id })
    setInfo(i => ({ ...i, [c.id]: error
      ? 'La relance n’a pas pu être enregistrée. Les coordonnées de virement ci-dessous restent valables.'
      : 'Rappel enregistré : l’équipe Flowin est prévenue que le virement est en cours. Coordonnées de virement ci-dessous.' }))
    recharger()
  }

  if (etat === 'charge') return <div style={{ ...CARD, ...MUTED }}>Chargement de vos commandes…</div>
  if (etat === 'sans-session') {
    return (
      <div style={CARD}>
        <div style={{ fontSize: 16, fontWeight: 900 }}>Connectez-vous pour voir vos commandes</div>
        <div style={{ fontSize: 13.5, ...MUTED, margin: '6px 0 14px' }}>Vos commandes et vos factures sont réservées à votre compte pro.</div>
        <Link href="/pro/connexion" style={{ ...BTN, display: 'inline-block', textDecoration: 'none' }}>Se connecter</Link>
      </div>
    )
  }
  if (etat === 'indisponible') {
    return (
      <div style={CARD}>
        <div style={{ fontSize: 16, fontWeight: 900 }}>Historique bientôt disponible</div>
        <div style={{ fontSize: 13.5, ...MUTED, marginTop: 6, lineHeight: 1.55 }}>Cette page affichera vos commandes, vos contrats signés et vos factures dès l’ouverture du service de commande en ligne. Rien n’est perdu : vos commandes passées sont conservées.</div>
      </div>
    )
  }
  if (etat === 'erreur') return <div style={{ ...CARD, color: C.ko }}>Impossible de charger vos commandes : {message}. Si le problème continue, contactez Flowin.</div>

  if (!liste.length) {
    return (
      <div style={{ ...CARD, textAlign: 'center', padding: 28 }}>
        <div style={{ fontSize: 17, fontWeight: 900 }}>Aucune commande pour le moment</div>
        <div style={{ fontSize: 13.5, ...MUTED, margin: '6px 0 16px' }}>Choisissez votre offre et signez votre bon de commande pour ouvrir votre espace.</div>
        <LienBonCommande proId={proId} style={{ ...BTN, display: 'inline-block', textDecoration: 'none' }}>Choisir mon offre et signer</LienBonCommande>
      </div>
    )
  }

  const attente = liste.filter(c => statutAffiche(c) === 'attente' || statutAffiche(c) === 'a_reprendre')
  return (
    <div>
      {attente.length > 0 && (
        <div style={{ ...CARD, background: '#FFF4E0', borderColor: '#F5D9A6' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#7A4A00' }}>{attente.length === 1 ? 'Une commande attend son paiement' : `${attente.length} commandes attendent leur paiement`}</div>
          <div style={{ fontSize: 13.5, color: '#7A4A00', marginTop: 4, lineHeight: 1.55 }}>Votre espace pro s’ouvre dès que l’équipe Flowin a validé votre paiement. Le prélèvement SEPA est validé automatiquement ; le virement est validé à réception.</div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {liste.map(c => {
          const s = statutAffiche(c)
          const ouv = ouvert === c.id
          const virer = montantAVirer(c)
          return (
            <div key={c.id} style={{ ...CARD, marginBottom: 0, padding: 0, overflow: 'hidden', borderColor: ouv ? C.violet : C.bordure }}>
              <button onClick={() => setOuvert(ouv ? null : c.id)} aria-expanded={ouv}
                style={{ all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer', display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1.6fr) auto auto', gap: 12, alignItems: 'center', padding: '14px 16px' }} className="cmd-ligne">
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 900 }}>{c.id}</div>
                  <div style={{ fontSize: 12, ...MUTED }}>{dateFr(c.created_at)}{c.facture_numero ? ` · facture ${c.facture_numero}` : ''}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.encre2 }}>{resumeOffre(c)}</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 900 }}>{eur(c.montant_ttc)} <span style={{ fontSize: 11, ...MUTED, fontWeight: 700 }}>TTC</span></div>
                  <div style={{ fontSize: 11.5, ...MUTED }}>{eur(c.montant_ht)} HT</div>
                </div>
                <Pastille s={s} />
              </button>

              {ouv && (
                <div style={{ borderTop: `1px solid ${C.bordure}`, padding: '16px', display: 'grid', gap: 16 }}>
                  <div className="cmd-detail">
                    <div>
                      <div style={ETIQ}>Détail de la commande</div>
                      {lignesCommande(c).map((l, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.bordure}`, fontSize: 13 }}>
                          <div><b>{l.lib}</b>{l.q > 1 ? <span style={MUTED}> × {l.q}</span> : null}<div style={{ fontSize: 11.5, ...MUTED }}>{l.det}</div></div>
                          <b style={{ whiteSpace: 'nowrap' }}>{eur(l.ht)}</b>
                        </div>
                      ))}
                      <div style={LIGNE}><span style={MUTED}>Total HT</span><b>{eur(c.montant_ht)}</b></div>
                      <div style={LIGNE}><span style={MUTED}>TVA 20 %</span><b>{eur(c.montant_tva)}</b></div>
                      <div style={{ ...LIGNE, fontSize: 15 }}><span style={{ fontWeight: 900 }}>Total TTC</span><b>{eur(c.montant_ttc)}</b></div>
                      {GARANTIE_ACTIVE && c.garantie && <div style={{ fontSize: 12.5, ...MUTED, marginTop: 8, lineHeight: 1.5 }}>Satisfait ou remboursé (première souscription annuelle) : objectif de {c.garantie_clients_objectif} clients venus retirer leur lot sur 12 mois.</div>}
                      {GARANTIE_ACTIVE && c.type_commande === 'renouvellement' && <div style={{ fontSize: 12.5, ...MUTED, marginTop: 8, lineHeight: 1.5 }}>Renouvellement : la garantie satisfait ou remboursé est réservée à la première souscription annuelle.</div>}
                    </div>

                    <div>
                      <div style={ETIQ}>Paiement et documents</div>
                      <div style={LIGNE}><span style={MUTED}>Mode de paiement</span><b>{LIBELLE_PAIEMENT[c.mode_paiement] ?? c.mode_paiement}</b></div>
                      <div style={LIGNE}><span style={MUTED}>Statut</span><Pastille s={s} /></div>
                      <div style={LIGNE}><span style={MUTED}>Souscription</span><b>{c.type_commande === 'renouvellement' ? 'Renouvellement' : 'Première souscription'}</b></div>
                      <div style={LIGNE}><span style={MUTED}>Signé le</span><b>{dateHeureFr(c.signature_horodatage ?? c.created_at)}</b></div>
                      {c.paiement_valide_le && <div style={LIGNE}><span style={MUTED}>Paiement validé le</span><b>{dateFr(c.paiement_valide_le)}</b></div>}
                      {(factures[c.id] ?? []).map(f => <div key={f.numero} style={LIGNE}><span style={MUTED}>{f.objet === 'mensualite' ? 'Facture mensualité' : 'Facture'}</span><b>{f.numero}</b></div>)}

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                        <button style={{ ...BTN2, padding: '10px 16px', fontSize: 13 }} onClick={() => pdf(c)}>Contrat signé (PDF)</button>
                        {(factures[c.id] ?? []).map(f => (
                          <button key={f.numero} style={{ ...BTN2, padding: '10px 16px', fontSize: 13 }} onClick={() => pdf(c, f)}>{f.objet === 'mensualite' ? 'Mensualité' : 'Facture'} {f.numero} (PDF)</button>
                        ))}
                        {!(factures[c.id] ?? []).length && <button style={{ ...BTN2, padding: '10px 16px', fontSize: 13, opacity: .55, cursor: 'default' }} disabled>Facture (PDF)</button>}
                      </div>
                      {!(factures[c.id] ?? []).length && <div style={{ fontSize: 12, ...MUTED, marginTop: 6 }}>La facture acquittée est disponible dès que votre paiement est validé.</div>}
                      {info[c.id] && <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 8, color: info[c.id].startsWith('Rappel') ? C.ok : C.ko }}>{info[c.id]}</div>}
                    </div>
                  </div>

                  {(s === 'attente' || s === 'a_reprendre') && virer > 0 && (
                    <div style={{ background: C.violetClair, borderRadius: 14, padding: '14px 16px' }}>
                      <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 6 }}>Régler par virement : {eur(virer)} TTC</div>
                      {[['Titulaire', VIREMENT.titulaire], ['IBAN', VIREMENT.iban], ['BIC', VIREMENT.bic], ['Référence à rappeler', c.id]].map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '5px 0', fontSize: 13 }}>
                          <span style={{ minWidth: 128, ...MUTED, fontWeight: 700 }}>{k}</span>
                          <b style={{ fontFamily: k === 'IBAN' || k === 'BIC' || k === 'Référence à rappeler' ? 'ui-monospace,Menlo,monospace' : 'inherit', wordBreak: 'break-all' }}>{v}</b>
                          {k !== 'Titulaire' && <button onClick={() => copier(v, c.id + k)} style={{ all: 'unset', cursor: 'pointer', color: C.bleu, fontWeight: 800, fontSize: 12 }}>{copie === c.id + k ? 'Copié' : 'Copier'}</button>}
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
                        {c.mode_paiement === 'virement' && <button style={{ ...BTN, padding: '10px 18px', fontSize: 13.5 }} onClick={() => relancer(c)}>J’ai fait le virement : prévenir Flowin</button>}
                        {c.relance_paiement_at && <span style={{ fontSize: 12, ...MUTED }}>Dernier rappel : {dateHeureFr(c.relance_paiement_at)}</span>}
                      </div>
                    </div>
                  )}
                  {(s === 'attente' || s === 'a_reprendre') && c.mode_paiement === 'prelevement_sepa' && (
                    <div style={{ background: C.violetClair, borderRadius: 14, padding: '14px 16px', fontSize: 13.5, lineHeight: 1.55 }}>
                      <b>Prélèvement SEPA en cours.</b> Signez le mandat sur la page GoCardless ; le paiement est validé automatiquement et votre espace s’ouvre aussitôt.
                      {virer > 0 && <div style={{ marginTop: 6 }}>Le kit et les options ({eur(virer)} TTC) sont à régler par virement avec la référence <b>{c.id}</b>.</div>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .cmd-detail{display:grid;grid-template-columns:1.15fr 1fr;gap:22px}
        @media (max-width:720px){
          .cmd-detail{grid-template-columns:1fr}
          .cmd-ligne{grid-template-columns:minmax(0,1fr) auto !important}
          .cmd-ligne > :nth-child(2){grid-column:1 / -1;order:3}
        }
      ` }} />
    </div>
  )
}

const ETIQ: React.CSSProperties = { fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: C.attenue, marginBottom: 6 }
const LIGNE: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.bordure}`, fontSize: 13 }
