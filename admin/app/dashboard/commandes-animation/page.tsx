'use client'

/**
 * COMMANDES ANIMATION (Super Admin) — validation des paiements (31/10/2026).
 *
 * Decisions de Romain :
 *   - pas de branchement bancaire pour les virements : le SA clique « Marquer le virement
 *     recu » (journalise : qui, quand) ; la commande passe a payee, l'espace pro du client
 *     s'ouvre, la facture acquittee est numerotee (sql/commandes_animation_pro.sql) ;
 *   - SEPA GoCardless : le webhook valide tout seul, rien a faire ici ;
 *   - indicateur « en attente depuis plus de X jours » + email de relance cote Flowin.
 *
 * Premiere page du dashboard qui travaille SOUS IDENTITE (connexion Supabase d'un compte
 * Super Admin, table flowin_super_admins) : lecture et ecriture soumises a la RLS.
 * Plan de generalisation : sql/confidentialite_contacts.sql, phase 2.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { supabase } from '@/lib/supabase'
import { CHARTE_PRO as C, POLICE_PRO } from '@/lib/charte'
import {
  type CommandeAnimation, LIBELLE_PAIEMENT, LIBELLE_STATUT, dateFr, dateHeureFr, eur, statutAffiche,
} from '@/lib/commandesPro'
import { Pastille } from '@/components/pro/HistoriqueCommandes'

type Ligne = CommandeAnimation & { virement_recu_par_email?: string | null; relances_paiement?: number | null }

const joursDepuis = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
const btn: React.CSSProperties = { border: `1.5px solid ${C.bordureChamp}`, background: '#fff', color: C.encre, borderRadius: 99, padding: '8px 14px', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }
const btnPlein: React.CSSProperties = { ...btn, background: C.violet, borderColor: C.violet, color: '#fff' }
const champ: React.CSSProperties = { width: '100%', border: `1.5px solid ${C.bordureChamp}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }

export default function Page() {
  const [etat, setEtat] = useState<'charge' | 'connexion' | 'pas-sa' | 'indisponible' | 'ok'>('charge')
  const [liste, setListe] = useState<Ligne[]>([])
  const [email, setEmail] = useState('')
  const [mdp, setMdp] = useState('')
  const [erreur, setErreur] = useState('')
  const [seuil, setSeuil] = useState(3)
  const [filtre, setFiltre] = useState<'attente' | 'toutes'>('attente')
  const [occupe, setOccupe] = useState('')
  const [message, setMessage] = useState('')

  const charger = useCallback(async () => {
    const { data: s } = await supabase.auth.getSession()
    if (!s.session) { setEtat('connexion'); return }
    const sa = await supabase.rpc('est_super_admin')
    if (sa.error) { setEtat('indisponible'); return }
    if (!sa.data) { setEtat('pas-sa'); return }
    const r = await supabase.from('commandes_animation').select('*').order('created_at', { ascending: false })
    if (r.error) { setEtat('indisponible'); return }
    setListe((r.data ?? []) as Ligne[]); setEtat('ok')
  }, [])
  useEffect(() => { charger() }, [charger])

  async function connecter(e: React.FormEvent) {
    e.preventDefault(); setErreur('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: mdp })
    if (error) { setErreur('Connexion refusée : vérifiez l’email et le mot de passe.'); return }
    setMdp(''); setEtat('charge'); charger()
  }
  async function valider(c: Ligne) {
    if (!window.confirm(`Confirmer la réception du virement de ${eur(c.montant_ttc)} TTC pour ${c.raison_sociale} (${c.id}) ?\n\nL’espace pro du client s’ouvre et la facture acquittée est émise. L’action est enregistrée à votre nom.`)) return
    setOccupe(c.id); setMessage('')
    const { error } = await supabase.rpc('marquer_virement_recu', { p_commande: c.id })
    setOccupe('')
    setMessage(error ? `Échec : ${error.message}` : `Virement validé pour ${c.raison_sociale}. Espace pro ouvert.`)
    charger()
  }
  async function docsEnvoyes(c: Ligne) {
    setOccupe(c.id)
    const { error } = await supabase.rpc('marquer_documents_envoyes', { p_commande: c.id })
    setOccupe(''); setMessage(error ? `Échec : ${error.message}` : 'Documents marqués comme envoyés.'); charger()
  }

  const attente = useMemo(() => liste.filter(c => ['attente', 'a_reprendre'].includes(statutAffiche(c))), [liste])
  const enRetard = useMemo(() => attente.filter(c => joursDepuis(c.created_at) >= seuil), [attente, seuil])
  const vue = filtre === 'attente' ? attente : liste

  return (
    <div className="sa-page" style={{ background: C.fond, fontFamily: POLICE_PRO, color: C.encre, padding: '24px 28px 40px', minHeight: '100vh' }}>
      <PageHeader title="Commandes Animation" subtitle="Validation des paiements : virement reçu, ouverture de l’espace pro, factures." />

      {etat === 'charge' && <EmptyState icon="🔍" title="Chargement…" />}

      {etat === 'indisponible' && (
        <EmptyState icon="🔍" title="Pas encore disponible" desc="Les tables de commandes ne sont pas encore appliquées (sql/2026-11-01-commandes-animation.sql puis sql/commandes_animation_pro.sql)." />
      )}

      {etat === 'pas-sa' && (
        <div style={{ maxWidth: 460, background: '#fff', border: `1px solid ${C.bordure}`, borderRadius: 16, padding: 22 }}>
          <b>Ce compte n’est pas Super Admin.</b>
          <div style={{ fontSize: 13, color: C.attenue, margin: '6px 0 14px' }}>Il doit être inscrit dans la table flowin_super_admins.</div>
          <button style={btn} onClick={async () => { await supabase.auth.signOut(); setEtat('connexion') }}>Changer de compte</button>
        </div>
      )}

      {etat === 'connexion' && (
        <form onSubmit={connecter} style={{ maxWidth: 400, background: '#fff', border: `1px solid ${C.bordure}`, borderRadius: 16, padding: 22, display: 'grid', gap: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 900 }}>Connexion Super Admin</div>
          <div style={{ fontSize: 13, color: C.attenue }}>Les validations de paiement sont enregistrées à votre nom.</div>
          <label style={{ fontSize: 12, fontWeight: 800, color: C.attenue }}>Email<input style={champ} type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" /></label>
          <label style={{ fontSize: 12, fontWeight: 800, color: C.attenue }}>Mot de passe<input style={champ} type="password" value={mdp} onChange={e => setMdp(e.target.value)} autoComplete="current-password" /></label>
          {erreur && <div style={{ color: C.ko, fontSize: 13, fontWeight: 700 }}>{erreur}</div>}
          <button style={{ ...btnPlein, padding: '11px 18px', fontSize: 14 }} type="submit">Se connecter</button>
        </form>
      )}

      {etat === 'ok' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginBottom: 14 }}>
            <Kpi v={attente.length} l="en attente de paiement" />
            <Kpi v={enRetard.length} l={`en attente depuis ${seuil} jours ou plus`} alerte={enRetard.length > 0} />
            <Kpi v={eur(attente.reduce((n, c) => n + Number(c.montant_ttc), 0))} l="TTC à encaisser" />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
            <button style={filtre === 'attente' ? btnPlein : btn} onClick={() => setFiltre('attente')}>À valider ({attente.length})</button>
            <button style={filtre === 'toutes' ? btnPlein : btn} onClick={() => setFiltre('toutes')}>Toutes ({liste.length})</button>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: C.attenue, marginLeft: 'auto' }}>Alerte à partir de{' '}
              <select value={seuil} onChange={e => setSeuil(Number(e.target.value))} style={{ ...champ, width: 'auto', padding: '6px 8px' }}>
                {[1, 2, 3, 5, 7, 10, 15].map(n => <option key={n} value={n}>{n} jours</option>)}
              </select>
            </label>
          </div>
          {message && <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10, color: message.startsWith('Échec') ? C.ko : C.ok }}>{message}</div>}

          {vue.length === 0 && <EmptyState icon="🔍" title={filtre === 'attente' ? 'Aucune commande en attente' : 'Aucune commande'} />}
          <div style={{ display: 'grid', gap: 10 }}>
            {vue.map(c => {
              const s = statutAffiche(c), j = joursDepuis(c.created_at)
              const alerte = (s === 'attente' || s === 'a_reprendre') && j >= seuil
              return (
                <div key={c.id} style={{ background: '#fff', border: `1px solid ${alerte ? '#E8A9A9' : C.bordure}`, borderRadius: 16, padding: '14px 16px', display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr) auto', gap: 12, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 900 }}>{c.raison_sociale}</div>
                    <div style={{ fontSize: 12, color: C.attenue }}>{c.id} · {dateFr(c.created_at)} · {c.email}</div>
                    <div style={{ fontSize: 12, color: C.attenue }}>{LIBELLE_PAIEMENT[c.mode_paiement]} · {c.pro_id ? `compte pro ${c.pro_id}` : 'sans compte pro lié'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 900 }}>{eur(c.montant_ttc)} <span style={{ fontSize: 11, color: C.attenue }}>TTC</span></div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                      <Pastille s={s} />
                      {alerte && <span style={{ fontSize: 12, fontWeight: 900, color: C.ko }}>depuis {j} j</span>}
                    </div>
                    {c.virement_recu_at && <div style={{ fontSize: 11.5, color: C.attenue, marginTop: 4 }}>Virement validé le {dateHeureFr(c.virement_recu_at)}{c.virement_recu_par_email ? ` par ${c.virement_recu_par_email}` : ''}{c.facture_numero ? ` · ${c.facture_numero}` : ''}</div>}
                    {(c.relances_paiement ?? 0) > 0 && s === 'attente' && <div style={{ fontSize: 11.5, color: C.attenue, marginTop: 4 }}>Le client a prévenu de son virement ({c.relances_paiement}×, dernier : {dateHeureFr(c.relance_paiement_at)})</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(s === 'attente' || s === 'a_reprendre') && <button style={btnPlein} disabled={occupe === c.id} onClick={() => valider(c)}>{occupe === c.id ? '…' : 'Marquer le virement reçu'}</button>}
                    {s === 'paye' && <button style={btn} disabled={occupe === c.id} onClick={() => docsEnvoyes(c)}>Documents envoyés</button>}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ fontSize: 12, color: C.attenue, marginTop: 14, lineHeight: 1.6 }}>
            Statuts : {Object.values(LIBELLE_STATUT).join(' · ')}. Le prélèvement SEPA se valide tout seul (webhook GoCardless). Un email vous alerte à chaque nouvelle commande, puis chaque matin pour celles en attente depuis plus de {seuil} jours.
          </div>
        </>
      )}
    </div>
  )
}

function Kpi({ v, l, alerte }: { v: number | string; l: string; alerte?: boolean }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${alerte ? '#E8A9A9' : C.bordure}`, borderRadius: 14, padding: '12px 16px' }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: alerte ? C.ko : C.encre }}>{v}</div>
      <div style={{ fontSize: 12, color: C.attenue, fontWeight: 700 }}>{l}</div>
    </div>
  )
}
