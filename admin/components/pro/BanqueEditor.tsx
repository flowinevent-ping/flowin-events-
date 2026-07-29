'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Banque, QuestionQuiz, QuestionBonus, QuestionBanque } from '@/lib/banques'
import { enregistrerBanque, nouvelleQuestionQuiz, nouvelleQuestionBonus, blocDeQuatre, parseImportQuestions, mapQuestionsIA } from '@/lib/banques'
import { CARD, MUTED, ACC } from '@/lib/proui'
import { Ico } from '@/lib/proicons'
import { supabase } from '@/lib/supabase'

const btn: React.CSSProperties = { border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }
const inputStyle: React.CSSProperties = { width: '100%', border: '1.5px solid #E2E8F0', borderRadius: 9, padding: '9px 11px', fontSize: 13.5, fontFamily: 'inherit' }

export default function BanqueEditor({ banque, proId, estBonus }: { banque: Banque; proId: string; estBonus: boolean }) {
  const router = useRouter()
  const [nom, setNom] = useState(banque.nom)
  const [questions, setQuestions] = useState(banque.questions?.length ? banque.questions : blocDeQuatre(estBonus))
  const [statut, setStatut] = useState(banque.statut)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  const [panneau, setPanneau] = useState<'ia' | 'import' | null>(null)
  const [themeIA, setThemeIA] = useState('')
  const [nombreIA, setNombreIA] = useState(4)
  const [genIA, setGenIA] = useState<'idle' | 'busy' | 'echec'>('idle')
  const [erreurIA, setErreurIA] = useState<string | null>(null)
  const [texteImport, setTexteImport] = useState('')

  async function genererIA() {
    if (!themeIA.trim()) return
    setGenIA('busy'); setErreurIA(null)
    try {
      const res = await fetch('/api/pro/generer-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: themeIA.trim(), nombre: nombreIA, bonus: estBonus }),
      })
      const data = await res.json()
      if (!data.ok) { setGenIA('echec'); setErreurIA(data.error ?? 'Échec de la génération.'); return }
      const nouvelles = mapQuestionsIA(data.questions ?? [], estBonus)
      if (!nouvelles.length) { setGenIA('echec'); setErreurIA('Aucune question exploitable reçue.'); return }
      setQuestions(qs => [...qs, ...nouvelles])
      setGenIA('idle'); setThemeIA(''); setPanneau(null)
    } catch {
      setGenIA('echec'); setErreurIA('Échec de la génération — réessayez.')
    }
  }

  function importer() {
    const nouvelles = parseImportQuestions(texteImport, estBonus)
    if (!nouvelles.length) return
    setQuestions(qs => [...qs, ...nouvelles])
    setTexteImport(''); setPanneau(null)
  }

  function sauvegarder(valider: boolean) {
    setMessage(null)
    const propres = questions.filter(q => (estBonus ? (q as QuestionBonus).label : (q as QuestionQuiz).texte)?.trim())
    startTransition(async () => {
      const ok = await enregistrerBanque(banque.id, propres, valider)
      if (ok) {
        setStatut(valider ? 'valide' : 'brouillon')
        setQuestions(propres.length ? propres : blocDeQuatre(estBonus))
        setMessage(valider ? 'Banque validée et enregistrée.' : 'Brouillon enregistré.')
        router.refresh()
      } else {
        setMessage('Échec de l\u2019enregistrement — réessayez.')
      }
    })
  }

  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''

  return (
    <div>
      <div style={{ ...CARD, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={nom}
          onChange={e => setNom(e.target.value)}
          onBlur={() => { supabase.from('banques').update({ nom }).eq('id', banque.id) }}
          style={{ ...inputStyle, flex: 1, minWidth: 220, fontWeight: 800, fontSize: 16 }}
          placeholder="Nom de la banque"
        />
        <span style={{
          fontSize: 10.5, fontWeight: 800, borderRadius: 6, padding: '3px 9px', flexShrink: 0,
          background: statut === 'valide' ? 'rgba(21,128,61,.1)' : 'rgba(180,83,9,.1)',
          color: statut === 'valide' ? '#15803D' : '#B45309',
        }}>{statut === 'valide' ? 'VALIDÉE' : 'BROUILLON'}</span>
      </div>

      <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 16 }}>
        {estBonus
          ? 'Questions sondage — pas de bonne réponse, elles servent à connaître votre clientèle.'
          : 'Questions quiz — cochez la bonne réponse.'}
      </div>

      {estBonus ? (
        <BlocBonus questions={questions as QuestionBonus[]} onChange={next => setQuestions(next)} />
      ) : (
        <BlocQuiz questions={questions as QuestionQuiz[]} onChange={next => setQuestions(next)} />
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <button
          onClick={() => setQuestions(qs => [...qs, estBonus ? nouvelleQuestionBonus() : nouvelleQuestionQuiz()])}
          style={{ ...btn, background: '#fff', border: '1.5px solid #E2E8F0', color: '#0F172A' }}
        ><Ico k="plus" size={13} style={{ marginRight: 6 }} />Une question</button>
        <button
          onClick={() => setQuestions(qs => [...qs, ...blocDeQuatre(estBonus)])}
          style={{ ...btn, background: '#fff', border: '1.5px solid #E2E8F0', color: '#0F172A' }}
        ><Ico k="plus" size={13} style={{ marginRight: 6 }} />Un bloc de 4</button>
        <button
          onClick={() => setPanneau(p => p === 'ia' ? null : 'ia')}
          style={{ ...btn, background: panneau === 'ia' ? 'rgba(124,45,146,.08)' : '#fff', border: `1.5px solid ${panneau === 'ia' ? ACC : '#E2E8F0'}`, color: ACC }}
        ><Ico k="sparkle" size={13} style={{ marginRight: 6 }} />Générer avec l&apos;IA</button>
        <button
          onClick={() => setPanneau(p => p === 'import' ? null : 'import')}
          style={{ ...btn, background: panneau === 'import' ? 'rgba(124,45,146,.08)' : '#fff', border: `1.5px solid ${panneau === 'import' ? ACC : '#E2E8F0'}`, color: ACC }}
        ><Ico k="upload" size={13} style={{ marginRight: 6 }} />Importer</button>
      </div>

      {panneau === 'ia' && (
        <div style={{ ...CARD, background: '#F8FAFC' }}>
          <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 4 }}>Génération assistée par IA</div>
          <div style={{ fontSize: 12, ...MUTED, marginBottom: 12 }}>
            Décrivez un thème, l&apos;IA propose des questions {estBonus ? 'sondage' : 'quiz'} prêtes à relire et ajuster.
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 10 }}>
            <div style={{ flex: 2, minWidth: 200 }}>
              <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>Thème</label>
              <input style={inputStyle} value={themeIA} onChange={e => setThemeIA(e.target.value)} placeholder="Ex. Histoire de Vence et des Nuits du Sud" />
            </div>
            <div style={{ width: 90 }}>
              <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>Nombre</label>
              <input style={inputStyle} type="number" min={1} max={12} value={nombreIA} onChange={e => setNombreIA(Number(e.target.value))} />
            </div>
            <button
              disabled={genIA === 'busy' || !themeIA.trim()}
              onClick={genererIA}
              style={{ ...btn, background: ACC, color: '#fff', opacity: genIA === 'busy' || !themeIA.trim() ? 0.5 : 1 }}
            >{genIA === 'busy' ? 'Génération…' : 'Générer'}</button>
          </div>
          {genIA === 'echec' && <div style={{ fontSize: 12.5, color: '#B91C1C', fontWeight: 700 }}>{erreurIA}</div>}
        </div>
      )}

      {panneau === 'import' && (
        <div style={{ ...CARD, background: '#F8FAFC' }}>
          <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 4 }}>Importer des questions</div>
          <div style={{ fontSize: 12, ...MUTED, marginBottom: 10, lineHeight: 1.6 }}>
            Collez vos questions : un intitulé par bloc, une réponse par ligne, blocs séparés par une ligne vide.
            {!estBonus && ' Préfixez la bonne réponse par « * ».'}
          </div>
          <textarea
            value={texteImport}
            onChange={e => setTexteImport(e.target.value)}
            placeholder={estBonus
              ? 'Quel est votre plat préféré ?\nSalé\nSucré\n\nÀ quelle fréquence venez-vous ?\nRégulièrement\nOccasionnellement'
              : 'Capitale de la France ?\n*Paris\nLyon\nMarseille\n\nEn quelle année a eu lieu... ?\n2020\n*2021\n2022'}
            style={{ ...inputStyle, minHeight: 120, resize: 'vertical', fontFamily: 'inherit', marginBottom: 10 }}
          />
          <button disabled={!texteImport.trim()} onClick={importer} style={{ ...btn, background: ACC, color: '#fff', opacity: texteImport.trim() ? 1 : 0.5 }}>Importer</button>
        </div>
      )}

      <div style={{ marginTop: 8 }} />

      <div style={{ ...CARD, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', position: 'sticky', bottom: 12, boxShadow: '0 8px 24px rgba(15,23,42,.08)' }}>
        <button disabled={pending} onClick={() => sauvegarder(false)} style={{ ...btn, background: '#fff', border: '1.5px solid #E2E8F0', color: '#0F172A', opacity: pending ? 0.6 : 1 }}><Ico k="save" size={13} style={{ marginRight: 6 }} />Enregistrer en brouillon</button>
        <button disabled={pending} onClick={() => sauvegarder(true)} style={{ ...btn, background: ACC, color: '#fff', opacity: pending ? 0.6 : 1 }}><Ico k="check" size={13} style={{ marginRight: 6 }} />Valider</button>
        {message && <span style={{ fontSize: 12.5, ...MUTED }}>{message}</span>}
        <a href={`/pro/banques${q}`} style={{ marginLeft: 'auto', fontSize: 13, color: ACC, fontWeight: 700, textDecoration: 'none' }}>← Retour aux banques</a>
      </div>
    </div>
  )
}

/* ---- Quiz : options texte[] + index de bonne reponse ---- */
function BlocQuiz({ questions, onChange }: { questions: QuestionQuiz[]; onChange: (q: QuestionQuiz[]) => void }) {
  const maj = (id: string, patch: Partial<QuestionQuiz>) => onChange(questions.map(q => (q.id === id ? { ...q, ...patch } : q)))
  const majOpt = (id: string, i: number, val: string) => onChange(questions.map(q => (q.id === id ? { ...q, options: q.options.map((o, oi) => (oi === i ? val : o)) } : q)))
  const ajoutOpt = (id: string) => onChange(questions.map(q => (q.id === id ? { ...q, options: [...q.options, ''] } : q)))
  const retireOpt = (id: string, i: number) => onChange(questions.map(q => (q.id === id && q.options.length > 2 ? { ...q, options: q.options.filter((_, oi) => oi !== i), bonne: q.bonne === i ? 0 : q.bonne > i ? q.bonne - 1 : q.bonne } : q)))
  const retire = (id: string) => onChange(questions.filter(q => q.id !== id))

  return <>{questions.map((qst, qi) => (
    <div key={qst.id} style={{ ...CARD }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', paddingTop: 10, flexShrink: 0 }}>Q{qi + 1}</span>
        <input value={qst.texte} onChange={e => maj(qst.id, { texte: e.target.value })} placeholder="Intitulé de la question" style={{ ...inputStyle, flex: 1 }} />
        <button onClick={() => retire(qst.id)} style={{ ...btn, background: 'transparent', color: '#B45309', flexShrink: 0 }} title="Retirer la question">×</button>
      </div>
      <div style={{ paddingLeft: 30, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {qst.options.map((opt, oi) => (
          <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="radio" name={`bonne-${qst.id}`} checked={qst.bonne === oi} onChange={() => maj(qst.id, { bonne: oi })} title="Bonne réponse" />
            <input value={opt} onChange={e => majOpt(qst.id, oi, e.target.value)} placeholder={`Réponse ${oi + 1}`} style={{ ...inputStyle, flex: 1 }} />
            {qst.options.length > 2 && <button onClick={() => retireOpt(qst.id, oi)} style={{ ...btn, background: 'transparent', color: '#94A3B8', padding: '4px 8px' }}>×</button>}
          </div>
        ))}
        <button onClick={() => ajoutOpt(qst.id)} style={{ ...btn, background: 'transparent', color: ACC, alignSelf: 'flex-start', padding: '4px 0', fontSize: 12 }}>+ Ajouter une réponse</button>
        <input value={qst.explication ?? ''} onChange={e => maj(qst.id, { explication: e.target.value })} placeholder="Explication affichée après la réponse (optionnel)" style={{ ...inputStyle, marginTop: 4, fontSize: 12.5 }} />
      </div>
    </div>
  ))}</>
}

/* ---- Bonus/sondage : options {val,label}[], choix unique ou multiple, pas de bonne reponse ---- */
function BlocBonus({ questions, onChange }: { questions: QuestionBonus[]; onChange: (q: QuestionBonus[]) => void }) {
  const maj = (id: string, patch: Partial<QuestionBonus>) => onChange(questions.map(q => (q.id === id ? { ...q, ...patch } : q)))
  const majOpt = (id: string, i: number, label: string) => onChange(questions.map(q => (q.id === id ? { ...q, options: q.options.map((o, oi) => (oi === i ? { ...o, label } : o)) } : q)))
  const ajoutOpt = (id: string) => onChange(questions.map(q => (q.id === id ? { ...q, options: [...q.options, { val: String.fromCharCode(97 + q.options.length), label: '' }] } : q)))
  const retireOpt = (id: string, i: number) => onChange(questions.map(q => (q.id === id && q.options.length > 2 ? { ...q, options: q.options.filter((_, oi) => oi !== i) } : q)))
  const retire = (id: string) => onChange(questions.filter(q => q.id !== id))

  return <>{questions.map((qst, qi) => (
    <div key={qst.id} style={{ ...CARD }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', paddingTop: 10, flexShrink: 0 }}>Q{qi + 1}</span>
        <input value={qst.label} onChange={e => maj(qst.id, { label: e.target.value })} placeholder="Intitulé de la question" style={{ ...inputStyle, flex: 1 }} />
        <select value={qst.type} onChange={e => maj(qst.id, { type: e.target.value as 'single' | 'multi' })} style={{ ...inputStyle, width: 140, flexShrink: 0 }}>
          <option value="single">Choix unique</option>
          <option value="multi">Choix multiple</option>
        </select>
        <button onClick={() => retire(qst.id)} style={{ ...btn, background: 'transparent', color: '#B45309', flexShrink: 0 }} title="Retirer la question">×</button>
      </div>
      <div style={{ paddingLeft: 30, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {qst.options.map((opt, oi) => (
          <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={opt.label} onChange={e => majOpt(qst.id, oi, e.target.value)} placeholder={`Réponse ${oi + 1}`} style={{ ...inputStyle, flex: 1 }} />
            {qst.options.length > 2 && <button onClick={() => retireOpt(qst.id, oi)} style={{ ...btn, background: 'transparent', color: '#94A3B8', padding: '4px 8px' }}>×</button>}
          </div>
        ))}
        <button onClick={() => ajoutOpt(qst.id)} style={{ ...btn, background: 'transparent', color: ACC, alignSelf: 'flex-start', padding: '4px 0', fontSize: 12 }}>+ Ajouter une réponse</button>
      </div>
    </div>
  ))}</>
}
