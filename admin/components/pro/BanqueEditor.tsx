'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Banque, QuestionQuiz, QuestionBonus } from '@/lib/banques'
import { enregistrerBanque, nouvelleQuestionQuiz, nouvelleQuestionBonus, blocDeQuatre } from '@/lib/banques'
import { CARD, MUTED, ACC } from '@/lib/proui'
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

  function sauvegarder(valider: boolean) {
    setMessage(null)
    const propres = questions.filter(q => (estBonus ? (q as QuestionBonus).label : (q as QuestionQuiz).texte)?.trim())
    startTransition(async () => {
      const ok = await enregistrerBanque(banque.id, propres, valider)
      if (ok) {
        setStatut(valider ? 'valide' : 'brouillon')
        setQuestions(propres.length ? propres : blocDeQuatre(estBonus))
        setMessage(valider ? '✅ Banque validée et enregistrée.' : '💾 Brouillon enregistré.')
        router.refresh()
      } else {
        setMessage('⚠️ Échec de l\u2019enregistrement — réessayez.')
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

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <button
          onClick={() => setQuestions(qs => [...qs, estBonus ? nouvelleQuestionBonus() : nouvelleQuestionQuiz()])}
          style={{ ...btn, background: '#fff', border: '1.5px solid #E2E8F0', color: '#0F172A' }}
        >+ Une question</button>
        <button
          onClick={() => setQuestions(qs => [...qs, ...blocDeQuatre(estBonus)])}
          style={{ ...btn, background: '#fff', border: '1.5px solid #E2E8F0', color: '#0F172A' }}
        >+ Un bloc de 4</button>
      </div>

      <div style={{ ...CARD, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', position: 'sticky', bottom: 12, boxShadow: '0 8px 24px rgba(15,23,42,.08)' }}>
        <button disabled={pending} onClick={() => sauvegarder(false)} style={{ ...btn, background: '#fff', border: '1.5px solid #E2E8F0', color: '#0F172A', opacity: pending ? 0.6 : 1 }}>💾 Enregistrer en brouillon</button>
        <button disabled={pending} onClick={() => sauvegarder(true)} style={{ ...btn, background: ACC, color: '#fff', opacity: pending ? 0.6 : 1 }}>✅ Valider</button>
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
        <button onClick={() => retire(qst.id)} style={{ ...btn, background: 'transparent', color: '#B45309', flexShrink: 0 }} title="Retirer la question">✕</button>
      </div>
      <div style={{ paddingLeft: 30, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {qst.options.map((opt, oi) => (
          <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="radio" name={`bonne-${qst.id}`} checked={qst.bonne === oi} onChange={() => maj(qst.id, { bonne: oi })} title="Bonne réponse" />
            <input value={opt} onChange={e => majOpt(qst.id, oi, e.target.value)} placeholder={`Réponse ${oi + 1}`} style={{ ...inputStyle, flex: 1 }} />
            {qst.options.length > 2 && <button onClick={() => retireOpt(qst.id, oi)} style={{ ...btn, background: 'transparent', color: '#94A3B8', padding: '4px 8px' }}>✕</button>}
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
        <button onClick={() => retire(qst.id)} style={{ ...btn, background: 'transparent', color: '#B45309', flexShrink: 0 }} title="Retirer la question">✕</button>
      </div>
      <div style={{ paddingLeft: 30, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {qst.options.map((opt, oi) => (
          <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={opt.label} onChange={e => majOpt(qst.id, oi, e.target.value)} placeholder={`Réponse ${oi + 1}`} style={{ ...inputStyle, flex: 1 }} />
            {qst.options.length > 2 && <button onClick={() => retireOpt(qst.id, oi)} style={{ ...btn, background: 'transparent', color: '#94A3B8', padding: '4px 8px' }}>✕</button>}
          </div>
        ))}
        <button onClick={() => ajoutOpt(qst.id)} style={{ ...btn, background: 'transparent', color: ACC, alignSelf: 'flex-start', padding: '4px 0', fontSize: 12 }}>+ Ajouter une réponse</button>
      </div>
    </div>
  ))}</>
}
