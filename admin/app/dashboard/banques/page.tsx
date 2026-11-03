'use client'

/**
 * BANQUES DE QUESTIONS — cote Super Admin (verification du 01/11).
 * Le lien « Creer une banque » du parcours de creation Super Admin pointait ici
 * et tombait sur une 404. Cette page reutilise l'editeur du pro tel quel
 * (components/pro/BanqueEditor : saisie, import texte, generation IA), pour
 * que les trois endroits (Super Admin, espace pro, creation d'animation) aient
 * la meme ergonomie. Une banque appartient a un pro, ou a « flowin » (banque
 * commune du Super Admin).
 */
import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDashboard } from '@/contexts/DashboardContext'
import { fetchBanquesToutes, fetchBanque, creerBanque, changerStatutBanque, supprimerBanque, estCommune, type Banque } from '@/lib/banques'
import BanqueEditor from '@/components/pro/BanqueEditor'
import ModelesBanques from '@/components/banques/ModelesBanques'
import { METIERS } from '@/lib/banquesModeles'

const estBonus = (b: Banque) => !!b.tags && b.tags.indexOf('bonus') >= 0

function Contenu() {
  const { pros } = useDashboard()
  const sp = useSearchParams()
  const [liste, setListe] = useState<Banque[] | null>(null)
  const [ouverte, setOuverte] = useState<Banque | null>(null)
  const [proId, setProId] = useState('flowin')
  const [erreur, setErreur] = useState('')
  const [creation, setCreation] = useState(false)
  const [metier, setMetier] = useState('tous')
  const [source, setSource] = useState<'toutes' | 'communes' | 'pros'>('toutes')
  const [occupe, setOccupe] = useState<string | null>(null)

  const charger = useCallback(() => { fetchBanquesToutes().then(setListe) }, [])
  useEffect(() => { charger() }, [charger])
  useEffect(() => { const id = sp.get('id'); if (id) fetchBanque(id).then(b => { if (b) setOuverte(b) }) }, [sp])

  async function nouvelle(bonus: boolean) {
    setErreur(''); setCreation(true)
    const b = await creerBanque({ proId, nom: bonus ? 'Nouveau sondage bonus' : 'Nouvelle banque quiz', tags: [bonus ? 'bonus' : 'quiz'] })
    setCreation(false)
    if (!b) { setErreur('Banque non créée (droit refusé ou erreur réseau).'); return }
    setOuverte(b); charger()
  }

  async function valider(b: Banque) {
    setErreur(''); setOccupe(b.id)
    const ok = await changerStatutBanque(b.id, b.statut !== 'valide')
    setOccupe(null)
    if (!ok) { setErreur('Statut non modifié (droit refusé ou erreur réseau).'); return }
    charger()
  }
  async function supprimer(b: Banque) {
    if (!window.confirm('Supprimer définitivement la banque « ' + (b.nom || 'Sans nom') + ' » ? Les animations qui l’utilisent n’auront plus ses questions.')) return
    setErreur(''); setOccupe(b.id)
    const ok = await supprimerBanque(b.id)
    setOccupe(null)
    if (!ok) { setErreur('Banque non supprimée (droit refusé ou erreur réseau).'); return }
    charger()
  }

  if (ouverte) {
    return (
      <div className="sa-content"><div className="sa-page" data-banque-editeur style={{ maxWidth: 860 }}>
        <button className="sa-btn" onClick={() => { setOuverte(null); charger() }} style={{ marginBottom: 12 }}>← Toutes les banques</button>
        <BanqueEditor key={ouverte.id} banque={ouverte} proId={ouverte.pro_id} estBonus={estBonus(ouverte)} lienRetour="/dashboard/banques" />
      </div></div>
    )
  }

  const nomPro = (id: string) => (pros.find(p => p.id === id)?.nom) || (id === 'flowin' ? 'Flowin (commune)' : id)
  return (
    <div className="sa-content"><div className="sa-page" style={{ maxWidth: 960 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Banques de questions</h1>
      <p className="sa-muted" style={{ fontSize: 13, margin: '0 0 14px' }}>Quiz (bonne réponse) et sondages bonus (sans bonne réponse). Même éditeur que dans l’espace pro : saisie, import, génération IA.</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <label className="sa-muted" style={{ fontSize: 12.5 }}>Pour</label>
        <select className="sa-input" aria-label="Propriétaire de la banque" value={proId} onChange={e => setProId(e.target.value)} style={{ maxWidth: 260 }}>
          <option value="flowin">Flowin (banque commune)</option>
          {pros.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>
        <button className="sa-btn primary" disabled={creation} onClick={() => nouvelle(false)} data-nouvelle="quiz">+ Banque de quiz</button>
        <button className="sa-btn primary" disabled={creation} onClick={() => nouvelle(true)} data-nouvelle="bonus">+ Banque de questions bonus</button>
      </div>
      {erreur && <div className="sa-alert info" role="alert">{erreur}</div>}
      <h2 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 8px' }}>Banques enregistrées</h2>
      <p className="sa-muted" style={{ fontSize: 12.5, margin: '0 0 10px', lineHeight: 1.5 }}>
        <b>Banques communes Flowin</b> : propriété de Flowin, modifiées par le Super Admin seul. Une fois <b>validée</b>, une banque commune est partagée en lecture
        avec tous les pros (sélecteur de l’animation, et « Copier dans mes banques »). En brouillon, elle reste visible du Super Admin seulement.
      </p>
      <div role="tablist" aria-label="Source des banques" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {([['toutes', 'Toutes'], ['communes', 'Banques communes Flowin'], ['pros', 'Banques des pros']] as const).map(([id, nom]) => (
          <button key={id} role="tab" aria-selected={source === id} data-source={id} className={'sa-btn' + (source === id ? ' primary' : '')} onClick={() => setSource(id)} style={{ padding: '5px 12px', fontSize: 12 }}>{nom}</button>
        ))}
      </div>
      <div role="tablist" aria-label="Filtrer les banques enregistrées par métier" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {[{ id: 'tous', nom: 'Tous' }].concat(METIERS).map(m => (
          <button key={m.id} role="tab" aria-selected={metier === m.id} data-filtre-metier={m.id} className={'sa-btn' + (metier === m.id ? ' primary' : '')} onClick={() => setMetier(m.id)} style={{ padding: '5px 12px', fontSize: 12 }}>{m.nom}</button>
        ))}
      </div>
      {liste === null && <div className="sa-muted">Chargement…</div>}
      {liste && liste.length === 0 && <div className="sa-muted">Aucune banque. Ajoutez-en une depuis les banques modèles ci-dessus.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 12 }}>
        {(liste ?? []).filter(b => (metier === 'tous' || (b.tags ?? []).indexOf(metier) >= 0) && (source === 'toutes' || (source === 'communes') === estCommune(b))).map(b => (
          <div key={b.id} data-banque={b.id} style={{ background: '#fff', border: '1px solid var(--sa-border)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={() => setOuverte(b)} data-ouvrir={b.id} style={{ textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit' }}>
              <div style={{ fontWeight: 800, fontSize: 13.5 }}>{b.nom || 'Sans nom'}</div>
              <div className="sa-muted" style={{ fontSize: 12, margin: '4px 0' }}>{estBonus(b) ? 'Sondage bonus' : 'Quiz'} · {b.questions?.length ?? 0} question(s) · {estCommune(b) ? 'Commune Flowin' : nomPro(b.pro_id)}</div>
            </button>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: b.statut === 'valide' ? '#15803D' : '#B45309' }}>{b.statut === 'valide' ? 'VALIDÉE' : 'BROUILLON'}</span>
              {estCommune(b) && <span style={{ fontSize: 10, fontWeight: 800, color: '#5B34C2', background: 'rgba(122,79,224,.1)', borderRadius: 6, padding: '1px 7px' }}>{b.statut === 'valide' ? 'PARTAGÉE AVEC LES PROS' : 'NON PARTAGÉE'}</span>}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              <button className="sa-btn" disabled={occupe === b.id} data-valider={b.id} onClick={() => valider(b)} style={{ padding: '4px 10px', fontSize: 12 }}>{b.statut === 'valide' ? 'Repasser en brouillon' : 'Valider'}</button>
              <button className="sa-btn" onClick={() => setOuverte(b)} data-modifier={b.id} style={{ padding: '4px 10px', fontSize: 12 }}>Modifier</button>
              <button className="sa-btn danger-ghost" disabled={occupe === b.id} data-supprimer={b.id} onClick={() => supprimer(b)} style={{ padding: '4px 10px', fontSize: 12 }}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 28 }}>
  <ModelesBanques proId={proId} onInstalle={b => { setOuverte(b); charger() }} />
      </div>
    </div></div>
  )
}

export default function Page() { return <Suspense fallback={null}><Contenu /></Suspense> }
