'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Banque, QuestionQuiz, QuestionBonus, QuestionBanque, Difficulte } from '@/lib/banques'
import { enregistrerBanque, nouvelleQuestionQuiz, nouvelleQuestionBonus, blocDeQuatre, parseImportQuestions, mapQuestionsIA } from '@/lib/banques'
import { CARD, MUTED, ACC } from '@/lib/proui'
import { Ico } from '@/lib/proicons'
import { supabase } from '@/lib/supabase'
import { diagnostiquerModele } from '@/lib/banquesModeles/resoudre'
import { BANQUES_MODELES, METIERS, type Metier } from '@/lib/banquesModeles'

/* Applique une modification a la question n°i. Pour une question personnalisee, le nom de
   l etablissement est recopie dans les autres questions personnalisees encore « synchronisees »
   (vides ou egales a l ancienne valeur) : on le saisit une fois, pas quatorze. */
function appliquerPatch(qs: QuestionBanque[], i: number, patch: Partial<QuestionQuiz> | Partial<QuestionBonus>): QuestionBanque[] {
  const avant = qs[i] as QuestionQuiz
  const apres = { ...avant, ...patch } as QuestionBanque
  const ancien = avant.modele?.variables.find(v => v.cle === 'etablissement')?.valeur ?? ''
  const nouveau = (apres as QuestionQuiz).modele?.variables.find(v => v.cle === 'etablissement')?.valeur ?? ''
  return qs.map((x, k) => {
    if (k === i) return apres
    const m = (x as QuestionQuiz).modele
    if (!m || ancien === nouveau) return x
    const v = m.variables.find(y => y.cle === 'etablissement')
    if (!v || (v.valeur ?? '') !== ancien) return x
    return { ...(x as QuestionQuiz), modele: { ...m, variables: m.variables.map(y => y.cle === 'etablissement' ? { ...y, valeur: nouveau } : y) } }
  })
}

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
export default function BanqueEditor({ banque, proId, estBonus, lienRetour }: { banque: Banque; proId: string; estBonus: boolean; /** Super Admin : retour vers /dashboard/banques */ lienRetour?: string }) {
  const router = useRouter()
  const [nom, setNom] = useState(banque.nom)
  const [questions, setQuestions] = useState(banque.questions?.length ? banque.questions : blocDeQuatre(estBonus))
  const [statut, setStatut] = useState(banque.statut)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  /* etape : index de la question en cours d edition, ou 'recap' une fois
     la derniere question passee. */
  const [etape, setEtape] = useState<number | 'recap'>(0)

  const [panneau, setPanneau] = useState<'ia' | 'import' | 'modeles' | null>(null)
  const [metierModele, setMetierModele] = useState<Metier>('restaurateur')
  const [themeIA, setThemeIA] = useState('')
  /* `nombreIA` reste une CHAINE brute tant qu'on tape : la convertir en Number()
     a chaque frappe puis la reinjecter dans `value` produisait des courses avec
     le champ number natif du navigateur (le DOM affichait deja le caractere
     tape avant le re-rendu React) -- symptome constate par Romain (18/09),
     un « 0300 » impossible a obtenir en tapant normalement. Le nettoyage
     (borne 1-12, repli sur 4) n'a lieu qu'a la perte de focus et a l'appel API. */
  const [nombreIA, setNombreIA] = useState('4')
  const nombreIAPropre = () => Math.min(Math.max(Math.round(Number(nombreIA)) || 4, 1), 12)
  const [contexteIA, setContexteIA] = useState('')
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
        body: JSON.stringify({ theme: themeIA.trim(), nombre: nombreIAPropre(), bonus: estBonus, contexte: contexteIA.trim() }),
      })
      const data = await res.json()
      if (!data.ok) { setGenIA('echec'); setErreurIA(data.error ?? 'Échec de la génération.'); return }
      const nouvelles = mapQuestionsIA(data.questions ?? [], estBonus)
      if (!nouvelles.length) { setGenIA('echec'); setErreurIA('Aucune question exploitable reçue.'); return }
      setQuestions(qs => [...qs, ...nouvelles])
      setGenIA('idle'); setThemeIA(''); setContexteIA(''); setNombreIA('4'); setPanneau(null)
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
                background: actif ? ACC : rempli ? 'rgba(122,79,224,.08)' : '#fff',
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
          onChange={patch => setQuestions(qs => appliquerPatch(qs, etape, patch))}
          onRetirer={() => retirerQuestion(etape)}
        />
      ) : (
        <UneQuestionQuiz
          question={qActuelle as QuestionQuiz} index={etape} total={questions.length}
          onChange={patch => setQuestions(qs => appliquerPatch(qs, etape, patch))}
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
                const mod = !estBonus && (qst as QuestionQuiz).modele ? diagnostiquerModele(qst as QuestionQuiz) : null
                const bonne = !estBonus ? (mod ? (mod.resolue ? mod.resolue.options[mod.resolue.bonne] : null) : (qst as QuestionQuiz).options[(qst as QuestionQuiz).bonne]) : null
                return (
                  <button key={qst.id} onClick={() => setEtape(i)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', borderTop: '1px solid #efe9f2', padding: '10px 0', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8' }}>Q{i + 1}</span>
                      {mod && <span data-a-completer style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: mod.complet ? '#15803D' : '#B45309', background: mod.complet ? 'rgba(21,128,61,.1)' : 'rgba(180,83,9,.1)', borderRadius: 99, padding: '1px 7px' }}>{mod.complet ? 'Personnalisée' : 'À compléter'}</span>}
                      {qst.difficulte && <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: ACC, background: 'rgba(122,79,224,.08)', borderRadius: 99, padding: '1px 7px' }}>{qst.difficulte}</span>}
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: intitule?.trim() ? '#1c1024' : '#B45309' }}>{mod?.resolue ? mod.resolue.texte : (intitule?.trim() || 'Intitulé manquant')}</div>
                    {bonne != null && <div style={{ fontSize: 12, color: '#15803D', marginTop: 2 }}>Bonne réponse : {bonne || '—'}</div>}
                    {mod && !mod.complet && <div style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>{mod.probleme ?? `Pas encore posée aux joueurs : il manque ${mod.manquants.length} champ${mod.manquants.length > 1 ? 's' : ''} à compléter.`}</div>}
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
            <button onClick={() => setPanneau(p => p === 'modeles' ? null : 'modeles')} data-panneau-modeles
              style={{ ...btn, background: panneau === 'modeles' ? 'rgba(122,79,224,.08)' : '#fff', border: `1.5px solid ${panneau === 'modeles' ? ACC : '#efe9f2'}`, color: ACC }}
            ><Ico k="plus" size={13} style={{ marginRight: 6 }} />Piocher dans les modèles</button>
            <button onClick={() => setPanneau(p => p === 'ia' ? null : 'ia')}
              style={{ ...btn, background: panneau === 'ia' ? 'rgba(122,79,224,.08)' : '#fff', border: `1.5px solid ${panneau === 'ia' ? ACC : '#efe9f2'}`, color: ACC }}
            ><Ico k="sparkle" size={13} style={{ marginRight: 6 }} />Générer avec l&apos;IA</button>
            <button onClick={() => setPanneau(p => p === 'import' ? null : 'import')}
              style={{ ...btn, background: panneau === 'import' ? 'rgba(122,79,224,.08)' : '#fff', border: `1.5px solid ${panneau === 'import' ? ACC : '#efe9f2'}`, color: ACC }}
            ><Ico k="upload" size={13} style={{ marginRight: 6 }} />Importer</button>
          </div>

          {panneau === 'modeles' && (
            <PanneauModeles
              estBonus={estBonus} metier={metierModele} onMetier={setMetierModele}
              onAjouter={nouvelles => { ajouter(nouvelles); setPanneau(null) }}
            />
          )}

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
                  <input
                    style={inputStyle} type="number" min={1} max={12} inputMode="numeric"
                    value={nombreIA}
                    onChange={e => setNombreIA(e.target.value)}
                    onBlur={() => setNombreIA(String(nombreIAPropre()))}
                  />
                </div>
              </div>
              {/* « une boite de chat avec toi en ecran » (Romain, 18/09) : un texte
                  colle donne un vrai contexte a l'IA, plutot que le seul theme court
                  -- un paragraphe d'histoire locale, un extrait de site, des notes. */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>Contexte (optionnel)</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }}
                  value={contexteIA}
                  onChange={e => setContexteIA(e.target.value)}
                  placeholder="Collez ici un texte pour guider l'IA : historique du lieu, programme de la soirée, notes de brief…"
                  maxLength={6000}
                />
                <div style={{ fontSize: 10.5, ...MUTED, marginTop: 3, textAlign: 'right' }}>{contexteIA.length}/6000</div>
              </div>
              <button
                disabled={genIA === 'busy' || !themeIA.trim()}
                onClick={genererIA}
                style={{ ...btn, background: ACC, color: '#fff', opacity: genIA === 'busy' || !themeIA.trim() ? 0.5 : 1 }}
              >{genIA === 'busy' ? 'Génération…' : 'Générer'}</button>
              {genIA === 'echec' && <div style={{ fontSize: 12.5, color: '#B91C1C', fontWeight: 700, marginTop: 8 }}>{erreurIA}</div>}
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
            <a href={lienRetour ?? `/pro/banques${q}`} style={{ marginLeft: 'auto', fontSize: 13, color: ACC, fontWeight: 700, textDecoration: 'none' }}>← Retour aux banques</a>
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
      {qst.modele && <BlocModele question={qst} onChange={onChange} />}
      {!qst.modele && <div style={{ paddingLeft: 30, display: 'flex', flexDirection: 'column', gap: 7, marginTop: 10 }}>
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
      </div>}
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

/* ---- Piocher dans les banques modeles : questions deja ecrites, par metier ---- */
function PanneauModeles({ estBonus, metier, onMetier, onAjouter }: {
  estBonus: boolean; metier: Metier; onMetier: (m: Metier) => void; onAjouter: (qs: QuestionBanque[]) => void
}) {
  const banques = BANQUES_MODELES.filter(b => (estBonus ? b.genre === 'bonus' : b.genre === 'quiz') && b.metiers.indexOf(metier) >= 0)
  /* Copie profonde + nouveaux identifiants : la meme question peut etre ajoutee dans plusieurs banques. */
  const copier = (qs: QuestionBanque[]): QuestionBanque[] => qs.map(q => ({ ...JSON.parse(JSON.stringify(q)), id: 'q_' + Math.random().toString(36).slice(2, 9) }))
  return (
    <div style={{ ...CARD, background: '#faf7fd' }} data-panneau="modeles">
      <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 4 }}>Questions prêtes à l&apos;emploi</div>
      <div style={{ fontSize: 12, ...MUTED, marginBottom: 10, lineHeight: 1.5 }}>
        Choisissez votre métier, puis ajoutez une question ou toute une série. Les <b>questions personnalisées</b> restent « à compléter » :
        vous renseignez vous-même vos réponses.
      </div>
      <select value={metier} onChange={e => onMetier(e.target.value as Metier)} aria-label="Métier" style={{ ...inputStyle, maxWidth: 240, marginBottom: 10 }}>
        {METIERS.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
      </select>
      {banques.length === 0 && <div style={{ fontSize: 12.5, ...MUTED }}>Aucun modèle pour ce métier.</div>}
      {banques.map(b => (
        <details key={b.id} style={{ borderTop: '1px solid #efe9f2', padding: '8px 0' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            {b.nom} <span style={{ ...MUTED, fontWeight: 600 }}>({b.questions.length})</span>
            {b.personnalisable && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 800, color: '#0B7A4F' }}>À COMPLÉTER</span>}
          </summary>
          <button onClick={() => onAjouter(copier(b.questions))} style={{ ...btn, background: ACC, color: '#fff', padding: '6px 12px', fontSize: 12, margin: '8px 0' }}>Ajouter les {b.questions.length} questions</button>
          {b.questions.map(q => {
            const t = q.type === 'qcm' ? (q as QuestionQuiz).texte : (q as QuestionBonus).label
            return (
              <div key={q.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '5px 0', fontSize: 12.5 }}>
                <span style={{ flex: 1 }}>{t}</span>
                <button onClick={() => onAjouter(copier([q]))} style={{ ...btn, background: '#fff', border: '1.5px solid #efe9f2', color: ACC, padding: '3px 10px', fontSize: 11.5, flexShrink: 0 }}>Ajouter</button>
              </div>
            )
          })}
        </details>
      ))}
    </div>
  )
}

/* ---- Question personnalisee : champs « a completer par le commercant » + apercu joueur ---- */
function BlocModele({ question: qst, onChange }: { question: QuestionQuiz; onChange: (patch: Partial<QuestionQuiz>) => void }) {
  const m = qst.modele!
  const d = diagnostiquerModele(qst)
  const majVar = (cle: string, valeur: string) => onChange({ modele: { ...m, variables: m.variables.map(v => v.cle === cle ? { ...v, valeur } : v) } })
  const majOpt = (i: number, val: string) => onChange({ options: qst.options.map((o, oi) => (oi === i ? val : o)) })
  return (
    <div data-bloc-modele style={{ margin: '4px 0 12px 30px', border: '1.5px solid #bfe3d3', background: '#f3fbf7', borderRadius: 12, padding: 12 }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: '#0B7A4F', marginBottom: 2 }}>Question personnalisée : à compléter par le commerçant</div>
      <div style={{ fontSize: 11.5, ...MUTED, marginBottom: 10, lineHeight: 1.5 }}>
        Les mots entre {'{'}accolades{'}'} sont remplacés par vos réponses. Tant qu&apos;un champ est vide, la question n&apos;est jamais posée aux joueurs.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {m.variables.map(v => {
          const vide = !(v.valeur ?? '').trim()
          return (
            <label key={v.cle} style={{ display: 'block' }}>
              <span style={{ fontSize: 11, fontWeight: 700, display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                {v.label}
                {vide && <span style={{ fontSize: 9.5, fontWeight: 800, color: '#B45309', background: 'rgba(180,83,9,.1)', borderRadius: 99, padding: '1px 7px' }}>À COMPLÉTER</span>}
              </span>
              <input data-variable={v.cle} value={v.valeur ?? ''} onChange={e => majVar(v.cle, e.target.value)} placeholder={v.placeholder}
                inputMode={m.mode === 'annee' && v.cle === 'reponse' ? 'numeric' : m.mode === 'nombre' && v.cle === 'reponse' ? 'numeric' : undefined}
                style={{ ...inputStyle, boxSizing: 'border-box', borderColor: vide ? '#f0c27a' : '#bfe3d3', background: '#fff' }} />
            </label>
          )
        })}
      </div>
      {m.mode === 'choix' && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Mauvaises réponses proposées par défaut (modifiables)</div>
          {[1, 2, 3].map(i => <input key={i} value={qst.options[i] ?? ''} onChange={e => majOpt(i, e.target.value)} style={{ ...inputStyle, boxSizing: 'border-box', marginBottom: 6, background: '#fff' }} />)}
        </div>
      )}
      {(m.mode === 'annee' || m.mode === 'nombre') && (
        <div style={{ fontSize: 11.5, ...MUTED, marginTop: 10 }}>Les 3 mauvaises propositions sont calculées automatiquement autour de votre réponse.</div>
      )}
      <div data-apercu-joueur style={{ marginTop: 12, background: '#fff', border: '1px solid #e5e1ea', borderRadius: 10, padding: 10 }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#94A3B8', marginBottom: 4 }}>Aperçu joueur</div>
        {d.resolue ? (
          <>
            <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 6 }}>{d.resolue.texte}</div>
            {d.resolue.options.map((o, i) => (
              <div key={i} style={{ fontSize: 12.5, padding: '3px 0', color: i === d.resolue!.bonne ? '#15803D' : '#1c1024', fontWeight: i === d.resolue!.bonne ? 800 : 500 }}>
                {String.fromCharCode(65 + i)}. {o}{i === d.resolue!.bonne ? '  (bonne réponse)' : ''}
              </div>
            ))}
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: '#B45309' }}>
            {d.probleme ?? `Pas encore jouable : il manque ${d.manquants.map(x => x.label.toLowerCase()).join(', ')}.`}
          </div>
        )}
      </div>
    </div>
  )
}
