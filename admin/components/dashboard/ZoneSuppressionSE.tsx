'use client'

/**
 * Suppression d un super event cree par erreur — sur SA fiche, pas dans le
 * parcours de creation (Romain, 29/10 : « cette fonction annulation n est pas
 * au bon endroit »).
 * Refusee par la base si l operation porte des participations ou des tirages :
 * on n efface pas de l activite joueur, ni des gagnants a qui on a promis un
 * lot. Le nom doit etre ressaisi exactement — un clic de trop ne suffit pas.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SectionHeader } from '@/components/dashboard/DashboardUI'
import { supprimerSuperEvent } from '@/lib/nds'
import { Ico } from '@/lib/proicons'

export default function ZoneSuppressionSE({ id, nom }: { id: string; nom: string }) {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [saisie, setSaisie] = useState('')
  const [occupe, setOccupe] = useState(false)
  const [retour, setRetour] = useState<{ ok: boolean; texte: string } | null>(null)

  async function supprimer() {
    setOccupe(true); setRetour(null)
    const r = await supprimerSuperEvent(id, saisie)
    setOccupe(false)
    if (r.ok) {
      setRetour({ ok: true, texte: `« ${r.nom} » supprimé — ${r.events_supprimes ?? 0} station(s) avec lui.` })
      setTimeout(() => router.push('/dashboard/super-events'), 1500)
      return
    }
    if (r.raison === 'activite') {
      setRetour({
        ok: false,
        texte: `Suppression refusée : cette opération porte ${r.participations} partie(s) et ${r.tirages} tirage(s). `
          + 'Effacer, ce serait effacer de l’activité joueur réelle et des gagnants déjà désignés.',
      })
      return
    }
    if (r.raison === 'confirmation') {
      setRetour({ ok: false, texte: `Le nom saisi ne correspond pas. Attendu exactement : « ${r.attendu} ».` })
      return
    }
    setRetour({
      ok: false,
      texte: r.message ? `La suppression a échoué — ${r.message}` : 'Super event introuvable.',
    })
  }

  return (
    <div className="sa-card" style={{ padding: 18, marginTop: 20, borderColor: '#E2B4B4' }}>
      <SectionHeader>Supprimer ce super event</SectionHeader>
      <div style={{ fontSize: 12, color: 'var(--sa-muted)', marginBottom: 12, lineHeight: 1.5 }}>
        Pour une opération créée par erreur. Refusé automatiquement si elle porte des parties
        jouées ou des tirages. Les stations rattachées partent avec elle ; <b>les fiches pro sont
        conservées</b> — un pro existe indépendamment de l’opération à laquelle il a participé.
      </div>

      {!ouvert ? (
        <button className="sa-btn sm" onClick={() => setOuvert(true)} style={{ color: '#B3261E', borderColor: '#E2B4B4' }}>
          <Ico k="trash" size={13} /> Supprimer ce super event…
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="sa-input" style={{ maxWidth: 320 }} value={saisie}
            onChange={e => setSaisie(e.target.value)}
            placeholder={`Retapez « ${nom} » pour confirmer`} />
          <button className="sa-btn" style={{ background: '#B3261E', color: '#fff', borderColor: '#B3261E' }}
            onClick={supprimer} disabled={occupe || saisie.trim() !== (nom ?? '').trim()}>
            {occupe ? '…' : 'Supprimer définitivement'}
          </button>
          <button className="sa-btn sm" onClick={() => { setOuvert(false); setSaisie(''); setRetour(null) }} disabled={occupe}>
            Annuler
          </button>
        </div>
      )}

      {retour && (
        <div className={`sa-alert ${retour.ok ? 'info' : 'warn'}`} style={{ marginTop: 12, fontSize: 12.5 }}>
          {retour.texte}
        </div>
      )}
    </div>
  )
}
