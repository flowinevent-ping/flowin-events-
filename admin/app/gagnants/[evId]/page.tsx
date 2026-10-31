import type { Metadata } from 'next'
import { supabasePublic } from '@/lib/supabase'

/**
 * LISTE PUBLIQUE DES GAGNANTS (lot QR, 31/10).
 *
 * Diffusee automatiquement selon le choix du pro (events.cfg.publierGagnants).
 * Toute la lecture passe par la RPC security definer liste_gagnants_publique
 * (sql/2026-11-01-tirage-auto-liste-gagnants.sql) : elle ne renvoie RIEN si
 * l option n est pas active, et seulement prenom + initiale du nom, lot, date
 * et commerce -- jamais email, telephone ni nom complet.
 */

export const revalidate = 60

interface Props { params: { evId: string } }

interface Gagnant { nom: string; lot: string | null; date: string | null }
interface Liste { publie: boolean; event_nom?: string | null; commerce?: string | null; gagnants?: Gagnant[] }

export const metadata: Metadata = { title: 'Liste des gagnants', robots: { index: false } }

async function charger(evId: string): Promise<Liste | null> {
  const { data, error } = await supabasePublic.rpc('liste_gagnants_publique', { p_event_id: evId })
  if (error || !data) return null
  return data as Liste
}

const fond = 'linear-gradient(180deg,#6e2785 0%,#3a1450 55%,#160820 100%)'

function Cadre({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', background: fond, color: '#fff', fontFamily: 'Manrope, system-ui, sans-serif', padding: '32px 16px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>{children}</div>
    </div>
  )
}

export default async function Page({ params }: Props) {
  const l = await charger(params.evId)
  if (!l || !l.publie) {
    return (
      <Cadre>
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 20, fontWeight: 900 }}>Liste des gagnants indisponible</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,.65)', marginTop: 8, lineHeight: 1.5 }}>
            L’organisateur n’a pas publié la liste des gagnants de cette animation.
          </div>
        </div>
      </Cadre>
    )
  }
  const gagnants = l.gagnants ?? []
  const jour = (d: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }) : '')
  return (
    <Cadre>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 99, padding: '5px 14px' }}>Liste des gagnants</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: '14px 0 4px' }}>{l.event_nom || 'Animation'}</h1>
        {l.commerce && <div style={{ fontSize: 14, color: 'rgba(255,255,255,.65)' }}>{l.commerce}</div>}
      </div>
      {gagnants.length === 0 ? (
        <div style={{ textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,.7)', background: 'rgba(255,255,255,.06)', borderRadius: 16, padding: 20 }}>
          Le tirage n’a pas encore eu lieu. Revenez après la date du tirage.
        </div>
      ) : (
        <div style={{ background: '#faf7fd', color: '#1a1226', borderRadius: 18, padding: '6px 16px', boxShadow: '0 16px 40px rgba(0,0,0,.3)' }}>
          {gagnants.map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i ? '1px solid rgba(26,18,38,.08)' : 'none' }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#7C2D92,#E0218A)', color: '#fff', fontWeight: 800, fontSize: 13 }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{g.nom}</div>
                <div style={{ fontSize: 13, color: '#52455e' }}>{g.lot || 'Lot'}</div>
              </div>
              <div style={{ fontSize: 12, color: '#7a6e85', textAlign: 'right' }}>{jour(g.date)}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 22 }}>
        Tirage au sort réalisé par Flowin{l.commerce ? ` pour ${l.commerce}` : ''}. Les gagnants sont prévenus par email.
      </div>
    </Cadre>
  )
}
