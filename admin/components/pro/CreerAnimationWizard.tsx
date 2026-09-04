'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { creerAnimation, enregistrerDemandeQuiz } from '@/lib/pro'
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

const input: React.CSSProperties = { width: '100%', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '11px 13px', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }
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

  /* CONFIER LE QUIZ A FLOWIN — Romain, 04/09 : « on peut pas continuer sans
     banque, soit le pro selectionne une banque, soit il la cree, soit Flowin
     lui cree ». La troisieme voie n etait qu un lien mailto au corps vide de
     contenu utile : il partait sans le theme voulu ni aucune coordonnee, donc
     l equipe devait rappeler pour tout demander. Le formulaire ci-dessous
     collecte ce qu il faut AVANT d ouvrir le mail. */
  const [voieBanque, setVoieBanque] = useState<'mienne' | 'flowin' | null>(null)
  const [themeQuiz, setThemeQuiz] = useState('')
  const [contactNom, setContactNom] = useState('')
  const [contactTel, setContactTel] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [dispo, setDispo] = useState('')
  const [demandeEnvoyee, setDemandeEnvoyee] = useState(false)
  const [demandeTracee, setDemandeTracee] = useState<'idle' | 'ok' | 'echec'>('idle')
  const [module_, setModule] = useState<string | null>(null)
  const [nom, setNom] = useState('')
  const [banqueId, setBanqueId] = useState<string | null>(null)
  const [banques, setBanques] = useState<Banque[]>(banqueQuizExistante)
  /* `valeur` ajoute le 04/09 : le billet imprime affiche « Valeur du bon », le
     parcours ne la demandait nulle part. Sans elle, le bon sortait a 0 EUR. */
  const [lots, setLots] = useState<{ id: string; nom: string; quantite: number; valeur: number; type: 'tirage' | 'instantane'; conditions: string }[]>(
    [{ id: 'l1', nom: '', quantite: 10, valeur: 0, type: 'tirage', conditions: '' }]
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

  /* Le contact Flowin affiche aux partenaires. Jamais une adresse personnelle
     ni info@opconsult.co : c est celui de tous les supports partenaires. */
  const TEL_FLOWIN = '04 93 59 91 37'
  const MAIL_FLOWIN = 'flowinevent@gmail.com'

  /* Le modele de billet, charge une fois depuis public/. */
  const [billetModele, setBilletModele] = useState<string | null>(null)
  useEffect(() => {
    fetch('/bon-achat-template.html')
      .then(r => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then(setBilletModele)
      .catch(() => setBilletModele(null))
  }, [])

  const lotPrincipal = lots.find(l => l.nom.trim()) ?? null

  /* Une animation ne se programme pas dans le passe : le champ le refuse au
     lieu de laisser saisir une date qui ne s ouvrira jamais. */
  const aujourdhui = new Date().toISOString().slice(0, 10)
  const dureeJours = (dateD && dateF && dateF >= dateD)
    ? Math.round((new Date(dateF).getTime() - new Date(dateD).getTime()) / 86400000) + 1
    : null

  /* Remplissage des placeholders du modele avec la saisie en cours. Les valeurs
     inconnues a ce stade (numero de ticket, nom du gagnant, date de validite)
     restent des exemples : l animation n existe pas encore. */
  const billetHtml = (() => {
    if (!billetModele || !lotPrincipal) return null
    const val = Math.max(0, Number(lotPrincipal.valeur) || 0)
    const remplacements: Record<string, string> = {
      partenaire_nom: proName || 'Votre commerce',
      partenaire_adresse: '', partenaire_cp: '', partenaire_ville: '',
      montant_int: String(Math.floor(val)),
      montant_dec: String(Math.round((val % 1) * 100)).padStart(2, '0'),
      ticket_num: 'EXEMPLE-0000', ticket_num_court: '0000',
      gagnant_nom_or_placeholder: 'Nom du gagnant',
      gagnant_class: '', gain_id: '',
      valide_jusqu_au: dateF || 'date de fin de l’animation',
    }
    return billetModele.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, cle: string) => remplacements[cle] ?? '')
  })()

  const demandeFormOk = !!(themeQuiz.trim() && contactNom.trim() && contactTel.trim() && contactEmail.trim())

  /* L etape n est franchissable que par une des trois voies : une banque
     choisie, ou une demande reellement envoyee a Flowin. */
  const etapeBanqueOk = !!banqueId || (voieBanque === 'flowin' && demandeEnvoyee)

  const mailDemande = `https://mail.google.com/mail/?view=cm&fs=1&to=${MAIL_FLOWIN}&su=${encodeURIComponent(
    `Demande de quiz — ${proName || 'partenaire'}`
  )}&body=${encodeURIComponent(
    [
      'Bonjour,',
      '',
      `${proName || 'Notre établissement'} souhaite que l'équipe Flowin réalise les questions du quiz de son animation${nom.trim() ? ` « ${nom.trim()} »` : ''}.`,
      '',
      'THÈME SOUHAITÉ',
      themeQuiz.trim() || '—',
      '',
      'COORDONNÉES',
      `   Établissement : ${proName || '—'}`,
      `   Contact : ${contactNom.trim() || '—'}`,
      `   Téléphone : ${contactTel.trim() || '—'}`,
      `   Email : ${contactEmail.trim() || '—'}`,
      `   Meilleur moment pour appeler : ${dispo.trim() || '—'}`,
      '',
      'ANIMATION',
      `   Jeu : ${jeu?.t ?? module_}`,
      `   Dates : ${dateD || '—'}${dateF ? ` → ${dateF}` : ''}`,
      '',
      'Merci de nous recontacter pour la réalisation des questions personnalisées.',
    ].join('\n')
  )}`
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
  function ajouterLot() { setLots(l => [...l, { id: 'l' + Date.now(), nom: '', quantite: 5, valeur: 0, type: 'tirage', conditions: '' }]) }
  function retirerLot(id: string) { setLots(l => l.length > 1 ? l.filter(x => x.id !== id) : l) }
  function majLot(id: string, champ: 'nom' | 'quantite' | 'valeur' | 'type' | 'conditions', valeur: string | number) {
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
          <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 16 }}>Choisissez une de vos banques, créez-en une, ou demandez à Flowin d’écrire les questions. Un jeu sans questions ne peut pas tourner.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {banques.filter(b => !(b.tags || []).includes('bonus')).map(b => (
              <div
                key={b.id}
                onClick={() => { const n = banqueId === b.id ? null : b.id; setBanqueId(n); setVoieBanque(n ? 'mienne' : null) }}
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
            onClick={() => { setVoieBanque('flowin'); setBanqueId(null) }}
            style={{ display: 'flex', gap: 10, alignItems: 'flex-start', border: voieBanque === 'flowin' ? `2px solid ${ACC}` : '1.5px dashed #CBD5E1', borderRadius: 12, padding: 13, marginTop: 14, textDecoration: 'none', color: 'inherit', cursor: 'pointer', background: voieBanque === 'flowin' ? 'rgba(168,85,247,.06)' : '#fff' }}
          >
            <span style={{ fontSize: 18 }}>✉️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12.5 }}>Demander à Flowin de réaliser le quiz</div>
              <div style={{ fontSize: 11, ...MUTED }}>On écrit les questions pour vous, à partir du thème que vous choisissez</div>
            </div>
          </a>

          {voieBanque === 'flowin' && (
            <div style={{ marginTop: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 15 }}>
              <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 14 }}>
                Dites-nous sur quoi porte le quiz et comment vous joindre. Tout part dans un seul message, on ne vous rappellera pas pour redemander.
              </div>

              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Thème des questions *</label>
              <textarea
                style={{ ...input, minHeight: 74, resize: 'vertical', marginBottom: 14 }}
                value={themeQuiz} onChange={e => setThemeQuiz(e.target.value)}
                placeholder="Ex. notre métier, l'histoire du quartier, nos produits, l'écologie au quotidien…"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Personne à contacter *</label>
                  <input style={input} value={contactNom} onChange={e => setContactNom(e.target.value)} placeholder="Prénom et nom" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Téléphone *</label>
                  <input style={input} value={contactTel} onChange={e => setContactTel(e.target.value)} placeholder="06 …" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Email *</label>
                  <input style={input} value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="vous@exemple.fr" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Quand vous appeler ?</label>
                  <input style={input} value={dispo} onChange={e => setDispo(e.target.value)} placeholder="Ex. matins avant 11h" />
                </div>
              </div>

              {!demandeFormOk && (
                <div style={{ fontSize: 11.5, color: '#B45309', marginBottom: 12 }}>
                  Thème, personne à contacter, téléphone et email sont nécessaires pour que l’équipe puisse travailler sans vous relancer.
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                <a
                  href={demandeFormOk ? mailDemande : undefined}
                  target="_blank" rel="noreferrer"
                  onClick={async () => {
                    if (!demandeFormOk) return
                    setDemandeEnvoyee(true)
                    /* La trace part AVANT le mail : l ouverture de Gmail depend
                       d un client externe, la demande ne doit pas en dependre. */
                    const r = await enregistrerDemandeQuiz({
                      proId, proNom: proName, theme: themeQuiz,
                      contactNom, contactTel, contactEmail, dispo,
                      animationNom: nom, jeu: jeu?.t ?? module_,
                      dateD: dateD || null, dateF: dateF || null,
                    })
                    setDemandeTracee(r.ok ? 'ok' : 'echec')
                  }}
                  style={{
                    ...btnPrimary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7,
                    opacity: demandeFormOk ? 1 : 0.45, pointerEvents: demandeFormOk ? 'auto' : 'none',
                  }}
                ><Ico k="mail" size={14} />Envoyer ma demande par email</a>

                {/* « option appelez avec le numero de tel qui s affiche » : le
                    numero est ecrit en clair, et cliquable sur mobile. */}
                <a href={`tel:${TEL_FLOWIN.replace(/\s/g, '')}`} style={{ ...btnGhost, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  📞 Ou appelez-nous — {TEL_FLOWIN}
                </a>
              </div>

              {demandeEnvoyee && (
                <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, border: `1px solid ${demandeTracee === 'echec' ? '#B45309' : '#15803D'}`, color: demandeTracee === 'echec' ? '#B45309' : '#15803D', fontSize: 12, fontWeight: 600 }}>
                  {demandeTracee === 'echec'
                    ? 'Le mail est prêt, mais nous n’avons pas pu enregistrer la demande de notre côté. Envoyez-le, ou appelez-nous au numéro ci-dessus — nous ne la verrons pas autrement.'
                    : 'Demande enregistrée. Vous pouvez continuer : l’animation partira en attente de validation, et l’équipe y attachera votre banque de questions.'}
                </div>
              )}
            </div>
          )}

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
            {/* Plus de « Continuer sans banque » : le jeu sortait vide du
                parcours et rien ne le signalait avant la mise en ligne. */}
            <button
              style={{ ...btnPrimary, opacity: etapeBanqueOk ? 1 : 0.45, cursor: etapeBanqueOk ? 'pointer' : 'not-allowed' }}
              disabled={!etapeBanqueOk} onClick={suivant}
            >Suivant →</button>
          </div>
        </div>
      )}

      {etape === (etapeBanque ? 3 : 2) && (
        <div style={CARD}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Quelle récompense ?</div>
          {/* Romain, 04/09 : « il faut une explication plus simple ». L ancienne
              phrase parlait de « tirage au sort apres coup » sans jamais dire ce
              qu on met dans un lot. */}
          <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 16 }}>
            Mettez en jeu ce que vous voulez : <b>une remise</b>, <b>un cadeau</b>, une invitation.
            Pour chacun, indiquez la quantité, sa valeur et les conditions d’utilisation.
            Le joueur peut le gagner <b>au tirage au sort</b> à la fin, ou <b>tout de suite</b> s’il répond juste.
          </div>

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
                  <div style={{ flex: 1, minWidth: 80 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>Valeur (€)</label>
                    <input style={input} type="number" min={0} value={l.valeur} onChange={e => majLot(l.id, 'valeur', Number(e.target.value))} />
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
                <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>Conditions d’utilisation</label>
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

          {/* LE BILLET — Romain, 04/09 : « a la fin il faut la visualisation du
              billet, billet toujours le meme pour tous les pros (tu as le
              modele avec le QR code) ».
              Le modele est public/bon-achat-template.html, celui qui a servi aux
              bons NDS 2026. Il est CHARGE, pas recopie : les placeholders
              {{...}} sont remplis avec la saisie en cours et le document reel
              s affiche dans une iframe. Redessiner un billet ici en ferait un
              deuxieme, qui divergerait du premier a la premiere retouche. */}
          {lotPrincipal && (
            <div style={{ marginTop: 20, borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Le billet que recevra le gagnant</div>
              <div style={{ fontSize: 11.5, ...MUTED, marginBottom: 12 }}>
                Le même pour tous les commerces — seuls votre nom, le montant et vos conditions changent.
                Le gagnant le présente chez vous, vous le validez, et la quantité mise en jeu diminue d’autant.
              </div>
              {billetHtml
                ? (
                  <iframe
                    title="Aperçu du billet"
                    sandbox=""
                    srcDoc={billetHtml}
                    style={{ width: '100%', height: 460, border: '1px solid #E2E8F0', borderRadius: 12, background: '#fff' }}
                  />
                )
                : <div style={{ fontSize: 12, ...MUTED }}>Chargement du modèle…</div>}
            </div>
          )}


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
          {/* `minWidth: 0` : un enfant de flex vaut par defaut au moins la
              largeur intrinseque de son contenu, et un champ date en a une.
              Sans ca les deux colonnes refusent de se reduire et poussent la
              seconde hors de la carte. */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 180px', minWidth: 0 }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Du</label>
              <input
                style={input} type="date" value={dateD}
                min={aujourdhui}
                onChange={e => {
                  const v = e.target.value
                  setDateD(v)
                  /* Une fin anterieure au debut donnait une animation qui ne
                     s ouvre jamais, sans que rien ne le signale. */
                  if (dateF && v && dateF < v) setDateF(v)
                }}
              />
            </div>
            <div style={{ flex: '1 1 180px', minWidth: 0 }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Au</label>
              <input
                style={input} type="date" value={dateF}
                min={dateD || aujourdhui}
                onChange={e => setDateF(e.target.value)}
              />
            </div>
          </div>
          {dureeJours !== null && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#15803D', fontWeight: 600 }}>
              {dureeJours === 1 ? 'Une seule journée de jeu.' : `${dureeJours} jours de jeu.`}
            </div>
          )}
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
              /* « Aucune sélectionnée » ne peut plus arriver : l etape ne se
                 franchit qu avec une banque ou une demande envoyee. Le recap
                 dit donc laquelle des deux. */
              ...(etapeBanque ? [['Banque de questions', banques.find(b => b.id === banqueId)?.nom ?? (demandeEnvoyee ? 'Réalisée par Flowin — demande envoyée' : '—')]] : []),
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
          {/* CE BOUTON NE MONTRAIT RIEN (constate le 04/09). Il ouvrait
              /nds/billets-partenaires.html?p=<partenaire>, qui liste les billets
              DEJA EMIS a des gagnants reels via un RPC. Une animation qui vient
              d etre creee n a aucun gagnant : la page s ouvrait vide, et le pro
              y voyait un bug.
              On affiche a la place le meme apercu qu a l etape « recompense » —
              le modele public/bon-achat-template.html rempli avec sa saisie.
              C est ce qu il voulait voir : son billet, pas ceux des autres. */}
          {billetHtml ? (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Le billet que recevra le gagnant</div>
              <iframe
                title="Billet gagnant"
                sandbox=""
                srcDoc={billetHtml}
                style={{ width: '100%', height: 460, border: '1px solid #E2E8F0', borderRadius: 12, background: '#fff' }}
              />
            </div>
          ) : (
            <div style={{ fontSize: 11.5, ...MUTED, marginBottom: 20 }}>Le billet s’affichera dès qu’un lot aura un nom.</div>
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
