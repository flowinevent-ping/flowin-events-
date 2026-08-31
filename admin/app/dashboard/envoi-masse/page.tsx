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
import { useMemo, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader, SectionHeader, EmptyState } from '@/components/dashboard/DashboardUI'

const TAILLE_LOT = 40

export default function Page() {
  const { joueurs } = useDashboard()
  const [objet, setObjet] = useState('')
  const [message, setMessage] = useState('')
  const [filtreOptin, setFiltreOptin] = useState(true)
  const [q, setQ] = useState('')

  const destinataires = useMemo(() => {
    let l = joueurs.filter(j => !!j.email)
    if (filtreOptin) l = l.filter(j => j.optin === true)
    if (q.trim()) {
      const t = q.trim().toLowerCase()
      l = l.filter(j => [j.prenom, j.nom, j.ville, j.code_postal].some(v => String(v ?? '').toLowerCase().includes(t)))
    }
    return l
  }, [joueurs, filtreOptin, q])

  const lots = useMemo(() => {
    const out: string[][] = []
    for (let i = 0; i < destinataires.length; i += TAILLE_LOT) {
      out.push(destinataires.slice(i, i + TAILLE_LOT).map(j => j.email))
    }
    return out
  }, [destinataires])

  function lienGmailLot(bccList: string[]): string {
    return `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(bccList.join(','))}&su=${encodeURIComponent(objet)}&body=${encodeURIComponent(message)}`
  }

  function exporterCsv() {
    const lignes = [
      ['prenom', 'nom', 'email', 'ville', 'code_postal', 'optin'],
      ...destinataires.map(j => [j.prenom ?? '', j.nom ?? '', j.email, j.ville ?? '', j.code_postal ?? '', j.optin ? 'oui' : 'non']),
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

  const pret = objet.trim() && message.trim() && destinataires.length > 0

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader
          title="📣 Envoi en masse"
          subtitle="Message à plusieurs joueurs à la fois — même mécanisme Gmail que les envois unitaires, par lots"
        />
        <div style={{ padding: '0 24px 24px' }}>

          <div className="sa-card" style={{ padding: 18, marginBottom: 16 }}>
            <SectionHeader>✉️ Message</SectionHeader>
            <div className="sa-field">
              <label className="sa-label">Objet</label>
              <input className="sa-input" value={objet} onChange={e => setObjet(e.target.value)} placeholder="Merci d'avoir joué aux Nuits du Sud 2026 !" style={{ width: '100%' }} />
            </div>
            <div className="sa-field" style={{ marginTop: 10 }}>
              <label className="sa-label">Message</label>
              <textarea className="sa-input" value={message} onChange={e => setMessage(e.target.value)} rows={6} style={{ width: '100%' }} placeholder="Bonjour, merci d'avoir joué..." />
              <div className="sa-muted" style={{ fontSize: 11, marginTop: 4 }}>Même texte pour tout le monde (les destinataires sont en copie cachée — BCC — ils ne se voient pas entre eux).</div>
            </div>
          </div>

          <div className="sa-card" style={{ padding: 18, marginBottom: 16 }}>
            <SectionHeader>👥 Destinataires ({destinataires.length})</SectionHeader>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
              <input className="sa-input" placeholder="Rechercher un nom, une ville…" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 280 }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                <input type="checkbox" checked={filtreOptin} onChange={e => setFiltreOptin(e.target.checked)} />
                Opt-in uniquement
              </label>
              <button className="sa-btn sm" style={{ marginLeft: 'auto' }} onClick={exporterCsv} disabled={!destinataires.length}>⬇ Export CSV</button>
            </div>

            {destinataires.length === 0 && <EmptyState title="Aucun destinataire" desc="Vérifie le filtre opt-in ou la recherche." />}

            {destinataires.length > 0 && (
              <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--sa-border)', borderRadius: 10 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ position: 'sticky', top: 0, background: 'var(--sa-card)' }}>
                      <th style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10.5, color: 'var(--sa-muted)', textTransform: 'uppercase' }}>Nom</th>
                      <th style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10.5, color: 'var(--sa-muted)', textTransform: 'uppercase' }}>Email</th>
                      <th style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10.5, color: 'var(--sa-muted)', textTransform: 'uppercase' }}>Ville</th>
                    </tr>
                  </thead>
                  <tbody>
                    {destinataires.slice(0, 200).map(j => (
                      <tr key={j.id} style={{ borderTop: '1px solid var(--sa-border)' }}>
                        <td style={{ padding: '6px 10px' }}>{[j.prenom, j.nom].filter(Boolean).join(' ') || '—'}</td>
                        <td style={{ padding: '6px 10px' }}>{j.email}</td>
                        <td style={{ padding: '6px 10px' }}>{j.ville ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {destinataires.length > 200 && (
                  <div className="sa-muted" style={{ fontSize: 11, padding: '8px 10px' }}>… et {destinataires.length - 200} de plus (export CSV pour la liste complète).</div>
                )}
              </div>
            )}
          </div>

          <div className="sa-card" style={{ padding: 18 }}>
            <SectionHeader>🚀 Envoyer — {lots.length} lot{lots.length > 1 ? 's' : ''} de {TAILLE_LOT} maximum</SectionHeader>
            {!pret && <div className="sa-muted" style={{ fontSize: 12.5 }}>Renseigne l&apos;objet, le message, et au moins un destinataire.</div>}
            {pret && (
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
          </div>

        </div>
      </div>
    </div>
  )
}
