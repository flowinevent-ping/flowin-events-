'use client'

/**
 * CREER UN PRO — le troisieme parcours de creation, cote SA.
 *
 * Romain, 03/09 : « je souhaite avoir un parcours de creation d'events, de
 * super events, de creation de pro dans le meme style que celui de l'app comme
 * pour le parcours pro de creation d'event et participation au super events. »
 *
 * Les deux premiers existaient (wizard-event, wizard-super-event). Celui-ci
 * manquait : un pro ne pouvait naitre que d'une demande de rattachement
 * approuvee, ou d'une ligne saisie a la main dans la fiche. Le SA peut
 * desormais en creer un directement, avec les memes etapes que le pro voit de
 * son cote.
 *
 * CE QU IL REPREND, ET D OU. Les etapes, les personas et la liste des secteurs
 * sont ceux de `components/pro/RejoindreWizard.tsx` — le parcours que le pro
 * suit deja pour rejoindre une operation. Les champs ecrits sont ceux de
 * `FlowinPro` (lib/types.ts), et l ecriture passe par `upsertPro`
 * (lib/dashboard.ts), la meme fonction que la fiche pro. Aucun champ invente,
 * aucune table nouvelle.
 *
 * CE QU IL NE FAIT PAS. Il ne cree pas de station : un pro peut exister sans
 * jouer. La derniere etape propose d enchainer sur la creation d event, avec le
 * pro deja pre-selectionne dans l URL — c est le lien que le SA suivait a la
 * main jusqu ici.
 */

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/DashboardUI'
import { Parcours, VignetteChoix, type EtapeParcours } from '@/components/dashboard/Parcours'
import { useDashboard } from '@/contexts/DashboardContext'
import { upsertPro } from '@/lib/dashboard'
import type { FlowinPro } from '@/lib/types'

/* Repris tel quel de RejoindreWizard : le pro voit cette liste, le SA doit
   voir la meme, sinon les deux cotes se repondent avec des secteurs differents. */
const SECTEURS = [
  'Grande distribution', 'Banque · Assurance', 'Automobile', 'Immobilier',
  'Restauration', 'Commerce', 'Collectivité', 'Association', 'Tourisme',
  'Énergie', 'Autre',
]

/* Les deux profils du parcours pro, avec leurs propres mots. */
const PROFILS = [
  {
    id: 'commerce', icone: '🏪', titre: 'Commerce · point de vente',
    sous: 'Il tient une station de jeu chez lui : les joueurs viennent flasher sur place.',
    badges: ['Station', 'Trafic en boutique', 'Fichier client'],
  },
  {
    id: 'annonceur', icone: '📣', titre: 'Annonceur · sponsor',
    sous: 'Il communique sur l’opération sans tenir de station.',
    badges: ['Audience locale', 'Impact', 'Choix de l’event'],
  },
] as const
type Profil = typeof PROFILS[number]['id']

function slugPro(nom: string): string {
  const base = nom.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return base ? `pro-${base}` : ''
}

export default function Page() {
  const router = useRouter()
  const { pros } = useDashboard()

  const [profil, setProfil] = useState<Profil | ''>('')
  const [nom, setNom] = useState('')
  const [idManuel, setIdManuel] = useState('')
  const [secteur, setSecteur] = useState('')
  const [adresse, setAdresse] = useState('')
  const [codePostal, setCodePostal] = useState('')
  const [ville, setVille] = useState('')
  const [siret, setSiret] = useState('')
  const [contact, setContact] = useState('')
  const [roleContact, setRoleContact] = useState('')
  const [email, setEmail] = useState('')
  const [tel, setTel] = useState('')
  const [notes, setNotes] = useState('')
  const [statut, setStatut] = useState<FlowinPro['statut']>('valide')

  const [occupe, setOccupe] = useState(false)
  const [retour, setRetour] = useState<{ ok: boolean; texte: string; id?: string } | null>(null)

  const id = idManuel || slugPro(nom)

  /* Deux pros ne peuvent pas partager un identifiant : c est la cle primaire,
     et un upsert sur un id existant ECRASERAIT la fiche de l autre. On le dit
     avant, pas apres. */
  const idPris = useMemo(() => !!id && pros.some(p => p.id === id), [id, pros])
  const nomPris = useMemo(
    () => !!nom.trim() && pros.some(p => (p.nom ?? '').trim().toLowerCase() === nom.trim().toLowerCase()),
    [nom, pros],
  )

  const emailValide = !email.trim() || /.+@.+\..+/.test(email.trim())

  async function creer() {
    setOccupe(true); setRetour(null)
    const ok = await upsertPro({
      id, nom: nom.trim(), ville, code_postal: codePostal, adresse,
      siret, secteur, contact, role_contact: roleContact,
      email: email.trim(), tel, notes, statut,
      tags: profil ? [profil] : [],
    })
    setOccupe(false)
    setRetour(ok
      ? { ok: true, texte: `${nom.trim()} est créé.`, id }
      : { ok: false, texte: 'L’enregistrement a échoué. Rien n’a été écrit.' })
  }

  const champ = (
    lbl: string, val: string, set: (v: string) => void,
    ph = '', aide?: string, type = 'text',
  ) => (
    <label style={{ display: 'block' }}>
      <span className="sa-lbl">{lbl}</span>
      <input className="sa-input" type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph} />
      {aide && <span className="sa-aide">{aide}</span>}
    </label>
  )

  const etapes: EtapeParcours[] = [
    {
      id: 'profil', icone: '🧭', titre: 'De quel pro s’agit-il ?',
      sous: 'Les deux profils du parcours pro. Ils ne demandent pas les mêmes informations.',
      bloque: !profil ? 'Choisissez un profil pour continuer.' : undefined,
      contenu: (
        <div className="sa-choix-grille">
          {PROFILS.map(p => (
            <VignetteChoix
              key={p.id} titre={p.titre} sous={p.sous} icone={p.icone}
              badges={[...p.badges]} actif={profil === p.id}
              onClick={() => setProfil(p.id)}
            />
          ))}
        </div>
      ),
    },
    {
      id: 'identite', icone: '🏢', titre: 'Son identité',
      sous: 'Le nom que verront les joueurs, et l’identifiant qui le suivra partout.',
      bloque: !nom.trim() ? 'Donnez un nom au pro pour continuer.'
        : idPris ? `L’identifiant ${id} est déjà pris — un enregistrement écraserait cette fiche. Changez-le.`
          : undefined,
      contenu: (
        <div style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
          {champ('Nom *', nom, setNom, profil === 'annonceur' ? 'Ex. Allianz Clarence Charvolin' : 'Ex. Domaine de la Bergerie')}
          {nomPris && (
            <div className="sa-alert warn" style={{ fontSize: 12, marginTop: -4 }}>
              Un pro porte déjà ce nom. Ce n’est pas interdit — deux enseignes peuvent
              s’appeler pareil — mais vérifiez que ce n’est pas un doublon.
            </div>
          )}
          <label>
            <span className="sa-lbl">Identifiant</span>
            <input className="sa-input" value={idManuel} onChange={e => setIdManuel(e.target.value)} placeholder={slugPro(nom) || 'pro-…'} />
            <span className="sa-aide">
              Déduit du nom : <code className="sa-code">{id || 'pro-…'}</code>. Il relie
              ses stations, ses lots et son CRM — il ne se change plus ensuite.
            </span>
          </label>
          <label>
            <span className="sa-lbl">Secteur</span>
            <select className="sa-input" value={secteur} onChange={e => setSecteur(e.target.value)}>
              <option value="">— Choisir —</option>
              {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
      ),
    },
    {
      id: 'lieu', icone: '📍', titre: 'Où il se trouve',
      sous: profil === 'annonceur'
        ? 'Un annonceur ne tient pas de station : la ville suffit.'
        : 'L’adresse sert à placer sa station sur la carte de l’opération.',
      contenu: (
        <div style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
          {profil !== 'annonceur' && champ('Adresse', adresse, setAdresse, 'Ex. 12 place du Grand Jardin')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            {champ('Code postal', codePostal, setCodePostal, '06140')}
            {champ('Ville', ville, setVille, 'Vence')}
          </div>
          {champ('SIRET', siret, setSiret, '', 'Facultatif — utile pour les bons de commande et les factures.')}
        </div>
      ),
    },
    {
      id: 'contact', icone: '👤', titre: 'Qui le représente',
      sous: 'La personne que l’on appelle. C’est elle qui recevra les accès si un compte pro est ouvert.',
      bloque: !emailValide ? 'L’email saisi n’a pas une forme valide.' : undefined,
      contenu: (
        <div style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {champ('Contact', contact, setContact, 'Prénom Nom')}
            {champ('Rôle', roleContact, setRoleContact, 'Gérant, responsable…')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {champ('Email', email, setEmail, 'contact@enseigne.fr', undefined, 'email')}
            {champ('Téléphone', tel, setTel, '', undefined, 'tel')}
          </div>
          <label>
            <span className="sa-lbl">Notes internes</span>
            <textarea className="sa-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Ce qu’il faut savoir sur ce pro — visible du SA seulement." />
          </label>
        </div>
      ),
    },
    {
      id: 'recap', icone: '✅', titre: 'Récapitulatif',
      sous: 'Rien n’est écrit avant que vous validiez.',
      contenu: (
        <div style={{ display: 'grid', gap: 12, maxWidth: 620 }}>
          <div className="sa-recap">
            {[
              ['Profil', PROFILS.find(p => p.id === profil)?.titre ?? '—'],
              ['Nom', nom.trim() || '—'],
              ['Identifiant', id || '—'],
              ['Secteur', secteur || '—'],
              ['Adresse', [adresse, codePostal, ville].filter(Boolean).join(', ') || '—'],
              ['SIRET', siret || '—'],
              ['Contact', [contact, roleContact].filter(Boolean).join(' · ') || '—'],
              ['Email', email.trim() || '—'],
              ['Téléphone', tel || '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--sa-border)' }}>
                <span style={{ minWidth: 130, fontSize: 12, fontWeight: 800, color: 'var(--sa-muted)' }}>{k}</span>
                <span style={{ fontSize: 13 }}>{v}</span>
              </div>
            ))}
          </div>

          <label>
            <span className="sa-lbl">Statut</span>
            <select className="sa-input" style={{ maxWidth: 240 }} value={statut}
              onChange={e => setStatut(e.target.value as FlowinPro['statut'])}>
              <option value="valide">Validé — il peut recevoir une station</option>
              <option value="en_attente">En attente — à vérifier avant de l’engager</option>
            </select>
          </label>

          {retour?.ok && (
            <div className="sa-alert info" style={{ fontSize: 12.5, lineHeight: 1.55 }}>
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
      ),
    },
  ]

  return (
    <div className="sa-page">
      <PageHeader
        title="🏢 Créer un pro"
        subtitle="Les mêmes étapes que le parcours pro — le SA saisit ce que le pro remplirait lui-même"
      />
      <Parcours
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
