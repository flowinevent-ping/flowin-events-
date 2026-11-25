'use client'

/**
 * CONFIGURATEUR DU JEU (pro) — maquette lot 3-4 validée le 24/11/2026 : QUATRE écrans pré-remplis, carrousel sans scroll :
 *   Jeu (roue présélectionnée ; quiz : questions en banque ou rédigées par Flowin) · Lots (formulaire complet + aperçu du ticket,
 *   LotFormulaire.tsx) · Diffusion (supports, QR, kit digital par défaut) · Validation (récapitulatif + prix, « Valider mon bon de commande »).
 *   Les coordonnées sont reprises du profil : seuls les champs manquants s'affichent, sur l'écran Validation.
 * Écritures : pros (coordonnées), events + lots (creerAnimation, lots.validite_jours, lots.valide_du / valide_au),
 * qr_stations (creerQrTrace), crm_retours (enregistrerDemandeQuiz, enregistrerDemandeKit — même avec PAIEMENT_ACTIF=false), banques (questions à écrire après).
 * PAIEMENT_ACTIF=false : validation sans paiement, le jeu passe en ligne ; true : bon de commande pré-rempli + virement.
 * Le logo n'est plus bloquant (Romain, 10/11) : le billet montre le nom du commerce tant qu'il n'y a pas de logo.
 */
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { creerAnimation, enregistrerDemandeQuiz, enregistrerDemandeKit, idAnimation } from '@/lib/pro'
import type { Banque, QuestionQuiz } from '@/lib/banques'
import { creerBanque, enregistrerBanque, nouvelleQuestionQuiz } from '@/lib/banques'
import { GABARIT_MODULE } from '@/lib/gabarit'
import { creerQrTrace, slugQr, QR_INCLUS, urlDuQr, type TypeQr } from '@/lib/qrTraces'
import LotsEcran, { lotVide, verifierLot, valeurNombre, casesRoue, type LotC } from './LotFormulaire'
import { PictoSupport } from '@/components/operations/PictoSupport'
import { lienAncien } from '@/lib/qrPermalien'
import { qrFlowinPng } from '@/lib/qrLogo'
import { geocoderAdresse } from '@/lib/geocodage'
import { cfgDepuisTirage } from '@/components/operations/ReglageTirage'
import { cfgMaster, MASTER_VIDE } from '@/components/masters/PersoMaster'
import { NavCarrousel, useGlisser } from '@/components/pro/Carrousel'
import QrVirement from '@/components/pro/QrVirement'
import { PRIX_ANIMATION, PRIX_KIT_PHYSIQUE, PAIEMENT_ACTIF, lienBonCommande, referenceVirement } from '@/lib/reglement'
import { chiffres, siretValide } from '@/lib/entreprise'
import { CHARTE_PRO as C, VERT_OK } from '@/lib/charte'
import EnLigne, { Celebration, type QrFin } from './EnLigne'
import { BTN, BTN2, MUTED } from '@/lib/proui'

const BLEU = '#3B5CC4'
const GROUPES = ['Jeu', 'Lots', 'Diffusion', 'Validation']
const THEMES_QUIZ = ['Mon métier', 'Ma ville', 'Saison', 'Culture générale']
const TONS = ['Léger', 'Neutre', 'Sérieux']
const DELAIS = ['Sous 1 semaine', 'Urgent', 'À une date']
export interface ProConfigurateur {
  id: string; nom: string | null; adresse: string | null; code_postal: string | null; ville: string | null
  email: string | null; tel: string | null; contact: string | null; partenaire_id: string | null; siret?: string | null
}
/** Date du jour + n jours, au format AAAA-MM-JJ (heure locale). */
const isoJour = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
type Jeu = 'quizbonus' | 'spin' | 'tombola'

const JEUX: { k: Jeu; module: string; t: string; s: string; illu: ReactNode }[] = [
  { k: 'quizbonus', module: GABARIT_MODULE, t: 'Quiz + bonus', s: 'Animez, dynamisez et sondez votre clientèle', illu: <IlluQuiz bonus /> },
  { k: 'spin', module: 'spin', t: 'Roue', s: 'Faites-les gagner tout de suite, faites-les revenir', illu: <IlluRoue /> },
  { k: 'tombola', module: 'tombola', t: 'Tombola', s: 'Animez et créez de l’engouement autour de votre offre', illu: <IlluTombola /> },
]
/** Supports de diffusion : ceux des QR tracés (lib/qrTraces SUPPORTS_QR), un QR par support coché. */
const SUPPORTS: { k: string; t: string; support: string; type: TypeQr; p: string }[] = [
  { k: 'magasin', t: 'En magasin', support: 'Vitrine / comptoir', type: 'physique', p: 'vitrine' },
  { k: 'caisse', t: 'Ticket de caisse', support: 'Ticket de caisse', type: 'physique', p: 'ticket' },
  { k: 'affiche', t: 'Affiche', support: 'Affiche', type: 'physique', p: 'affiche' },
  { k: 'flyer', t: 'Flyer', support: 'Flyer', type: 'physique', p: 'flyer' },
  { k: 'bus', t: 'Bus / transport', support: 'Bus / transport', type: 'physique', p: 'bus' },
  { k: 'instagram', t: 'Instagram', support: 'Instagram', type: 'digital', p: 'instagram' },
  { k: 'facebook', t: 'Facebook', support: 'Facebook', type: 'digital', p: 'facebook' },
  { k: 'tiktok', t: 'TikTok', support: 'TikTok', type: 'digital', p: 'tiktok' },
  { k: 'site', t: 'Site web', support: 'Site web', type: 'physique', p: 'site' },
  { k: 'presse', t: 'Presse / magazine', support: 'Presse / magazine', type: 'physique', p: 'presse' },
  { k: 'radio', t: 'Radio', support: 'Radio', type: 'physique', p: 'radio' },
]
const eur = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €'

const IN: CSSProperties = { width: '100%', padding: '11px 13px', background: '#fff', border: `1.5px solid ${C.bordureChamp}`, borderRadius: 12, color: C.texte, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }
const LAB: CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 800, color: C.attenue, margin: '0 0 4px' }
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
  /* Coordonnées reprises du profil : seuls les champs manquants sont demandés (calculé une fois, à l'ouverture). */
  const [manque] = useState(() => ({
    nom: !prenom.trim() || !nomFam.trim(), tel: !tel.trim(), email: !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email.trim()),
    commerce: !commerce.trim(), siret: !siretValide(siret), adresse: !adresse.trim() || !ville.trim(),
  }))
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!p.partenaire_id) return
    supabase.from('partenaires').select('image_url').eq('id', p.partenaire_id).maybeSingle().then(r => setLogoUrl(((r.data as { image_url: string | null } | null)?.image_url) ?? null), () => {})
  }, [p.partenaire_id])

  /* 2-4. Jeu et quiz */
  /* Pré-rempli : la roue est présélectionnée (1 toucher pour changer). */
  const [jeu, setJeu] = useState<Jeu | null>('spin')
  const [voie, setVoie] = useState<'' | 'moi' | 'flowin'>('')
  const [banqueId, setBanqueId] = useState<string>('')
  const [theme, setTheme] = useState('')
  /* Demande à Flowin de rédiger le quiz (maquette lot 5 A) : nombre, ton, délai. Rien d'obligatoire sauf le thème. */
  const [nbQuiz, setNbQuiz] = useState(30)
  const [nbBonus, setNbBonus] = useState(5)
  const [ton, setTon] = useState('Neutre')
  const [delai, setDelai] = useState('Sous 1 semaine')
  const [motFlowin, setMotFlowin] = useState('')
  const [commerceQuiz, setCommerceQuiz] = useState(p.nom || '')
  const estQuiz = jeu === 'quizbonus'
  /* Audit promesse L3 (19/11/2026) : « c'est toi qui choisis le gain, immédiat ou par tirage au sort ».
     La roue gagne tout de suite, la tombola tire au sort ; pour le quiz, le pro choisit. */
  const [gainQuiz, setGainQuiz] = useState<'' | 'immediat' | 'tirage'>('immediat')
  const gainImmediat = jeu === 'spin' || (estQuiz && gainQuiz === 'immediat')
  const banquesQuiz = useMemo(() => banques.slice(0, 3), [banques])

  /* 5. Lots */
  const [lots, setLots] = useState<LotC[]>([lotVide()])
  const [lotI, setLotI] = useState(0)
  const lot = lots[Math.min(lotI, lots.length - 1)]
  const majLot = (patch: Partial<LotC>) => setLots(ls => ls.map(l => (l.id === lot.id ? { ...l, ...patch } : l)))
  /* Roue : cases perdues et tickets pour le prochain tirage (3 types de cases : lot, perdu, ticket). */
  const [nbPerdu, setNbPerdu] = useState(2)
  const [nbTicket, setNbTicket] = useState(0)
  /* Formulaire complet obligatoire : un lot commencé doit être complet ; au moins un lot complet. */
  const lotsOk = lots.filter(l => l.nom.trim() || l.conditions.trim())
  const lotsKo = !lotsOk.length ? 'Ajoutez au moins un lot.' : (lotsOk.map(verifierLot).find(x => !!x) ?? null)

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
  /* Durée de l'animation (curseur, Romain 25/11) : début aujourd'hui, fin = début + durée. */
  const [dureeJours, setDureeJours] = useState(30)
  const [nbBoutiques, setNbBoutiques] = useState(1)

  /* Écrans */
  const ecrans = useMemo(() => {
    const e: string[] = []
    e.push('jeu')
    if (estQuiz) { e.push('quiz'); if (voie === 'flowin') e.push('flowin'); if (voie === 'moi') e.push('questions') }
    e.push('lots', 'diffusion', 'validation')
    return e
  }, [estQuiz, voie])
  const [i, setI] = useState(0)
  const cur = Math.min(i, ecrans.length - 1)
  const ecran = ecrans[cur]
  const [retourRecap, setRetourRecap] = useState(false)
  const [tente, setTente] = useState(false)
  const bloque: Record<string, string | null> = {
    jeu: !jeu ? 'Choisissez un jeu.' : null,
    quiz: !voie ? 'Choisissez qui rédige le quiz.' : null,
    flowin: !theme.trim() ? 'Indiquez le thème du quiz.' : null,
    questions: null,
    lots: lotsKo,
    diffusion: !supports.length ? 'Cochez au moins un support.' : null,
    validation: coordKo,
  }
  const allerA = (cle: string) => { const k = ecrans.indexOf(cle); if (k >= 0) { setI(k); setTente(false) } }
  const setEcran = (k: number) => {
    setTente(false)
    if (retourRecap && k > cur && ecran !== 'quiz' && ecran !== 'validation') { setRetourRecap(false); allerA('validation'); return }
    setI(k)
  }
  const glisser = useGlisser(s => { const k = cur + s; if (k < 0 || k >= ecrans.length) return; if (s > 0 && bloque[ecran]) { setTente(true); return } setEcran(k) })
  /* Arrivé au récapitulatif, le mode « Modifier » s'arrête. */
  useEffect(() => { if (ecran === 'validation') setRetourRecap(false) }, [ecran])
  const modifier = (cle: string) => { setRetourRecap(true); allerA(cle) }
  /* Progression STABLE (23/11/2026, AMEL-DES-04) : 4 groupes fixes, quels que soient les choix (quiz ou non,
     je rédige ou Flowin rédige). Le nombre d'écrans varie de 4 (roue, tombola) à 5-6 (quiz), jamais le décor de progression. */
  const groupeDe = (e: string) => e === 'lots' ? 1 : e === 'diffusion' ? 2 : e === 'validation' ? 3 : 0
  const grCur = groupeDe(ecran)
  const allerGroupe = (g: number) => {
    const cible = ecrans.findIndex(e => groupeDe(e) === g)
    if (cible < 0 || g === grCur) return
    for (let k = cur; k < cible; k++) if (bloque[ecrans[k]]) { setTente(true); return }
    setTente(false); setRetourRecap(false); setI(cible)
  }
  /* Un choix unique fait avancer tout seul (moins de clics). */
  const choisirPuisSuivant = (fn: () => void) => { fn(); setTimeout(() => setI(k => k + 1), 160) }

  /* Prix (offre de bienvenue -50 %, grille unique lib/reglement) */
  const quizFlowin = estQuiz && voie === 'flowin'
  const totalHt = PRIX_ANIMATION.lancement + (quizFlowin ? PRIX_ANIMATION.quizFlowinLancement : 0) + (kit === 'physique' ? PRIX_KIT_PHYSIQUE * nbBoutiques : 0)

  /* Validation */
  const [envoi, setEnvoi] = useState<'' | 'envoi'>('')
  const [erreur, setErreur] = useState('')
  const [fait, setFait] = useState<{ info: string; qrs: QrFin[] } | null>(null)
  const supportsChoisis = SUPPORTS.filter(s => supports.indexOf(s.k) >= 0)
  const objectifFlowin = [`Nombre : ${nbQuiz} questions${jeu === 'quizbonus' ? ` + ${nbBonus} bonus` : ''}`, `Ton : ${ton}`, `Délai : ${delai}`, motFlowin.trim() ? `Mot pour Flowin : ${motFlowin.trim()}` : ''].filter(Boolean).join(' · ')
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
    /* Position du commerce pour la carte des commerces participants (jamais inventée : sans résultat, pas de point). */
    const gps = await geocoderAdresse(adresse.trim(), cp.trim() || null, ville.trim()).catch(() => null)
    const lotsEnvoi = lotsOk.map(l => ({
      nom: l.nom.trim(), quantite: Number(l.quantite) || 1, valeur: valeurNombre(l.valeur) ?? undefined, cessible: l.cessible, type: gainImmediat ? 'instantane' as const : 'tirage' as const, conditions: l.conditions.trim(),
      validiteJours: l.validite === 'jours' ? Number(l.jours) || null : null,
      validiteDu: l.validite === 'dates' ? l.du : null, validiteAu: l.validite === 'dates' ? l.au : null,
    }))
    let logoUrl: string | null = null
    if (p.partenaire_id) {
      const { data } = await supabase.from('partenaires').select('image_url').eq('id', p.partenaire_id).maybeSingle()
      logoUrl = (data as { image_url: string | null } | null)?.image_url ?? null
    }
    const r = await creerAnimation({
      id: evId, proId: p.id, module: module_, nom: `Jeu ${commerce.trim()}`, dateD: isoJour(0), dateF: isoJour(dureeJours),
      banqueId: estQuiz ? bq : null,
      cfgJeu: {
        ...(spin ? { spinSegments: casesRoue(lotsOk, nbPerdu, nbTicket).map(c => ({ label: c.label, color: c.color, ...(c.perdant ? { perdant: true } : {}), ...(c.mode ? { mode: c.mode } : {}), ...(c.textes && c.textes.length ? { textes: c.textes } : {}) })) } : cfgDepuisTirage({ mode: 'manuel', date: '', publier: false, notifierPerdants: true })),
        ...cfgMaster(module_, MASTER_VIDE),
        ...(logoUrl ? { logoUrl } : {}),
        commande: { offre: 'lancement', quiz_flowin: quizFlowin, kit, ...(kit === 'physique' ? { nb_boutiques: nbBoutiques } : {}), total_ht: totalHt, supports: supportsChoisis.map(s => s.t), paiement_actif: PAIEMENT_ACTIF, cree_le: new Date().toISOString() },
        ...(quizFlowin ? { quizFlowin: { statut: 'demande', theme: theme.trim(), objectif: objectifFlowin, bonus: jeu === 'quizbonus', nb_quiz: nbQuiz, nb_bonus: jeu === 'quizbonus' ? nbBonus : 0, ton, delai } } : {}),
      },
      lots: lotsEnvoi,
      /* Quiz en gain immédiat : un lot par joueur et par jour tant qu'il en reste (appliquer_regle_gain). */
      regleRecompense: spin ? { mode: 'aleatoire', everyX: 10, probabilite: 15 } : gainImmediat ? { mode: 'aleatoire', everyX: 1, probabilite: 100 } : undefined,
      lieu: gps ? { lat: gps.lat, lng: gps.lng, adresse: [adresse.trim(), [cp.trim(), ville.trim()].filter(Boolean).join(' ')].filter(Boolean).join(', '), photoUrl: logoUrl } : null,
      diffusionPhysique: supportsChoisis.some(s => s.type === 'physique') || kit === 'physique',
      diffusionDigital: supportsChoisis.some(s => s.type === 'digital'),
      diffusionQrTracking: true,
      paiement: PAIEMENT_ACTIF ? { offre: 'lancement', quizFlowin, customisation: false } : undefined,
    })
    if (!r.ok) { setEnvoi(''); setErreur(r.error || 'Votre jeu n’a pas pu être enregistré.'); return }
    const pris: string[] = []
    const qrsFin: QrFin[] = []
    let ko = 0
    for (const s of supportsChoisis) {
      const q = await creerQrTrace(evId, { nom: s.t, support: s.support, type: s.type }, pris)
      if (q.qr) { pris.push(q.qr.source_qr); qrsFin.push({ nom: s.t, support: s.support, code: q.qr.code_court ?? null, url: urlDuQr(q.qr, evId, module_) }) } else ko++
    }
    /* Aucun QR enregistre : on montre quand meme le lien du jeu (jamais un ecran final sans QR). */
    if (!qrsFin.length && supportsChoisis[0]) qrsFin.push({ nom: supportsChoisis[0].t, support: supportsChoisis[0].support, code: null, url: lienAncien(evId, module_, slugs[supportsChoisis[0].k]) })
    if (ko) infos.push(`${ko} QR à recréer depuis Diffusion.`)
    if (quizFlowin) {
      const d = await enregistrerDemandeQuiz({
        proId: p.id, proNom: commerce.trim(), theme, objectif: objectifFlowin, bonus: jeu === 'quizbonus', commerce: commerceQuiz || commerce,
        contactNom: contact, contactTel: tel, contactEmail: email, siret: chiffres(siret), adresse, cp, ville,
        animationNom: `Jeu ${commerce.trim()}`, jeu: JEUX.find(j => j.k === jeu)?.t, eventId: evId,
      })
      if (!d.ok) infos.push(`Demande de quiz non transmise : appelez Flowin au 04 93 59 91 37.`)
    }
    /* Kit physique : demande d'impression envoyée à Flowin même sans paiement (même file que la demande de quiz). */
    if (kit === 'physique') {
      const d = await enregistrerDemandeKit({
        proId: p.id, proNom: commerce.trim(), nbBoutiques, contactNom: contact, contactTel: tel, contactEmail: email,
        siret: chiffres(siret), adresse, cp, ville, eventId: evId, animationNom: `Jeu ${commerce.trim()}`,
      })
      if (!d.ok) infos.push(`Demande d’impression du kit non transmise : appelez Flowin au 04 93 59 91 37.`)
    }
    try {
      window.localStorage.setItem('flowin_am_prefill', JSON.stringify({
        raison: commerce.trim(), siret: chiffres(siret), adresse: adresse.trim(), cp: cp.trim(), ville: ville.trim(), contact, email: email.trim(), tel: tel.trim(), pro_id: p.id,
        lots: lotsOk.map(l => `${l.nom.trim()}${l.quantite > 1 ? ` × ${l.quantite}` : ''}`).join(', '),
        conditions_lots: Array.from(new Set(lotsOk.map(l => l.conditions.trim()).filter(Boolean))).join(' ; '),
      }))
    } catch { /* stockage indisponible : le bon reprend la fiche du compte */ }
    setEnvoi(''); setFait({ info: infos.join(' '), qrs: qrsFin })
  }

  const q = `?pro=${encodeURIComponent(p.id)}`
  const lienEspace = `/pro${q}&bienvenue=jeu${quizFlowin ? '&quiz=1' : ''}`

  /* ── Validé ── */
  if (fait) {
    const urlBon = lienBonCommande({ proId: p.id, offre: 'lancement', quizFlowin, customisation: false, eventId: evId, kit })
    if (!PAIEMENT_ACTIF) {
      return <Cadre><EnLigne commerce={commerce.trim()} qrs={fait.qrs} lienEspace={lienEspace} info={fait.info} quizFlowin={quizFlowin} eventId={evId} logoUrl={logoUrl} /></Cadre>
    }
    return (
      <Cadre>
        <div data-ecran="valide" style={{ textAlign: 'center' }}>
          <Celebration />
          <div style={{ fontSize: 21, fontWeight: 900 }}>Bon de commande validé</div>
          <div style={{ fontSize: 13.5, ...MUTED, marginTop: 4 }}>Votre facture vous est envoyée par email.{quizFlowin ? ' Votre quiz : retour sous 72 h.' : ''}</div>
        </div>
        <div style={{ marginTop: 12 }}>
          <QrVirement montant={Math.round(totalHt * 1.2 * 100) / 100} reference={referenceVirement(evId)} taille={150} />
          <a href={urlBon} style={{ ...BTN2, display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 10 }}>Payer par prélèvement SEPA</a>
        </div>
        {fait.info && <div style={{ fontSize: 13, color: '#B45309', fontWeight: 700, marginTop: 10 }}>{fait.info}</div>}
        <a data-espace href={lienEspace} style={{ ...BTN, display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 16 }}>Mon espace pro</a>
      </Cadre>
    )
  }

  /* ── Écrans ── */
  let contenu: ReactNode = null
  if (ecran === 'jeu') contenu = (
    <>
      <Titre t="Votre jeu" s="Choisi pour démarrer : touchez pour en changer." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {JEUX.map(j => (
          <button key={j.k} type="button" data-jeu={j.k} aria-pressed={jeu === j.k} style={{ ...carte(jeu === j.k), textAlign: 'center', minHeight: 44 }}
            onClick={() => { setJeu(j.k); if (j.k === 'spin' || j.k === 'tombola') setVoie('') }}>
            <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{j.illu}</div>
            <div style={{ fontSize: 16, fontWeight: 900, marginTop: 4 }}>{j.t}</div>
            <div style={{ fontSize: 12.5, ...MUTED, marginTop: 2, lineHeight: 1.35 }}>{j.s}</div>
          </button>
        ))}
      </div>
      {estQuiz && (
        <div style={{ marginTop: 12 }}>
          <span style={LAB}>Le gain</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" data-gain="immediat" style={{ ...puce(gainQuiz === 'immediat'), flex: 1 }} onClick={() => setGainQuiz('immediat')}>Gain immédiat</button>
            <button type="button" data-gain="tirage" style={{ ...puce(gainQuiz === 'tirage'), flex: 1 }} onClick={() => setGainQuiz('tirage')}>Tirage au sort</button>
          </div>
        </div>
      )}
    </>
  )
  if (ecran === 'quiz') contenu = (
    <>
      <Titre t="Vos questions" s="Comment avoir les questions ?" />
      <div style={{ display: 'grid', gap: 12 }}>
        <button type="button" data-voie="moi" style={{ ...carte(voie === 'moi'), padding: 18 }} onClick={() => choisirPuisSuivant(() => setVoie('moi'))}>
          <div style={{ fontSize: 17, fontWeight: 900 }}>Choisir dans une banque</div>
          <div style={{ fontSize: 13, ...MUTED, marginTop: 3 }}>Mes banques, ou j’écris après · inclus</div>
        </button>
        <button type="button" data-voie="flowin" style={{ ...carte(voie === 'flowin'), padding: 18 }} onClick={() => choisirPuisSuivant(() => setVoie('flowin'))}>
          <div style={{ fontSize: 17, fontWeight: 900 }}>Demander à Flowin de rédiger mes questions</div>
          <div style={{ fontSize: 13, ...MUTED, marginTop: 3 }}>Quiz et questions bonus, prêts à jouer</div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: BLEU, marginTop: 6 }}>Option Flowin · {eur(PRIX_ANIMATION.quizFlowinLancement)} HT la 1re année</div>
        </button>
      </div>
    </>
  )
  if (ecran === 'flowin') contenu = (
    <>
      <Titre t="Flowin rédige votre quiz" s={jeu === 'quizbonus' ? 'Quiz + questions bonus.' : 'Quelques choix, rien d’autre.'} />
      <span style={LAB}>Thème</span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        {THEMES_QUIZ.map(t => <button key={t} type="button" data-theme={t} style={puce(theme === t)} onClick={() => setTheme(t)}>{t}</button>)}
      </div>
      <input data-theme-libre style={{ ...IN, marginBottom: 10 }} value={theme} onChange={e => setTheme(e.target.value)} aria-label="Thème" placeholder="Ou votre thème" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}><b style={{ fontSize: 14 }}>Questions du quiz</b><Pas v={nbQuiz} set={setNbQuiz} min={10} max={60} pas={5} label="Questions du quiz" /></div>
      {jeu === 'quizbonus' && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}><b style={{ fontSize: 14 }}>Questions bonus</b><Pas v={nbBonus} set={setNbBonus} min={1} max={15} pas={1} label="Questions bonus" /></div>}
      <span style={LAB}>Ton</span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>{TONS.map(t => <button key={t} type="button" data-ton={t} style={puce(ton === t)} onClick={() => setTon(t)}>{t}</button>)}</div>
      <span style={LAB}>Délai · à confirmer par Flowin</span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>{DELAIS.map(t => <button key={t} type="button" data-delai={t} style={puce(delai === t)} onClick={() => setDelai(t)}>{t}</button>)}</div>
      <input style={IN} value={motFlowin} onChange={e => setMotFlowin(e.target.value)} aria-label="Un mot pour Flowin" placeholder="Un mot pour Flowin (facultatif)" />
    </>
  )
  if (ecran === 'questions') contenu = (
    <>
      <Titre t="Vos questions" s="Vous les écrivez ou modifiez à tout moment dans Banques." />
      <div style={{ display: 'grid', gap: 8 }}>
        {banquesQuiz.map(b => (
          <button key={b.id} type="button" style={{ ...carte(banqueId === b.id), minHeight: 44 }} onClick={() => setBanqueId(b.id)}>
            <b style={{ fontSize: 14.5 }}>{b.nom}</b>
          </button>
        ))}
        <button type="button" data-banque="apres" style={{ ...carte(banqueId === 'apres' || !banqueId), minHeight: 44 }} onClick={() => setBanqueId('apres')}>
          <b style={{ fontSize: 14.5 }}>J’écris mes questions après</b>
          <div style={{ fontSize: 12.5, ...MUTED }}>3 exemples à remplacer sont préparés.</div>
        </button>
      </div>
    </>
  )
  if (ecran === 'lots') contenu = (
    <LotsEcran lots={lots} setLots={setLots} lotI={lotI} setLotI={setLotI} mode={gainImmediat ? 'immediat' : 'tirage'} spin={jeu === 'spin'}
      nbPerdu={nbPerdu} setNbPerdu={setNbPerdu} nbTicket={nbTicket} setNbTicket={setNbTicket} commerce={commerce} logoUrl={logoUrl} />
  )
  if (ecran === 'diffusion') contenu = (
    <>
      <Titre t="Où diffuser ?" s="Un QR par support : vous mesurez l’impact de chacun." />
      <div style={{ marginBottom: 12 }}>
        <span style={LAB}>Durée de l’animation : {dureeJours} jours</span>
        <input type="range" data-duree min={7} max={180} step={1} value={dureeJours} aria-label="Durée de l’animation en jours" style={{ width: '100%', minHeight: 44 }} onChange={e => setDureeJours(Number(e.target.value))} />
        <div style={{ fontSize: 13, ...MUTED }}>Du {new Date().toLocaleDateString('fr-FR')} au {new Date(Date.now() + dureeJours * 86400000).toLocaleDateString('fr-FR')}</div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {SUPPORTS.map(s => {
          const on = supports.indexOf(s.k) >= 0
          return <button key={s.k} type="button" data-support={s.k} aria-pressed={on} style={{ ...puce(on), display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px 5px 6px' }} onClick={() => setSupports(l => on ? l.filter(x => x !== s.k) : l.concat([s.k]))}><span style={{ background: '#fff', borderRadius: 8, display: 'inline-flex' }}><PictoSupport k={s.p} taille={24} /></span>{s.t}</button>
        })}
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginTop: 12, paddingBottom: 4, scrollbarWidth: 'none' }}>
        {supportsChoisis.map(s => (
          <div key={s.k} data-qr={s.k} style={{ flex: '0 0 auto', width: 132, textAlign: 'center', border: `1.5px solid ${C.bordure}`, borderRadius: 14, padding: 8, background: '#fff' }}>
            {qrs[s.k + module_ + slugs[s.k]] ? <img src={qrs[s.k + module_ + slugs[s.k]]} alt={`QR ${s.t}`} width={116} height={116} style={{ display: 'block', margin: '0 auto' }} /> : <div style={{ width: 116, height: 116, margin: '0 auto', background: C.subtil, borderRadius: 8 }} />}
            <div style={{ fontSize: 12.5, fontWeight: 800, marginTop: 4 }}>{s.t}</div>
          </div>
        ))}
      </div>
      <div data-qr-inclus style={{ fontSize: 12.5, fontWeight: 700, marginTop: 6, ...MUTED }}>{QR_INCLUS} QR inclus{supportsChoisis.length > QR_INCLUS ? ` · ${supportsChoisis.length - QR_INCLUS} QR supplémentaire${supportsChoisis.length - QR_INCLUS > 1 ? 's' : ''} (option, prix à définir)` : ''}</div>
      <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
        <button type="button" data-kit="digital" aria-pressed={kit === 'digital'} style={{ ...carte(kit === 'digital'), minHeight: 44, padding: '9px 12px' }} onClick={() => setKit('digital')}>
          <b style={{ fontSize: 14.5 }}>Kit digital (inclus)</b><div style={{ fontSize: 12.5, ...MUTED }}>Affiches et QR à imprimer vous-même.</div>
        </button>
        <button type="button" data-kit="physique" aria-pressed={kit === 'physique'} style={{ ...carte(kit === 'physique'), minHeight: 44, padding: '9px 12px' }} onClick={() => setKit('physique')}>
          <b style={{ fontSize: 14.5 }}>Kit imprimé en option</b><div style={{ fontSize: 12.5, ...MUTED }}>Support de caisse, 3 affiches, 3 macarons · <b style={{ color: BLEU }}>{PRIX_KIT_PHYSIQUE} € HT</b> par boutique</div>
        </button>
        {kit === 'physique' && (
          <div data-nb-boutiques style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <b style={{ fontSize: 14.5 }}>Nombre de boutiques</b>
            <Pas v={nbBoutiques} set={setNbBoutiques} min={1} max={50} pas={1} label="Boutiques" />
          </div>
        )}
      </div>
    </>
  )
  if (ecran === 'validation') {
    const jeuT = JEUX.find(j => j.k === jeu)?.t || '—'
    const blocs: { cle: string; t: string; v: string }[] = [
      { cle: 'jeu', t: 'Jeu', v: `${jeuT}${estQuiz ? ` · ${gainQuiz === 'immediat' ? 'gain immédiat' : 'tirage au sort'}` : ''}${voie === 'flowin' ? ` · questions par Flowin (${theme.trim() || '—'})` : ''}` },
      { cle: 'lots', t: 'Lots', v: lotsOk.map(l => `${l.nom.trim()} × ${l.quantite}`).join(', ') || '—' },
      { cle: 'diffusion', t: 'Diffusion', v: `${supportsChoisis.length} QR · ${kit === 'physique' ? `kit imprimé, ${nbBoutiques} boutique${nbBoutiques > 1 ? 's' : ''}` : 'kit digital'}` },
    ]
    const champ = (cle: string, l: string, v: string, set: (x: string) => void, extra: Record<string, string> = {}) => <C2 key={cle} l={l}><input data-coord={cle} style={IN} value={v} onChange={e => set(e.target.value)} {...extra} /></C2>
    contenu = (
      <>
        <Titre t="Tout est prêt" />
        <div style={{ display: 'grid', gap: 6 }}>
          {blocs.map(b => (
            <div key={b.t} data-recap={b.cle} style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1.5px solid ${C.bordure}`, borderRadius: 14, padding: '6px 4px 6px 12px', background: '#fff' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 800, ...MUTED }}>{b.t}</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{b.v}</div>
              </div>
              <button type="button" data-modifier={b.cle} onClick={() => modifier(b.cle)} style={{ minHeight: 44, minWidth: 44, border: 'none', background: 'none', color: BLEU, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Modifier</button>
            </div>
          ))}
          {!coordKo && <div data-recap="coord" style={{ border: `1.5px solid ${C.bordure}`, borderRadius: 14, padding: '9px 12px', background: '#fff' }}><div style={{ fontSize: 12, fontWeight: 800, ...MUTED }}>Coordonnées</div><div style={{ fontSize: 13.5, fontWeight: 700 }}>Reprises de votre profil</div></div>}
        </div>
        {coordKo && (
          <div data-coord-manquantes style={{ marginTop: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#B45309', marginBottom: 4 }}>Il manque :</div>
            {manque.nom && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{champ('prenom', 'Prénom', prenom, setPrenom, { autoComplete: 'given-name' })}{champ('nom', 'Nom', nomFam, setNomFam, { autoComplete: 'family-name' })}</div>}
            {manque.tel && champ('tel', 'Téléphone', tel, setTel, { inputMode: 'tel', autoComplete: 'tel' })}
            {manque.email && champ('email', 'Email', email, setEmail, { inputMode: 'email', autoComplete: 'email' })}
            {manque.commerce && champ('commerce', 'Commerce', commerce, setCommerce, { autoComplete: 'organization' })}
            {manque.siret && champ('siret', 'SIRET', siret, setSiret, { inputMode: 'numeric', placeholder: '14 chiffres' })}
            {manque.adresse && <>{champ('adresse', 'Adresse', adresse, setAdresse, { autoComplete: 'street-address' })}<div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 8 }}>{champ('cp', 'Code postal', cp, setCp, { inputMode: 'numeric' })}{champ('ville', 'Ville', ville, setVille, { autoComplete: 'address-level2' })}</div></>}
          </div>
        )}
        <div style={{ border: `1.5px solid ${C.bordure}`, borderRadius: 16, background: '#fff', padding: '2px 14px', marginTop: 10 }}>
          <LignePrix t="Animation, 1re année" barre={`${PRIX_ANIMATION.annuelle} € HT/an`} v={`${PRIX_ANIMATION.lancement} € HT`} />
          {quizFlowin && <LignePrix t="Quiz rédigé par Flowin" barre={eur(PRIX_ANIMATION.quizFlowin)} v={`${eur(PRIX_ANIMATION.quizFlowinLancement)} HT`} />}
          {kit === 'physique' && <LignePrix t={`Kit imprimé${nbBoutiques > 1 ? ` × ${nbBoutiques}` : ''}`} v={`${PRIX_KIT_PHYSIQUE * nbBoutiques} € HT`} />}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', fontWeight: 900, fontSize: 16 }}><span>Total</span><span data-total>{eur(totalHt)} HT</span></div>
        </div>
        {erreur && <div style={{ fontSize: 12.5, color: '#B91C1C', fontWeight: 700, marginTop: 8 }}>{erreur}</div>}
      </>
    )
  }

  const msg = tente ? bloque[ecran] : null
  return (
    <Cadre>
      <div data-progression role="group" aria-label={`Étape ${grCur + 1} sur ${GROUPES.length} : ${GROUPES[grCur]}`} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {GROUPES.map((g, k) => (
            <button key={g} type="button" data-groupe={k} aria-current={k === grCur ? 'step' : undefined} aria-label={`${g}${k < grCur ? ' : fait' : ''}`} onClick={() => allerGroupe(k)}
              style={{ flex: 1, minHeight: 44, border: 'none', background: 'transparent', padding: '0', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5 }}>
              <span style={{ display: 'block', height: 6, borderRadius: 6, background: k < grCur ? VERT_OK : k === grCur ? BLEU : C.bordureChamp, transition: 'background .25s' }} />
              <span style={{ fontSize: 12.5, fontWeight: 800, textAlign: 'left', color: k < grCur ? VERT_OK : k === grCur ? BLEU : C.attenue, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k < grCur ? '✓ ' : ''}{g}</span>
            </button>
          ))}
        </div>
      </div>
      <div {...glisser} data-ecran={ecran}>
        {contenu}
        {retourRecap && ecran !== 'validation' && ecran !== 'quiz' && <button type="button" data-retour-recap style={{ ...BTN2, width: '100%', marginTop: 10 }} onClick={() => { if (bloque[ecran]) { setTente(true); return } setRetourRecap(false); allerA('validation') }}>Retour au récapitulatif</button>}
        {msg && <div style={{ fontSize: 12.5, color: '#B45309', fontWeight: 700, marginTop: 8, textAlign: 'right' }}>{msg}</div>}
        <NavCarrousel sansPoints n={ecrans.length} i={cur} setI={setEcran} suivantBloque={bloque[ecran]} onTenter={() => setTente(true)}
          dernier={<button type="button" data-valider style={{ ...BTN, opacity: envoi ? 0.6 : 1 }} disabled={!!envoi} onClick={valider}>{envoi ? 'Validation…' : 'Valider mon bon de commande'}</button>} />
      </div>
    </Cadre>
  )
}

function Pas({ v, set, min, max, pas, label }: { v: number; set: (n: number) => void; min: number; max: number; pas: number; label: string }) {
  const b: CSSProperties = { width: 44, height: 44, borderRadius: 99, border: `1.5px solid ${BLEU}`, background: '#fff', color: BLEU, fontSize: 22, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1 }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button type="button" aria-label={`${label} : moins`} style={b} onClick={() => set(Math.max(min, v - pas))}>−</button>
      <b data-nb style={{ fontSize: 18, minWidth: 28, textAlign: 'center' }}>{v}</b>
      <button type="button" aria-label={`${label} : plus`} style={b} onClick={() => set(Math.min(max, v + pas))}>+</button>
    </div>
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
