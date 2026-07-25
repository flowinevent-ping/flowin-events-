'use client'

/**
 * Parametres — configuration effective.
 *
 * Cette vue montre la configuration REELLEMENT EN VIGUEUR, lue en base. Le monolithe
 * affichait six cartes de reglages decoratives (connecteurs, branding, securite…)
 * ouvrant des fenetres vides : une interface qui laisse croire a des reglages
 * inexistants est pire que pas d interface du tout.
 *
 * Ce qui n est pas configurable ici est signale comme tel, avec l endroit ou ca se
 * regle vraiment.
 */
import { useEffect, useState } from 'react'
import { PageHeader, SectionHeader } from '@/components/dashboard/DashboardUI'
import { useDashboard } from '@/contexts/DashboardContext'
import { fetchCommConfig, CONTACT_PARTENAIRE, type CommConfig } from '@/lib/comm'
import { fetchSuperEvents, type SuperEvent } from '@/lib/nds'
import { fetchDocumentsLegaux, type DocumentLegal } from '@/lib/administratif'

function Ligne({ cle, valeur, note }: { cle: string; valeur: React.ReactNode; note?: string }) {
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid var(--sa-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span className="sa-muted" style={{ fontSize: 11.5 }}>{cle}</span>
        <span style={{ fontSize: 11.5, fontWeight: 700, textAlign: 'right' }}>{valeur}</span>
      </div>
      {note && <div className="sa-muted" style={{ fontSize: 10.5, marginTop: 3 }}>{note}</div>}
    </div>
  )
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--sa-card)', border: '1px solid var(--sa-border)',
      borderRadius: 12, padding: '14px 16px', marginBottom: 14,
    }}>
      <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 8 }}>{titre}</div>
      {children}
    </div>
  )
}

const absent = <span className="sa-muted" style={{ fontWeight: 400 }}>non renseigné</span>

export default function Page() {
  const { joueurs, events, partenaires, pros } = useDashboard()
  const [cfg, setCfg] = useState<CommConfig | null>(null)
  const [supers, setSupers] = useState<SuperEvent[]>([])
  const [docs, setDocs] = useState<DocumentLegal[]>([])

  useEffect(() => {
    fetchCommConfig().then(setCfg)
    fetchSuperEvents().then(setSupers)
    fetchDocumentsLegaux().then(setDocs)
  }, [])

  const valides = docs.filter(d => (d.statut ?? '').toLowerCase().startsWith('valid'))
  const brouillons = docs.length - valides.length

  return (
    <div className="sa-page">
      <PageHeader title="Paramètres" subtitle="Configuration effective, lue en base" />

      <div style={{
        marginBottom: 14, padding: '10px 12px', borderRadius: 10,
        border: '1px solid var(--sa-border)', fontSize: 11.5, lineHeight: 1.5,
      }}>
        Cette page montre ce qui est <b>réellement en vigueur</b>. Ce qui ne se règle pas ici
        est signalé, avec l&apos;endroit où ça se règle.
      </div>

      <SectionHeader>📇 Coordonnées de contact</SectionHeader>
      <Bloc titre="Supports partenaires et clients">
        <Ligne cle="Email" valeur={CONTACT_PARTENAIRE.email} />
        <Ligne
          cle="Téléphone"
          valeur={CONTACT_PARTENAIRE.tel}
          note="Ces coordonnées figurent sur tout support partenaire. Aucun nom de personne physique n'apparaît sur un visuel."
        />
      </Bloc>

      <SectionHeader>🎪 Communication</SectionHeader>
      <Bloc titre="Configuration de l'événement en cours">
        <Ligne cle="Événement" valeur={cfg?.evenement ?? absent} />
        <Ligne cle="Édition" valeur={cfg?.edition ?? absent} />
        <Ligne cle="Lieu" valeur={cfg?.lieu ?? absent} />
        <Ligne
          cle="Descriptif"
          valeur={cfg?.descriptif ? `${cfg.descriptif.slice(0, 60)}…` : absent}
          note="Ces valeurs alimentent les gabarits du kit com. Elles se modifient dans la table comm_config."
        />
      </Bloc>

      <SectionHeader>📄 Documents légaux</SectionHeader>
      <Bloc titre={`${docs.length} document${docs.length > 1 ? 's' : ''}`}>
        <Ligne cle="Validés — opposables" valeur={String(valides.length)} />
        <Ligne
          cle="En brouillon"
          valeur={String(brouillons)}
          note={brouillons > 0
            ? "Un document en brouillon ne peut pas être présenté comme en vigueur. Se règle dans CGV & légal."
            : undefined}
        />
      </Bloc>

      <SectionHeader>📊 Volumétrie</SectionHeader>
      <Bloc titre="Données chargées">
        <Ligne cle="Super events" valeur={String(supers.length)} />
        <Ligne cle="Événements" valeur={String(events.length)} />
        <Ligne cle="Partenaires" valeur={String(partenaires.length)} />
        <Ligne cle="Professionnels" valeur={String(pros.length)} />
        <Ligne cle="Joueurs CRM" valeur={String(joueurs.length)} />
      </Bloc>

      <SectionHeader>🔒 Ce qui ne se règle pas ici</SectionHeader>
      <Bloc titre="Et où ça se règle">
        <Ligne cle="Accès et rôles base de données" valeur="Console Supabase" />
        <Ligne cle="Variables d'environnement" valeur="Console Vercel" />
        <Ligne cle="Déploiement" valeur="Push sur la branche main" />
        <Ligne
          cle="Textes de communication"
          valeur="Table comm_templates"
          note="Les gabarits ne se réécrivent pas dans l'interface : ils se modifient en base, et toutes les vues suivent."
        />
      </Bloc>
    </div>
  )
}
