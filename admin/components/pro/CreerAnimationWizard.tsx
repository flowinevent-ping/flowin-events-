'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { creerAnimation } from '@/lib/pro'
import { fetchBanquesPro, type Banque } from '@/lib/banques'
import { CARD, MUTED, ACC } from '@/lib/proui'

const JEUX = [
  { m: 'quiz', t: 'Quiz', s: 'QCM + questions bonus', banque: true },
  { m: 'spin', t: 'Roue de la fortune', s: 'Tirage instantané, segments = lots', banque: false },
  { m: 'tombola', t: 'Tombola', s: 'Inscription + grand tirage', banque: false },
  { m: 'vote', t: 'Vote', s: 'Vote produits / artistes', banque: false },
]

const input: React.CSSProperties = { width: '100%', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '11px 13px', fontSize: 14, fontFamily: 'inherit' }
const btnPrimary: React.CSSProperties = { background: ACC, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }
const btnGhost: React.CSSProperties = { background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', color: '#0F172A' }

export default function CreerAnimationWizard({ proId, banqueQuizExistante }: { proId: string; banqueQuizExistante: Banque[] }) {
  const router = useRouter()
  const [etape, setEtape] = useState(1)
  const [module_, setModule] = useState<string | null>(null)
  const [banqueId, setBanqueId] = useState<string | null>(null)
  const [banques, setBanques] = useState<Banque[]>(banqueQuizExistante)
  const [typeRecompense, setTypeRecompense] = useState<'tirage' | 'instantane'>('tirage')
  const [lotNom, setLotNom] = useState('')
  const [lotQuantite, setLotQuantite] = useState(10)
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
  const totalEtapes = etapeBanque ? 5 : 4

  function suivant() { setEtape(e => e + 1) }
  function precedent() { setEtape(e => Math.max(1, e - 1)) }

  async function valider() {
    if (!module_ || !nom.trim() || !lotNom.trim()) return
    setEnvoi('envoi')
    const res = await creerAnimation({
      proId, module: module_, nom: nom.trim(), dateD: dateD || null, dateF: dateF || null,
      banqueId, typeRecompense, lotNom: lotNom.trim(), lotQuantite,
      diffusionPhysique: diffPhysique, diffusionDigital: diffDigital, diffusionQrTracking: diffQr,
    })
    if (res.ok) {
      setEnvoi('ok')
      setTimeout(() => router.push(`/pro/events?pro=${encodeURIComponent(proId)}`), 1400)
    } else {
      setEnvoi('echec')
    }
  }

  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''

  return (
    <div>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
            {JEUX.map(g => (
              <div
                key={g.m}
                onClick={() => setModule(g.m)}
                style={{
                  border: module_ === g.m ? `2px solid ${ACC}` : '1.5px solid #E2E8F0', borderRadius: 14, padding: 16, cursor: 'pointer',
                  background: module_ === g.m ? 'rgba(168,85,247,.06)' : '#fff',
                }}
              >
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
            <a href={`/pro/banques/nouvelle${q}&tags=quiz`} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: ACC, fontWeight: 700, textDecoration: 'none', marginTop: 4 }}>
              + Créer une nouvelle banque (nouvel onglet)
            </a>
          </div>
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
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 200 }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Nom du lot</label>
              <input style={input} value={lotNom} onChange={e => setLotNom(e.target.value)} placeholder="Ex. Café gourmand offert" />
            </div>
            <div style={{ flex: 1, minWidth: 100 }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Quantité</label>
              <input style={input} type="number" min={1} value={lotQuantite} onChange={e => setLotQuantite(Number(e.target.value))} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <button style={btnGhost} onClick={precedent}>← Précédent</button>
            <button style={{ ...btnPrimary, opacity: lotNom.trim() ? 1 : 0.4 }} disabled={!lotNom.trim()} onClick={suivant}>Suivant →</button>
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
          <div style={{ fontSize: 11.5, ...MUTED, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '9px 12px', marginBottom: 4 }}>
            Le QR code physique est toujours généré depuis notre centre de pilotage — jamais directement par vous. Votre demande nous arrive automatiquement.
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button style={btnGhost} onClick={precedent}>← Précédent</button>
            <button style={{ ...btnPrimary, opacity: envoi === 'envoi' ? 0.6 : 1 }} disabled={envoi === 'envoi'} onClick={valider}>
              {envoi === 'envoi' ? 'Création…' : 'Créer mon animation ✓'}
            </button>
          </div>
          {envoi === 'ok' && <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: '#15803D' }}>✅ Animation créée — direction vos events…</div>}
          {envoi === 'echec' && <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: '#B91C1C' }}>Échec de la création, réessayez.</div>}
        </div>
      )}
    </div>
  )
}
