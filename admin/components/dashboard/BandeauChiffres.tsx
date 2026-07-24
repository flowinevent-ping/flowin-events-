'use client'

/**
 * Bandeau des chiffres publiables — source unique.
 *
 * Ce composant existe pour une raison precise : sur ce projet, les memes
 * grandeurs ont ete publiees avec trois valeurs differentes selon la vue qui
 * les calculait. Il n y a desormais qu un seul calcul, cote base
 * (`super_event_chiffres`), et un seul affichage : celui-ci.
 *
 * Il montre aussi ce qui n est PAS mesurable. Un chiffre dont on tait la marge
 * d aveuglement est un chiffre faux : l avertissement est affiche, pas masque.
 */
import { useEffect, useState } from 'react'
import { fetchChiffres, SE_DEFAUT, type Chiffres } from '@/lib/nds'

export function BandeauChiffres({
  se = SE_DEFAUT,
  compact = false,
}: {
  se?: string
  compact?: boolean
}) {
  const [c, setC] = useState<Chiffres | null>(null)
  const [charge, setCharge] = useState(true)
  const [detail, setDetail] = useState(false)

  useEffect(() => {
    setCharge(true)
    fetchChiffres(se).then(setC).finally(() => setCharge(false))
  }, [se])

  if (charge) return <div className="sa-muted" style={{ fontSize: 13 }}>Chargement des chiffres…</div>
  if (!c) return <div className="sa-muted" style={{ fontSize: 13 }}>Chiffres indisponibles.</div>

  const p = c.publiable
  const f = c.fiabilite
  const e = c.ecarts

  const carte = {
    background: 'var(--sa-card)',
    border: '1px solid var(--sa-border)',
    borderRadius: 10,
    padding: '14px 12px',
  } as const

  const legende = {
    fontSize: 9.5,
    fontWeight: 700,
    color: 'var(--sa-muted)',
    textTransform: 'uppercase',
    letterSpacing: '.04em',
    marginTop: 4,
  } as const

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11.5, color: 'var(--sa-muted)', marginBottom: 8 }}>
        <b>Chiffres publiables</b> — {c.perimetre.nom}, du {c.perimetre.date_d} au {c.perimetre.date_f}.
        Bornés à la période : ce sont les seules valeurs à reprendre sur un rapport ou un support commercial.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        <div style={carte}>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{p.flashs}</div>
          <div style={legende}>Flashs</div>
        </div>
        <div style={carte}>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{p.parties}</div>
          <div style={legende}>Parties</div>
        </div>
        <div style={carte}>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{p.joueurs}</div>
          <div style={legende}>Joueurs</div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--sa-muted)', marginTop: 8, lineHeight: 1.5 }}>
        <b>Flash</b> — {p.definition_flash}.<br />
        <b>Joueur</b> — {p.definition_joueur}.
      </div>

      {f.flashs_sans_identifiant > 0 && (
        <div
          style={{
            marginTop: 10,
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #b4791f',
            background: 'rgba(244,181,68,.10)',
            fontSize: 11.5,
            lineHeight: 1.5,
          }}
        >
          <b>Ce qui n&apos;est pas mesurable</b> — {f.flashs_sans_identifiant} flashs sur {p.flashs}{' '}
          ({f.pct_flashs_aveugles} %) ont été enregistrés sans identifiant de visiteur. Le dédoublonnage y est
          impossible. Les <b>{f.visiteurs_uniques_mesures} visiteurs uniques</b> ne portent donc que sur la
          période à partir du {f.premier_jour_fiable}. Ne jamais présenter ce nombre comme le total du festival.
        </div>
      )}

      {!compact && (
        <>
          <button
            type="button"
            onClick={() => setDetail(d => !d)}
            style={{
              marginTop: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              background: 'transparent', border: '1px solid var(--sa-border)',
              borderRadius: 8, padding: '5px 10px', color: 'var(--sa-muted)',
            }}
          >
            {detail ? 'Masquer' : 'Pourquoi d’autres chiffres circulent'}
          </button>

          {detail && (
            <div style={{ marginTop: 8, fontSize: 11.5, lineHeight: 1.6, color: 'var(--sa-muted)' }}>
              <div>
                <b>{p.parties + e.parties_hors_bornes} parties</b> et{' '}
                <b>{p.joueurs + e.joueurs_hors_bornes} joueurs</b> apparaissent si l&apos;on ne borne pas aux dates
                du super event : {e.parties_hors_bornes} parties et {e.joueurs_hors_bornes} joueurs sont hors période
                (tests avant ouverture, jeu résiduel après clôture). Ces valeurs ne se publient pas.
              </div>
              <div style={{ marginTop: 6 }}>
                <b>{e.joueurs_rattaches_sans_partie} joueur</b> est rattaché au super event sans participation
                enregistrée — d&apos;où l&apos;écart d&apos;une unité entre l&apos;écran Participants et le comptage par parties.
              </div>
              <div style={{ marginTop: 6, color: '#c46a6a' }}>
                <b>À ne jamais publier</b> — {e.piege_lignes_visites}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
