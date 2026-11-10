'use client'

/**
 * « MA PREMIERE FOIS » — le parcours d'inscription d'un pro (31/10/2026).
 *
 * Accueil engageant, puis sept etapes : vous, votre entreprise (pre-remplie
 * par SIRET / SIREN / nom), secteur, produits & services, adresse, points de
 * vente, creation du compte. Barre de progression, retour possible a chaque
 * etape, brouillon garde dans le navigateur (jamais le mot de passe).
 *
 * Meme definition que le parcours SA (lib/proCreation : secteurs, profils,
 * identifiant, colonnes `pros`) ; l'inscription arrive en `en_attente`.
 *
 * Donnees : rien n'est invente. Ce que l'annuaire officiel ne renvoie pas
 * reste vide, et tout ce qui est pre-rempli reste modifiable.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { capturerSource, tagSource } from '@/lib/source'
import { CHARTE_PRO as C, VARIABLES_PRO_CSS } from '@/lib/charte'
import {
  PROFILS_PRO, SECTEURS_PRO, SECTEUR_AUTRE, nettoyerPrecision, ficheProVide, identifiantPro, lignePro, ligneProEntreprise,
  type FichePro, type ProfilPro,
} from '@/lib/proCreation'
import {
  chiffres, erreurNumero, formaterSiret, natureRecherche, secteurSuggere, siretValide,
  type EntrepriseTrouvee,
} from '@/lib/entreprise'

import { messageFr, messageAuth } from '@/lib/erreursFr'
import { retourSur } from '@/lib/retour'
import { GARANTIE_ACTIVE } from '@/lib/flowinConfig'
import PrecisionAutre from '@/components/creation/PrecisionAutre'
import SelectActivite from '@/components/creation/SelectActivite'
import Carrousel from './Carrousel'
import { OFFRES_ANIMATION, OPTION_QUIZ_FLOWIN, prixOptionQuiz } from '@/lib/reglement'
const CLE_BROUILLON = 'flowin.premiere-fois.v1'

const ETAPES = [
  { id: 'vous', titre: 'Vous', court: 'Vous' },
  { id: 'entreprise', titre: 'Votre entreprise', court: 'Entreprise' },
  { id: 'secteur', titre: 'Votre secteur', court: 'Secteur' },
  { id: 'produits', titre: 'Ce que vous proposez', court: 'Produits' },
  { id: 'adresse', titre: 'Votre adresse', court: 'Adresse' },
  { id: 'points', titre: 'Vos points de vente', court: 'Points de vente' },
  { id: 'compte', titre: 'Votre compte', court: 'Compte' },
] as const
type IdEtape = typeof ETAPES[number]['id']

interface Perso { prenom: string; nom: string }
interface Brouillon { etape: number; f: FichePro; perso: Perso; mode: 'recherche' | 'manuel' | 'prerempli'; selection?: string }

/* Parametres de la plaquette (offre, kit, options, garantie certifiee, commercial) transmis tels quels au bon de commande. */
const PARAMS_OFFRE = ['offre', 'kit', 'boutiques', 'quiz', 'bonus', 'garantie', 'panier', 'flux', 'certif_le', 'certif_par', 'commercial']
const NOM_OFFRE: Record<string, string> = { annuelle: 'Formule annuelle', mensuelle: 'Formule mensuelle (3 mois minimum)' }
function lireSelection(): string {
  try {
    const u = new URLSearchParams(window.location.search)
    const out = new URLSearchParams()
    PARAMS_OFFRE.forEach(k => { const v = u.get(k); if (v) out.set(k, v.slice(0, 120)) })
    /* Garantie satisfait ou remboursé : offre ANNUELLE uniquement. */
    /* Offre suspendue (lib/flowinConfig) : aucun parametre de garantie n'est repris ni transmis. */
    if (!GARANTIE_ACTIVE || out.get('offre') !== 'annuelle') ['garantie', 'panier', 'flux', 'certif_le', 'certif_par'].forEach(k => out.delete(k))
    return out.toString()
  } catch { return '' }
}
function resumeSelection(sel: string): string {
  if (!sel) return ''
  const u = new URLSearchParams(sel)
  const morceaux = [NOM_OFFRE[u.get('offre') ?? ''] ?? '']
  if (u.get('kit') === 'digital') morceaux.push('kit digital')
  if (u.get('kit') === 'physique') morceaux.push(`kit physique (${u.get('boutiques') ?? '1'} boutique${Number(u.get('boutiques') ?? 1) > 1 ? 's' : ''})`)
  if (u.get('quiz')) morceaux.push('quiz personnalisé')
  if (u.get('bonus')) morceaux.push('questions bonus')
  if (GARANTIE_ACTIVE && u.get('garantie') === '1' && u.get('offre') === 'annuelle') morceaux.push('garantie satisfait ou remboursé')
  return morceaux.filter(Boolean).join(', ')
}

const EMAIL_OK = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
const TEL_OK = (v: string) => !v.trim() || /^(\+?\d[\d\s.-]{7,17}\d)$/.test(v.trim())
const CP_OK = (v: string) => /^\d{5}$/.test(v.trim())

function lireBrouillon(): Brouillon | null {
  try {
    const t = window.localStorage.getItem(CLE_BROUILLON)
    if (!t) return null
    const b = JSON.parse(t) as Brouillon
    if (!b || typeof b.etape !== 'number' || !b.f) return null
    return { ...b, f: { ...ficheProVide(), ...b.f, motdepasse: '' } }
  } catch { return null }
}
function ecrireBrouillon(b: Brouillon) {
  try { window.localStorage.setItem(CLE_BROUILLON, JSON.stringify({ ...b, f: { ...b.f, motdepasse: '' } })) } catch { /* navigation privee */ }
}
function effacerBrouillon() {
  try { window.localStorage.removeItem(CLE_BROUILLON) } catch { /* rien */ }
}

const dateFr = (iso: string) => {
  if (!iso) return ''
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function PremiereFois() {
  /* -1 = page d'accueil ; 0..6 = etapes ; 7 = termine */
  const [etape, setEtape] = useState(-1)
  const [f, setF] = useState<FichePro>({ ...ficheProVide(), profil: 'commerce' })
  const [perso, setPerso] = useState<Perso>({ prenom: '', nom: '' })
  const [mode, setMode] = useState<Brouillon['mode']>('recherche')
  const [brouillonTrouve, setBrouillonTrouve] = useState<Brouillon | null>(null)
  const [pret, setPret] = useState(false)
  const [tente, setTente] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [voirMdp, setVoirMdp] = useState(false)
  const [envoi, setEnvoi] = useState<'idle' | 'loading' | 'error'>('idle')
  const [erreur, setErreur] = useState('')
  const [fin, setFin] = useState<{ proId: string; session: boolean; degrade: boolean } | null>(null)
  const [selection, setSelection] = useState('')
  const [ecranAccueil, setEcranAccueil] = useState(0)
  const haut = useRef<HTMLDivElement>(null)
  /* Compte d'acces deja cree pendant cette visite (reprise apres un echec d'enregistrement de la fiche). */
  /* Retour vers une demande en cours (parcours « rejoindre un super event » sans compte) : ?retour=/rejoindre?... */
  const [retour, setRetour] = useState<string | null>(null)
  useEffect(() => { try { setRetour(retourSur(new URLSearchParams(window.location.search).get('retour'))) } catch { /* rien */ } }, [])
  const compteCree = useRef<{ email: string; id: string } | null>(null)

  /* Recherche entreprise */
  const [recherche, setRecherche] = useState('')
  const [etatRecherche, setEtatRecherche] = useState<'idle' | 'loading' | 'ok' | 'vide' | 'indispo' | 'erreur'>('idle')
  const [messageRecherche, setMessageRecherche] = useState('')
  const [resultats, setResultats] = useState<EntrepriseTrouvee[]>([])
  /* Canal d'origine du lien (?src=), retenu à la 1re visite, écrit en tag `src:<canal>` (aucun SQL). */
  const [src, setSrc] = useState('')

  useEffect(() => {
    const b = lireBrouillon()
    if (b && b.etape >= 0) setBrouillonTrouve(b)
    const sel = lireSelection() || b?.selection || ''
    setSelection(sel)
    const nb = new URLSearchParams(sel).get('boutiques')
    if (nb && /^\d{1,3}$/.test(nb)) setF(x => ({ ...x, nbPointsVente: x.nbPointsVente || nb }))
    setSrc(capturerSource())
    // Pré-remplissage depuis les plaquettes (« Être recontacté » / « Je crée mon jeu ») : ?prenom=&email=&tel=
    try {
      const q = new URLSearchParams(window.location.search)
      const pp = (q.get('prenom') || '').slice(0, 60), pe = (q.get('email') || '').slice(0, 120), pt = (q.get('tel') || '').slice(0, 30)
      if (pp) setPerso(x => ({ ...x, prenom: x.prenom || pp }))
      if (pe || pt) setF(x => ({ ...x, email: x.email || pe, tel: x.tel || pt }))
    } catch { /* rien */ }
    setPret(true)
  }, [])

  useEffect(() => {
    if (!pret || etape < 0 || etape > 6) return
    ecrireBrouillon({ etape, f, perso, mode, selection })
  }, [pret, etape, f, perso, mode, selection])

  const maj = (c: Partial<FichePro>) => setF(x => ({ ...x, ...c }))
  const allerA = (n: number) => {
    setTente(false); setErreur('')
    setEtape(n)
    try { haut.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); window.scrollTo({ top: 0 }) } catch { /* rien */ }
  }

  const id: IdEtape | null = etape >= 0 && etape <= 6 ? ETAPES[etape].id : null

  /** Ce qui manque pour avancer, par champ (affiche apres un premier essai). */
  const erreurs = useMemo(() => {
    const e: Record<string, string> = {}
    if (id === 'vous') {
      if (perso.prenom.trim().length < 1) e.prenom = 'Votre prénom.'
      if (perso.nom.trim().length < 1) e.nom = 'Votre nom.'
      if (!EMAIL_OK(f.email)) e.email = 'Un email valide : il servira à vous connecter.'
      if (!TEL_OK(f.tel)) e.tel = 'Ce numéro ne semble pas valide.'
    }
    if (id === 'entreprise') {
      if (mode !== 'recherche' && f.nom.trim().length < 2) e.nom = 'La raison sociale ou le nom de l’établissement.'
      if (mode === 'recherche') e.recherche = 'Choisissez votre entreprise dans les résultats, ou saisissez-la à la main.'
      if (f.siret.trim() && !siretValide(f.siret)) e.siret = erreurNumero(f.siret) ?? 'SIRET invalide.'
    }
    if (id === 'secteur' && !f.secteur) e.secteur = 'Choisissez le secteur le plus proche (ou « Autre »).'
    if (id === 'secteur' && (f.secteur === SECTEUR_AUTRE || (f.secteur === 'Commerce & Négoce' && f.activite === SECTEUR_AUTRE)) && nettoyerPrecision(f.secteurAutre).length < 3) e.secteurAutre = 'Précisez votre activité (3 lettres minimum).'
    if (id === 'produits' && (f.produits ?? '').trim().length < 3) e.produits = 'Quelques mots suffisent : ce que vos clients viennent chercher chez vous.'
    if (id === 'adresse') {
      if (f.profil !== 'annonceur' && f.adresse.trim().length < 3) e.adresse = 'Le numéro et la rue.'
      if (!CP_OK(f.codePostal)) e.codePostal = '5 chiffres.'
      if (f.ville.trim().length < 2) e.ville = 'La ville.'
    }
    if (id === 'points') {
      const n = parseInt(f.nbPointsVente ?? '', 10)
      if (!Number.isFinite(n) || n < 1) e.nbPointsVente = 'Au moins 1.'
    }
    if (id === 'compte') {
      if (f.motdepasse.length < 8) e.motdepasse = '8 caractères minimum.'
      if (confirmation !== f.motdepasse) e.confirmation = 'Les deux mots de passe ne sont pas identiques.'
    }
    return e
  }, [id, perso, f, mode, confirmation])
  const ok = Object.keys(erreurs).length === 0
  const err = (k: string) => (tente && erreurs[k] ? <div className="pf-err">{erreurs[k]}</div> : null)

  function suivant() {
    if (!ok) { setTente(true); return }
    if (id === 'vous') maj({ contact: `${perso.prenom.trim()} ${perso.nom.trim()}`.trim() })
    if (id === 'compte') { creer(); return }
    allerA(etape + 1)
  }

  async function chercher() {
    const q = recherche.trim()
    const e = erreurNumero(q)
    if (e) { setEtatRecherche('erreur'); setMessageRecherche(e); return }
    if (natureRecherche(q) === 'invalide') { setEtatRecherche('erreur'); setMessageRecherche('Saisissez un SIRET (14 chiffres), un SIREN (9 chiffres) ou au moins 3 lettres du nom.'); return }
    setEtatRecherche('loading'); setMessageRecherche(''); setResultats([])
    try {
      const rep = await fetch(`/api/pro/entreprise?q=${encodeURIComponent(q)}`)
      const j = await rep.json()
      if (!j.ok) {
        setEtatRecherche(j.indisponible ? 'indispo' : 'erreur')
        setMessageRecherche(j.erreur ?? 'Recherche impossible.')
        return
      }
      const r = (j.resultats ?? []) as EntrepriseTrouvee[]
      setResultats(r)
      setEtatRecherche(r.length ? 'ok' : 'vide')
    } catch {
      setEtatRecherche('indispo'); setMessageRecherche('Le service public ne répond pas.')
    }
  }

  function choisir(r: EntrepriseTrouvee) {
    maj({
      nom: r.nom || f.nom, nomCommercial: r.nomCommercial, siret: r.siret, siren: r.siren,
      formeJuridique: r.formeJuridique, formeJuridiqueCode: r.formeJuridiqueCode,
      codeNaf: r.codeNaf, activiteNaf: r.activite, dateCreation: r.dateCreation,
      adresse: r.adresse || f.adresse, codePostal: r.codePostal || f.codePostal, ville: r.ville || f.ville,
      secteur: f.secteur || secteurSuggere(r.codeNaf, r.formeJuridiqueCode),
    })
    setMode('prerempli'); setTente(false)
  }

  async function creer() {
    setEnvoi('loading'); setErreur('')
    const fiche: FichePro = { ...f, contact: `${perso.prenom.trim()} ${perso.nom.trim()}`.trim(), siret: chiffres(f.siret) }
    const adresse = fiche.email.trim()
    /* Reprise apres un echec de l'enregistrement de la fiche : le compte d'acces existe deja (cree au 1er essai).
       On le reutilise au lieu de refaire un signUp, qui repondrait « compte deja existant » et bloquerait le pro. */
    let userId = '', aSession = false
    if (compteCree.current && compteCree.current.email === adresse.toLowerCase()) {
      userId = compteCree.current.id
    } else {
      /* 10/11 : une ancienne session (autre pro) ne doit jamais survivre à une nouvelle inscription. */
      try { const { data: ss } = await supabase.auth.getSession(); if (ss.session && ss.session.user.email?.toLowerCase() !== adresse.toLowerCase()) await supabase.auth.signOut() } catch { /* rien */ }
      const { data: authData, error: authErr } = await supabase.auth.signUp({ email: adresse, password: fiche.motdepasse, options: { emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'https://flowin-events.vercel.app'}/pro/connexion` } })
      if (authErr || !authData.user) {
        setErreur(messageAuth(authErr)); setEnvoi('error'); return
      }
      /* Email deja inscrit : Supabase ne renvoie pas d'erreur (protection contre l'enumeration des comptes)
         mais un faux utilisateur, sans identite. On tente alors la connexion avec le mot de passe saisi :
         si le compte n'a pas de fiche pro (inscription interrompue), on la complete ; sinon on renvoie vers la connexion. */
      if (Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
        const { data: conn, error: connErr } = await supabase.auth.signInWithPassword({ email: adresse, password: fiche.motdepasse })
        if (connErr || !conn.user) {
          setErreur('Un compte existe déjà avec cet email. Connectez-vous, ou utilisez « Mot de passe oublié » sur la page de connexion.')
          setEnvoi('error'); return
        }
        const { data: dejaPro } = await supabase.from('pros').select('id').eq('auth_id', conn.user.id).maybeSingle()
        if (dejaPro) { setErreur('Votre espace existe déjà : connectez-vous avec cet email.'); setEnvoi('error'); return }
        userId = conn.user.id; aSession = true
      } else {
        userId = authData.user.id; aSession = !!authData.session
      }
      compteCree.current = { email: adresse.toLowerCase(), id: userId }
    }
    let idPro = identifiantPro(fiche)
    const { data: existe } = await supabase.from('pros').select('id').eq('id', idPro).maybeSingle()
    if (existe) idPro = `${idPro}-${Math.random().toString(36).slice(2, 6)}`
    const ligne = lignePro(fiche, 'pro')
    const tSrc = tagSource(src)
    const base = { ...ligne, tags: tSrc ? [...(ligne.tags ?? []), tSrc] : ligne.tags, id: idPro, auth_id: userId }
    let degrade = false
    let { error: insErr } = await supabase.from('pros').insert({ ...base, ...ligneProEntreprise(fiche, 'premiere-fois') })
    /* Migration sql/02-pros-entreprise-onboarding.sql pas encore appliquee :
       colonne inconnue (PGRST204 / 42703) -> on cree la fiche sans ces champs. */
    if (insErr && (insErr.code === 'PGRST204' || insErr.code === '42703' || /column/i.test(insErr.message))) {
      degrade = true
      const r = await supabase.from('pros').insert(base)
      insErr = r.error
    }
    if (insErr) {
      /* 23503 = cle etrangere : le compte d'acces n'existe pas. 23505 = identifiant ou SIRET deja pris. */
      setErreur(insErr.code === '23503'
        ? 'La création de votre accès n’a pas abouti. Réessayez ; si cela continue, utilisez une autre adresse email.'
        : insErr.code === '23505'
          ? 'Un établissement avec ces informations existe déjà. Connectez-vous, ou contactez l’équipe Flowin.'
          : `Votre accès est créé, mais la fiche entreprise n’a pas pu être enregistrée : ${messageFr(insErr)} Vous pouvez réessayer : votre compte est conservé.`)
      setEnvoi('error'); return
    }
    effacerBrouillon()
    /* Le bon de commande (public/bon-commande-animation.html) reprend ces informations :
       stockage local du meme site, jamais dans l'adresse. Efface apres la commande. */
    try {
      window.localStorage.setItem('flowin_am_prefill', JSON.stringify({
        raison: fiche.nom.trim(), enseigne: (fiche.nomCommercial ?? '').trim(), siret: fiche.siret, adresse: fiche.adresse, cp: fiche.codePostal, ville: fiche.ville,
        contact: fiche.contact, fonction: fiche.roleContact, email: fiche.email.trim(), tel: fiche.tel,
        nb: parseInt(fiche.nbPointsVente ?? '', 10) || 1, commercial: new URLSearchParams(selection).get('commercial') ?? '', pro_id: idPro,
      }))
    } catch { /* navigation privee : le bon de commande se remplit a la main */ }
    setEnvoi('idle')
    setFin({ proId: idPro, session: aSession, degrade })
    setEtape(7)
  }

  const progression = etape < 0 ? 0 : Math.min(etape + 1, ETAPES.length)

  /* ------------------------------------------------------------------ */
  return (
    <div className="pf" ref={haut}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="pf-top">
        <Link href="/landing" className="pf-logo" aria-label="Flowin Event">Flow<em>in</em> Event</Link>
        <span className="pf-badge">Espace pro</span>
        <span style={{ flex: 1 }} />
        <Link href="/pro/connexion" className="pf-lien">Déjà un compte ?</Link>
      </header>

      {etape === -1 && (
        <main className="pf-col">
          {brouillonTrouve && (
            <div className="pf-brouillon">
              <div><b>Vous aviez commencé.</b> Votre brouillon est gardé sur cet appareil (étape {brouillonTrouve.etape + 1} sur {ETAPES.length}).</div>
              <div className="pf-row">
                <button className="pf-btn" onClick={() => { setF(brouillonTrouve.f); setPerso(brouillonTrouve.perso ?? { prenom: '', nom: '' }); setMode(brouillonTrouve.mode ?? 'recherche'); allerA(brouillonTrouve.etape) }}>Reprendre</button>
                <button className="pf-btn2" onClick={() => { effacerBrouillon(); setBrouillonTrouve(null) }}>Recommencer</button>
              </div>
            </div>
          )}
          {/* Accueil en carrousel (Romain, 10/11/2026) : d'abord « Tester Flowin », puis seulement les offres mensuelle et annuelle. */}
          <Carrousel nom="Découvrir Flowin" i={ecranAccueil} setI={setEcranAccueil}
            dernier={<button className="pf-btn" onClick={() => allerA(0)}>C’est parti</button>}
            ecrans={[
              { cle: 'promesse', contenu: (<>
                <div className="pf-kicker">Ma première fois</div>
                <h1 className="pf-h1">Votre commerce, <span>animé</span> en quelques minutes.</h1>
                <ul className="pf-promesses">
                  <li><span className="pf-ic">1</span><div><b>Vous vous présentez</b><br />Votre SIRET suffit.</div></li>
                  <li><span className="pf-ic">2</span><div><b>Vous configurez votre jeu</b><br />Jeu, lots, QR : vous le voyez avant de payer.</div></li>
                  <li><span className="pf-ic">3</span><div><b>Vous payez pour le mettre en ligne</b><br />Par virement, en un scan.</div></li>
                </ul>
              </>) },
              { cle: 'tester', contenu: (
                <div className="pf-offre pf-offre-1" data-offre="lancement">
                  <span className="pf-offre-tag">Pour commencer</span>
                  <div className="pf-offre-n">{OFFRES_ANIMATION[0].nom}</div>
                  <div className="pf-offre-p">{OFFRES_ANIMATION[0].prix}</div>
                  <div className="pf-offre-d">{OFFRES_ANIMATION[0].detail}. Toutes les fonctions.</div>
                  <div className="pf-offre-o"><b>{OPTION_QUIZ_FLOWIN.nom}</b><span>{prixOptionQuiz('lancement')}</span></div>
                </div>
              ) },
              { cle: 'offres', contenu: (<>
                <div className="pf-kicker">Nos autres offres</div>
                {OFFRES_ANIMATION.filter(o => o.cle !== 'lancement').map(o => (
                  <div key={o.cle} className="pf-offre" data-offre={o.cle}>
                    <div className="pf-offre-n">{o.nom}</div>
                    <div className="pf-offre-p">{o.prix}</div>
                    <div className="pf-offre-d">{o.detail}</div>
                  </div>
                ))}
                <div className="pf-offre-o"><b>{OPTION_QUIZ_FLOWIN.nom}</b><span>{prixOptionQuiz('annuelle')}</span></div>
              </>) },
            ]} />
          {selection && <div className="pf-info">Votre sélection : <b>{resumeSelection(selection)}</b>. Elle sera reprise dans votre bon de commande.</div>}
          <div className="pf-note">Environ 3 minutes · {ETAPES.length} étapes · vous pouvez revenir en arrière à tout moment</div>
        </main>
      )}

      {etape >= 0 && etape <= 6 && (
        <main className="pf-col">
          <div className="pf-prog" aria-label={`Étape ${progression} sur ${ETAPES.length}`}>
            <div className="pf-prog-l">
              <span>Étape {progression} sur {ETAPES.length}</span>
              <span className="pf-prog-n">{ETAPES[etape].court}</span>
            </div>
            <div className="pf-barres">
              {ETAPES.map((e, n) => (
                <button key={e.id} className={`pf-barre${n <= etape ? ' on' : ''}`} disabled={n >= etape} onClick={() => allerA(n)} aria-label={`Revenir à l’étape ${e.court}`} />
              ))}
            </div>
          </div>

          <div className="pf-carte">
            {id === 'vous' && (
              <>
                <h2 className="pf-h2">Faisons connaissance</h2>
                <p className="pf-sous">La personne que l’équipe Flowin contactera, et l’email qui ouvrira votre espace.</p>
                <div className="pf-g2">
                  <Champ label="Prénom *" v={perso.prenom} set={v => setPerso(p => ({ ...p, prenom: v }))} auto="given-name" />
                  <Champ label="Nom *" v={perso.nom} set={v => setPerso(p => ({ ...p, nom: v }))} auto="family-name" />
                </div>
                {err('prenom')}{err('nom')}
                <Champ label="Votre rôle" v={f.roleContact} set={v => maj({ roleContact: v })} placeholder="Gérant, responsable de magasin…" auto="organization-title" />
                <Champ label="Email professionnel *" v={f.email} set={v => maj({ email: v })} type="email" placeholder="vous@votre-commerce.fr" auto="email" />
                {err('email')}
                <Champ label="Téléphone" v={f.tel} set={v => maj({ tel: v })} type="tel" placeholder="06 00 00 00 00" auto="tel" aide="Facultatif. Pour vous joindre au lancement de votre première animation." />
                {err('tel')}
              </>
            )}

            {id === 'entreprise' && (
              <>
                <h2 className="pf-h2">Votre entreprise</h2>
                <p className="pf-sous">Saisissez votre SIRET : on récupère la raison sociale, l’adresse et l’activité dans l’annuaire officiel des entreprises.</p>
                <div className="pf-label">Vous êtes</div>
                <div className="pf-choix2">
                  {PROFILS_PRO.map(p => (
                    <button key={p.id} className={`pf-opt${f.profil === p.id ? ' on' : ''}`} onClick={() => maj({ profil: p.id as ProfilPro })}>
                      <b>{p.titre}</b><span>{p.sous}</span>
                    </button>
                  ))}
                </div>

                {mode === 'recherche' && (
                  <>
                    <label className="pf-label" htmlFor="pf-q">SIRET, SIREN ou nom de l’entreprise</label>
                    <div className="pf-cherche">
                      <input id="pf-q" className="pf-in" value={recherche} inputMode="search" placeholder="Ex. 123 456 789 00012"
                        onChange={e => { setRecherche(e.target.value); if (etatRecherche === 'erreur') setEtatRecherche('idle') }}
                        onKeyDown={e => { if (e.key === 'Enter') chercher() }} />
                      <button className="pf-btn" onClick={chercher} disabled={etatRecherche === 'loading'}>{etatRecherche === 'loading' ? 'Recherche…' : 'Rechercher'}</button>
                    </div>
                    {etatRecherche === 'erreur' && <div className="pf-err">{messageRecherche}</div>}
                    {etatRecherche === 'vide' && <div className="pf-info">Aucune entreprise trouvée. Vérifiez le numéro, ou saisissez vos informations à la main.</div>}
                    {etatRecherche === 'indispo' && (
                      <div className="pf-info">L’annuaire officiel des entreprises ne répond pas pour le moment. Pas de souci : saisissez vos informations à la main.
                        <div style={{ marginTop: 8 }}><button className="pf-btn2" onClick={() => { setMode('manuel'); if (natureRecherche(recherche) === 'siret') maj({ siret: chiffres(recherche) }) }}>Saisir à la main</button></div>
                      </div>
                    )}
                    {resultats.length > 0 && (
                      <div className="pf-resultats">
                        {resultats.map(r => (
                          <button key={r.siret || r.siren} className="pf-res" onClick={() => choisir(r)}>
                            <div className="pf-res-n">{r.nom || '[nom non communiqué]'}{r.nomCommercial ? <span> · {r.nomCommercial}</span> : null}</div>
                            <div className="pf-res-d">{[r.formeJuridique, [r.codePostal, r.ville].filter(Boolean).join(' ')].filter(Boolean).join(' · ')}</div>
                            <div className="pf-res-d">SIRET {r.siret ? formaterSiret(r.siret) : '—'}{!r.enActivite && <b className="pf-ferme"> · fermé</b>}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    {tente && erreurs.recherche && <div className="pf-err">{erreurs.recherche}</div>}
                    <button className="pf-lien-btn" onClick={() => setMode('manuel')}>Pas de SIRET (association, projet en création…) ? Saisir à la main</button>
                  </>
                )}

                {mode !== 'recherche' && (
                  <>
                    {mode === 'prerempli' && (
                      <div className="pf-ok">Fiche pré-remplie depuis l’annuaire officiel des entreprises (INSEE). Vérifiez et corrigez si besoin.</div>
                    )}
                    <Champ label="Raison sociale ou nom de l’établissement *" v={f.nom} set={v => maj({ nom: v })} auto="organization" />
                    {err('nom')}
                    <Champ label="Nom commercial (enseigne)" v={f.nomCommercial ?? ''} set={v => maj({ nomCommercial: v })} aide="Le nom que voient vos clients, s’il diffère de la raison sociale." />
                    <Champ label="SIRET" v={f.siret} set={v => maj({ siret: v })} inputMode="numeric" placeholder="14 chiffres" aide="Facultatif, utile pour vos factures." />
                    {err('siret')}
                    <Champ label="Forme juridique" v={f.formeJuridique ?? ''} set={v => maj({ formeJuridique: v })} />
                    <div className="pf-g2">
                      <Champ label="Date de création" v={f.dateCreation ?? ''} set={v => maj({ dateCreation: v })} type="date" />
                    </div>
                    <button className="pf-lien-btn" onClick={() => { setMode('recherche'); setResultats([]); setEtatRecherche('idle') }}>Rechercher une autre entreprise</button>
                  </>
                )}
              </>
            )}

            {id === 'secteur' && (
              <>
                <h2 className="pf-h2">Votre secteur d’activité</h2>
                <p className="pf-sous">Il sert à vous proposer les bons jeux et les bons lots.</p>
                {f.codeNaf && (
                  <div className="pf-info">Activité déclarée (code NAF {f.codeNaf}){f.activiteNaf ? ` : ${f.activiteNaf}` : ''}.</div>
                )}
                <div className="pf-choix">
                  {(SECTEURS_PRO as readonly string[]).map(s => {
                    const suggere = s === secteurSuggere(f.codeNaf, f.formeJuridiqueCode)
                    return (
                      <button key={s} className={`pf-opt${f.secteur === s ? ' on' : ''}`} onClick={() => maj({ secteur: s })}>
                        <b>{s}</b>{suggere && <span className="pf-suggere">Suggéré d’après votre activité</span>}
                      </button>
                    )
                  })}
                </div>
                {err('secteur')}
                <PrecisionAutre secteur={f.secteur} valeur={f.secteurAutre ?? ''} onChange={v => maj({ secteurAutre: v })} id="pf-secteur-autre" erreur={tente ? erreurs.secteurAutre : null} />
                {f.secteur === 'Commerce & Négoce' && (
                  <div style={{ display: 'block', marginTop: 12 }}>
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 5 }}>Votre activité (facultatif)</span>
                    <SelectActivite id="pf-activite" valeur={f.activite ?? ''} onChange={v => maj({ activite: v })} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #C9D4E3', fontSize: 16, fontFamily: 'inherit' }} />
                    <PrecisionAutre secteur={f.activite ?? ''} valeur={f.secteurAutre ?? ''} onChange={v => maj({ secteurAutre: v })} id="pf-activite-autre" />
                  </div>
                )}
              </>
            )}

            {id === 'produits' && (
              <>
                <h2 className="pf-h2">Ce que vous proposez</h2>
                <p className="pf-sous">Vos produits ou services, en quelques mots. Cela nous aide à imaginer des lots qui ont du sens.</p>
                <label className="pf-label" htmlFor="pf-prod">Produits et services *</label>
                <textarea id="pf-prod" className="pf-in pf-zone" value={f.produits ?? ''} onChange={e => maj({ produits: e.target.value })}
                  placeholder="Ex. pain au levain, viennoiseries, pâtisseries maison, snacking le midi" />
                {err('produits')}
              </>
            )}

            {id === 'adresse' && (
              <>
                <h2 className="pf-h2">Votre adresse</h2>
                <p className="pf-sous">{f.profil === 'annonceur' ? 'L’adresse de votre siège, pour vos factures.' : 'Elle place votre commerce sur la carte des animations.'}</p>
                {mode === 'prerempli' && f.adresse && <div className="pf-ok">Adresse reprise de l’annuaire officiel. Modifiez-la si votre point de vente est ailleurs.</div>}
                <Champ label={f.profil === 'annonceur' ? 'Adresse' : 'Adresse *'} v={f.adresse} set={v => maj({ adresse: v })} placeholder="Numéro et rue" auto="street-address" />
                {err('adresse')}
                <div className="pf-g2 pf-cp">
                  <Champ label="Code postal *" v={f.codePostal} set={v => maj({ codePostal: v })} inputMode="numeric" auto="postal-code" />
                  <Champ label="Ville *" v={f.ville} set={v => maj({ ville: v })} auto="address-level2" />
                </div>
                {err('codePostal')}{err('ville')}
              </>
            )}

            {id === 'points' && (
              <>
                <h2 className="pf-h2">Combien de points de vente ?</h2>
                <p className="pf-sous">Chaque point de vente peut avoir ses propres QR et ses propres statistiques.</p>
                <div className="pf-stepper">
                  <button aria-label="Moins" onClick={() => maj({ nbPointsVente: String(Math.max(1, (parseInt(f.nbPointsVente ?? '', 10) || 1) - 1)) })}>−</button>
                  <input className="pf-in" inputMode="numeric" value={f.nbPointsVente ?? ''} onChange={e => maj({ nbPointsVente: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="1" aria-label="Nombre de points de vente" />
                  <button aria-label="Plus" onClick={() => maj({ nbPointsVente: String((parseInt(f.nbPointsVente ?? '', 10) || 0) + 1) })}>+</button>
                </div>
                <div className="pf-puces">
                  {['1', '2', '3', '5', '10'].map(n => (
                    <button key={n} className={`pf-puce${f.nbPointsVente === n ? ' on' : ''}`} onClick={() => maj({ nbPointsVente: n })}>{n === '10' ? '10 et +' : n}</button>
                  ))}
                </div>
                {err('nbPointsVente')}
              </>
            )}

            {id === 'compte' && (
              <>
                <h2 className="pf-h2">Créez votre accès</h2>
                <p className="pf-sous">Dernière étape. Relisez, choisissez un mot de passe, et votre espace pro est ouvert.</p>
                <div className="pf-recap">
                  {[
                    { k: 'Vous', v: [`${perso.prenom} ${perso.nom}`.trim(), f.roleContact].filter(Boolean).join(' · '), e: 0 },
                    { k: 'Email', v: f.email, e: 0 },
                    { k: 'Entreprise', v: [f.nom, f.nomCommercial].filter(Boolean).join(' · '), e: 1 },
                    { k: 'SIRET', v: f.siret ? formaterSiret(f.siret) : '', e: 1 },
                    { k: 'Forme · création', v: [f.formeJuridique, f.dateCreation ? `créée le ${dateFr(f.dateCreation)}` : ''].filter(Boolean).join(' · '), e: 1 },
                    { k: 'Secteur', v: f.secteur, e: 2 },
                    { k: 'Produits', v: f.produits ?? '', e: 3 },
                    { k: 'Adresse', v: [f.adresse, `${f.codePostal} ${f.ville}`.trim()].filter(Boolean).join(', '), e: 4 },
                    { k: 'Points de vente', v: f.nbPointsVente ?? '', e: 5 },
                  ].map(l => (
                    <div key={l.k} className="pf-recap-l">
                      <span className="pf-recap-k">{l.k}</span>
                      <span className="pf-recap-v">{l.v || '—'}</span>
                      <button className="pf-lien-btn" onClick={() => allerA(l.e)}>Modifier</button>
                    </div>
                  ))}
                </div>
                <label className="pf-label" htmlFor="pf-mdp">Mot de passe *</label>
                <div className="pf-cherche">
                  <input id="pf-mdp" className="pf-in" type={voirMdp ? 'text' : 'password'} autoComplete="new-password" value={f.motdepasse} onChange={e => maj({ motdepasse: e.target.value })} />
                  <button className="pf-btn2" onClick={() => setVoirMdp(v => !v)}>{voirMdp ? 'Masquer' : 'Afficher'}</button>
                </div>
                <div className="pf-aide">8 caractères minimum.</div>
                {err('motdepasse')}
                <label className="pf-label" htmlFor="pf-mdp2">Confirmez le mot de passe *</label>
                <input id="pf-mdp2" className="pf-in" type={voirMdp ? 'text' : 'password'} autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} />
                {err('confirmation')}
                <div className="pf-aide" style={{ marginTop: 12 }}>Ensuite : vous configurez votre jeu, puis vous validez votre bon de commande, déjà rempli.</div>
                {erreur && <div className="pf-err" style={{ marginTop: 12 }}>{erreur} {/existe déjà/.test(erreur) && <Link href="/pro/connexion" className="pf-lien">Se connecter</Link>}</div>}
              </>
            )}

            <div className="pf-nav">
              <button className="pf-btn2" onClick={() => allerA(etape - 1)} disabled={envoi === 'loading'}>← Retour</button>
              <span style={{ flex: 1 }} />
              <button className="pf-btn" onClick={suivant} disabled={envoi === 'loading'}>
                {id === 'compte' ? (envoi === 'loading' ? 'Création…' : 'Créer mon espace') : 'Continuer'}
              </button>
            </div>
          </div>
          <div className="pf-note">Brouillon enregistré sur cet appareil (sans le mot de passe).</div>
        </main>
      )}

      {etape === 7 && fin && (
        <main className="pf-col">
          <div className="pf-carte pf-fin">
            <div className="pf-coche" aria-hidden>✓</div>
            <h2 className="pf-h2">Bienvenue chez Flowin, {perso.prenom || 'et merci'} !</h2>
            <p className="pf-sous">Votre espace pro <b>{f.nomCommercial || f.nom}</b> est créé. L’équipe Flowin valide votre fiche ; en attendant, vous pouvez déjà découvrir votre espace.</p>
            {!fin.session && <div className="pf-info">Un email de confirmation vient de vous être envoyé à <b>{f.email}</b>. Cliquez sur le lien qu’il contient, puis connectez-vous.</div>}
            {fin.degrade && <div className="pf-aide">Certaines informations (forme juridique, produits, points de vente) seront complétées dans votre profil.</div>}
            <div className="pf-suite">
              <div className="pf-suite-l"><span className="pf-ic">✓</span><span><b>Inscription</b> : faite</span></div>
              <div className="pf-suite-l"><span className="pf-ic">2</span><span><b>Configurez votre jeu</b>, puis réglez pour le mettre en ligne</span></div>
              <div className="pf-suite-l"><span className="pf-ic">3</span><span><b>Espace pro</b> : vos animations, vos lots, vos contacts</span></div>
            </div>
            <div className="pf-row" style={{ justifyContent: 'center', marginTop: 16 }}>
              {retour && (
                <a className="pf-btn pf-grand" href={fin.session ? retour : `/pro/connexion?retour=${encodeURIComponent(retour)}`}>Reprendre ma demande pour le super event</a>
              )}
              {fin.session
                ? <a className={retour ? 'pf-btn2' : 'pf-btn pf-grand'} href={`/pro?pro=${encodeURIComponent(fin.proId)}&bienvenue=1`}>Entrer dans mon espace pro</a>
                : <a className={retour ? 'pf-btn2' : 'pf-btn pf-grand'} href="/pro/connexion">Me connecter</a>}
              <a className="pf-btn2" href="/validation/plaquette-animation-v3.html#offres">Découvrir nos offres</a>
            </div>
          </div>
        </main>
      )}
    </div>
  )
}

function Champ({ label, v, set, type = 'text', placeholder, aide, auto, inputMode }: {
  label: string; v: string; set: (v: string) => void; type?: string; placeholder?: string; aide?: string; auto?: string
  inputMode?: 'numeric' | 'text' | 'tel' | 'email'
}) {
  const idc = 'pf-' + label.replace(/[^a-zA-Z]/g, '').toLowerCase().slice(0, 18)
  return (
    <div className="pf-champ">
      <label className="pf-label" htmlFor={idc}>{label}</label>
      <input id={idc} className="pf-in" type={type} value={v} placeholder={placeholder} autoComplete={auto} inputMode={inputMode}
        autoCapitalize={type === 'email' ? 'none' : undefined} onChange={e => set(e.target.value)} />
      {aide && <div className="pf-aide">{aide}</div>}
    </div>
  )
}

const CSS = `
.pf{${VARIABLES_PRO_CSS}min-height:100dvh;background:var(--fl-papier);color:var(--fl-encre);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;-webkit-text-size-adjust:100%}
.pf *{box-sizing:border-box}
.pf-top{display:flex;align-items:center;gap:10px;padding:14px 16px;max-width:1100px;margin:0 auto}
.pf-logo{font-size:22px;font-weight:900;letter-spacing:-.02em;color:var(--fl-encre);text-decoration:none}
.pf-logo em{color:var(--fl-bleu);font-style:normal}
.pf-offre{border:1.5px solid var(--fl-trait);border-radius:18px;background:#fff;padding:16px 18px;margin-top:10px}
.pf-offre-1{border:2px solid #3B5CC4;padding:22px 20px;margin-top:0}
.pf-offre-tag{display:inline-block;background:#3B5CC4;color:#fff;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;border-radius:999px;padding:3px 10px}
.pf-offre-n{font-size:20px;font-weight:900;margin-top:8px}
.pf-offre-1 .pf-offre-n{font-size:26px}
.pf-offre-p{font-size:22px;font-weight:900;color:#3B5CC4;margin-top:2px}
.pf-offre-1 .pf-offre-p{font-size:30px}
.pf-offre-d{font-size:14px;color:var(--fl-texte-2);margin-top:4px}
.pf-offre-o{display:flex;justify-content:space-between;gap:10px;align-items:center;border-top:1px dashed var(--fl-trait);margin-top:14px;padding-top:12px;font-size:14px}
.pf-offre-o span{font-weight:900;white-space:nowrap}
.pf-badge{font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--fl-violet);background:var(--fl-violet-clair);border-radius:99px;padding:4px 9px}
.pf-lien{color:var(--fl-bleu);font-weight:700;font-size:13.5px;text-decoration:none}
.pf-col{max-width:600px;margin:0 auto;padding:8px 16px 48px}
.pf-kicker{font-size:12.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--fl-violet);margin:22px 0 10px;display:flex;align-items:center;gap:10px}
.pf-kicker::before{content:'';width:26px;height:3px;border-radius:2px;background:var(--fl-violet)}
.pf-h1{font-size:34px;line-height:1.08;font-weight:900;letter-spacing:-.02em;margin:0 0 14px}
.pf-h1 span{color:var(--fl-violet)}
.pf-lead{font-size:16px;line-height:1.55;color:var(--fl-texte2);margin:0 0 20px}
.pf-promesses{list-style:none;padding:0;margin:0 0 24px;display:grid;gap:10px}
.pf-promesses li{display:flex;gap:12px;align-items:flex-start;background:#fff;border:1px solid var(--fl-bordure);border-radius:16px;padding:14px 16px;font-size:14px;line-height:1.5;color:var(--fl-texte2)}
.pf-promesses b{color:var(--fl-encre)}
.pf-ic{width:34px;height:34px;border-radius:11px;background:var(--fl-violet-clair);color:var(--fl-violet);display:grid;place-items:center;font-weight:900;flex-shrink:0}
.pf-note{font-size:12.5px;color:var(--fl-texte2);text-align:center;margin-top:12px;line-height:1.5}
.pf-brouillon{background:#fff;border:1.5px solid var(--fl-violet);border-radius:16px;padding:14px 16px;font-size:14px;line-height:1.5;margin-top:12px}
.pf-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}
.pf-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--fl-violet);color:#fff;border:none;border-radius:100px;padding:13px 22px;font-size:15px;font-weight:800;cursor:pointer;text-decoration:none;font-family:inherit;box-shadow:0 10px 24px rgba(122,79,224,.24)}
.pf-btn:hover{background:var(--fl-violet-fonce)}
.pf-btn:disabled{opacity:.6;cursor:default}
.pf-btn2{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;background:#fff;color:var(--fl-encre);border:1.5px solid var(--fl-bordure-champ);border-radius:100px;padding:12px 18px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap}
.pf-grand{width:100%;padding:16px;font-size:16px}
.pf-prog{margin:10px 0 14px}
.pf-prog-l{display:flex;justify-content:space-between;font-size:12.5px;font-weight:800;color:var(--fl-texte2);margin-bottom:8px}
.pf-prog-n{color:var(--fl-violet)}
.pf-barres{display:flex;gap:5px}
.pf-barre{flex:1;height:6px;border-radius:99px;border:none;padding:0;background:var(--fl-bordure);cursor:default}
.pf-barre.on{background:var(--fl-violet)}
.pf-barre.on:not(:disabled){cursor:pointer}
.pf-carte{background:#fff;border:1px solid var(--fl-bordure);border-radius:20px;padding:22px 20px;box-shadow:0 8px 28px rgba(27,58,92,.06)}
.pf-h2{font-size:23px;font-weight:900;letter-spacing:-.01em;margin:0 0 6px;line-height:1.15}
.pf-sous{font-size:14px;line-height:1.55;color:var(--fl-texte2);margin:0 0 16px}
.pf-champ{margin-bottom:12px}
.pf-label{display:block;font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--fl-texte2);margin:10px 0 6px}
.pf-in{width:100%;padding:13px 14px;border-radius:13px;border:1.5px solid var(--fl-bordure-champ);background:var(--fl-champ);font-size:16px;font-family:inherit;color:var(--fl-encre);outline:none}
.pf-in:focus{border-color:var(--fl-violet);background:#fff}
.pf-zone{min-height:110px;resize:vertical}
.pf-aide{font-size:12.5px;color:var(--fl-texte2);margin-top:5px;line-height:1.5}
.pf-err{font-size:13px;color:var(--fl-erreur);font-weight:700;margin:4px 0 8px}
.pf-info{background:#EEF2FB;color:var(--fl-encre);border-radius:12px;padding:11px 14px;font-size:13.5px;line-height:1.5;margin:10px 0}
.pf-ok{background:#EAF6EE;color:#14532D;border-radius:12px;padding:11px 14px;font-size:13.5px;line-height:1.5;margin:4px 0 10px}
.pf-g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pf-cp{grid-template-columns:130px 1fr}
.pf-cherche{display:flex;gap:8px}
.pf-cherche .pf-in{flex:1;min-width:0}
.pf-choix,.pf-choix2{display:grid;gap:8px;margin-bottom:6px}
.pf-choix2{grid-template-columns:1fr 1fr}
.pf-opt{text-align:left;background:var(--fl-champ);border:1.5px solid var(--fl-bordure-champ);border-radius:14px;padding:12px 14px;cursor:pointer;font-family:inherit;color:var(--fl-encre);display:flex;flex-direction:column;gap:3px}
.pf-opt b{font-size:14.5px;font-weight:800}
.pf-opt span{font-size:12.5px;color:var(--fl-texte2);line-height:1.4}
.pf-opt.on{border:2px solid var(--fl-violet);background:var(--fl-violet-clair)}
.pf-suggere{color:var(--fl-violet)!important;font-weight:800}
.pf-resultats{display:grid;gap:8px;margin:12px 0}
.pf-res{text-align:left;background:#fff;border:1.5px solid var(--fl-bordure-champ);border-radius:14px;padding:12px 14px;cursor:pointer;font-family:inherit;color:var(--fl-encre)}
.pf-res:hover{border-color:var(--fl-violet)}
.pf-res-n{font-weight:800;font-size:15px}
.pf-res-n span{font-weight:600;color:var(--fl-texte2)}
.pf-res-d{font-size:12.5px;color:var(--fl-texte2);margin-top:2px}
.pf-ferme{color:var(--fl-erreur)}
.pf-lien-btn{background:none;border:none;color:var(--fl-bleu);font-weight:700;font-size:13.5px;cursor:pointer;padding:8px 0;font-family:inherit;text-align:left}
.pf-stepper{display:flex;align-items:center;gap:10px;margin:6px 0 12px}
.pf-stepper button{width:52px;height:52px;border-radius:50%;border:1.5px solid var(--fl-bordure-champ);background:#fff;font-size:24px;font-weight:700;color:var(--fl-encre);cursor:pointer}
.pf-stepper .pf-in{text-align:center;font-size:28px;font-weight:900;flex:1}
.pf-puces{display:flex;gap:8px;flex-wrap:wrap}
.pf-puce{border:1.5px solid var(--fl-bordure-champ);background:#fff;border-radius:99px;padding:8px 15px;font-weight:800;font-size:13.5px;cursor:pointer;color:var(--fl-encre);font-family:inherit}
.pf-puce.on{border-color:var(--fl-violet);background:var(--fl-violet-clair);color:var(--fl-violet-fonce)}
.pf-recap{border:1px solid var(--fl-bordure);border-radius:14px;padding:4px 14px;margin-bottom:8px}
.pf-recap-l{display:flex;align-items:baseline;gap:10px;padding:8px 0;border-bottom:1px solid var(--fl-bordure)}
.pf-recap-l:last-child{border-bottom:none}
.pf-recap-k{flex:0 0 120px;font-size:12px;font-weight:800;color:var(--fl-texte2)}
.pf-recap-v{flex:1;font-size:13.5px;word-break:break-word}
.pf-recap-l .pf-lien-btn{padding:0;font-size:12.5px}
.pf-nav{display:flex;align-items:center;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid var(--fl-bordure)}
.pf-fin{text-align:center;margin-top:26px}
.pf-suite{text-align:left;display:grid;gap:8px;margin:14px 0 4px}
.pf-suite-l{display:flex;gap:10px;align-items:center;font-size:14px;line-height:1.4}
.pf-coche{width:68px;height:68px;border-radius:50%;background:var(--fl-violet-clair);color:var(--fl-violet);font-size:34px;font-weight:900;display:grid;place-items:center;margin:0 auto 14px}
@media (max-width:520px){
  .pf-h1{font-size:29px}
  .pf-choix2{grid-template-columns:1fr}
  .pf-g2{grid-template-columns:1fr}
  .pf-cp{grid-template-columns:1fr 2fr}
  .pf-carte{padding:18px 16px}
  .pf-recap-k{flex-basis:92px}
}
`
