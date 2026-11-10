'use client'

/**
 * BANQUES MODELES PAR METIER -- catalogue pret a l emploi (restaurateur, pizzeria, boulanger,
 * boucher, libraire). Donnees : lib/banquesModeles (format exact de la table `banques`).
 * « Ajouter a mes banques » copie la banque dans le compte choisi, sur clic d une personne ;
 * rien n est ecrit en base tant que personne n a clique. Meme composant cote Super Admin
 * (/dashboard/banques) et cote espace pro (/pro/banques).
 */
import { useState } from 'react'
import { BANQUES_MODELES, METIERS, modelesDuMetier, type BanqueModele, type Metier } from '@/lib/banquesModeles'
import { installerModele } from '@/lib/banquesModeles/installer'
import type { Banque, QuestionBonus, QuestionQuiz } from '@/lib/banques'
import { remplacer } from '@/lib/banquesModeles/resoudre'

const BORD = '#e5e1ea'
const ACCENT = '#3B5CC4'

/** Enonce d un modele pour l apercu : les {variables} montrent leur placeholder « a completer ». */
function enonceApercu(q: QuestionQuiz): string {
  if (!q.modele) return q.texte
  const vals: Record<string, string> = {}
  q.modele.variables.forEach(v => { vals[v.cle] = v.placeholder })
  return remplacer(q.texte, vals)
}

function nbQuestions(b: BanqueModele) { return b.questions.length }

export default function ModelesBanques({ proId, onInstalle, lienBase, lienSuffixe = '' }: {
  proId: string
  /** Appelee apres une copie reussie (le Super Admin ouvre la banque dans l editeur). */
  onInstalle?: (b: Banque) => void
  /** Espace pro : debut du lien vers la banque copiee (ex. « /pro/banques/ »), suivi de l identifiant puis de `lienSuffixe`. */
  lienBase?: string
  lienSuffixe?: string
}) {
  const [metier, setMetier] = useState<Metier | 'tous'>('tous')
  const [ouvert, setOuvert] = useState<string | null>(null)
  const [encours, setEncours] = useState<string | null>(null)
  const [fait, setFait] = useState<Record<string, string>>({})
  const [erreur, setErreur] = useState('')

  const liste = modelesDuMetier(metier)

  async function ajouter(m: BanqueModele) {
    if (!proId) { setErreur('Choisissez d’abord à quel compte ajouter la banque.'); return }
    setErreur(''); setEncours(m.id)
    const b = await installerModele(proId, m)
    setEncours(null)
    if (!b) { setErreur('Banque non ajoutée (droit refusé ou erreur réseau). Réessayez.'); return }
    setFait(f => ({ ...f, [m.id]: b.id }))
    if (onInstalle) onInstalle(b)
  }

  const chip = (actif: boolean): React.CSSProperties => ({
    border: `1.5px solid ${actif ? ACCENT : BORD}`, background: actif ? ACCENT : '#fff', color: actif ? '#fff' : '#1c1024',
    borderRadius: 99, padding: '7px 14px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
  })

  return (
    <section data-modeles-banques style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 4px' }}>Banques modèles par métier</h2>
      <p style={{ fontSize: 12.5, opacity: 0.75, margin: '0 0 12px', lineHeight: 1.5 }}>
        Des questions prêtes à l’emploi pour varier les parties et ne lasser personne : quiz à 3 niveaux, mini-sondages
        sans bonne réponse, et <b>questions personnalisées</b> que le commerçant complète lui-même (serveuse, plat signature, année de création…).
        « Ajouter » en fait une copie modifiable.
      </p>
      <div role="tablist" aria-label="Filtrer par métier" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <button role="tab" aria-selected={metier === 'tous'} data-metier="tous" style={chip(metier === 'tous')} onClick={() => setMetier('tous')}>Tous les métiers</button>
        {METIERS.map(m => (
          <button key={m.id} role="tab" aria-selected={metier === m.id} data-metier={m.id} style={chip(metier === m.id)} onClick={() => setMetier(m.id)}>{m.nom}</button>
        ))}
      </div>
      {erreur && <div role="alert" style={{ background: '#fff4e5', border: '1px solid #f5c98b', borderRadius: 10, padding: '8px 12px', fontSize: 12.5, marginBottom: 12 }}>{erreur}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,300px),1fr))', gap: 12 }}>
        {liste.map(m => {
          const est = ouvert === m.id
          const ajoutee = fait[m.id]
          return (
            <div key={m.id} data-modele={m.id} style={{ background: '#fff', border: `1px solid ${BORD}`, borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: m.genre === 'bonus' ? '#B45309' : ACCENT, background: m.genre === 'bonus' ? 'rgba(180,83,9,.1)' : 'rgba(122,79,224,.1)', borderRadius: 6, padding: '2px 8px' }}>{m.genre === 'bonus' ? 'Sondage bonus' : 'Quiz'}</span>
                {m.personnalisable && <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: '#0B7A4F', background: 'rgba(11,122,79,.1)', borderRadius: 6, padding: '2px 8px' }}>À compléter par le commerçant</span>}
              </div>
              <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.3 }}>{m.nom}</div>
              <div style={{ fontSize: 12.5, opacity: 0.75, lineHeight: 1.45 }}>{m.description}</div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{nbQuestions(m)} question{nbQuestions(m) > 1 ? 's' : ''} · {m.metiers.map(x => METIERS.find(y => y.id === x)?.nom).join(', ')}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
                <button type="button" onClick={() => setOuvert(est ? null : m.id)} aria-expanded={est} data-apercu={m.id}
                  style={{ border: `1.5px solid ${BORD}`, background: '#fff', borderRadius: 9, padding: '7px 12px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{est ? 'Masquer' : 'Voir les questions'}</button>
                {ajoutee ? (
                  lienBase
                    ? <a href={lienBase + ajoutee + lienSuffixe} style={{ fontSize: 12.5, fontWeight: 800, color: '#15803D', alignSelf: 'center' }}>Ajoutée — ouvrir</a>
                    : <span style={{ fontSize: 12.5, fontWeight: 800, color: '#15803D', alignSelf: 'center' }}>Ajoutée</span>
                ) : (
                  <button type="button" disabled={encours === m.id} onClick={() => ajouter(m)} data-ajouter={m.id}
                    style={{ border: 'none', background: ACCENT, color: '#fff', borderRadius: 9, padding: '7px 12px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', opacity: encours === m.id ? 0.6 : 1, fontFamily: 'inherit' }}>{encours === m.id ? 'Ajout…' : 'Ajouter à mes banques'}</button>
                )}
              </div>
              {est && (
                <ol style={{ margin: '4px 0 0', padding: 0, listStyle: 'none', maxHeight: 320, overflow: 'auto', borderTop: `1px solid ${BORD}` }}>
                  {m.questions.map((q, i) => {
                    const quiz = q.type === 'qcm' ? (q as QuestionQuiz) : null
                    const intitule = quiz ? enonceApercu(quiz) : (q as QuestionBonus).label
                    return (
                      <li key={q.id} style={{ padding: '8px 0', borderBottom: `1px solid ${BORD}`, fontSize: 12.5, lineHeight: 1.45 }}>
                        <div style={{ opacity: 0.6, fontSize: 11, fontWeight: 800 }}>
                          Q{i + 1}{q.theme ? ` · ${q.theme}` : ''}{q.difficulte ? ` · ${q.difficulte}` : ''}
                        </div>
                        <div style={{ fontWeight: 700 }}>{intitule}</div>
                        {quiz && !quiz.modele && <div style={{ color: '#15803D' }}>Bonne réponse : {quiz.options[quiz.bonne]}</div>}
                        {quiz && quiz.modele && <div style={{ color: '#0B7A4F' }}>Réponse : à compléter par le commerçant</div>}
                        {!quiz && <div style={{ opacity: 0.7 }}>{(q as QuestionBonus).options.map(o => o.label).join(' · ')}</div>}
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
          )
        })}
      </div>
      <p style={{ fontSize: 11.5, opacity: 0.6, marginTop: 10 }}>{BANQUES_MODELES.length} banques modèles · les faits sont des connaissances générales, relisez-les avant de valider.</p>
    </section>
  )
}
