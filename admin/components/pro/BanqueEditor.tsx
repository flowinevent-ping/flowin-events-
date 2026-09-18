'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Banque, QuestionQuiz, QuestionBonus, QuestionBanque, Difficulte } from '@/lib/banques'
import { enregistrerBanque, nouvelleQuestionQuiz, nouvelleQuestionBonus, blocDeQuatre, parseImportQuestions, mapQuestionsIA } from '@/lib/banques'
import { CARD, MUTED, ACC } from '@/lib/proui'
import { Ico } from '@/lib/proicons'
import { supabase } from '@/lib/supabase'

const btn: React.CSSProperties = { border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }
const inputStyle: React.CSSProperties = { width: '100%', border: '1.5px solid #efe9f2', borderRadius: 9, padding: '9px 11px', fontSize: 13.5, fontFamily: 'inherit' }

/* Rangement demande par Romain (18/09) : "rangement par theme et difficulte".
   Facultatif -- une question sans theme reste valide, juste non groupee au
   recapitulatif (voir Recap plus bas). */
function ThemeEtDifficulte({ theme, difficulte, onChange }: {
  theme?: string; difficulte?: Difficulte
  onChange: (patch: { theme?: string; difficulte?: Difficulte }) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
      <input
        value={theme ?? ''} onChange={e => onChange({ theme: e.target.value })}
        placeholder="Thème (optionnel)" style={{ ...inputStyle, flex: 1, fontSize: 12.5 }}
      />
      <select
        value={difficulte ?? ''} onChange={e => onChange({ difficulte: (e.target.value || undefined) as Difficulte | undefined })}
        style={{ ...inputStyle, width: 130, flexShrink: 0, fontSize: 12.5 }}
      >
        <option value="">Difficulté</option>
        <option value="facile">Facile</option>
        <option value="moyen">Moyen</option>
        <option value="difficile">Difficile</option>
      </select>
    </div>
  )
}

/* Refonte (18/09), consigne repetee de Romain, pas respectee la premiere
   fois : « un seul bloc de quatre questions, une reponse [correcte] et une
   reponse en cas d'echec [l'explication], valider a la fin, creer
   question par question » -- « ca fait beaucoup trop d'informations sur le
   meme ecran ». Les 4 questions du bloc de depart (deja le comportement de
   blocDeQuatre) s'affichaient TOUTES en meme temps, empilees. Elles passent
   maintenant une par une (etape), le bouton Enregistrer/Valider n'apparaissant
   qu'au recapitulatif final -- meme principe que le parcours /rejoindre. */
export default function BanqueEditor({ banque, proId, estBonus }: { banque: Banque; proId: string; estBonus: boolean }) {
  const router = useRouter()
  const [nom, setNom] = useState(banque.nom)
  const [questions, setQuestions] = useState(banque.questions?.length ? banque.questions : blocDeQuatre(estBonus))
  const [statut, setStatut] = useState(banque.statut)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  /* etape : index de la question en cours d edition, ou 'recap' une fois
     la derniere question passee. */
  const [etape, setEtape] = useState<number | 'recap'>(0)

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
        setMessage('Échec de l’enregistrement — réessayez.')
      }
    })
  }

  function ajouter(nouvelles: QuestionBanque[]) {
    setQuestions(qs => [...qs, ...nouvelles])
    setEtape(questions.length) // ouvre directement la premiere question ajoutee
  }
  function retirerQuestion(i: number) {
    setQuestions(qs => qs.filter((_, qi) => qi !== i))
    setEtape(e => {
      if (e === 'recap') return 'recap'
      if (i < e) return e - 1
      if (i === e) return Math.min(e, questions.length - 2)
      return e
    })
  }

  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''
  const qActuelle = typeof etape === 'number' ? questions[etape] : null

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
          : 'Questions quiz — une bonne réponse, une explication affichée en cas de mauvaise réponse.'}
      </div>

      {/* Progression : une pastille par question, celle en cours ou deja
          passee est pleine. Cliquer y revient directement. */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        {questions.map((qst, i) => {
          const rempli = (estBonus ? (qst as QuestionBonus).label : (qst as QuestionQuiz).texte)?.trim()
          const actif = etape === i
          return (
            <button key={qst.id} onClick={() => setEtape(i)}
              style={{
                width: 30, height: 30, borderRadius: '50%', border: `1.5px solid ${actif ? ACC : '#efe9f2'}`,
                background: actif ? ACC : rempli ? 'rgba(37,99,235,.08)' : '#fff',
                color: actif ? '#fff' : rempli ? ACC : '#94A3B8',
                fontWeight: 800, fontSize: 12, cursor: 'pointer',
              }}
              title={`Question ${i + 1}`}
            >{i + 1}</button>
          )
        })}
        <button onClick={() => setEtape('recap')}
          style={{
            marginLeft: 4, fontSize: 11.5, fontWeight: 800, borderRadius: 99, padding: '6px 12px',
            border: `1.5px solid ${etape === 'recap' ? ACC : '#efe9f2'}`,
            background: etape === 'recap' ? ACC : '#fff', color: etape === 'recap' ? '#fff' : '#1c1024', cursor: 'pointer',
          }}
        >Récapitulatif</button>
      </div>

      {qActuelle && typeof etape === 'number' && (estBonus ? (
        <UneQuestionBonus
          question={qActuelle as QuestionBonus} index={etape} total={questions.length}
          onChange={patch => setQuestions(qs => qs.map((x, i) => i === etape ? { ...(x as QuestionBonus), ...patch } : x))}
          onRetirer={() => retirerQuestion(etape)}
        />
      ) : (
        <UneQuestionQuiz
          question={qActuelle as QuestionQuiz} index={etape} total={questions.length}
          onChange={patch => setQuestions(qs => qs.map((x, i) => i === etape ? { ...(x as QuestionQuiz), ...patch } : x))}
          onRetirer={() => retirerQuestion(etape)}
        />
      ))}

      {typeof etape === 'number' && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button disabled={etape === 0} onClick={() => setEtape(e => (e as number) - 1)}
            style={{ ...btn, background: '#fff', border: '1.5px solid #efe9f2', color: '#1c1024', opacity: etape === 0 ? 0.4 : 1 }}>
            <Ico k="chevronLeft" size={13} style={{ marginRight: 4 }} />Précédente
          </button>
          <button onClick={() => { setEtape(etape + 1 < questions.length ? etape + 1 : 'recap') }}
            style={{ ...btn, background: ACC, color: '#fff', marginLeft: 'auto' }}>
            {etape + 1 < questions.length ? 'Question suivante' : 'Voir le récapitulatif'}
            <Ico k="chevronRight" size={13} style={{ marginLeft: 4 }} />
          </button>
        </div>
      )}

      {etape === 'recap' && (
        <>
          <div style={{ ...CARD }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Récapitulatif — {questions.length} question{questions.length > 1 ? 's' : ''}</div>
            {(() => {
              const uneQuestion = (qst: QuestionBanque, i: number) => {
                const intitule = estBonus ? (qst as QuestionBonus).label : (qst as QuestionQuiz).texte
                const bonne = !estBonus ? (qst as QuestionQuiz).options[(qst as QuestionQuiz).bonne] : null
                return (
                  <button key={qst.id} onClick={() => setEtape(i)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', borderTop: '1px solid #efe9f2', padding: '10px 0', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8' }}>Q{i + 1}</span>
                      {qst.difficulte && <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: ACC, background: 'rgba(37,99,235,.08)', borderRadius: 99, padding: '1px 7px' }}>{qst.difficulte}</span>}
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: intitule?.trim() ? '#1c1024' : '#B45309' }}>{intitule?.trim() || 'Intitulé manquant'}</div>
                    {bonne != null && <div style={{ fontSize: 12, color: '#15803D', marginTop: 2 }}>Bonne réponse : {bonne || '—'}</div>}
                  </button>
                )
              }
              /* Rangement par theme demande par Romain -- ne groupe que si au
                 moins une question porte un theme, sinon liste plate. */
              const auMoinsUnTheme = questions.some(q => q.theme?.trim())
              if (!auMoinsUnTheme) return questions.map((qst, i) => uneQuestion(qst, i))
              const groupes = new Map<string, { qst: QuestionBanque; i: number }[]>()
              questions.forEach((qst, i) => {
                const t = qst.theme?.trim() || 'Sans thème'
                if (!groupes.has(t)) groupes.set(t, [])
                groupes.get(t)!.push({ qst, i })
              })
              return Array.from(groupes.entries()).map(([theme, items]) => (
                <div key={theme} style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#94A3B8', marginTop: 10 }}>{theme}</div>
                  {items.map(({ qst, i }) => uneQuestion(qst, i))}
                </div>
              ))
            })()}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <button onClick={() => ajouter([estBonus ? nouvelleQuestionBonus() : nouvelleQuestionQuiz()])}
              style={{ ...btn, background: '#fff', border: '1.5px solid #efe9f2', color: '#1c1024' }}
            ><Ico k="plus" size={13} style={{ marginRight: 6 }} />Une question</button>
            <button onClick={() => ajouter(blocDeQuatre(estBonus))}
              style={{ ...btn, background: '#fff', border: '1.5px solid #efe9f2', color: '#1c1024' }}
            ><Ico k="plus" size={13} style={{ marginRight: 6 }} />Un bloc de 4</button>
            <button onClick={() => setPanneau(p => p === 'ia' ? null : 'ia')}
              style={{ ...btn, background: panneau === 'ia' ? 'rgba(37,99,235,.08)' : '#fff', border: `1.5px solid ${panneau === 'ia' ? ACC : '#efe9f2'}`, color: ACC }}
            ><Ico k="sparkle" size={13} style={{ marginRight: 6 }} />Générer avec l&apos;IA</button>
            <button onClick={() => setPanneau(p => p === 'import' ? null : 'import')}
              style={{ ...btn, background: panneau === 'import' ? 'rgba(37,99,235,.08)' : '#fff', border: `1.5px solid ${panneau === 'import' ? ACC : '#efe9f2'}`, color: ACC }}
            ><Ico k="upload" size={13} style={{ marginRight: 6 }} />Importer</button>
          </div>

          {panneau === 'ia' && (
            <div style={{ ...CARD, background: '#faf7fd' }}>
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
            <div style={{ ...CARD, background: '#faf7fd' }}>
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
            <button disabled={pending} onClick={() => sauvegarder(false)} style={{ ...btn, background: '#fff', border: '1.5px solid #efe9f2', color: '#1c1024', opacity: pending ? 0.6 : 1 }}><Ico k="save" size={13} style={{ marginRight: 6 }} />Enregistrer en brouillon</button>
            <button disabled={pending} onClick={() => sauvegarder(true)} style={{ ...btn, background: ACC, color: '#fff', opacity: pending ? 0.6 : 1 }}><Ico k="check" size={13} style={{ marginRight: 6 }} />Valider</button>
            {message && <span style={{ fontSize: 12.5, ...MUTED }}>{message}</span>}
            <a href={`/pro/banques${q}`} style={{ marginLeft: 'auto', fontSize: 13, color: ACC, fontWeight: 700, textDecoration: 'none' }}>← Retour aux banques</a>
          </div>
        </>
      )}
    </div>
  )
}

/* ---- Quiz : UNE question a la fois -- intitule, options, bonne reponse,
   explication affichee en cas d erreur. ---- */
function UneQuestionQuiz({ question: qst, index, total, onChange, onRetirer }: {
  question: QuestionQuiz; index: number; total: number
  onChange: (patch: Partial<QuestionQuiz>) => void
  onRetirer: () => void
}) {
  const majOpt = (i: number, val: string) => onChange({ options: qst.options.map((o, oi) => (oi === i ? val : o)) })
  const ajoutOpt = () => onChange({ options: [...qst.options, ''] })
  const retireOpt = (i: number) => onChange({ options: qst.options.filter((_, oi) => oi !== i), bonne: qst.bonne === i ? 0 : qst.bonne > i ? qst.bonne - 1 : qst.bonne })

  return (
    <div style={{ ...CARD }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', paddingTop: 10, flexShrink: 0 }}>Q{index + 1}/{total}</span>
        <input value={qst.texte} onChange={e => onChange({ texte: e.target.value })} placeholder="Intitulé de la question" style={{ ...inputStyle, flex: 1 }} autoFocus />
        {total > 1 && <button onClick={onRetirer} style={{ ...btn, background: 'transparent', color: '#B45309', flexShrink: 0 }} title="Retirer la question">×</button>}
      </div>
      <div style={{ paddingLeft: 30 }}>
        <ThemeEtDifficulte theme={qst.theme} difficulte={qst.difficulte} onChange={onChange} />
      </div>
      <div style={{ paddingLeft: 30, display: 'flex', flexDirection: 'column', gap: 7, marginTop: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: -2 }}>Réponses — cochez la bonne</div>
        {qst.options.map((opt, oi) => (
          <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="radio" name={`bonne-${qst.id}`} checked={qst.bonne === oi} onChange={() => onChange({ bonne: oi })} title="Bonne réponse" />
            <input value={opt} onChange={e => majOpt(oi, e.target.value)} placeholder={`Réponse ${oi + 1}`} style={{ ...inputStyle, flex: 1, borderColor: qst.bonne === oi ? '#15803D' : undefined }} />
            {qst.options.length > 2 && <button onClick={() => retireOpt(oi)} style={{ ...btn, background: 'transparent', color: '#94A3B8', padding: '4px 8px' }}>×</button>}
          </div>
        ))}
        <button onClick={ajoutOpt} style={{ ...btn, background: 'transparent', color: ACC, alignSelf: 'flex-start', padding: '4px 0', fontSize: 12 }}>+ Ajouter une réponse</button>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', marginTop: 4 }}>En cas de mauvaise réponse</div>
        <input value={qst.explication ?? ''} onChange={e => onChange({ explication: e.target.value })} placeholder="Explication affichée après une réponse fausse (optionnel)" style={{ ...inputStyle, fontSize: 12.5 }} />
      </div>
    </div>
  )
}

/* ---- Bonus/sondage : UNE question a la fois -- options {val,label}[], choix unique ou multiple, pas de bonne reponse ---- */
function UneQuestionBonus({ question: qst, index, total, onChange, onRetirer }: {
  question: QuestionBonus; index: number; total: number
  onChange: (patch: Partial<QuestionBonus>) => void
  onRetirer: () => void
}) {
  const majOpt = (i: number, label: string) => onChange({ options: qst.options.map((o, oi) => (oi === i ? { ...o, label } : o)) })
  const ajoutOpt = () => onChange({ options: [...qst.options, { val: String.fromCharCode(97 + qst.options.length), label: '' }] })
  const retireOpt = (i: number) => onChange({ options: qst.options.filter((_, oi) => oi !== i) })

  return (
    <div style={{ ...CARD }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', paddingTop: 10, flexShrink: 0 }}>Q{index + 1}/{total}</span>
        <input value={qst.label} onChange={e => onChange({ label: e.target.value })} placeholder="Intitulé de la question" style={{ ...inputStyle, flex: 1 }} autoFocus />
        <select value={qst.type} onChange={e => onChange({ type: e.target.value as 'single' | 'multi' })} style={{ ...inputStyle, width: 140, flexShrink: 0 }}>
          <option value="single">Choix unique</option>
          <option value="multi">Choix multiple</option>
        </select>
        {total > 1 && <button onClick={onRetirer} style={{ ...btn, background: 'transparent', color: '#B45309', flexShrink: 0 }} title="Retirer la question">×</button>}
      </div>
      <div style={{ paddingLeft: 30 }}>
        <ThemeEtDifficulte theme={qst.theme} difficulte={qst.difficulte} onChange={onChange} />
      </div>
      <div style={{ paddingLeft: 30, display: 'flex', flexDirection: 'column', gap: 7, marginTop: 10 }}>
        {qst.options.map((opt, oi) => (
          <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={opt.label} onChange={e => majOpt(oi, e.target.value)} placeholder={`Réponse ${oi + 1}`} style={{ ...inputStyle, flex: 1 }} />
            {qst.options.length > 2 && <button onClick={() => retireOpt(oi)} style={{ ...btn, background: 'transparent', color: '#94A3B8', padding: '4px 8px' }}>×</button>}
          </div>
        ))}
        <button onClick={ajoutOpt} style={{ ...btn, background: 'transparent', color: ACC, alignSelf: 'flex-start', padding: '4px 0', fontSize: 12 }}>+ Ajouter une réponse</button>
      </div>
    </div>
  )
}
