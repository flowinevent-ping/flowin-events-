'use client'

/**
 * CREER UN PRO — cote SA.
 *
 * Romain, 03/09 : « la création d'un pro côté pro ou dashboard SA doit être la
 * même ».
 *
 * Cet ecran ne definit donc plus ses etapes : il rend celles de
 * `lib/proCreation.ts`, la definition unique que l'espace pro rend de son cote
 * avec ses propres primitives. Memes questions, meme ordre, memes validations,
 * meme liste de secteurs. Les seuls ecarts sont ceux que le fichier declare :
 * l'identifiant technique et les notes internes n'existent que du cote SA, le
 * mot de passe que du cote pro.
 *
 * L'ecriture passe par `upsertPro` (lib/dashboard.ts), la meme fonction que la
 * fiche pro : aucune table nouvelle, aucun champ invente.
 *
 * IL NE CREE PAS DE STATION. Un pro peut exister sans jouer. Le recapitulatif
 * propose d'enchainer sur la creation d'event, le pro deja pre-selectionne.
 */

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/DashboardUI'
import { Parcours, VignetteChoix, type EtapeParcours } from '@/components/dashboard/Parcours'
import { useDashboard } from '@/contexts/DashboardContext'
import { upsertPro } from '@/lib/dashboard'
import {
  ETAPES_FICHE_PRO, PROFILS_PRO, etapesPour, ficheProVide, identifiantPro,
  lignePro, recapPro, slugPro,
  type ChampPro, type FichePro, type ProfilPro,
} from '@/lib/proCreation'

export default function Page() {
  const router = useRouter()
  const { pros } = useDashboard()

  const [f, setF] = useState<FichePro>(ficheProVide())
  const [statut, setStatut] = useState<'valide' | 'en_attente'>('valide')
  const [occupe, setOccupe] = useState(false)
  const [retour, setRetour] = useState<{ ok: boolean; texte: string; id?: string } | null>(null)

  const maj = (c: Partial<FichePro>) => setF(x => ({ ...x, ...c }))
  const id = identifiantPro(f)

  /* Deux pros ne peuvent pas partager un identifiant : c est la cle primaire, et
     un upsert dessus ECRASERAIT la fiche de l autre. On le dit avant, pas apres. */
  const idPris = useMemo(() => !!id && pros.some(p => p.id === id), [id, pros])
  const nomPris = useMemo(
    () => !!f.nom.trim() && pros.some(p => (p.nom ?? '').trim().toLowerCase() === f.nom.trim().toLowerCase()),
    [f.nom, pros],
  )

  async function creer() {
    setOccupe(true); setRetour(null)
    const ok = await upsertPro(lignePro(f, 'sa', statut))
    setOccupe(false)
    setRetour(ok
      ? { ok: true, texte: `${f.nom.trim()} est créé.`, id }
      : { ok: false, texte: 'L’enregistrement a échoué. Rien n’a été écrit.' })
  }

  /* Un champ, rendu avec les primitives du dashboard. La DEFINITION vient de
     lib/proCreation — ce composant ne fait que la dessiner. */
  function Champ({ c }: { c: ChampPro }) {
    const v = (f[c.cle] as string) ?? ''
    const set = (x: string) => maj({ [c.cle]: x } as Partial<FichePro>)
    const aide = c.cle === 'identifiant'
      ? <>Déduit du nom : <code className="sa-code">{id || 'pro-…'}</code>. {c.aide}</>
      : c.aide
    return (
      <label style={{ display: 'block' }}>
        <span className="sa-lbl">{c.label}</span>
        {c.type === 'liste' ? (
          <select className="sa-input" value={v} onChange={e => set(e.target.value)}>
            <option value="">— Choisir —</option>
            {(c.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : c.type === 'zone' ? (
          <textarea className="sa-input" rows={3} value={v} onChange={e => set(e.target.value)} placeholder={c.placeholder} />
        ) : (
          <input
            className="sa-input"
            type={c.type === 'email' ? 'email' : c.type === 'tel' ? 'tel' : 'text'}
            value={v} onChange={e => set(e.target.value)}
            placeholder={c.cle === 'identifiant' ? (slugPro(f.nom) || 'pro-…') : c.placeholder}
          />
        )}
        {aide && <span className="sa-aide">{aide}</span>}
      </label>
    )
  }

  /* Les champs d une etape, les groupes cote a cote. */
  function Champs({ champs }: { champs: ChampPro[] }) {
    const blocs: ChampPro[][] = []
    champs.forEach(c => {
      const dernier = blocs[blocs.length - 1]
      if (c.groupe && dernier && dernier[0].groupe === c.groupe) dernier.push(c)
      else blocs.push([c])
    })
    return (
      <div style={{ display: 'grid', gap: 12, maxWidth: 600 }}>
        {blocs.map((b, i) => b.length === 1
          ? <Champ key={i} c={b[0]} />
          : <div key={i} style={{ display: 'grid', gridTemplateColumns: `repeat(${b.length},1fr)`, gap: 12 }}>
              {b.map(c => <Champ key={c.cle} c={c} />)}
            </div>)}
      </div>
    )
  }

  const etapes: EtapeParcours[] = etapesPour('sa', f.profil).map(e => {
    const bloqueBase = e.bloque(f, 'sa')
    const bloque = e.id === 'identite' && !bloqueBase && idPris
      ? `L’identifiant ${id} est déjà pris — un enregistrement écraserait cette fiche. Changez-le.`
      : bloqueBase

    let contenu: React.ReactNode
    if (e.vignettes) {
      contenu = (
        <div className="sa-choix-grille">
          {PROFILS_PRO.map(p => (
            <VignetteChoix
              key={p.id} titre={p.titre} sous={p.sousSA} icone={p.icone}
              badges={[...p.badges]} actif={f.profil === p.id}
              onClick={() => maj({ profil: p.id as ProfilPro })}
            />
          ))}
        </div>
      )
    } else if (e.id === 'recap') {
      contenu = (
        <div style={{ display: 'grid', gap: 14, maxWidth: 640 }}>
          <div>
            {recapPro(f, 'sa').map(l => (
              <div key={l.k} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid #E2E8F0' }}>
                <span style={{ minWidth: 140, fontSize: 12, fontWeight: 800, color: '#64748B' }}>{l.k}</span>
                <span style={{ fontSize: 13.5 }}>{l.v}</span>
              </div>
            ))}
          </div>
          <label>
            <span className="sa-lbl">Statut</span>
            <select className="sa-input" style={{ maxWidth: 300 }} value={statut}
              onChange={e2 => setStatut(e2.target.value as 'valide' | 'en_attente')}>
              <option value="valide">Validé — il peut recevoir une station</option>
              <option value="en_attente">En attente — à vérifier avant de l’engager</option>
            </select>
            <span className="sa-aide">
              Un pro qui s’inscrit lui-même depuis l’espace pro arrive toujours
              « en attente » : c’est une demande. Ici, vous créez directement.
            </span>
          </label>
          {retour?.ok && (
            <div className="sa-alert info texte" style={{ fontSize: 12.5, lineHeight: 1.55 }}>
              {retour.texte} Un pro n’a pas encore de station : c’est la création
              d’event qui lui en donne une.
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <button className="sa-btn sm primary" onClick={() => router.push(`/dashboard/wizard-event?pro=${encodeURIComponent(retour.id ?? '')}`)}>
                  Lui créer une station →
                </button>
                <button className="sa-btn sm" onClick={() => router.push('/dashboard/pros')}>
                  Voir la liste des pros
                </button>
              </div>
            </div>
          )}
        </div>
      )
    } else {
      contenu = (
        <>
          <Champs champs={e.champs} />
          {e.id === 'identite' && nomPris && (
            <div className="sa-alert warn" style={{ fontSize: 12, marginTop: 12, maxWidth: 600 }}>
              Un pro porte déjà ce nom. Ce n’est pas interdit — deux enseignes peuvent
              s’appeler pareil — mais vérifiez que ce n’est pas un doublon.
            </div>
          )}
        </>
      )
    }

    return { id: e.id, icone: e.icone, titre: e.titre, sous: e.sous, bloque, contenu }
  })

  return (
    <div className="sa-page">
      <PageHeader
        title="🏢 Créer un pro"
        subtitle={`Le même parcours que l’espace pro — ${ETAPES_FICHE_PRO.length} étapes, mêmes questions`}
      />
      <Parcours
        teinte="pro"
        bandeau="Créer un pro"
        etapes={etapes}
        onTerminer={creer}
        libelleFin="Créer le pro"
        occupe={occupe}
        message={retour && !retour.ok && (
          <div className="sa-alert warn" style={{ marginTop: 14, fontSize: 12.5 }}>{retour.texte}</div>
        )}
      />
    </div>
  )
}
