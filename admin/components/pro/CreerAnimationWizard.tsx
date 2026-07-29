'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { creerAnimation } from '@/lib/pro'
import { fetchBanquesPro, type Banque } from '@/lib/banques'
import { CARD, MUTED, ACC } from '@/lib/proui'
import { Ico } from '@/lib/proicons'

const ICONES: Record<string, React.ReactNode> = {
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
  const [module_, setModule] = useState<string | null>(null)
  const [banqueId, setBanqueId] = useState<string | null>(null)
  const [banques, setBanques] = useState<Banque[]>(banqueQuizExistante)
  const [typeRecompense, setTypeRecompense] = useState<'tirage' | 'instantane'>('tirage')
  const [lots, setLots] = useState<{ id: string; nom: string; quantite: number }[]>([{ id: 'l1', nom: '', quantite: 10 }])
  const [modeInstant, setModeInstant] = useState<'tousLesX' | 'aleatoire'>('aleatoire')
  const [everyX, setEveryX] = useState(10)
  const [probabilite, setProbabilite] = useState(15)
  const [nom, setNom] = useState('')
  const [dateD, setDateD] = useState('')
  const [dateF, setDateF] = useState('')
  const [diffPhysique, setDiffPhysique] = useState(true)
  const [diffDigital, setDiffDigital] = useState(true)
  const [diffQr, setDiffQr] = useState(false)
  const [envoi, setEnvoi] = useState<'idle' | 'envoi' | 'ok' | 'echec'>('idle')

  useEffect(() => { setBanques(banqueQuizExistante) }, [banqueQuizExistante])

  const jeu = JEUX.find(j => j.m === module_)
  const etapeBanque = jeu?.banque ?? false
  const totalEtapes = etapeBanque ? 6 : 5

  function suivant() { setEtape(e => e + 1) }
  function precedent() { setEtape(e => Math.max(1, e - 1)) }
  function ajouterLot() { setLots(l => [...l, { id: 'l' + Date.now(), nom: '', quantite: 5 }]) }
  function retirerLot(id: string) { setLots(l => l.length > 1 ? l.filter(x => x.id !== id) : l) }
  function majLot(id: string, champ: 'nom' | 'quantite', valeur: string | number) {
    setLots(l => l.map(x => x.id === id ? { ...x, [champ]: valeur } : x))
  }

  async function valider() {
    const lotsValides = lots.filter(l => l.nom.trim())
    if (!module_ || !nom.trim() || lotsValides.length === 0) return
    setEnvoi('envoi')
    const res = await creerAnimation({
      proId, module: module_, nom: nom.trim(), dateD: dateD || null, dateF: dateF || null,
      banqueId, typeRecompense,
      lots: lotsValides.map(l => ({ nom: l.nom.trim(), quantite: l.quantite })),
      regleRecompense: typeRecompense === 'instantane' ? { mode: modeInstant, everyX, probabilite } : undefined,
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

      {etape === 1 && (
        <div style={CARD}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Quel jeu pour votre animation ?</div>
          <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 16 }}>Choisissez le format que vos clients joueront.</div>
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
            <button style={{ ...btnPrimary, opacity: module_ ? 1 : 0.4 }} disabled={!module_} onClick={suivant}>Suivant →</button>
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
          <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 16 }}>Tirage au sort après coup, ou gain immédiat si bonne réponse.</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {(['tirage', 'instantane'] as const).map(v => (
              <div
                key={v}
                onClick={() => setTypeRecompense(v)}
                style={{
                  flex: 1, border: typeRecompense === v ? `2px solid ${ACC}` : '1.5px solid #E2E8F0', borderRadius: 12, padding: 14, cursor: 'pointer',
                  background: typeRecompense === v ? 'rgba(168,85,247,.06)' : '#fff',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 13.5 }}>{v === 'tirage' ? 'Tirage au sort' : 'Gain immédiat'}</div>
                <div style={{ fontSize: 11.5, ...MUTED, marginTop: 3 }}>{v === 'tirage' ? 'Vous tirez les gagnants après coup' : 'Le client gagne en direct sur bonne réponse'}</div>
              </div>
            ))}
          </div>

          {typeRecompense === 'instantane' && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Règle du gain immédiat</div>
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

          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Vos lots {lots.length > 1 ? `(${lots.length})` : ''}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            {lots.map(l => (
              <div key={l.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
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
            ))}
          </div>
          <button onClick={ajouterLot} style={{ ...btnGhost, fontSize: 12.5, padding: '9px 14px' }}>+ Ajouter un lot / sous-lot</button>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <button style={btnGhost} onClick={precedent}>← Précédent</button>
            <button style={{ ...btnPrimary, opacity: lots.some(l => l.nom.trim()) ? 1 : 0.4 }} disabled={!lots.some(l => l.nom.trim())} onClick={suivant}>Suivant →</button>
          </div>
        </div>
      )}

      {etape === (etapeBanque ? 4 : 3) && (
        <div style={CARD}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Nom et dates</div>
          <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 16 }}>Le nom sert à identifier votre animation dans vos events.</div>
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Nom de l&apos;animation</label>
          <input style={{ ...input, marginBottom: 14 }} value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex. Jeu d'été chez nous" />
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
            <button style={{ ...btnPrimary, opacity: nom.trim() ? 1 : 0.4 }} disabled={!nom.trim()} onClick={suivant}>Suivant →</button>
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
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 7 }}><Ico k="check" size={16} style={{ color: '#15803D' }} />Votre animation est prête</div>
          <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 18 }}>Voici de quoi l&apos;annoncer, à télécharger ou à envoyer à votre base de contacts.</div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B', marginBottom: 10 }}>Récapitulatif</div>
            {[
              ['Jeu', JEUX.find(j => j.m === module_)?.t ?? '—'],
              ...(etapeBanque ? [['Banque de questions', banques.find(b => b.id === banqueId)?.nom ?? 'Aucune sélectionnée']] : []),
              ['Récompense', typeRecompense === 'tirage' ? 'Tirage au sort' : 'Gain immédiat'],
              ['Lots', lots.filter(l => l.nom.trim()).map(l => `${l.nom} × ${l.quantite}`).join(', ') || '—'],
              ['Dates', dateD && dateF ? `${dateD} → ${dateF}` : 'Non précisées'],
              ['Diffusion', [diffPhysique && 'QR physique', diffDigital && 'Lien digital', diffQr && 'QR tracking'].filter(Boolean).join(' · ') || 'Aucune'],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12.5, padding: '6px 0', borderBottom: '1px solid #E2E8F0' }}>
                <span style={MUTED}>{l}</span><span style={{ fontWeight: 700, textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>

          <div id="visuel-annonce" style={{ background: 'linear-gradient(135deg,#7C2D92 0%,#A855F7 100%)', borderRadius: 16, padding: '28px 24px', color: '#fff', textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', opacity: 0.85 }}>Nouvelle animation</div>
            <div style={{ fontSize: 22, fontWeight: 900, margin: '8px 0 6px', letterSpacing: '-.4px' }}>{nom}</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>{dateD && dateF ? `Du ${dateD} au ${dateF}` : 'Bientôt disponible'}</div>
            <div style={{ marginTop: 14, fontSize: 13, fontWeight: 700, background: 'rgba(255,255,255,.15)', borderRadius: 10, padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: 7 }}><Ico k="gift" size={14} />{lotsTexte}</div>
            <div style={{ marginTop: 14, fontSize: 11.5, opacity: 0.85, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {diffPhysique && <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}><Ico k="pin" size={12} />QR code physique — en attente de génération par notre équipe</div>}
              {diffDigital && <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}><Ico k="link" size={12} />Lien digital — en attente de génération par notre équipe</div>}
              {diffQr && <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}><Ico k="chart" size={12} />QR de tracking — en attente de mise en place</div>}
            </div>
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
  )
}
