'use client'

/**
 * Kit com partenaire — email clients, Instagram, Facebook.
 *
 * Les textes sont GENERES depuis les gabarits en base, jamais reecrits ici. La
 * formulation validee ne se reinvente pas : si un texte doit changer, il change dans
 * `comm_templates` et toutes les vues suivent.
 *
 * Une variable non resolue reste visible entre accolades et est signalee. Un texte
 * ou il manque silencieusement le lien ou le lieu partirait en clientele sans que
 * personne ne s en apercoive.
 */
import { useEffect, useMemo, useState } from 'react'
import { PageHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { useDashboard } from '@/contexts/DashboardContext'
import {
  fetchCommTemplates, fetchCommConfig, resoudreGabarit, variablesComm,
  CONTACT_PARTENAIRE, type CommTemplate, type CommConfig,
} from '@/lib/comm'

const LIBELLE: Record<string, string> = {
  email: '✉️ Email clients',
  instagram: '📸 Instagram',
  facebook: '👥 Facebook',
}

export default function Page() {
  const { partenaires } = useDashboard()
  const [tpl, setTpl] = useState<CommTemplate[]>([])
  const [cfg, setCfg] = useState<CommConfig | null>(null)
  const [charge, setCharge] = useState(true)
  const [pid, setPid] = useState('')
  const [copie, setCopie] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchCommTemplates(), fetchCommConfig()])
      .then(([t, c]) => { setTpl(t); setCfg(c) })
      .finally(() => setCharge(false))
  }, [])

  useEffect(() => {
    if (!pid && partenaires.length) setPid(partenaires[0].id)
  }, [partenaires, pid])

  const partenaire = partenaires.find(p => p.id === pid) ?? null
  const slug = pid.replace(/^pt-/, '')
  const lien = slug ? `https://flowin-events.vercel.app/parcours/nds2026?ev=ev-nds-${slug}&source=reseaux-${slug}` : null

  const vars = useMemo(
    () => variablesComm(cfg, partenaire?.nom ?? null, lien),
    [cfg, partenaire, lien]
  )

  const copier = async (cle: string, texte: string) => {
    try {
      await navigator.clipboard.writeText(texte)
      setCopie(cle)
      setTimeout(() => setCopie(null), 1600)
    } catch { /* le presse-papier peut etre refuse par le navigateur */ }
  }

  const actifs = tpl.filter(t => t.actif !== false)

  return (
    <div className="sa-page">
      <PageHeader
        title="Kit com partenaire"
        subtitle="Textes générés depuis les gabarits en base — lien et coordonnées résolus automatiquement"
        actions={
          partenaires.length ? (
            <select className="sa-input" value={pid} onChange={e => setPid(e.target.value)}>
              {partenaires.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          ) : null
        }
      />

      {charge && <div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div>}

      {!charge && !actifs.length && (
        <EmptyState icon="📣" title="Aucun gabarit actif" desc="Aucun gabarit de communication n'est activé en base." />
      )}

      {!charge && actifs.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14, fontSize: 11.5 }}>
            <span className="sa-chip">{cfg?.evenement ?? 'événement non configuré'}</span>
            {cfg?.edition && <span className="sa-chip">{cfg.edition}</span>}
            {cfg?.lieu && <span className="sa-chip">{cfg.lieu}</span>}
            <span className="sa-chip">{CONTACT_PARTENAIRE.email}</span>
            <span className="sa-chip">{CONTACT_PARTENAIRE.tel}</span>
          </div>

          {lien && (
            <div style={{ fontSize: 11, color: 'var(--sa-muted)', marginBottom: 14, wordBreak: 'break-all' }}>
              Lien du partenaire — <code>{lien}</code>
            </div>
          )}

          {actifs.map(t => {
            const objet = resoudreGabarit(t.objet, vars)
            const corps = resoudreGabarit(t.corps, vars)
            const manquantes = Array.from(new Set([...objet.manquantes, ...corps.manquantes]))
            const complet = [t.objet ? `Objet : ${objet.rendu}` : '', corps.rendu, t.hashtags ?? '']
              .filter(Boolean).join('\n\n')

            return (
              <div key={t.channel} style={{ border: '1px solid var(--sa-border)', borderRadius: 12, marginBottom: 14, overflow: 'hidden' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                  background: 'var(--sa-card)', borderBottom: '1px solid var(--sa-border)',
                }}>
                  <b style={{ fontSize: 13.5 }}>{LIBELLE[t.channel] ?? t.channel}</b>
                  {manquantes.length > 0 && (
                    <span className="sa-chip" style={{ fontSize: 10, color: '#b4791f', borderColor: '#b4791f' }}>
                      {manquantes.length} variable{manquantes.length > 1 ? 's' : ''} non résolue{manquantes.length > 1 ? 's' : ''}
                    </span>
                  )}
                  <button
                    className={`sa-btn sm${copie === t.channel ? '' : ' primary'}`}
                    style={{ marginLeft: 'auto' }}
                    onClick={() => copier(t.channel, complet)}
                  >
                    {copie === t.channel ? 'Copié' : 'Copier'}
                  </button>
                </div>

                <div style={{ padding: '14px 16px' }}>
                  {manquantes.length > 0 && (
                    <div style={{
                      marginBottom: 12, padding: '9px 11px', borderRadius: 9,
                      border: '1px solid #b4791f', background: 'rgba(244,181,68,.10)', fontSize: 11.5, lineHeight: 1.5,
                    }}>
                      Non résolu : <b>{manquantes.join(', ')}</b>. Les variables restent visibles entre accolades
                      dans le texte — à compléter avant envoi.
                    </div>
                  )}

                  {t.objet && (
                    <div style={{ fontSize: 12.5, color: 'var(--sa-muted)', marginBottom: 10, paddingBottom: 10, borderBottom: '1px dashed var(--sa-border)' }}>
                      <b>Objet</b> — {objet.rendu}
                    </div>
                  )}

                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
                    {corps.rendu}
                  </pre>

                  {t.hashtags && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--sa-border)', fontSize: 13, lineHeight: 1.5 }}>
                      {t.hashtags}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
