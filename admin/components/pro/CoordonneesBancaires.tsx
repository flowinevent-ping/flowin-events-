'use client'

/**
 * COORDONNEES BANCAIRES DU PRO (31/10/2026) — onglet du profil pro.
 *
 * Pour les remboursements (garantie) et les virements faits AU pro. Jamais
 * pour le prelevement de l'abonnement : le mandat est gere par GoCardless,
 * l'application ne collecte pas d'IBAN pour cela — le libelle le dit a l'ecran.
 *
 * Lecture / ecriture avec la SESSION du pro (client `supabase`) : la table
 * `pros_rib` (sql/04-pros-rib.sql) n'est accessible qu'au pro proprietaire et au
 * SA ; le pro ne relit jamais l'IBAN complet, seulement sa version masquee.
 * Tant que la migration n'est pas appliquee : message « bientot disponible ».
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { CHARTE_PRO as C } from '@/lib/charte'
import { CARD, CHAMP, LABEL, BTN, BTN2, MUTED } from '@/lib/proui'
import { bicCoherent, compacterIban, erreurBic, erreurIban, formaterIban, masquerIban } from '@/lib/rib'
import { messageFr } from '@/lib/erreursFr'

interface RibAffiche { titulaire: string; iban_masque: string; bic: string; updated_at: string | null }
type Etat = 'charge' | 'sans-session' | 'indisponible' | 'refuse' | 'pret'

const TABLE_ABSENTE = (code?: string, msg?: string) =>
  code === '42P01' || code === 'PGRST205' || code === 'PGRST106' || /does not exist|schema cache/i.test(msg ?? '')

export default function CoordonneesBancaires({ proId, titulaireParDefaut }: { proId: string; titulaireParDefaut: string }) {
  const [etat, setEtat] = useState<Etat>('charge')
  const [rib, setRib] = useState<RibAffiche | null>(null)
  const [edition, setEdition] = useState(false)
  const [titulaire, setTitulaire] = useState('')
  const [iban, setIban] = useState('')
  const [bic, setBic] = useState('')
  const [tente, setTente] = useState(false)
  const [envoi, setEnvoi] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let fini = false
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) { if (!fini) setEtat('sans-session'); return }
      const { data: ligne, error } = await supabase.from('pros_rib')
        .select('titulaire,iban_masque,bic,updated_at').eq('pro_id', proId).maybeSingle()
      if (fini) return
      if (error) {
        if (TABLE_ABSENTE(error.code, error.message)) setEtat('indisponible')
        else { setEtat('refuse'); setMessage(messageFr(error)) }
        return
      }
      setRib((ligne as RibAffiche) ?? null)
      setEdition(!ligne)
      setTitulaire((ligne as RibAffiche | null)?.titulaire ?? titulaireParDefaut)
      setBic((ligne as RibAffiche | null)?.bic ?? '')
      setEtat('pret')
    })()
    return () => { fini = true }
  }, [proId, titulaireParDefaut])

  const eTit = titulaire.trim().length < 2 ? 'Le nom du titulaire du compte, tel qu’il figure sur le RIB.' : undefined
  const eIban = erreurIban(iban)
  const eBic = erreurBic(bic) ?? (!erreurIban(iban) && !bicCoherent(iban, bic) ? 'Le pays du BIC ne correspond pas à celui de l’IBAN.' : undefined)

  async function enregistrer() {
    if (eTit || eIban || eBic) { setTente(true); return }
    setEnvoi('loading'); setMessage('')
    const compact = compacterIban(iban)
    const ligne = { titulaire: titulaire.trim(), iban: compact, iban_masque: masquerIban(compact), bic: bic.replace(/\s/g, '').toUpperCase() }
    const { error } = rib
      ? await supabase.from('pros_rib').update(ligne).eq('pro_id', proId)
      : await supabase.from('pros_rib').insert({ ...ligne, pro_id: proId })
    if (error) { setEnvoi('error'); setMessage(TABLE_ABSENTE(error.code, error.message) ? 'Enregistrement pas encore disponible.' : messageFr(error)); return }
    setRib({ titulaire: ligne.titulaire, iban_masque: ligne.iban_masque, bic: ligne.bic, updated_at: new Date().toISOString() })
    setIban(''); setTente(false); setEdition(false); setEnvoi('ok')
  }

  const usage = (
    <div style={{ background: C.violetClair, color: C.encre, borderRadius: 12, padding: '11px 14px', fontSize: 13.5, lineHeight: 1.5, marginBottom: 14 }}>
      <b>Pour vos remboursements, pas pour le prélèvement.</b> Ces coordonnées servent uniquement à vous verser de l’argent
      (remboursements éventuels, virements). Le prélèvement de votre abonnement passe par un mandat GoCardless :
      Flowin ne vous demande jamais votre IBAN pour cela.
    </div>
  )

  return (
    <div style={CARD}>
      <div style={{ fontSize: 17, fontWeight: 900, marginBottom: 4 }}>Coordonnées bancaires</div>
      <div style={{ fontSize: 13, ...MUTED, marginBottom: 12 }}>Visibles uniquement par vous et par l’équipe Flowin.</div>
      {usage}

      {etat === 'charge' && <div style={{ fontSize: 13.5, ...MUTED }}>Chargement…</div>}
      {etat === 'sans-session' && (
        <div style={{ fontSize: 13.5 }}>Pour protéger vos coordonnées bancaires, connectez-vous avec votre compte pro.{' '}
          <Link href="/pro/connexion" style={{ color: C.accent, fontWeight: 800 }}>Se connecter</Link></div>
      )}
      {etat === 'indisponible' && (
        <div style={{ fontSize: 13.5, ...MUTED }}>Cette section sera disponible très prochainement. Rien n’est enregistré pour le moment.</div>
      )}
      {etat === 'refuse' && <div style={{ fontSize: 13.5, color: '#B42318' }}>Accès refusé à ces coordonnées ({message}).</div>}

      {etat === 'pret' && rib && !edition && (
        <div>
          {[
            { k: 'Titulaire', v: rib.titulaire },
            { k: 'IBAN', v: rib.iban_masque },
            { k: 'BIC', v: rib.bic },
          ].map(l => (
            <div key={l.k} style={{ display: 'flex', gap: 12, padding: '9px 0', borderBottom: `1px solid ${C.bordure}`, fontSize: 14 }}>
              <span style={{ minWidth: 90, fontWeight: 800, color: C.attenue, fontSize: 12.5 }}>{l.k}</span>
              <span style={{ fontWeight: 700, fontFamily: l.k === 'Titulaire' ? 'inherit' : 'ui-monospace,Menlo,monospace', letterSpacing: l.k === 'IBAN' ? '.04em' : 0 }}>{l.v}</span>
            </div>
          ))}
          {rib.updated_at && <div style={{ fontSize: 12, ...MUTED, marginTop: 8 }}>Mis à jour le {new Date(rib.updated_at).toLocaleDateString('fr-FR')}</div>}
          {envoi === 'ok' && <div style={{ fontSize: 13, color: '#15803D', fontWeight: 800, marginTop: 8 }}>Coordonnées enregistrées.</div>}
          <button style={{ ...BTN2, marginTop: 14 }} onClick={() => { setEdition(true); setEnvoi('idle') }}>Modifier mon RIB</button>
        </div>
      )}

      {etat === 'pret' && edition && (
        <div style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
          <div>
            <label style={LABEL} htmlFor="rib-tit">Titulaire du compte</label>
            <input id="rib-tit" style={CHAMP} value={titulaire} onChange={e => setTitulaire(e.target.value)} autoComplete="cc-name" />
            {tente && eTit && <div style={{ fontSize: 12.5, color: '#B42318', fontWeight: 700, marginTop: 4 }}>{eTit}</div>}
          </div>
          <div>
            <label style={LABEL} htmlFor="rib-iban">IBAN</label>
            <input id="rib-iban" style={{ ...CHAMP, fontFamily: 'ui-monospace,Menlo,monospace', letterSpacing: '.03em' }} value={formaterIban(iban)}
              onChange={e => setIban(compacterIban(e.target.value).slice(0, 34))} placeholder="FR76 …" autoComplete="off" spellCheck={false} />
            {rib && <div style={{ fontSize: 12, ...MUTED, marginTop: 4 }}>IBAN actuel : {rib.iban_masque}. Pour le changer, saisissez le nouvel IBAN en entier.</div>}
            {tente && eIban && <div style={{ fontSize: 12.5, color: '#B42318', fontWeight: 700, marginTop: 4 }}>{eIban}</div>}
          </div>
          <div>
            <label style={LABEL} htmlFor="rib-bic">BIC</label>
            <input id="rib-bic" style={{ ...CHAMP, fontFamily: 'ui-monospace,Menlo,monospace', textTransform: 'uppercase' }} value={bic}
              onChange={e => setBic(e.target.value.replace(/\s/g, '').toUpperCase().slice(0, 11))} placeholder="8 ou 11 caractères" autoComplete="off" spellCheck={false} />
            {tente && eBic && <div style={{ fontSize: 12.5, color: '#B42318', fontWeight: 700, marginTop: 4 }}>{eBic}</div>}
          </div>
          {envoi === 'error' && <div style={{ fontSize: 13, color: '#B42318', fontWeight: 700 }}>{message}</div>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button style={BTN} onClick={enregistrer} disabled={envoi === 'loading'}>{envoi === 'loading' ? 'Enregistrement…' : 'Enregistrer'}</button>
            {rib && <button style={BTN2} onClick={() => { setEdition(false); setIban(''); setTente(false) }}>Annuler</button>}
          </div>
        </div>
      )}
    </div>
  )
}
