'use client'

/**
 * Module d'envoi en masse — 31/08/2026, corrigé le même jour.
 *
 * Distinct des envois UNITAIRES déjà fonctionnels en production (devis, factures,
 * listes gagnants, billets — liens Gmail pré-remplis, un par un, cf. PartenaireDrawer/
 * CRM Landing/CRM Retours/BtoB Prospects).
 *
 * CORRECTION APRÈS RETOUR DE ROMAIN : la première version bloquait l'envoi en attendant
 * un domaine Resend vérifié. Erreur — le mécanisme qui marche déjà (liens Gmail
 * pré-remplis, exactement le même que pour les partenaires/gagnants) n'a pas besoin de
 * Resend du tout. Corrigé : génère des liens Gmail par lots (BCC, ~40 destinataires par
 * lien pour rester dans une longueur d'URL raisonnable) au lieu d'un bouton bloqué.
 * Même mécanisme, même geste (ouvrir un lien Gmail pré-rempli, cliquer Envoyer côté
 * Gmail), juste appliqué à plusieurs personnes par lien au lieu d'une seule.
 */
import { useEffect, useMemo, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader, SectionHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { fetchGagnants, type GagnantRow } from '@/lib/dashboard'

const TAILLE_LOT = 40

/* Meme etat a 3 valeurs que app/dashboard/gagnants/page.tsx -- ne pas
   reinventer un autre vocabulaire (Romain, 19/09 : « il faut le complet
   comme les autres », donc les memes filtres/etats que la liste des
   gagnants, pas une variante). */
type EtatGagnant = 'a_confirmer' | 'confirme' | 'retire'
function etatDe(t: GagnantRow): EtatGagnant {
  if (t.retire_at) return 'retire'
  if (t.notifie_at) return 'confirme'
  return 'a_confirmer'
}

/* Normalise un numero FR pour un lien wa.me (E.164 sans le "+") :
   "06 12 34 56 78" -> "33612345678". Best-effort, jamais bloquant : un
   numero deja international ou mal forme part tel quel. */
function telWhatsApp(tel: string): string {
  const digits = tel.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits.slice(1)
  if (digits.startsWith('0')) return '33' + digits.slice(1)
  return digits
}

export default function Page() {
  const { joueurs } = useDashboard()
  const [canal, setCanal] = useState<'email' | 'whatsapp'>('email')
  const [waReferent, setWaReferent] = useState('')
  const [objet, setObjet] = useState('')
  const [message, setMessage] = useState('')
  const [filtreOptin, setFiltreOptin] = useState(true)
  const [source, setSource] = useState('')
  const [statutGagnant, setStatutGagnant] = useState<'' | 'gagnant' | 'a_confirmer' | 'confirme' | 'retire'>('')
  const [q, setQ] = useState('')
  const [gagnants, setGagnants] = useState<GagnantRow[]>([])

  useEffect(() => { fetchGagnants().then(setGagnants) }, [])

  const etatsParJoueur = useMemo(() => {
    const m: Record<string, Set<EtatGagnant>> = {}
    gagnants.forEach(g => { if (g.joueur_id) (m[g.joueur_id] ??= new Set()).add(etatDe(g)) })
    return m
  }, [gagnants])

  const sources = useMemo(() => {
    const vus = new Set<string>()
    joueurs.forEach(j => { if (j.source) vus.add(j.source) })
    return Array.from(vus).sort((a, b) => a.localeCompare(b, 'fr'))
  }, [joueurs])

  const destinataires = useMemo(() => {
    let l = joueurs.filter(j => canal === 'whatsapp' ? !!j.tel : !!j.email)
    if (filtreOptin) l = l.filter(j => j.optin === true)
    if (source) l = l.filter(j => j.source === source)
    if (statutGagnant === 'gagnant') l = l.filter(j => (etatsParJoueur[j.id]?.size ?? 0) > 0)
    else if (statutGagnant) l = l.filter(j => etatsParJoueur[j.id]?.has(statutGagnant))
    if (q.trim()) {
      const t = q.trim().toLowerCase()
      l = l.filter(j => [j.prenom, j.nom, j.ville, j.code_postal].some(v => String(v ?? '').toLowerCase().includes(t)))
    }
    return l
  }, [joueurs, filtreOptin, source, statutGagnant, etatsParJoueur, q, canal])

  const lots = useMemo(() => {
    if (canal !== 'email') return []
    const out: string[][] = []
    for (let i = 0; i < destinataires.length; i += TAILLE_LOT) {
      out.push(destinataires.slice(i, i + TAILLE_LOT).map(j => j.email))
    }
    return out
  }, [destinataires, canal])

  function lienGmailLot(bccList: string[]): string {
    return `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(bccList.join(','))}&su=${encodeURIComponent(objet)}&body=${encodeURIComponent(message)}`
  }

  function lienWhatsApp(tel: string): string {
    return `https://wa.me/${telWhatsApp(tel)}?text=${encodeURIComponent(message)}`
  }

  function exporterCsv() {
    const lignes = [
      ['prenom', 'nom', 'email', 'tel', 'ville', 'code_postal', 'optin'],
      ...destinataires.map(j => [j.prenom ?? '', j.nom ?? '', j.email, j.tel ?? '', j.ville ?? '', j.code_postal ?? '', j.optin ? 'oui' : 'non']),
    ]
    const csv = lignes.map(l => l.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `destinataires-envoi-masse-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const pret = (canal === 'whatsapp' || objet.trim()) && message.trim() && destinataires.length > 0

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader
          title="Envoi en masse"
          subtitle="Message à plusieurs joueurs à la fois — même mécanisme Gmail que les envois unitaires, par lots"
        />
        <div style={{ padding: '0 24px 24px' }}>

          <div className="sa-card" style={{ padding: 18, marginBottom: 16 }}>
            <SectionHeader>Message</SectionHeader>
            <div className="sa-field" style={{ marginBottom: 12 }}>
              <label className="sa-label">Canal d&apos;envoi</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className={`sa-btn sm${canal === 'email' ? ' primary' : ''}`} onClick={() => setCanal('email')}>✉️ Email</button>
                <button type="button" className={`sa-btn sm${canal === 'whatsapp' ? ' primary' : ''}`} onClick={() => setCanal('whatsapp')}>💬 WhatsApp</button>
              </div>
            </div>
            {canal === 'whatsapp' && (
              <div className="sa-field" style={{ marginBottom: 12 }}>
                <label className="sa-label">Numéro WhatsApp référent (celui utilisé pour cet envoi)</label>
                <input className="sa-input" value={waReferent} onChange={e => setWaReferent(e.target.value)} placeholder="06 16 35 49 36" style={{ maxWidth: 280 }} />
                <div className="sa-muted" style={{ fontSize: 11, marginTop: 4 }}>Pour ton suivi seulement — WhatsApp n&apos;a pas d&apos;envoi groupé, chaque lien ouvre une conversation individuelle depuis le numéro connecté sur cet appareil.</div>
              </div>
            )}
            {canal === 'email' && (
              <div className="sa-field">
                <label className="sa-label">Objet</label>
                <input className="sa-input" value={objet} onChange={e => setObjet(e.target.value)} placeholder="Merci d'avoir joué aux Nuits du Sud 2026 !" style={{ width: '100%' }} />
              </div>
            )}
            <div className="sa-field" style={{ marginTop: 10 }}>
              <label className="sa-label">Message</label>
              <textarea className="sa-input" value={message} onChange={e => setMessage(e.target.value)} rows={6} style={{ width: '100%' }} placeholder="Bonjour, merci d'avoir joué..." />
              <div className="sa-muted" style={{ fontSize: 11, marginTop: 4 }}>
                {canal === 'email'
                  ? 'Même texte pour tout le monde (les destinataires sont en copie cachée — BCC — ils ne se voient pas entre eux).'
                  : 'Même texte pré-rempli pour chaque conversation WhatsApp ouverte.'}
              </div>
            </div>
          </div>

          <div className="sa-card" style={{ padding: 18, marginBottom: 16 }}>
            <SectionHeader>Destinataires ({destinataires.length})</SectionHeader>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
              <input className="sa-input" placeholder="Rechercher un nom, une ville…" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 280 }} />
              {sources.length > 1 && (
                <select className="sa-input" value={source} onChange={e => setSource(e.target.value)} style={{ maxWidth: 200 }}>
                  <option value="">Toutes les sources</option>
                  {sources.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                <input type="checkbox" checked={filtreOptin} onChange={e => setFiltreOptin(e.target.checked)} />
                Opt-in uniquement
              </label>
              <button className="sa-btn sm" style={{ marginLeft: 'auto' }} onClick={exporterCsv} disabled={!destinataires.length}>⬇ Export CSV</button>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--sa-muted)' }}>Statut gagnant</span>
              {([['', 'Tous'], ['gagnant', '🏆 Gagnants'], ['a_confirmer', '⏳ Lot en attente'], ['confirme', '📞 Confirmé'], ['retire', '✅ Lot utilisé']] as const).map(([val, lib]) => (
                <button key={val} type="button" className={`sa-btn sm${statutGagnant === val ? ' primary' : ''}`} onClick={() => setStatutGagnant(val)}>{lib}</button>
              ))}
            </div>

            {destinataires.length === 0 && <EmptyState title="Aucun destinataire" desc="Vérifie le filtre opt-in ou la recherche." />}

            {destinataires.length > 0 && (
              <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--sa-border)', borderRadius: 10 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ position: 'sticky', top: 0, background: 'var(--sa-card)' }}>
                      <th style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10.5, color: 'var(--sa-muted)', textTransform: 'uppercase' }}>Nom</th>
                      <th style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10.5, color: 'var(--sa-muted)', textTransform: 'uppercase' }}>{canal === 'whatsapp' ? 'Téléphone' : 'Email'}</th>
                      <th style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10.5, color: 'var(--sa-muted)', textTransform: 'uppercase' }}>Code postal</th>
                      <th style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10.5, color: 'var(--sa-muted)', textTransform: 'uppercase' }}>Ville</th>
                      <th style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10.5, color: 'var(--sa-muted)', textTransform: 'uppercase' }}>Source</th>
                      <th style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10.5, color: 'var(--sa-muted)', textTransform: 'uppercase' }}>Lot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {destinataires.slice(0, 200).map(j => {
                      const etats = etatsParJoueur[j.id]
                      const lib = etats?.has('retire') ? '✅ Utilisé' : etats?.has('confirme') ? '📞 Confirmé' : etats?.has('a_confirmer') ? '⏳ En attente' : '—'
                      return (
                        <tr key={j.id} style={{ borderTop: '1px solid var(--sa-border)' }}>
                          <td style={{ padding: '6px 10px' }}>{[j.prenom, j.nom].filter(Boolean).join(' ') || '—'}</td>
                          <td style={{ padding: '6px 10px' }}>{canal === 'whatsapp' ? (j.tel ?? '—') : j.email}</td>
                          <td style={{ padding: '6px 10px' }}>{j.code_postal ?? '—'}</td>
                          <td style={{ padding: '6px 10px' }}>{j.ville ?? '—'}</td>
                          <td style={{ padding: '6px 10px' }}><code className="sa-code">{j.source ?? '—'}</code></td>
                          <td style={{ padding: '6px 10px', fontSize: 11.5 }}>{lib}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {destinataires.length > 200 && (
                  <div className="sa-muted" style={{ fontSize: 11, padding: '8px 10px' }}>… et {destinataires.length - 200} de plus (export CSV pour la liste complète).</div>
                )}
              </div>
            )}
          </div>

          <div className="sa-card" style={{ padding: 18 }}>
            <SectionHeader>
              {canal === 'email'
                ? `Envoyer — ${lots.length} lot${lots.length > 1 ? 's' : ''} de ${TAILLE_LOT} maximum`
                : `Envoyer — ${destinataires.length} conversation${destinataires.length > 1 ? 's' : ''} WhatsApp`}
            </SectionHeader>
            {!pret && <div className="sa-muted" style={{ fontSize: 12.5 }}>Renseigne {canal === 'email' ? "l'objet, " : ''}le message, et au moins un destinataire.</div>}
            {pret && canal === 'email' && (
              <>
                <div className="sa-muted" style={{ fontSize: 12, marginBottom: 12 }}>
                  Un lien par lot, exactement le même geste que pour les envois partenaires/gagnants : ouvre Gmail pré-rempli, vérifie, clique Envoyer. Ferme puis passe au lot suivant.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {lots.map((bcc, i) => (
                    <a
                      key={i}
                      href={lienGmailLot(bcc)}
                      target="_blank" rel="noreferrer"
                      className="sa-btn primary"
                      style={{ textDecoration: 'none', justifyContent: 'space-between', display: 'flex' }}
                    >
                      <span>✉️ Lot {i + 1} / {lots.length} — ouvrir dans Gmail</span>
                      <span style={{ opacity: 0.85 }}>{bcc.length} destinataire{bcc.length > 1 ? 's' : ''}</span>
                    </a>
                  ))}
                </div>
              </>
            )}
            {pret && canal === 'whatsapp' && (
              <>
                <div className="sa-muted" style={{ fontSize: 12, marginBottom: 12 }}>
                  WhatsApp n&apos;a pas de copie cachée : un lien par personne, ouvre une conversation pré-remplie{waReferent ? ` depuis ${waReferent}` : ''}. Vérifie, clique Envoyer, reviens ici pour le suivant.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
                  {destinataires.slice(0, 200).map(j => (
                    <a
                      key={j.id}
                      href={lienWhatsApp(j.tel!)}
                      target="_blank" rel="noreferrer"
                      className="sa-btn sm"
                      style={{ textDecoration: 'none', justifyContent: 'space-between', display: 'flex' }}
                    >
                      <span>💬 {[j.prenom, j.nom].filter(Boolean).join(' ') || j.tel}</span>
                      <span style={{ opacity: 0.7 }}>{j.tel}</span>
                    </a>
                  ))}
                </div>
                {destinataires.length > 200 && (
                  <div className="sa-muted" style={{ fontSize: 11, marginTop: 8 }}>… et {destinataires.length - 200} de plus (affine la recherche pour les voir).</div>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
