'use client'

/**
 * Documents legaux — CGV, mentions, confidentialite.
 *
 * Regle portee par la vue : un document n est OPPOSABLE que si son statut vaut
 * 'valide'. Tant qu il est en brouillon, il est affiche comme tel, sans ambiguite.
 * Aucun document n est presente comme en vigueur sur la seule foi de sa presence.
 */
import { useEffect, useState } from 'react'
import { PageHeader, SectionHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { fetchDocumentsLegaux, majDocumentLegal, type DocumentLegal } from '@/lib/administratif'

const estValide = (d: DocumentLegal) => (d.statut ?? '').toLowerCase().startsWith('valid')

export default function Page() {
  const [docs, setDocs] = useState<DocumentLegal[]>([])
  const [charge, setCharge] = useState(true)
  const [ouvert, setOuvert] = useState<string | null>(null)
  const [brouillon, setBrouillon] = useState('')
  const [enregistre, setEnregistre] = useState(false)

  const recharger = () => {
    setCharge(true)
    fetchDocumentsLegaux().then(setDocs).finally(() => setCharge(false))
  }
  useEffect(recharger, [])

  const doc = docs.find(d => d.id === ouvert) ?? null

  const ouvrir = (d: DocumentLegal) => {
    setOuvert(d.id)
    setBrouillon(d.contenu ?? '')
  }

  const enregistrer = async () => {
    if (!doc) return
    setEnregistre(true)
    const ok = await majDocumentLegal(doc.id, { contenu: brouillon })
    setEnregistre(false)
    if (ok) recharger()
  }

  return (
    <div className="sa-page">
      <PageHeader
        title="CGV & documents légaux"
        subtitle={`${docs.length} document${docs.length > 1 ? 's' : ''}`}
      />

      {charge && <div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div>}

      {!charge && !docs.length && (
        <EmptyState icon="📄" title="Aucun document" desc="Aucun document légal n'est enregistré." />
      )}

      {!charge && docs.length > 0 && (
        <>
          <SectionHeader>📄 Documents</SectionHeader>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 10, marginBottom: 20 }}>
            {docs.map(d => (
              <button
                key={d.id}
                type="button"
                onClick={() => ouvrir(d)}
                style={{
                  textAlign: 'left', cursor: 'pointer',
                  background: 'var(--sa-card)',
                  border: `1px solid ${ouvert === d.id ? 'var(--sa-accent, #f4b544)' : 'var(--sa-border)'}`,
                  borderRadius: 10, padding: 12,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{d.titre ?? d.id}</div>
                <div className="sa-muted" style={{ fontSize: 11, marginBottom: 7 }}>
                  {d.type ?? '—'}{d.version ? ` · version ${d.version}` : ''}
                </div>
                <span
                  className="sa-chip"
                  style={{
                    fontSize: 10, fontWeight: 700,
                    color: estValide(d) ? '#2f7d4f' : '#b4791f',
                    borderColor: estValide(d) ? '#2f7d4f' : '#b4791f',
                  }}
                >
                  {estValide(d) ? 'Validé — opposable' : 'Brouillon — non opposable'}
                </span>
                {d.updated_at && (
                  <div className="sa-muted" style={{ fontSize: 10, marginTop: 6 }}>
                    modifié le {new Date(d.updated_at).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </button>
            ))}
          </div>

          {doc && (
            <>
              <SectionHeader>✏️ {doc.titre ?? doc.id}</SectionHeader>

              {!estValide(doc) && (
                <div style={{
                  marginBottom: 10, padding: '10px 12px', borderRadius: 10,
                  border: '1px solid #b4791f', background: 'rgba(244,181,68,.10)',
                  fontSize: 11.5, lineHeight: 1.5,
                }}>
                  Ce document est en <b>brouillon</b>. Il ne peut pas être présenté comme en vigueur
                  tant qu&apos;il n&apos;a pas été validé juridiquement et son statut passé à « validé ».
                </div>
              )}

              <textarea
                className="sa-input"
                value={brouillon}
                onChange={e => setBrouillon(e.target.value)}
                spellCheck={false}
                style={{ width: '100%', minHeight: 340, fontFamily: 'ui-monospace, monospace', fontSize: 12, lineHeight: 1.55 }}
              />

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                <button className="sa-btn primary" onClick={enregistrer} disabled={enregistre}>
                  {enregistre ? 'Enregistrement…' : 'Enregistrer le contenu'}
                </button>
                <button className="sa-btn" onClick={() => setBrouillon(doc.contenu ?? '')}>
                  Annuler les modifications
                </button>
                <span className="sa-muted" style={{ fontSize: 11 }}>
                  {brouillon.length} caractères
                </span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
