'use client'

/**
 * Packs de participation (Super Event).
 *
 * Catalogue unique, editable en direct : nom, sous-titre, prix HT, badge,
 * valeur du lot, prestations incluses. Reprend telles quelles les 3 offres
 * deja utilisees dans les bons de commande NDS 2026 (Visibilite / Animation /
 * Sponsor officiel) — la structure ne change pas ici, seuls les libelles et
 * les prix sont amenes a evoluer, d'ou l'edition en direct plutot qu'un
 * nouveau fichier HTML statique a chaque fois.
 *
 * Ce catalogue est la source que le parcours pro "Rejoindre un super event"
 * consommera pour son etape Participation — pas encore branche cote pro,
 * cette page est le premier maillon (catalogue + edition), le parcours pro
 * reste a cabler dessus dans un prochain tour.
 */
import { useEffect, useState } from 'react'
import { PageHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { fetchPacksParticipation, majPackParticipation, type PackParticipation } from '@/lib/commercial'

const euros = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

export default function Page() {
  const [packs, setPacks] = useState<PackParticipation[] | null>(null)
  const [brouillon, setBrouillon] = useState<Record<string, Record<string, string>>>({})
  const [enregistrement, setEnregistrement] = useState<string | null>(null)
  const [confirme, setConfirme] = useState<string | null>(null)

  const charger = () => fetchPacksParticipation().then(setPacks)
  useEffect(() => { charger() }, [])

  function champ(pack: PackParticipation, cle: keyof PackParticipation): string {
    const v = brouillon[pack.id]?.[cle]
    if (v !== undefined) return v
    return String(pack[cle] ?? '')
  }

  function set(id: string, cle: string, valeur: string) {
    setBrouillon(p => ({ ...p, [id]: { ...p[id], [cle]: valeur } }))
    setConfirme(null)
  }

  async function enregistrer(pack: PackParticipation) {
    const patch = brouillon[pack.id]
    if (!patch) return
    setEnregistrement(pack.id)
    const clean: Partial<PackParticipation> = {}
    if (patch.nom !== undefined) clean.nom = patch.nom
    if (patch.sous_titre !== undefined) clean.sous_titre = patch.sous_titre
    if (patch.inclusions !== undefined) clean.inclusions = patch.inclusions
    if (patch.prix_ht !== undefined) clean.prix_ht = Number(patch.prix_ht)
    if (patch.lot_valeur !== undefined) clean.lot_valeur = patch.lot_valeur === '' ? null : Number(patch.lot_valeur)
    if (patch.badge !== undefined) clean.badge = patch.badge === '' ? null : patch.badge
    const ok = await majPackParticipation(pack.id, clean)
    setEnregistrement(null)
    if (ok) {
      setConfirme(pack.id)
      setBrouillon(p => { const n = { ...p }; delete n[pack.id]; return n })
      charger()
    }
  }

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader
          title="🎟️ Packs de participation"
          subtitle="Catalogue Visibilité / Animation / Sponsor officiel — modifiable et publié en direct"
        />

        {packs === null && <div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div>}
        {packs !== null && packs.length === 0 && (
          <EmptyState icon="🎟️" title="Aucun pack" desc="Le catalogue de packs de participation est vide." />
        )}

        {packs !== null && packs.map(pack => {
          const modifie = !!brouillon[pack.id]
          return (
            <div
              key={pack.id}
              style={{
                background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 12,
                padding: 16, marginBottom: 14,
              }}
            >
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                <div style={{ flex: '1 1 220px' }}>
                  <label className="sa-muted" style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Nom</label>
                  <input className="sa-input" value={champ(pack, 'nom')} onChange={e => set(pack.id, 'nom', e.target.value)} style={{ width: '100%' }} />
                </div>
                <div style={{ flex: '2 1 260px' }}>
                  <label className="sa-muted" style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Sous-titre</label>
                  <input className="sa-input" value={champ(pack, 'sous_titre')} onChange={e => set(pack.id, 'sous_titre', e.target.value)} style={{ width: '100%' }} />
                </div>
                <div style={{ flex: '0 1 130px' }}>
                  <label className="sa-muted" style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Prix HT (€)</label>
                  <input className="sa-input" type="number" value={champ(pack, 'prix_ht')} onChange={e => set(pack.id, 'prix_ht', e.target.value)} style={{ width: '100%' }} />
                </div>
                <div style={{ flex: '0 1 150px' }}>
                  <label className="sa-muted" style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Badge (optionnel)</label>
                  <input className="sa-input" placeholder="Ex. Le plus choisi" value={champ(pack, 'badge')} onChange={e => set(pack.id, 'badge', e.target.value)} style={{ width: '100%' }} />
                </div>
                <div style={{ flex: '0 1 130px' }}>
                  <label className="sa-muted" style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Valeur du lot (€)</label>
                  <input className="sa-input" type="number" value={champ(pack, 'lot_valeur')} onChange={e => set(pack.id, 'lot_valeur', e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>

              <label className="sa-muted" style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                Prestations incluses (une par ligne)
              </label>
              <textarea
                className="sa-input"
                value={champ(pack, 'inclusions')}
                onChange={e => set(pack.id, 'inclusions', e.target.value)}
                rows={5}
                style={{ width: '100%', fontFamily: 'inherit', resize: 'vertical', marginBottom: 10 }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  className={`sa-btn sm${modifie ? ' primary' : ''}`}
                  disabled={!modifie || enregistrement === pack.id}
                  onClick={() => enregistrer(pack)}
                >
                  {enregistrement === pack.id ? 'Publication…' : 'Publier en direct'}
                </button>
                {confirme === pack.id && (
                  <span style={{ fontSize: 12, color: '#2f7d4f', fontWeight: 700 }}>✓ Publié</span>
                )}
                {pack.updated_at && !modifie && confirme !== pack.id && (
                  <span className="sa-muted" style={{ fontSize: 11 }}>
                    Dernière publication : {new Date(pack.updated_at).toLocaleString('fr-FR')}
                  </span>
                )}
              </div>
            </div>
          )
        })}

        <div style={{ fontSize: 11.5, color: 'var(--sa-muted)', marginTop: 4 }}>
          Ce catalogue alimente le futur écran « Participation » du parcours pro Rejoindre un super event — pas encore câblé côté pro, c'est la prochaine étape une fois ce catalogue validé.
        </div>
      </div>
    </div>
  )
}
