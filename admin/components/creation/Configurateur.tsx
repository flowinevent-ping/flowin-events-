'use client'

/**
 * CONFIGURATEUR DU JEU (pro) — parcours dicté par Romain le 10/11/2026, un écran = une idée, carrousel sans scroll :
 *   coordonnées (sauté si connues) · jeu · configuration du quiz (je rédige / Flowin rédige) · demande à Flowin
 *   · lots qui font revenir · supports + QR · kit · récapitulatif (Modifier) · prix · « Valider mon bon de commande ».
 * Écritures (rien de nouveau en base) : pros (coordonnées), events + lots (creerAnimation, lots.validite_jours),
 * qr_stations (creerQrTrace), crm_retours (enregistrerDemandeQuiz), banques (questions à écrire après).
 * PAIEMENT_ACTIF=false : validation sans paiement, le jeu passe en ligne ; true : bon de commande pré-rempli + virement.
 * Le logo n'est plus bloquant (Romain, 10/11) : le billet montre le nom du commerce tant qu'il n'y a pas de logo.
 */
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { creerAnimation, enregistrerDemandeQuiz, idAnimation } from '@/lib/pro'
import type { Banque, QuestionQuiz } from '@/lib/banques'
import { creerBanque, enregistrerBanque, nouvelleQuestionQuiz } from '@/lib/banques'
import { GABARIT_MODULE } from '@/lib/gabarit'
import { creerQrTrace, slugQr, type TypeQr } from '@/lib/qrTraces'
import { lienAncien } from '@/lib/qrPermalien'
import { qrFlowinPng } from '@/lib/qrLogo'
import { cfgDepuisTirage } from '@/components/operations/ReglageTirage'
import { cfgMaster, MASTER_VIDE } from '@/components/masters/PersoMaster'
import { NavCarrousel, useGlisser } from '@/components/pro/Carrousel'
import QrVirement from '@/components/pro/QrVirement'
import { PRIX_ANIMATION, PRIX_KIT_PHYSIQUE, PAIEMENT_ACTIF, lienBonCommande, referenceVirement } from '@/lib/reglement'
import { chiffres, siretValide } from '@/lib/entreprise'
import { CHARTE_PRO as C } from '@/lib/charte'
import { BTN, BTN2, MUTED } from '@/lib/proui'

const BLEU = '#3B5CC4'
export interface ProConfigurateur {
  id: string; nom: string | null; adresse: string | null; code_postal: string | null; ville: string | null
  email: string | null; tel: string | null; contact: string | null; partenaire_id: string | null; siret?: string | null
}
type Jeu = 'quizsolo' | 'quizbonus' | 'spin' | 'tombola'
type Validite = 'sans' | 'jours' | 'dates'
type LotC = { id: string; nom: string; quantite: number; conditions: string; validite: Validite; jours: number; du: string; au: string }

const JEUX: { k: Jeu; module: string; t: string; s: string; illu: ReactNode }[] = [
  { k: 'quizsolo', module: 'quizsolo', t: 'Quiz', s: '3 bonnes réponses = 1 ticket', illu: <IlluQuiz /> },
  { k: 'quizbonus', module: GABARIT_MODULE, t: 'Quiz + bonus', s: 'Le quiz, plus vos questions pour sonder', illu: <IlluQuiz bonus /> },
  { k: 'spin', module: 'spin', t: 'Roue', s: 'On tourne, on gagne tout de suite', illu: <IlluRoue /> },
  { k: 'tombola', module: 'tombola', t: 'Tombola', s: 'On s’inscrit, grand tirage à la fin', illu: <IlluTombola /> },
]
const EXEMPLES_LOTS = [
  { t: 'Remise', nom: '-10 % sur votre prochain achat', cond: 'Valable dès 20 € d’achat' },
  { t: 'Bon d’achat', nom: 'Bon d’achat de 5 €', cond: 'Bon de 5 € valable dès 30 € d’achat' },
  { t: 'Produit offert', nom: 'Un produit offert', cond: 'Pour tout achat en magasin' },
]
/** Supports de diffusion : ceux des QR tracés (lib/qrTraces SUPPORTS_QR), un QR par support coché. */
const SUPPORTS: { k: string; t: string; support: string; type: TypeQr }[] = [
  { k: 'magasin', t: 'En magasin', support: 'Entrée / vitrine', type: 'physique' },
  { k: 'caisse', t: 'À la caisse', support: 'Caisse', type: 'physique' },
  { k: 'affiche', t: 'Affiche', support: 'Support publicitaire', type: 'physique' },
  { k: 'instagram', t: 'Instagram', support: 'Instagram', type: 'digital' },
  { k: 'facebook', t: 'Facebook', support: 'Facebook', type: 'digital' },
  { k: 'tiktok', t: 'TikTok', support: 'TikTok', type: 'digital' },
  { k: 'site', t: 'Site internet', support: 'Autre', type: 'digital' },
]
const lotVide = (): LotC => ({ id: 'l' + Math.random().toString(36).slice(2, 8), nom: '', quantite: 10, conditions: '', validite: 'sans', jours: 30, du: '', au: '' })
const eur = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €'

const IN: CSSProperties = { width: '100%', padding: '11px 13px', background: '#fff', border: `1.5px solid ${C.bordureChamp}`, borderRadius: 12, color: C.texte, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }
const LAB: CSSProperties = { display: 'block', fontSize: 11, fontWeight: 800, color: C.attenue, margin: '0 0 4px' }
const carte = (on: boolean): CSSProperties => ({ border: `2px solid ${on ? BLEU : C.bordure}`, background: on ? '#EEF2FC' : '#fff', borderRadius: 16, padding: 12, cursor: 'pointer', fontFamily: 'inherit', color: C.texte, textAlign: 'left' })
const puce = (on: boolean): CSSProperties => ({ border: `1.5px solid ${on ? BLEU : C.bordureChamp}`, background: on ? BLEU : '#fff', color: on ? '#fff' : C.texte, borderRadius: 99, padding: '8px 13px', fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' })

function Titre({ t, s }: { t: string; s?: string }) {
  return <div style={{ marginBottom: 12 }}><div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.2 }}>{t}</div>{s && <div style={{ fontSize: 13.5, ...MUTED, marginTop: 4 }}>{s}</div>}</div>
}
function C2({ l, children }: { l: string; children: ReactNode }) {
  return <label style={{ display: 'block', marginBottom: 9 }}><span style={LAB}>{l}</span>{children}</label>
}

export default function Configurateur({ pro, banques }: { pro: ProConfigurateur; banques: Banque[] }) {
  const p = pro
  const morceaux = (p.contact || '').trim().split(/\s+/)
  /* 1. Coordonnées (reprises du profil / de « Ma première fois ») */
  const [prenom, setPrenom] = useState(morceaux[0] || '')
  const [nomFam, setNomFam] = useState(morceaux.slice(1).join(' '))
  const [tel, setTel] = useState(p.tel || '')
  const [email, setEmail] = useState(p.email || '')
  const [commerce, setCommerce] = useState(p.nom || '')
  const [siret, setSiret] = useState(p.siret || '')
  const [adresse, setAdresse] = useState(p.adresse || '')
  const [cp, setCp] = useState(p.code_postal || '')
  const [ville, setVille] = useState(p.ville || '')
  const coordKo = !prenom.trim() || !nomFam.trim() ? 'Indiquez votre prénom et votre nom.'
    : !tel.trim() ? 'Indiquez un téléphone.'
    : !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email.trim()) ? 'Indiquez un email valide.'
    : !commerce.trim() ? 'Indiquez le nom du commerce.'
    : !siretValide(siret) ? 'Indiquez un SIRET valide (14 chiffres).'
    : !adresse.trim() || !ville.trim() ? 'Indiquez l’adresse et la ville.' : null
  /* Coordonnées déjà complètes au profil : l'écran est sauté (calculé une fois, à l'ouverture). */
  const [coordConnues] = useState(() => !coordKo)

  /* 2-4. Jeu et quiz */
  const [jeu, setJeu] = useState<Jeu | null>(null)
  const [voie, setVoie] = useState<'' | 'moi' | 'flowin'>('')
  const [banqueId, setBanqueId] = useState<string>('')
  const [theme, setTheme] = useState('')
  const [commerceQuiz, setCommerceQuiz] = useState(p.nom || '')
  const [objectif, setObjectif] = useState('')
  const estQuiz = jeu === 'quizsolo' || jeu === 'quizbonus'
  const banquesQuiz = useMemo(() => banques.slice(0, 3), [banques])

  /* 5. Lots */
  const [lots, setLots] = useState<LotC[]>([lotVide()])
  const [lotI, setLotI] = useState(0)
  const lot = lots[Math.min(lotI, lots.length - 1)]
  const majLot = (patch: Partial<LotC>) => setLots(ls => ls.map(l => (l.id === lot.id ? { ...l, ...patch } : l)))
  const lotsOk = lots.filter(l => l.nom.trim())
  const lotsKo = !lotsOk.length ? 'Ajoutez au moins un lot.'
    : lotsOk.some(l => l.validite === 'dates' && (!l.du || !l.au || l.au < l.du)) ? 'Indiquez les dates de validité.'
    : lotsOk.some(l => l.validite === 'jours' && !(l.jours > 0)) ? 'Indiquez la durée de validité.' : null

  /* 6. Supports et QR (identifiant de l'animation décidé à l'avance : les QR montrés sont les définitifs) */
  const [evId] = useState(() => idAnimation(p.id || 'pro'))
  const [supports, setSupports] = useState<string[]>(['magasin', 'instagram'])
  const [qrs, setQrs] = useState<Record<string, string>>({})
  const module_ = JEUX.find(j => j.k === jeu)?.module || GABARIT_MODULE
  /* Slugs dans l'ordre de création (creerQrTrace) : le QR montré est celui qui sera enregistré. */
  const slugs = useMemo(() => {
    const pris: string[] = [], m: Record<string, string> = {}
    SUPPORTS.filter(s => supports.indexOf(s.k) >= 0).forEach(s => { const g = slugQr(s.t, s.support, s.type, pris); pris.push(g); m[s.k] = g })
    return m
  }, [supports])
  useEffect(() => {
    let vivant = true
    Object.keys(slugs).forEach(k => {
      const cle = k + module_ + slugs[k]
      if (qrs[cle]) return
      qrFlowinPng(lienAncien(evId, module_, slugs[k]), 360).then(src => { if (vivant) setQrs(m => ({ ...m, [cle]: src })) }, () => {})
    })
    return () => { vivant = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugs, module_, evId])

  /* 7. Kit */
  const [kit, setKit] = useState<'digital' | 'physique'>('digital')

  /* Écrans */
  const ecrans = useMemo(() => {
    const e: string[] = []
    if (!coordConnues) e.push('coord')
    e.push('jeu')
    if (estQuiz) { e.push('quiz'); if (voie === 'flowin') e.push('flowin'); if (voie === 'moi') e.push('questions') }
    e.push('lots', 'supports', 'kit', 'recap', 'prix')
    return e
  }, [coordConnues, estQuiz, voie])
  const [i, setI] = useState(0)
  const cur = Math.min(i, ecrans.length - 1)
  const ecran = ecrans[cur]
  const [retourRecap, setRetourRecap] = useState(false)
  const [tente, setTente] = useState(false)
  const bloque: Record<string, string | null> = {
    coord: coordKo,
    jeu: !jeu ? 'Choisissez un jeu.' : null,
    quiz: !voie ? 'Choisissez qui rédige le quiz.' : null,
    flowin: !theme.trim() ? 'Indiquez le thème du quiz.' : null,
    questions: null,
    lots: lotsKo,
    supports: !supports.length ? 'Cochez au moins un support.' : null,
    kit: null, recap: null, prix: null,
  }
  const allerA = (cle: string) => { const k = ecrans.indexOf(cle); if (k >= 0) { setI(k); setTente(false) } }
  const setEcran = (k: number) => {
    setTente(false)
    if (retourRecap && k > cur && ecran !== 'quiz' && ecran !== 'recap') { setRetourRecap(false); allerA('recap'); return }
    setI(k)
  }
  const glisser = useGlisser(s => { const k = cur + s; if (k < 0 || k >= ecrans.length) return; if (s > 0 && bloque[ecran]) { setTente(true); return } setEcran(k) })
  /* Arrivé au récapitulatif, le mode « Modifier » s'arrête. */
  useEffect(() => { if (ecran === 'recap') setRetourRecap(false) }, [ecran])
  const modifier = (cle: string) => { setRetourRecap(true); allerA(cle) }
  /* Un choix unique fait avancer tout seul (moins de clics). */
  const choisirPuisSuivant = (fn: () => void) => { fn(); setTimeout(() => setI(k => k + 1), 160) }

  /* Prix (offre de bienvenue -50 %, grille unique lib/reglement) */
  const quizFlowin = estQuiz && voie === 'flowin'
  const totalHt = PRIX_ANIMATION.lancement + (quizFlowin ? PRIX_ANIMATION.quizFlowinLancement : 0) + (kit === 'physique' ? PRIX_KIT_PHYSIQUE : 0)

  /* Validation */
  const [envoi, setEnvoi] = useState<'' | 'envoi'>('')
  const [erreur, setErreur] = useState('')
  const [fait, setFait] = useState<{ info: string } | null>(null)
  const supportsChoisis = SUPPORTS.filter(s => supports.indexOf(s.k) >= 0)
  async function valider() {
    setEnvoi('envoi'); setErreur('')
    const contact = `${prenom.trim()} ${nomFam.trim()}`.trim()
    const coords = { contact, tel: tel.trim(), email: email.trim(), nom: commerce.trim(), siret: chiffres(siret), adresse: adresse.trim(), code_postal: cp.trim() || null, ville: ville.trim() }
    const change = coords.contact !== (p.contact || '') || coords.tel !== (p.tel || '') || coords.email !== (p.email || '') || coords.nom !== (p.nom || '') ||
      coords.siret !== chiffres(p.siret || '') || coords.adresse !== (p.adresse || '') || (coords.code_postal || '') !== (p.code_postal || '') || coords.ville !== (p.ville || '')
    const infos: string[] = []
    if (change && p.id) {
      const r = await supabase.from('pros').update(coords).eq('id', p.id)
      if (r.error) infos.push('Coordonnées non mises à jour : corrigez-les dans Mon profil.')
    }
    /* Je rédige mes questions : banque choisie, ou banque créée avec 3 exemples à remplacer. */
    let bq: string | null = estQuiz && voie === 'moi' && banqueId && banqueId !== 'apres' ? banqueId : null
    if (estQuiz && voie === 'moi' && !bq) {
      const b = await creerBanque({ proId: p.id || 'flowin', nom: `Questions — ${commerce.trim()}`, tags: ['quiz'] })
      if (b) {
        const ex = (t: string): QuestionQuiz => ({ ...nouvelleQuestionQuiz(), texte: t, options: ['Réponse à corriger', 'Réponse à corriger', 'Réponse à corriger', 'Réponse à corriger'] })
        await enregistrerBanque(b.id, [ex('Exemple à modifier — une question sur votre commerce'), ex('Exemple à modifier — une question sur votre ville'), ex('Exemple à modifier — une question sur vos produits')], true)
        bq = b.id
      }
    }
    const spin = jeu === 'spin'
    const lotsEnvoi = lotsOk.map(l => ({
      nom: l.nom.trim(), quantite: Number(l.quantite) || 1, valeur: 0, type: spin ? 'instantane' as const : 'tirage' as const, conditions: l.conditions.trim(),
      validiteJours: l.validite === 'jours' ? Number(l.jours) || null : null,
      validiteDu: l.validite === 'dates' ? l.du : null, validiteAu: l.validite === 'dates' ? l.au : null,
    }))
    let logoUrl: string | null = null
    if (p.partenaire_id) {
      const { data } = await supabase.from('partenaires').select('image_url').eq('id', p.partenaire_id).maybeSingle()
      logoUrl = (data as { image_url: string | null } | null)?.image_url ?? null
    }
    const r = await creerAnimation({
      id: evId, proId: p.id, module: module_, nom: `Jeu ${commerce.trim()}`, dateD: null, dateF: null,
      banqueId: estQuiz ? bq : null,
      cfgJeu: {
        ...(spin ? { spinSegments: lotsOk.map((l, k): { label: string; color: string; perdant?: boolean } => ({ label: l.nom.trim(), color: k % 2 ? '#7FA1F0' : BLEU })).concat([{ label: 'Perdu', color: '#CBD5E1', perdant: true }] as { label: string; color: string; perdant?: boolean }[]) } : cfgDepuisTirage({ mode: 'manuel', date: '', publier: false, notifierPerdants: true })),
        ...cfgMaster(module_, MASTER_VIDE),
        ...(logoUrl ? { logoUrl } : {}),
        commande: { offre: 'lancement', quiz_flowin: quizFlowin, kit, total_ht: totalHt, supports: supportsChoisis.map(s => s.t), paiement_actif: PAIEMENT_ACTIF, cree_le: new Date().toISOString() },
        ...(quizFlowin ? { quizFlowin: { statut: 'demande', theme: theme.trim(), objectif: objectif.trim(), bonus: jeu === 'quizbonus' } } : {}),
      },
      lots: lotsEnvoi,
      regleRecompense: spin ? { mode: 'aleatoire', everyX: 10, probabilite: 15 } : undefined,
      diffusionPhysique: supportsChoisis.some(s => s.type === 'physique') || kit === 'physique',
      diffusionDigital: supportsChoisis.some(s => s.type === 'digital'),
      diffusionQrTracking: true,
      paiement: PAIEMENT_ACTIF ? { offre: 'lancement', quizFlowin, customisation: false } : undefined,
    })
    if (!r.ok) { setEnvoi(''); setErreur(r.error || 'Votre jeu n’a pas pu être enregistré.'); return }
    const pris: string[] = []
    let ko = 0
    for (const s of supportsChoisis) {
      const q = await creerQrTrace(evId, { nom: s.t, support: s.support, type: s.type }, pris)
      if (q.qr) pris.push(q.qr.source_qr); else ko++
    }
    if (ko) infos.push(`${ko} QR à recréer depuis Diffusion.`)
    if (quizFlowin) {
      const d = await enregistrerDemandeQuiz({
        proId: p.id, proNom: commerce.trim(), theme, objectif, bonus: jeu === 'quizbonus', commerce: commerceQuiz || commerce,
        contactNom: contact, contactTel: tel, contactEmail: email, siret: chiffres(siret), adresse, cp, ville,
        animationNom: `Jeu ${commerce.trim()}`, jeu: JEUX.find(j => j.k === jeu)?.t, eventId: evId,
      })
      if (!d.ok) infos.push(`Demande de quiz non transmise : appelez Flowin au 04 93 59 91 37.`)
    }
    try {
      window.localStorage.setItem('flowin_am_prefill', JSON.stringify({
        raison: commerce.trim(), siret: chiffres(siret), adresse: adresse.trim(), cp: cp.trim(), ville: ville.trim(), contact, email: email.trim(), tel: tel.trim(), pro_id: p.id,
        lots: lotsOk.map(l => `${l.nom.trim()}${l.quantite > 1 ? ` × ${l.quantite}` : ''}`).join(', '),
        conditions_lots: Array.from(new Set(lotsOk.map(l => l.conditions.trim()).filter(Boolean))).join(' ; '),
      }))
    } catch { /* stockage indisponible : le bon reprend la fiche du compte */ }
    setEnvoi(''); setFait({ info: infos.join(' ') })
  }

  const q = `?pro=${encodeURIComponent(p.id)}`
  const lienEspace = `/pro${q}&bienvenue=jeu${quizFlowin ? '&quiz=1' : ''}`

  /* ── Validé ── */
  if (fait) {
    const urlBon = lienBonCommande({ proId: p.id, offre: 'lancement', quizFlowin, customisation: false, eventId: evId, kit })
    return (
      <Cadre>
        <div data-ecran="valide" style={{ textAlign: 'center' }}>
          <div style={{ width: 58, height: 58, borderRadius: 99, background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 30, fontWeight: 900 }}>✓</div>
          <div style={{ fontSize: 21, fontWeight: 900 }}>{PAIEMENT_ACTIF ? 'Bon de commande validé' : 'Votre jeu est en ligne'}</div>
          <div style={{ fontSize: 13.5, ...MUTED, marginTop: 4 }}>Votre facture vous est envoyée par email.{quizFlowin ? ' Votre quiz : retour sous 72 h.' : ''}</div>
        </div>
        {PAIEMENT_ACTIF && <div style={{ marginTop: 12 }}>
          <QrVirement montant={Math.round(totalHt * 1.2 * 100) / 100} reference={referenceVirement(evId)} taille={150} />
          <a href={urlBon} style={{ ...BTN2, display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 10 }}>Payer par prélèvement SEPA</a>
        </div>}
        {fait.info && <div style={{ fontSize: 12.5, color: '#B45309', fontWeight: 700, marginTop: 10 }}>{fait.info}</div>}
        <a data-espace href={lienEspace} style={{ ...BTN, display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 16 }}>Mon espace pro</a>
      </Cadre>
    )
  }

  /* ── Écrans ── */
  let contenu: ReactNode = null
  if (ecran === 'coord') contenu = (
    <>
      <Titre t="Vos coordonnées" s="Pour votre bon de commande." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <C2 l="Prénom"><input style={IN} value={prenom} onChange={e => setPrenom(e.target.value)} autoComplete="given-name" /></C2>
        <C2 l="Nom"><input style={IN} value={nomFam} onChange={e => setNomFam(e.target.value)} autoComplete="family-name" /></C2>
        <C2 l="Téléphone"><input style={IN} value={tel} onChange={e => setTel(e.target.value)} inputMode="tel" autoComplete="tel" /></C2>
        <C2 l="Email"><input style={IN} value={email} onChange={e => setEmail(e.target.value)} inputMode="email" autoComplete="email" /></C2>
      </div>
      <C2 l="Commerce"><input style={IN} value={commerce} onChange={e => setCommerce(e.target.value)} autoComplete="organization" /></C2>
      <C2 l="SIRET"><input style={IN} value={siret} onChange={e => setSiret(e.target.value)} inputMode="numeric" placeholder="14 chiffres" /></C2>
      <C2 l="Adresse"><input style={IN} value={adresse} onChange={e => setAdresse(e.target.value)} autoComplete="street-address" /></C2>
      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 8 }}>
        <C2 l="Code postal"><input style={IN} value={cp} onChange={e => setCp(e.target.value)} inputMode="numeric" autoComplete="postal-code" /></C2>
        <C2 l="Ville"><input style={IN} value={ville} onChange={e => setVille(e.target.value)} autoComplete="address-level2" /></C2>
      </div>
    </>
  )
  if (ecran === 'jeu') contenu = (
    <>
      <Titre t="Choisissez votre jeu" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {JEUX.map(j => (
          <button key={j.k} type="button" data-jeu={j.k} style={{ ...carte(jeu === j.k), textAlign: 'center' }}
            onClick={() => choisirPuisSuivant(() => { setJeu(j.k); if (j.k === 'spin' || j.k === 'tombola') setVoie('') })}>
            <div style={{ height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{j.illu}</div>
            <div style={{ fontSize: 16, fontWeight: 900, marginTop: 6 }}>{j.t}</div>
            <div style={{ fontSize: 12.5, ...MUTED, marginTop: 2, lineHeight: 1.35 }}>{j.s}</div>
          </button>
        ))}
      </div>
    </>
  )
  if (ecran === 'quiz') contenu = (
    <>
      <Titre t="Vos questions" s="Qui rédige le quiz ?" />
      <div style={{ display: 'grid', gap: 12 }}>
        <button type="button" data-voie="moi" style={{ ...carte(voie === 'moi'), padding: 18 }} onClick={() => choisirPuisSuivant(() => setVoie('moi'))}>
          <div style={{ fontSize: 17, fontWeight: 900 }}>Je rédige mes questions</div>
          <div style={{ fontSize: 13, ...MUTED, marginTop: 3 }}>Inclus</div>
        </button>
        <button type="button" data-voie="flowin" style={{ ...carte(voie === 'flowin'), padding: 18 }} onClick={() => choisirPuisSuivant(() => setVoie('flowin'))}>
          <div style={{ fontSize: 17, fontWeight: 900 }}>Je demande à Flowin de rédiger mon quiz</div>
          <div style={{ fontSize: 13, ...MUTED, marginTop: 3 }}><s>{eur(PRIX_ANIMATION.quizFlowin)}</s> <b style={{ color: BLEU }}>{eur(PRIX_ANIMATION.quizFlowinLancement)} HT</b> · 30 questions + 5 bonus</div>
        </button>
      </div>
    </>
  )
  if (ecran === 'flowin') contenu = (
    <>
      <Titre t="L’équipe Flowin rédige votre quiz." s={jeu === 'quizbonus' ? 'Quiz + bonus : sondez vos clients.' : 'Retour sous 72 h.'} />
      <C2 l="Thème"><input style={IN} value={theme} onChange={e => setTheme(e.target.value)} placeholder="Ex. le vin, la Provence, le cinéma" /></C2>
      <C2 l="Votre commerce"><input style={IN} value={commerceQuiz} onChange={e => setCommerceQuiz(e.target.value)} /></C2>
      <C2 l={jeu === 'quizbonus' ? 'Ce que vous voulez faire connaître ou sonder' : 'Ce que vous voulez faire connaître'}>
        <textarea style={{ ...IN, minHeight: 84, resize: 'none' }} value={objectif} onChange={e => setObjectif(e.target.value)} placeholder="Ex. notre nouvelle carte, l’avis sur nos horaires" />
      </C2>
    </>
  )
  if (ecran === 'questions') contenu = (
    <>
      <Titre t="Vos questions" s="Vous les écrivez ou modifiez à tout moment dans Banques." />
      <div style={{ display: 'grid', gap: 8 }}>
        {banquesQuiz.map(b => (
          <button key={b.id} type="button" style={carte(banqueId === b.id)} onClick={() => setBanqueId(b.id)}>
            <b style={{ fontSize: 14.5 }}>{b.nom}</b>
          </button>
        ))}
        <button type="button" data-banque="apres" style={carte(banqueId === 'apres' || !banqueId)} onClick={() => setBanqueId('apres')}>
          <b style={{ fontSize: 14.5 }}>J’écris mes questions après</b>
          <div style={{ fontSize: 12.5, ...MUTED }}>3 exemples à remplacer sont préparés.</div>
        </button>
      </div>
    </>
  )
  if (ecran === 'lots') contenu = (
    <>
      <Titre t="Vos lots" s="Ce qui fait revenir vos clients." />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {lots.map((l, k) => <button key={l.id} type="button" data-lot-onglet={k} style={puce(l.id === lot.id)} onClick={() => setLotI(k)}>{l.nom.trim() ? (l.nom.trim().length > 14 ? l.nom.trim().slice(0, 13) + '…' : l.nom.trim()) : `Lot ${k + 1}`}</button>)}
        {lots.length < 5 && <button type="button" data-lot-ajout style={{ ...puce(false), color: BLEU }} onClick={() => { setLots(ls => ls.concat([lotVide()])); setLotI(lots.length) }}>+ Lot</button>}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {EXEMPLES_LOTS.map(x => <button key={x.t} type="button" data-exemple={x.t} style={{ ...puce(false), padding: '6px 11px', fontSize: 12.5, background: '#F1F5FB' }} onClick={() => majLot({ nom: x.nom, conditions: lot.conditions || x.cond })}>{x.t}</button>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 84px', gap: 8 }}>
        <C2 l="Libellé"><input data-lot-nom style={IN} value={lot.nom} onChange={e => majLot({ nom: e.target.value })} placeholder="Bon d’achat de 5 €" /></C2>
        <C2 l="Quantité"><input data-lot-qte style={IN} type="number" min={1} value={lot.quantite} onChange={e => majLot({ quantite: Math.max(1, Number(e.target.value) || 1) })} /></C2>
      </div>
      <C2 l="Conditions"><input data-lot-cond style={IN} value={lot.conditions} onChange={e => majLot({ conditions: e.target.value })} placeholder="Bon de 5 € valable dès 30 € d’achat" /></C2>
      <span style={LAB}>Validité</span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {([['sans', 'Sans limite'], ['jours', 'En jours'], ['dates', 'Du … au …']] as [Validite, string][]).map(([k, t]) =>
          <button key={k} type="button" data-validite={k} style={puce(lot.validite === k)} onClick={() => majLot({ validite: k })}>{t}</button>)}
      </div>
      {lot.validite === 'jours' && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}><input data-lot-jours style={{ ...IN, width: 90 }} type="number" min={1} value={lot.jours} onChange={e => majLot({ jours: Number(e.target.value) || 0 })} /><b style={{ fontSize: 14 }}>jours après le gain</b></div>}
      {lot.validite === 'dates' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
        <C2 l="Du"><input data-lot-du style={IN} type="date" value={lot.du} onChange={e => majLot({ du: e.target.value })} /></C2>
        <C2 l="Au"><input data-lot-au style={IN} type="date" value={lot.au} onChange={e => majLot({ au: e.target.value })} /></C2>
      </div>}
    </>
  )
  if (ecran === 'supports') contenu = (
    <>
      <Titre t="Où diffusez-vous votre jeu ?" s="Un QR par support : vous mesurez l’impact de chacun." />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {SUPPORTS.map(s => {
          const on = supports.indexOf(s.k) >= 0
          return <button key={s.k} type="button" data-support={s.k} aria-pressed={on} style={puce(on)} onClick={() => setSupports(l => on ? l.filter(x => x !== s.k) : l.concat([s.k]))}>{on ? '✓ ' : ''}{s.t}</button>
        })}
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginTop: 14, paddingBottom: 4, scrollbarWidth: 'none' }}>
        {supportsChoisis.map(s => (
          <div key={s.k} data-qr={s.k} style={{ flex: '0 0 auto', width: 106, textAlign: 'center', border: `1.5px solid ${C.bordure}`, borderRadius: 14, padding: 8, background: '#fff' }}>
            {qrs[s.k + module_ + slugs[s.k]] ? <img src={qrs[s.k + module_ + slugs[s.k]]} alt={`QR ${s.t}`} width={90} height={90} style={{ display: 'block', margin: '0 auto' }} /> : <div style={{ width: 90, height: 90, margin: '0 auto', background: C.subtil, borderRadius: 8 }} />}
            <div style={{ fontSize: 12.5, fontWeight: 800, marginTop: 4 }}>{s.t}</div>
          </div>
        ))}
      </div>
    </>
  )
  if (ecran === 'kit') contenu = (
    <>
      <Titre t="Votre kit" />
      <div style={{ display: 'grid', gap: 12 }}>
        <button type="button" data-kit="digital" style={{ ...carte(kit === 'digital'), padding: 18 }} onClick={() => choisirPuisSuivant(() => setKit('digital'))}>
          <div style={{ fontSize: 17, fontWeight: 900 }}>Kit digital (inclus)</div>
          <div style={{ fontSize: 13, ...MUTED, marginTop: 3 }}>Affiches et QR à imprimer vous-même.</div>
        </button>
        <button type="button" data-kit="physique" style={{ ...carte(kit === 'physique'), padding: 18 }} onClick={() => choisirPuisSuivant(() => setKit('physique'))}>
          <div style={{ fontSize: 17, fontWeight: 900 }}>Demander l’impression du kit physique</div>
          <div style={{ fontSize: 13, ...MUTED, marginTop: 3 }}>Support de caisse, 3 affiches, 3 macarons · <b style={{ color: BLEU }}>{PRIX_KIT_PHYSIQUE} € HT</b> par boutique</div>
        </button>
      </div>
    </>
  )
  if (ecran === 'recap') {
    const jeuT = JEUX.find(j => j.k === jeu)?.t || '—'
    const blocs: { cle: string; t: string; v: string }[] = [
      { cle: 'jeu', t: 'Jeu', v: jeuT },
      ...(estQuiz ? [{ cle: voie === 'flowin' ? 'flowin' : 'quiz', t: 'Quiz', v: voie === 'flowin' ? `Rédigé par Flowin · ${theme.trim() || '—'}` : 'Je rédige mes questions' }] : []),
      { cle: 'lots', t: 'Lots', v: lotsOk.map(l => `${l.nom.trim()} × ${l.quantite}${l.conditions.trim() ? ` (${l.conditions.trim()})` : ''} · ${l.validite === 'sans' ? 'sans limite' : l.validite === 'jours' ? `${l.jours} j` : `du ${l.du.split('-').reverse().join('/')} au ${l.au.split('-').reverse().join('/')}`}`).join(' ; ') || '—' },
      { cle: 'supports', t: 'Supports', v: supportsChoisis.map(s => s.t).join(', ') || '—' },
      { cle: 'kit', t: 'Kit', v: kit === 'physique' ? 'Kit physique imprimé' : 'Kit digital' },
    ]
    contenu = (
      <>
        <Titre t="Récapitulatif" />
        <div style={{ display: 'grid', gap: 7 }}>
          {blocs.map(b => (
            <div key={b.t} data-recap={b.cle} style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1.5px solid ${C.bordure}`, borderRadius: 14, padding: '9px 12px', background: '#fff' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 800, ...MUTED }}>{b.t}</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{b.v}</div>
              </div>
              <button type="button" data-modifier={b.cle} onClick={() => modifier(b.cle)} style={{ border: 'none', background: 'none', color: BLEU, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Modifier</button>
            </div>
          ))}
        </div>
      </>
    )
  }
  if (ecran === 'prix') contenu = (
    <>
      <Titre t="Flowin vous remercie." s="Premier client : offre de bienvenue -50 %." />
      <div style={{ border: `1.5px solid ${C.bordure}`, borderRadius: 16, background: '#fff', padding: '4px 14px' }}>
        <LignePrix t="Animation, 1re année" barre={`${PRIX_ANIMATION.annuelle} € HT/an`} v={`${PRIX_ANIMATION.lancement} € HT`} />
        {quizFlowin && <LignePrix t="Quiz rédigé par Flowin" barre={eur(PRIX_ANIMATION.quizFlowin)} v={`${eur(PRIX_ANIMATION.quizFlowinLancement)} HT`} />}
        {kit === 'physique' && <LignePrix t="Kit physique imprimé" v={`${PRIX_KIT_PHYSIQUE} € HT`} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', fontWeight: 900, fontSize: 16 }}><span>Total</span><span data-total>{eur(totalHt)} HT</span></div>
      </div>
      <div style={{ fontSize: 13, ...MUTED, marginTop: 10, textAlign: 'center' }}>Votre facture vous est envoyée par email.{quizFlowin ? ' Quiz : retour sous 72 h.' : ''}</div>
      {erreur && <div style={{ fontSize: 12.5, color: '#B91C1C', fontWeight: 700, marginTop: 8 }}>{erreur}</div>}
    </>
  )

  const msg = tente ? bloque[ecran] : null
  return (
    <Cadre>
      <div {...glisser} data-ecran={ecran}>
        {contenu}
        {retourRecap && ecran !== 'recap' && ecran !== 'quiz' && <button type="button" data-retour-recap style={{ ...BTN2, width: '100%', marginTop: 10 }} onClick={() => { if (bloque[ecran]) { setTente(true); return } setRetourRecap(false); allerA('recap') }}>Retour au récapitulatif</button>}
        {msg && <div style={{ fontSize: 12.5, color: '#B45309', fontWeight: 700, marginTop: 8, textAlign: 'right' }}>{msg}</div>}
        <NavCarrousel n={ecrans.length} i={cur} setI={setEcran} suivantBloque={bloque[ecran]} onTenter={() => setTente(true)}
          dernier={<button type="button" data-valider style={{ ...BTN, opacity: envoi ? 0.6 : 1 }} disabled={!!envoi} onClick={valider}>{envoi ? 'Validation…' : 'Valider mon bon de commande'}</button>} />
      </div>
    </Cadre>
  )
}

function Cadre({ children }: { children: ReactNode }) {
  return <div data-configurateur style={{ maxWidth: 560, margin: '0 auto' }}>{children}</div>
}
function LignePrix({ t, barre, v }: { t: string; barre?: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, padding: '11px 0', borderBottom: `1px solid ${C.bordure}` }}>
      <span style={{ fontSize: 14, fontWeight: 700 }}>{t}</span>
      <span style={{ whiteSpace: 'nowrap', fontSize: 14 }}>{barre && <s style={{ color: C.attenue, marginRight: 6 }}>{barre}</s>}<b style={{ color: BLEU }}>{v}</b></span>
    </div>
  )
}

/* Petites illustrations des jeux (SVG, bleu Flowin). */
function IlluQuiz({ bonus }: { bonus?: boolean }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="8" y="10" width="48" height="36" rx="10" fill="#E3E9F8" />
      <text x="32" y="37" textAnchor="middle" fontSize="24" fontWeight="900" fill={BLEU} fontFamily="Arial">?</text>
      <path d="M22 46l-4 10 12-10" fill="#E3E9F8" />
      {bonus && <g><circle cx="50" cy="14" r="10" fill={BLEU} /><text x="50" y="19" textAnchor="middle" fontSize="15" fontWeight="900" fill="#fff" fontFamily="Arial">+</text></g>}
    </svg>
  )
}
function IlluRoue() {
  const parts = [0, 1, 2, 3, 4, 5]
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
      {parts.map(k => {
        const a1 = (k / 6) * Math.PI * 2, a2 = ((k + 1) / 6) * Math.PI * 2
        return <path key={k} d={`M32 34 L${32 + 24 * Math.cos(a1)} ${34 + 24 * Math.sin(a1)} A24 24 0 0 1 ${32 + 24 * Math.cos(a2)} ${34 + 24 * Math.sin(a2)} Z`} fill={k % 2 ? '#7FA1F0' : BLEU} />
      })}
      <circle cx="32" cy="34" r="5" fill="#fff" /><path d="M32 4l5 9h-10z" fill="#F59E0B" />
    </svg>
  )
}
function IlluTombola() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M8 22h48v8a5 5 0 000 10v8H8v-8a5 5 0 000-10z" fill="#E3E9F8" stroke={BLEU} strokeWidth="2.5" />
      <line x1="24" y1="24" x2="24" y2="46" stroke={BLEU} strokeWidth="2" strokeDasharray="3 3" />
      <text x="40" y="40" textAnchor="middle" fontSize="13" fontWeight="900" fill={BLEU} fontFamily="Arial">N°7</text>
    </svg>
  )
}
