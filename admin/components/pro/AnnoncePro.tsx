'use client'

/**
 * ANNONCE À MES CONTACTS (18/11/2026) — espace pro, Mes contacts & stats.
 * Carrousel court : 1. le message, 2. lien et date de fin (facultatifs), 3. aperçu et envoi.
 * Envoi = notification dans l'application (profil /moi, onglet Alertes) des seuls participants
 * qui ont accepté « rester en contact avec ce commerce ». Aucun e-mail, aucun SMS.
 * SQL non appliqué -> « Bientôt disponible : activation en cours », sans erreur.
 * Démo (?demo=1) : nombre fictif, rien n'est envoyé.
 */
import { useEffect, useState } from 'react'
import Carrousel from '@/components/pro/Carrousel'
import { CHARTE_PRO as C } from '@/lib/charte'
import { CARD, MUTED, CHAMP, LABEL, BTN, BTN2 } from '@/lib/proui'
import { estDemo } from '@/lib/demo'
import {
  chargerEtatAnnonce, envoyerAnnonce, lienValide,
  ANNONCE_TITRE_MAX, ANNONCE_MESSAGE_MAX, ANNONCES_PAR_SEMAINE, type EtatAnnonce,
} from '@/lib/annoncesPro'

const DEMO_N = 128

export default function AnnoncePro({ proId, proNom, liens }: { proId: string; proNom: string; liens: { nom: string; url: string }[] }) {
  const [ouvert, setOuvert] = useState(false)
  const [i, setI] = useState(0)
  const [etat, setEtat] = useState<EtatAnnonce | null>(null)
  const [indispo, setIndispo] = useState(false)
  const [demo, setDemo] = useState(false)
  const [f, setF] = useState({ titre: '', message: '', lien: '', dateFin: '' })
  const [envoi, setEnvoi] = useState(false)
  const [fini, setFini] = useState<number | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    const d = estDemo()
    setDemo(d)
    if (d) { setEtat({ destinataires: DEMO_N, restantes: ANNONCES_PAR_SEMAINE }); return }
    if (!proId) { setIndispo(true); return }
    chargerEtatAnnonce(proId).then(r => { setEtat(r.etat); setIndispo(r.indisponible || !r.etat) }).catch(() => setIndispo(true))
  }, [proId])

  const maj = (p: Partial<typeof f>) => { setF({ ...f, ...p }); setErr('') }
  const n = etat?.destinataires ?? 0
  const bloque = !f.titre.trim() ? 'Ajoutez un titre.' : !f.message.trim() ? 'Ajoutez un message.' : !lienValide(f.lien) && !demo ? 'Lien : https://… ou une de vos animations.' : null

  const envoyer = async () => {
    if (bloque) { setErr(bloque); return }
    if (!n) { setErr('Aucun contact n’a accepté vos messages pour l’instant.'); return }
    if (demo) { setFini(n); return }
    setEnvoi(true)
    const r = await envoyerAnnonce(proId, f)
    setEnvoi(false)
    if (r.indisponible) { setIndispo(true); return }
    if (!r.ok) { setErr(r.erreur || 'Envoi impossible.'); return }
    setFini(r.n)
    setEtat(etat ? { destinataires: etat.destinataires, restantes: Math.max(0, etat.restantes - 1) } : etat)
  }

  const entete = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 16, fontWeight: 900 }}>Annonce à mes contacts</div>
        <div style={{ fontSize: 13, ...MUTED }}>
          {indispo ? 'Bientôt disponible : activation en cours' : etat ? `${n} contact${n > 1 ? 's' : ''} ont accepté vos messages. Dans l’application, jamais par e-mail.` : '…'}
        </div>
      </div>
      {!indispo && etat && !ouvert && (
        <button type="button" data-annonce-ouvrir onClick={() => { setOuvert(true); setI(0); setFini(null) }}
          disabled={etat.restantes <= 0}
          style={{ ...BTN, padding: '0 20px', minHeight: 44, fontSize: 14, opacity: etat.restantes <= 0 ? 0.5 : 1 }}>
          {etat.restantes <= 0 ? 'Limite de la semaine atteinte' : 'Nouvelle annonce'}
        </button>
      )}
    </div>
  )

  if (!ouvert || indispo || !etat) return <div data-annonce-pro data-indispo={indispo ? '1' : '0'} style={{ ...CARD, marginBottom: 14 }}>{entete}</div>

  if (fini !== null) {
    return (
      <div data-annonce-pro data-annonce-fini style={{ ...CARD, marginBottom: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: C.ok }}>Annonce envoyée</div>
        <div style={{ fontSize: 14, margin: '6px 0 14px' }}>{fini} contact{fini > 1 ? 's' : ''} la verront dans leur profil.{demo ? ' (Démo : rien n’est envoyé.)' : ''}</div>
        <button type="button" style={{ ...BTN2, minHeight: 44 }} onClick={() => { setOuvert(false); setF({ titre: '', message: '', lien: '', dateFin: '' }) }}>Fermer</button>
      </div>
    )
  }

  const compteur = (v: string, max: number) => <span style={{ float: 'right', fontWeight: 700, color: v.length > max ? C.ko : C.attenue }}>{v.length}/{max}</span>

  const ecrans = [
    { cle: 'message', contenu: (
      <div style={{ display: 'grid', gap: 12 }}>
        <label><span style={LABEL}>Titre {compteur(f.titre, ANNONCE_TITRE_MAX)}</span>
          <input data-annonce-titre value={f.titre} maxLength={ANNONCE_TITRE_MAX} onChange={e => maj({ titre: e.target.value })} style={CHAMP} placeholder="Nouveau jeu ce week-end" /></label>
        <label><span style={LABEL}>Message {compteur(f.message, ANNONCE_MESSAGE_MAX)}</span>
          <textarea data-annonce-message value={f.message} maxLength={ANNONCE_MESSAGE_MAX} rows={4} onChange={e => maj({ message: e.target.value })} style={{ ...CHAMP, resize: 'none' }} placeholder="Venez jouer et tenter de gagner un lot." /></label>
      </div>
    ) },
    { cle: 'options', contenu: (
      <div style={{ display: 'grid', gap: 12 }}>
        <label><span style={LABEL}>Lien vers mon animation (facultatif)</span>
          {liens.length > 0
            ? <select data-annonce-lien value={f.lien} onChange={e => maj({ lien: e.target.value })} style={CHAMP}>
                <option value="">Sans lien</option>
                {liens.map(l => <option key={l.url} value={l.url}>{l.nom}</option>)}
              </select>
            : <input data-annonce-lien value={f.lien} onChange={e => maj({ lien: e.target.value })} style={CHAMP} placeholder="https://…" />}
        </label>
        <label><span style={LABEL}>Visible jusqu’au (facultatif)</span>
          <input data-annonce-fin type="date" value={f.dateFin} min={new Date().toISOString().slice(0, 10)} onChange={e => maj({ dateFin: e.target.value })} style={CHAMP} /></label>
      </div>
    ) },
    { cle: 'apercu', contenu: (
      <div>
        <div style={{ ...LABEL, marginBottom: 8 }}>Aperçu dans le profil du participant</div>
        <div data-annonce-apercu style={{ background: '#fff', border: `1px solid ${C.bordure}`, borderRadius: 14, padding: 14, maxWidth: 380 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.bleu }}>{proNom || 'Mon établissement'}</div>
          <div style={{ fontSize: 15, fontWeight: 800, margin: '2px 0' }}>{f.titre || 'Titre'}</div>
          <div style={{ fontSize: 13.5, color: '#5a6071', whiteSpace: 'pre-wrap' }}>{f.message || 'Message'}</div>
          {f.lien && lienValide(f.lien) && <div style={{ fontSize: 13, fontWeight: 800, color: C.bleu, marginTop: 6 }}>Voir l’animation</div>}
          {f.dateFin && <div style={{ fontSize: 12, color: '#5a6071', marginTop: 4 }}>Jusqu’au {new Date(f.dateFin + 'T12:00:00').toLocaleDateString('fr-FR')}</div>}
        </div>
        <div style={{ fontSize: 12.5, ...MUTED, marginTop: 8 }}>{ANNONCES_PAR_SEMAINE} annonces par semaine au plus. Reste : {etat.restantes}.</div>
      </div>
    ) },
  ]

  return (
    <div data-annonce-pro style={{ ...CARD, marginBottom: 14 }}>
      {entete}
      <div style={{ marginTop: 12 }}>
        <Carrousel nom="Annonce" ecrans={ecrans} i={i} setI={setI} dernier={
          <button type="button" data-annonce-envoyer onClick={envoyer} disabled={envoi} style={{ ...BTN, opacity: bloque || !n ? 0.55 : 1 }}>
            {envoi ? 'Envoi…' : `Envoyer à ${n} contact${n > 1 ? 's' : ''}`}
          </button>
        } />
      </div>
      {err && <div data-annonce-erreur style={{ fontSize: 13, color: C.ko, marginTop: 8, fontWeight: 700 }}>{err}</div>}
      <button type="button" onClick={() => setOuvert(false)} style={{ background: 'none', border: 'none', color: C.attenue, fontSize: 13, marginTop: 6, cursor: 'pointer', minHeight: 44 }}>Annuler</button>
    </div>
  )
}
