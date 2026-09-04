'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { creerAnimation } from '@/lib/pro'
import { fetchBanquesPro, type Banque } from '@/lib/banques'
import { CARD, MUTED, ACC } from '@/lib/proui'
import { Ico } from '@/lib/proicons'
import { GABARIT_MODULE, GABARIT_NOM } from '@/lib/gabarit'
import ApercuApp, { type EcranApercu } from '@/components/dashboard/ApercuApp'

const ICONES: Record<string, React.ReactNode> = {
  /* Le gabarit de reference. Meme dessin que cote SA (app/dashboard/wizard-event) :
     deux surfaces, une seule identite visuelle pour le meme gabarit. */
  [GABARIT_MODULE]: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#7C2D92" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.6" stroke="#7C2D92" strokeWidth="1.6" /><circle cx="12" cy="12" r="1.4" fill="#7C2D92" /></svg>
  ),
  quiz: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#7C2D92" strokeWidth="1.8" />
      <path d="M9.5 9.2c0-1.4 1.1-2.4 2.5-2.4s2.5 1 2.5 2.2c0 1.6-2.5 1.8-2.5 3.6" stroke="#7C2D92" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="16.3" r="1" fill="#7C2D92" /></svg>
  ),
  spin: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#7C2D92" strokeWidth="1.8" />
      <path d="M12 2v10l7 4" stroke="#7C2D92" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="1.6" fill="#7C2D92" /></svg>
  ),
  tombola: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="11" rx="2" stroke="#7C2D92" strokeWidth="1.8" />
      <path d="M9 7v11M15 7v11" stroke="#7C2D92" strokeWidth="1.6" strokeDasharray="1.5 2.5" /><path d="M3 12h4M17 12h4" stroke="#7C2D92" strokeWidth="1.8" /></svg>
  ),
  vote: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke="#7C2D92" strokeWidth="1.8" />
      <path d="M8 12.5l2.5 2.5L16 9.5" stroke="#7C2D92" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
}

const JEUX = [
  /* LE GABARIT MANQUAIT ICI (constat 11 de docs/audit-parcours.html) : cette
     liste proposait quiz / roue / tombola / vote, jamais « Quiz + bonus ». Un
     pro ne pouvait donc pas creer son animation sur le gabarit de reference —
     seul le SA le pouvait. Le nom et l identifiant viennent de lib/gabarit.ts,
     source unique : les recopier ici en dur ferait une deuxieme definition que
     rien ne resynchroniserait. */
  { m: GABARIT_MODULE, t: GABARIT_NOM, s: 'Le gabarit de référence — quiz, bonus, ticket', banque: true },
  { m: 'quiz', t: 'Quiz', s: 'QCM + questions bonus', banque: true },
  { m: 'spin', t: 'Roue de la fortune', s: 'Tirage instantané, segments = lots', banque: false },
  { m: 'tombola', t: 'Tombola', s: 'Inscription + grand tirage', banque: false },
  { m: 'vote', t: 'Vote', s: 'Vote produits / artistes', banque: false },
]

const input: React.CSSProperties = { width: '100%', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '11px 13px', fontSize: 14, fontFamily: 'inherit' }
const btnPrimary: React.CSSProperties = { background: ACC, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }
const btnGhost: React.CSSProperties = { background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', color: '#0F172A' }

export default function CreerAnimationWizard({ proId, partenaireId, proName, banqueQuizExistante }: { proId: string; partenaireId: string | null; proName: string; banqueQuizExistante: Banque[] }) {
  const router = useRouter()
  const [etape, setEtape] = useState(1)
  /* L APERCU DE L APP, cote pro. Meme composant que les parcours SA — Romain,
     04/09 : « il faut ajouter la visualisation de l app [...] et il faut la
     meme chose meme style ». Il ne s affiche que sur le gabarit : les autres
     modules (roue, tombola, vote) ont leurs propres ecrans, montrer celui du
     quiz a leur place serait un aperçu faux. */
  const [ecranApercu, setEcranApercu] = useState<EcranApercu>('onboard')
  const [module_, setModule] = useState<string | null>(null)
  const [nom, setNom] = useState('')
  const [banqueId, setBanqueId] = useState<string | null>(null)
  const [banques, setBanques] = useState<Banque[]>(banqueQuizExistante)
  const [lots, setLots] = useState<{ id: string; nom: string; quantite: number; type: 'tirage' | 'instantane'; conditions: string }[]>(
    [{ id: 'l1', nom: '', quantite: 10, type: 'tirage', conditions: '' }]
  )
  const [modeInstant, setModeInstant] = useState<'tousLesX' | 'aleatoire'>('aleatoire')
  const [everyX, setEveryX] = useState(10)
  const [probabilite, setProbabilite] = useState(15)
  const [dateD, setDateD] = useState('')
  const [dateF, setDateF] = useState('')
  const [diffPhysique, setDiffPhysique] = useState(true)
  const [diffDigital, setDiffDigital] = useState(true)
  const [diffQr, setDiffQr] = useState(false)
  const [envoi, setEnvoi] = useState<'idle' | 'envoi' | 'ok' | 'echec'>('idle')

  useEffect(() => { setBanques(banqueQuizExistante) }, [banqueQuizExistante])

  const jeu = JEUX.find(j => j.m === module_)
  const avecApercu = module_ === GABARIT_MODULE
  /* Une animation pro est une station seule : pas de multi-stations, donc pas
     de carte des stations ni de carte partenaires (lib/gabarit.ts). */
  const dApercu = {
    nom: nom || 'Mon animation',
    multistation: false,
    lots: lots.filter(l => l.nom.trim()).map(l => ({ nom: l.nom, quantite: l.quantite })),
    nbQuestions: banques.find(b => b.id === banqueId)?.questions?.filter(x => x.type === 'qcm').length ?? 0,
    nbBonus: banques.find(b => b.id === banqueId)?.questions?.filter(x => x.type === 'single' || x.type === 'multi').length ?? 0,
  }
  const etapeBanque = jeu?.banque ?? false
  const totalEtapes = etapeBanque ? 6 : 5
  const aUnLotInstantane = lots.some(l => l.type === 'instantane')

  function suivant() { setEtape(e => e + 1) }
  function precedent() { setEtape(e => Math.max(1, e - 1)) }
  function ajouterLot() { setLots(l => [...l, { id: 'l' + Date.now(), nom: '', quantite: 5, type: 'tirage', conditions: '' }]) }
  function retirerLot(id: string) { setLots(l => l.length > 1 ? l.filter(x => x.id !== id) : l) }
  function majLot(id: string, champ: 'nom' | 'quantite' | 'type' | 'conditions', valeur: string | number) {
    setLots(l => l.map(x => x.id === id ? { ...x, [champ]: valeur } : x))
  }

  async function valider() {
    const lotsValides = lots.filter(l => l.nom.trim())
    if (!module_ || !nom.trim() || lotsValides.length === 0) return
    setEnvoi('envoi')
    const res = await creerAnimation({
      proId, module: module_, nom: nom.trim(), dateD: dateD || null, dateF: dateF || null,
      banqueId,
      lots: lotsValides.map(l => ({ nom: l.nom.trim(), quantite: l.quantite, type: l.type, conditions: l.conditions.trim() })),
      regleRecompense: aUnLotInstantane ? { mode: modeInstant, everyX, probabilite } : undefined,
      diffusionPhysique: diffPhysique, diffusionDigital: diffDigital, diffusionQrTracking: diffQr,
    })
    if (res.ok) {
      setEnvoi('ok')
      setEtape(e => e + 1) // étape "livraison"
    } else {
      setEnvoi('echec')
    }
  }

  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''
  const lotsTexte = lots.filter(l => l.nom.trim()).map(l => l.nom).join(', ') || '—'

  return (
    <div>
      <a href={`/pro/events${q}`} style={{ fontSize: 12.5, color: MUTED.color, fontWeight: 700, textDecoration: 'none', display: 'inline-block', marginBottom: 10 }}>← Quitter sans créer</a>
      <div style={{ borderRadius: 18, padding: '18px 20px', color: '#fff', marginBottom: 18, background: 'linear-gradient(135deg,#7C2D92 0%,#A855F7 100%)' }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', opacity: 0.9 }}>CRÉER MON ANIMATION</div>
        <div style={{ fontSize: 20, fontWeight: 900, margin: '4px 0 2px' }}>Étape {etape} sur {totalEtapes}</div>
        <div style={{ display: 'flex', gap: 5, marginTop: 12 }}>
          {Array.from({ length: totalEtapes }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 5, borderRadius: 99, background: i < etape ? '#fff' : 'rgba(255,255,255,.3)' }} />
          ))}
        </div>
      </div>

      {/* Deux colonnes des que le gabarit est choisi : la saisie a gauche, le
          parcours joueur a droite. `sa-parc-avec-apercu` vient de
          components/dashboard/apercu.css, importe par ApercuApp — la meme
          grille que les parcours SA, pas une deuxieme. */}
      <div className={avecApercu ? 'sa-parc-avec-apercu' : undefined}>
      <div>

      {etape === 1 && (
        <div style={CARD}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Nom et jeu de votre animation</div>
          <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 16 }}>Le nom sert à l&apos;identifier dans vos events. Choisissez ensuite le format joué.</div>
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Nom de l&apos;animation</label>
          <input style={{ ...input, marginBottom: 18 }} value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex. Jeu d'été chez nous" />
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>Quel jeu ?</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
            {JEUX.map(g => (
              <div
                key={g.m}
                onClick={() => setModule(g.m)}
                style={{
                  flex: '1 1 200px', maxWidth: 240, textAlign: 'center',
                  border: module_ === g.m ? `2px solid ${ACC}` : '1.5px solid #E2E8F0', borderRadius: 14, padding: 16, cursor: 'pointer',
                  background: module_ === g.m ? 'rgba(168,85,247,.06)' : '#fff',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(124,45,146,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>{ICONES[g.m]}</div>
                <div style={{ fontWeight: 800, fontSize: 14.5 }}>{g.t}</div>
                <div style={{ fontSize: 12, ...MUTED, marginTop: 4 }}>{g.s}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button style={{ ...btnPrimary, opacity: module_ && nom.trim() ? 1 : 0.4 }} disabled={!module_ || !nom.trim()} onClick={suivant}>Suivant →</button>
          </div>
        </div>
      )}

      {etape === 2 && etapeBanque && (
        <div style={CARD}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Quelle banque de questions ?</div>
          <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 16 }}>Vos banques déjà validées, ou continuez sans en choisir une maintenant.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {banques.filter(b => !(b.tags || []).includes('bonus')).map(b => (
              <div
                key={b.id}
                onClick={() => setBanqueId(banqueId === b.id ? null : b.id)}
                style={{
                  border: banqueId === b.id ? `2px solid ${ACC}` : '1.5px solid #E2E8F0', borderRadius: 12, padding: 13, cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: banqueId === b.id ? 'rgba(168,85,247,.06)' : '#fff',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{b.nom}</div>
                  <div style={{ fontSize: 11.5, ...MUTED }}>{(b.questions || []).length} questions</div>
                </div>
                {b.statut === 'valide'
                  ? <span style={{ fontSize: 10.5, fontWeight: 800, color: '#15803D' }}>VALIDÉE</span>
                  : <span style={{ fontSize: 10.5, fontWeight: 800, color: '#B45309' }}>BROUILLON</span>}
              </div>
            ))}
            {banques.filter(b => !(b.tags || []).includes('bonus')).length === 0 && (
              <div style={{ fontSize: 13, ...MUTED }}>Aucune banque pour l&apos;instant.</div>
            )}
            <a href={`/pro/banques/nouvelle${q}&tags=quiz&depuis=jeu`} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: ACC, fontWeight: 700, textDecoration: 'none', marginTop: 4 }}>
              + Créer une nouvelle banque (nouvel onglet)
            </a>
          </div>
          <a
            style={{ display: 'flex', gap: 10, alignItems: 'flex-start', border: '1.5px dashed #CBD5E1', borderRadius: 12, padding: 13, marginTop: 14, textDecoration: 'none', color: 'inherit' }}
            target="_blank" rel="noreferrer"
            href={`https://mail.google.com/mail/?view=cm&fs=1&to=flowinevent@gmail.com&su=${encodeURIComponent('Demande de quiz — ' + (proName || nom || 'nouvelle animation'))}&body=${encodeURIComponent(
              `Bonjour,\n\n${proName || 'Un partenaire'} souhaite que l'équipe Flowin réalise le quiz de son animation « ${nom || '—'} ».\n\nMerci de nous recontacter pour en discuter.\n\nNos coordonnées :\n   Téléphone : \n   Meilleur moment pour appeler : \n\nMerci de nous répondre rapidement.`
            )}`}
          >
            <span style={{ fontSize: 18 }}>✉️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12.5 }}>Demander à Flowin de réaliser un quiz →</div>
              <div style={{ fontSize: 11, ...MUTED }}>Envoie un email à notre équipe, on prépare les questions pour vous</div>
            </div>
          </a>
          {banqueId && (() => {
            const b = banques.find(x => x.id === banqueId)
            const apercu = (b?.questions ?? []).slice(0, 3)
            if (!apercu.length) return null
            return (
              <div style={{ marginTop: 16, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B', marginBottom: 10 }}>
                  Aperçu — {apercu.length} question{apercu.length > 1 ? 's' : ''} sur {b?.questions.length}
                </div>
                {apercu.map((qq, i) => (
                  <div key={qq.id} style={{ fontSize: 12.5, marginBottom: i < apercu.length - 1 ? 8 : 0 }}>
                    <b>{i + 1}.</b> {qq.type === 'qcm' ? qq.texte : qq.label}
                  </div>
                ))}
              </div>
            )
          })()}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <button style={btnGhost} onClick={precedent}>← Précédent</button>
            <button style={btnPrimary} onClick={suivant}>{banqueId ? 'Suivant →' : 'Continuer sans banque →'}</button>
          </div>
        </div>
      )}

      {etape === (etapeBanque ? 3 : 2) && (
        <div style={CARD}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Quelle récompense ?</div>
          <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 16 }}>Par lot : tirage au sort après coup, ou gain immédiat si bonne réponse.</div>

          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Vos lots {lots.length > 1 ? `(${lots.length})` : ''}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 10 }}>
            {lots.map(l => (
              <div key={l.id} style={{ border: '1.5px solid #E2E8F0', borderRadius: 12, padding: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 10 }}>
                  <div style={{ flex: 2, minWidth: 140 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>Nom du lot</label>
                    <input style={input} value={l.nom} onChange={e => majLot(l.id, 'nom', e.target.value)} placeholder="Ex. Café gourmand offert" />
                  </div>
                  <div style={{ flex: 1, minWidth: 80 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>Quantité</label>
                    <input style={input} type="number" min={1} value={l.quantite} onChange={e => majLot(l.id, 'quantite', Number(e.target.value))} />
                  </div>
                  {lots.length > 1 && (
                    <button onClick={() => retirerLot(l.id)} style={{ background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 10, width: 40, height: 42, cursor: 'pointer', color: '#B91C1C', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>×</button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {(['tirage', 'instantane'] as const).map(v => (
                    <div
                      key={v}
                      onClick={() => majLot(l.id, 'type', v)}
                      style={{
                        flex: 1, textAlign: 'center', border: l.type === v ? `2px solid ${ACC}` : '1.5px solid #E2E8F0', borderRadius: 8, padding: 7, cursor: 'pointer',
                        background: l.type === v ? 'rgba(168,85,247,.06)' : '#fff', color: l.type === v ? ACC : '#0F172A', fontWeight: 700, fontSize: 12,
                      }}
                    >
                      {v === 'tirage' ? 'Tirage au sort' : 'Gain immédiat'}
                    </div>
                  ))}
                </div>
                <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>Conditions du lot</label>
                <textarea
                  style={{ ...input, minHeight: 54, resize: 'vertical', fontFamily: 'inherit' }}
                  value={l.conditions}
                  onChange={e => majLot(l.id, 'conditions', e.target.value)}
                  placeholder="Ex. Valable 1 exemplaire par client, sur présentation du billet"
                />
              </div>
            ))}
          </div>
          <button onClick={ajouterLot} style={{ ...btnGhost, fontSize: 12.5, padding: '9px 14px' }}>+ Ajouter un lot / sous-lot</button>

          {aUnLotInstantane && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Règle du gain immédiat</div>
              <div style={{ fontSize: 11, ...MUTED, marginBottom: 8 }}>S&apos;applique à tous les lots réglés en gain immédiat.</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                {(['aleatoire', 'tousLesX'] as const).map(m => (
                  <div key={m} onClick={() => setModeInstant(m)} style={{ flex: 1, border: modeInstant === m ? `2px solid ${ACC}` : '1.5px solid #E2E8F0', borderRadius: 10, padding: 10, cursor: 'pointer', background: modeInstant === m ? 'rgba(168,85,247,.06)' : '#fff' }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5 }}>{m === 'aleatoire' ? 'Chance aléatoire' : '1 gain tous les X'}</div>
                  </div>
                ))}
              </div>
              {modeInstant === 'aleatoire' ? (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Probabilité de gagner (%)</label>
                  <input style={{ ...input, maxWidth: 120 }} type="number" min={1} max={100} value={probabilite} onChange={e => setProbabilite(Number(e.target.value))} />
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Un gain toutes les … parties</label>
                  <input style={{ ...input, maxWidth: 120 }} type="number" min={2} value={everyX} onChange={e => setEveryX(Number(e.target.value))} />
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <button style={btnGhost} onClick={precedent}>← Précédent</button>
            <button style={{ ...btnPrimary, opacity: lots.some(l => l.nom.trim()) ? 1 : 0.4 }} disabled={!lots.some(l => l.nom.trim())} onClick={suivant}>Suivant →</button>
          </div>
        </div>
      )}

      {etape === (etapeBanque ? 4 : 3) && (
        <div style={CARD}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Dates de l&apos;animation</div>
          <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 16 }}>Période pendant laquelle vos clients pourront jouer.</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Du</label>
              <input style={input} type="date" value={dateD} onChange={e => setDateD(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Au</label>
              <input style={input} type="date" value={dateF} onChange={e => setDateF(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <button style={btnGhost} onClick={precedent}>← Précédent</button>
            <button style={btnPrimary} onClick={suivant}>Suivant →</button>
          </div>
        </div>
      )}

      {etape === (etapeBanque ? 5 : 4) && (
        <div style={CARD}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Comment diffuser ?</div>
          <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 16 }}>Vous pouvez cocher plusieurs options.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
            {[
              { k: 'physique', v: diffPhysique, set: setDiffPhysique, t: 'QR code physique', s: 'Généré par notre équipe, à afficher chez vous — demande envoyée automatiquement' },
              { k: 'digital', v: diffDigital, set: setDiffDigital, t: 'Lien digital', s: 'Un lien à usage unique, à insérer dans vos posts et réseaux' },
              { k: 'qr', v: diffQr, set: setDiffQr, t: 'QR codes de tracking', s: 'Pour mesurer chaque support précisément — demande envoyée à notre équipe' },
            ].map(o => (
              <label key={o.k} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={o.v} onChange={e => o.set(e.target.checked)} style={{ marginTop: 3 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{o.t}</div>
                  <div style={{ fontSize: 11.5, ...MUTED }}>{o.s}</div>
                </div>
              </label>
            ))}
          </div>
          {diffQr && (
            <a
              style={{ ...btnGhost, textDecoration: 'none', display: 'inline-block', marginBottom: 8, borderColor: ACC, color: ACC }}
              target="_blank" rel="noreferrer"
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=flowinevent@gmail.com&su=${encodeURIComponent('Assistance tracking — ' + (proName || nom || 'nouvelle animation'))}&body=${encodeURIComponent(
                `Bonjour,\n\n${proName || 'Un partenaire'} sollicite votre assistance pour la mise en place du lien de tracking sur son animation « ${nom || '—'} ».\n\n` +
                `Merci de nous recontacter pour la mise en place du QR code de tracking.\n\n` +
                `Nos coordonnées :\n   Téléphone : \n   Meilleur moment pour appeler : \n\n` +
                `Merci de nous répondre rapidement.`
              )}`}
            >
              <Ico k="mail" size={14} style={{ marginRight: 7 }} />Solliciter l&apos;assistance Flowin pour le tracking
            </a>
          )}
          <div style={{ fontSize: 11.5, ...MUTED, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '9px 12px', marginBottom: 4 }}>
            Le QR code physique est toujours généré depuis notre centre de pilotage — jamais directement par vous. Votre demande nous arrive automatiquement.
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button style={btnGhost} onClick={precedent}>← Précédent</button>
            <button style={{ ...btnPrimary, opacity: envoi === 'envoi' ? 0.6 : 1 }} disabled={envoi === 'envoi'} onClick={valider}>
              {envoi === 'envoi' ? 'Création…' : 'Créer mon animation'}
            </button>
          </div>
          {envoi === 'echec' && <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: '#B91C1C' }}>Échec de la création, réessayez.</div>}
        </div>
      )}
      {etape === (etapeBanque ? 6 : 5) && envoi === 'ok' && (
        <div style={CARD}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 7 }}><Ico k="check" size={16} style={{ color: '#15803D' }} />Votre demande est enregistrée</div>
          <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 18 }}>Transmise à l&apos;équipe Flowin pour validation avant mise en ligne.</div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B', marginBottom: 10 }}>Récapitulatif</div>
            {[
              ['Nom', nom || '—'],
              ['Jeu', JEUX.find(j => j.m === module_)?.t ?? '—'],
              ...(etapeBanque ? [['Banque de questions', banques.find(b => b.id === banqueId)?.nom ?? 'Aucune sélectionnée']] : []),
              ...lots.filter(l => l.nom.trim()).map((l, i) => [
                lots.filter(x => x.nom.trim()).length > 1 ? `Lot ${i + 1}` : 'Lot',
                `${l.nom} × ${l.quantite} — ${l.type === 'tirage' ? 'Tirage au sort' : 'Gain immédiat'}`,
              ]),
              ['Dates', dateD && dateF ? `${dateD} → ${dateF}` : 'Non précisées'],
              ['Diffusion', [diffPhysique && 'QR physique', diffDigital && 'Lien digital', diffQr && 'QR tracking'].filter(Boolean).join(' · ') || 'Aucune'],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12.5, padding: '6px 0', borderBottom: '1px solid #E2E8F0' }}>
                <span style={MUTED}>{l}</span><span style={{ fontWeight: 700, textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>

          <div id="visuel-annonce" style={{ background: 'linear-gradient(135deg,#7C2D92 0%,#A855F7 100%)', borderRadius: 16, padding: '20px 24px', color: '#fff', textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', opacity: 0.85 }}>Statut</div>
            <div style={{ fontSize: 19, fontWeight: 900, margin: '8px 0 2px' }}>En attente de validation Flowin</div>
          </div>
          <div style={{ fontSize: 11.5, ...MUTED, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '9px 12px', marginBottom: 16 }}>
            Le QR code physique et la diffusion restent validés par l&apos;équipe Flowin avant mise en ligne. Vous serez prévenu dès l&apos;activation.
          </div>
          <style>{`@media print{ body *{visibility:hidden} #visuel-annonce,#visuel-annonce *{visibility:visible} #visuel-annonce{position:fixed;inset:0;border-radius:0} }`}</style>
          <button style={{ ...btnGhost, width: '100%', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={() => window.print()}><Ico k="download" size={14} />Télécharger / imprimer ce visuel</button>
          {partenaireId ? (
            <a
              style={{ ...btnGhost, width: '100%', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textAlign: 'center', boxSizing: 'border-box', marginBottom: 20 }}
              target="_blank" rel="noreferrer"
              href={`/nds/billets-partenaires.html?p=${encodeURIComponent(partenaireId)}`}
            >
              <Ico k="ticket" size={14} />Voir le billet gagnant (logo, conditions, valable {dateD && dateF ? `du ${dateD} au ${dateF}` : 'pendant l\u2019animation'})
            </a>
          ) : (
            <div style={{ fontSize: 11.5, ...MUTED, marginBottom: 20 }}>Le billet gagnant visuel sera disponible une fois votre compte relié à un partenaire.</div>
          )}

          <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 8 }}>Annoncer à votre base de contacts</div>
          <div style={{ fontSize: 12, ...MUTED, marginBottom: 10 }}>Copiez ce texte dans Brevo, Mailchimp ou votre outil habituel — ou envoyez-le-vous pour le garder sous la main.</div>
          <textarea
            readOnly
            id="texte-annonce"
            style={{ ...input, minHeight: 140, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
            value={[
              `Objet : ${nom} — jouez et tentez de gagner !`, '',
              `Bonjour,`, '',
              `On lance une nouvelle animation : ${nom}${dateD ? ` du ${dateD}${dateF ? ` au ${dateF}` : ''}` : ''}.`,
              `Jouez et tentez de gagner : ${lotsTexte}.`, '',
              `À très vite !`,
            ].join('\n')}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 10, marginBottom: 20 }}>
            <button style={{ ...btnGhost, display: 'flex', alignItems: 'center', gap: 7 }} onClick={() => {
              const el = document.getElementById('texte-annonce') as HTMLTextAreaElement | null
              el?.select(); document.execCommand('copy')
            }}><Ico k="list" size={13} />Copier le texte</button>
            <a
              style={{ ...btnGhost, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7 }}
              target="_blank" rel="noreferrer"
              href={`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(nom + ' — jouez et tentez de gagner !')}&body=${encodeURIComponent(`Bonjour,\n\nOn lance une nouvelle animation : ${nom}${dateD ? ` du ${dateD}${dateF ? ` au ${dateF}` : ''}` : ''}.\nJouez et tentez de gagner : ${lotsTexte}.\n\nÀ très vite !`)}`}
            ><Ico k="mail" size={13} />Ouvrir dans Gmail</a>
          </div>

          <button style={{ ...btnPrimary, width: '100%' }} onClick={() => router.push(`/pro/events?pro=${encodeURIComponent(proId)}`)}>Terminer — voir mes events →</button>
        </div>
      )}

      </div>
      {avecApercu && <ApercuApp d={dApercu} ecran={ecranApercu} onEcran={setEcranApercu} />}
      </div>
    </div>
  )
}
