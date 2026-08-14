'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { fetchSuperEvents, type SuperEvent } from '@/lib/nds'
import ProShell from '@/components/pro/ProShell'
import { card, Field, fieldInput, sectionLabel, primaryBtn, errorBox, ACCENT_D } from '@/components/pro/proPublicUI'

type Lot = { titre: string; valeur_euros: string; quantite: string; conditions: string }
const lotVide = (): Lot => ({ titre: '', valeur_euros: '', quantite: '1', conditions: '' })
const cardBlock: React.CSSProperties = { ...card, marginBottom: 16, boxShadow: 'none' }

export default function RejoindrePage() {
  const router = useRouter()
  const [chargement, setChargement] = useState(true)
  const [proId, setProId] = useState('')
  const [proNom, setProNom] = useState('')
  const [supers, setSupers] = useState<SuperEvent[]>([])

  const [seId, setSeId] = useState('')
  const [regleJeu, setRegleJeu] = useState('')
  const [offre, setOffre] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [lots, setLots] = useState<Lot[]>([lotVide()])
  const [envoi, setEnvoi] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) { router.push('/pro/connexion'); return }
      const { data: pro } = await supabase.from('pros').select('id, nom, statut').eq('auth_id', session.session.user.id).maybeSingle()
      if (!pro || pro.statut !== 'valide') { router.push('/pro/connexion'); return }
      setProId(pro.id); setProNom(pro.nom)
      const se = await fetchSuperEvents()
      setSupers(se.filter(s => s.status !== 'past'))
      setChargement(false)
    })()
  }, [router])

  const valide = seId && offre.trim().length > 2

  async function envoyer() {
    if (!valide) return
    setEnvoi('loading')
    setErreur('')
    const lotsPropres = lots.filter(l => l.titre.trim()).map(l => ({
      titre: l.titre, valeur_euros: Number(l.valeur_euros) || 0, quantite: Number(l.quantite) || 1, conditions: l.conditions,
    }))
    const { error } = await supabase.from('demandes_rattachement_super_event').insert({
      pro_id: proId, super_event_id: seId, regle_jeu: regleJeu || null, offre,
      date_debut_souhaite: dateDebut || null, date_fin_souhaite: dateFin || null,
      lots: lotsPropres, statut: 'en_attente',
    })
    if (error) { setErreur(error.message); setEnvoi('error'); return }
    setEnvoi('ok')
  }

  if (chargement) return null

  if (envoi === 'ok') {
    return (
      <ProShell proName={proNom} proId={proId} active="rejoindre">
        <div style={{ ...card, maxWidth: 480 }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>✅</div>
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>Demande envoyée</div>
          <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>L&apos;équipe Flowin va étudier votre participation et revient vers vous.</p>
        </div>
      </ProShell>
    )
  }

  return (
    <ProShell proName={proNom} proId={proId} active="rejoindre">
      <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-.6px', marginBottom: 2 }}>Rejoindre un super event</div>
      <div style={{ fontSize: 13.5, color: '#64748B', marginBottom: 20 }}>Choisissez l&apos;événement et décrivez votre participation. Soumis à validation.</div>

      <div style={cardBlock}>
        <Field label="Super event">
          <select style={fieldInput} value={seId} onChange={e => setSeId(e.target.value)}>
            <option value="">— Choisir —</option>
            {supers.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
        </Field>
      </div>

      <div style={cardBlock}>
        <div style={{ ...sectionLabel, marginTop: 0 }}>📅 Programmation</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}><Field label="Date de début souhaitée"><input style={fieldInput} type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} /></Field></div>
          <div style={{ flex: 1, minWidth: 160 }}><Field label="Date de fin souhaitée"><input style={fieldInput} type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} /></Field></div>
        </div>
        <Field label="Règle du jeu envisagée"><input style={fieldInput} value={regleJeu} onChange={e => setRegleJeu(e.target.value)} placeholder="Ex. quiz, scan simple…" /></Field>
        <Field label="Votre offre (visibilité / animation / sponsor)"><input style={fieldInput} value={offre} onChange={e => setOffre(e.target.value)} placeholder="Décrivez ce que vous proposez" /></Field>
      </div>

      <div style={cardBlock}>
        <div style={{ ...sectionLabel, marginTop: 0 }}>🎁 Lot(s) proposé(s)</div>
        {lots.map((l, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, paddingBottom: 10, borderBottom: i < lots.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
            <input style={{ ...fieldInput, flex: 2, minWidth: 160 }} placeholder="Titre du lot" value={l.titre} onChange={e => setLots(lots.map((x, j) => j === i ? { ...x, titre: e.target.value } : x))} />
            <input style={{ ...fieldInput, flex: 1, minWidth: 90 }} placeholder="Valeur €" value={l.valeur_euros} onChange={e => setLots(lots.map((x, j) => j === i ? { ...x, valeur_euros: e.target.value } : x))} />
            <input style={{ ...fieldInput, flex: 1, minWidth: 90 }} placeholder="Quantité" value={l.quantite} onChange={e => setLots(lots.map((x, j) => j === i ? { ...x, quantite: e.target.value } : x))} />
          </div>
        ))}
        <button onClick={() => setLots([...lots, lotVide()])} style={{ fontSize: 12.5, fontWeight: 700, color: ACCENT_D, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>+ Ajouter un lot</button>
      </div>

      {erreur && <div style={errorBox}>{erreur}</div>}

      <button onClick={envoyer} disabled={!valide || envoi === 'loading'} style={{ ...primaryBtn, width: 'auto', padding: '13px 22px', opacity: valide ? 1 : 0.5, cursor: valide ? 'pointer' : 'not-allowed' }}>
        {envoi === 'loading' ? 'Envoi…' : 'Envoyer ma demande'}
      </button>
    </ProShell>
  )
}
