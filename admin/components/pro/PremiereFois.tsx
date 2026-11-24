'use client'

/**
 * « MA PREMIERE FOIS » — le parcours d'inscription d'un pro.
 *
 * LOT 3-1 (24/11/2026, maquette validee par Romain, docs/maquette/lot3-1-inscription.html) : TROIS ecrans d'une hauteur,
 * sans ecran d'accueil : 1. Vous et votre commerce (SIRET = nom, adresse, secteur suggere), 2. Activite (secteur),
 * 3. Compte (mot de passe unique avec oeil, telephone facultatif). Fin : « Configurer mon jeu » en un toucher.
 * Avant : accueil en 3 ecrans puis 7 etapes (10 touchers, ~11 champs).
 *
 * Secteur detaille, produits et nombre de points de vente ne sont plus demandes ici : ils se completent dans
 * « Mon profil » (EntrepriseForm : produits_services, nb_points_vente), sans etre perdus ni bloquants. Memes colonnes
 * `pros` qu'avant (lib/proCreation) ; droits `en_attente`, brouillon local (jamais le mot de passe) et e-mail de
 * confirmation inchanges. Logique de validation : lib/inscriptionPro.ts (erreursEtape).
 *
 * Donnees : rien n'est invente. Ce que l'annuaire officiel ne renvoie pas reste vide, et tout ce qui est pre-rempli
 * reste modifiable.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { proIdExiste } from '@/lib/proFiche'
import { estDemo } from '@/lib/demo'
import { capturerSource, tagSource } from '@/lib/source'
import { CHARTE_PRO as C, VARIABLES_PRO_CSS } from '@/lib/charte'
import {
  SECTEURS_PRO, SECTEUR_AUTRE, nettoyerPrecision, ficheProVide, identifiantPro, lignePro, ligneProEntreprise,
  type FichePro,
} from '@/lib/proCreation'
import { chiffres, erreurNumero, natureRecherche, secteurSuggere, siretValide, type EntrepriseTrouvee } from '@/lib/entreprise'
import { ETAPES_INSCRIPTION, TEL_OK, EMAIL_OK, CP_OK, erreursEtape, etapeDepuisAncienne } from '@/lib/inscriptionPro'
import { messageFr, messageAuth } from '@/lib/erreursFr'
import { retourSur } from '@/lib/retour'
import { Celebration } from '@/components/creation/EnLigne'
import { GARANTIE_ACTIVE } from '@/lib/flowinConfig'
import PrecisionAutre from '@/components/creation/PrecisionAutre'
import SelectActivite from '@/components/creation/SelectActivite'

const CLE_BROUILLON = 'flowin.premiere-fois.v1'
const NB_ECRANS = ETAPES_INSCRIPTION.length
const SECTEUR_COMMERCE = 'Commerce & Négoce'

interface Perso { prenom: string; nom: string }
/** `v: 2` = brouillon du parcours a 3 ecrans ; sans `v`, ancien parcours a 7 etapes (etapeDepuisAncienne). */
interface Brouillon { v?: number; etape: number; f: FichePro; perso: Perso; mode: 'recherche' | 'manuel' | 'prerempli'; selection?: string }

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

function lireBrouillon(): Brouillon | null {
  try {
    const t = window.localStorage.getItem(CLE_BROUILLON)
    if (!t) return null
    const b = JSON.parse(t) as Brouillon
    if (!b || typeof b.etape !== 'number' || !b.f) return null
    const etape = b.v === 2 ? Math.min(Math.max(b.etape, 0), NB_ECRANS - 1) : etapeDepuisAncienne(b.etape)
    return { ...b, etape, f: { ...ficheProVide(), ...b.f, motdepasse: '' } }
  } catch { return null }
}
function ecrireBrouillon(b: Brouillon) {
  try { window.localStorage.setItem(CLE_BROUILLON, JSON.stringify({ ...b, v: 2, f: { ...b.f, motdepasse: '' } })) } catch { /* navigation privee */ }
}
function effacerBrouillon() {
  try { window.localStorage.removeItem(CLE_BROUILLON) } catch { /* rien */ }
}

export default function PremiereFois() {
  /* 0..2 = les trois ecrans ; 3 = termine */
  const [etape, setEtape] = useState(0)
  const [f, setF] = useState<FichePro>({ ...ficheProVide(), profil: 'commerce' })
  const [perso, setPerso] = useState<Perso>({ prenom: '', nom: '' })
  const [mode, setMode] = useState<Brouillon['mode']>('recherche')
  const [brouillonTrouve, setBrouillonTrouve] = useState<Brouillon | null>(null)
  const [pret, setPret] = useState(false)
  const [tente, setTente] = useState(false)
  const [voirMdp, setVoirMdp] = useState(false)
  const [envoi, setEnvoi] = useState<'idle' | 'loading' | 'error'>('idle')
  const [erreur, setErreur] = useState('')
  const [fin, setFin] = useState<{ proId: string; session: boolean; degrade: boolean } | null>(null)
  const [selection, setSelection] = useState('')
  const haut = useRef<HTMLDivElement>(null)
  /* Retour vers une demande en cours (parcours « rejoindre un super event » sans compte) : ?retour=/rejoindre?... */
  const [retour, setRetour] = useState<string | null>(null)
  useEffect(() => { try { setRetour(retourSur(new URLSearchParams(window.location.search).get('retour'))) } catch { /* rien */ } }, [])
  /* Compte d'acces deja cree pendant cette visite (reprise apres un echec d'enregistrement de la fiche). */
  const compteCree = useRef<{ email: string; id: string } | null>(null)

  /* Recherche entreprise par SIRET */
  const [recherche, setRecherche] = useState('')
  const [etatRecherche, setEtatRecherche] = useState<'idle' | 'loading' | 'ok' | 'vide' | 'indispo' | 'erreur'>('idle')
  const [messageRecherche, setMessageRecherche] = useState('')
  const [resultats, setResultats] = useState<EntrepriseTrouvee[]>([])
  /* Canal d'origine du lien (?src=), retenu à la 1re visite, écrit en tag `src:<canal>` (aucun SQL). */
  const [src, setSrc] = useState('')

  useEffect(() => {
    const b = lireBrouillon()
    if (b) setBrouillonTrouve(b)
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

  /* Le brouillon trouve attend la decision (Reprendre / Recommencer) : tant qu'elle n'est pas prise, on ne l'ecrase pas. */
  useEffect(() => {
    if (!pret || brouillonTrouve || etape > NB_ECRANS - 1) return
    ecrireBrouillon({ etape, f, perso, mode, selection })
  }, [pret, brouillonTrouve, etape, f, perso, mode, selection])

  const maj = (c: Partial<FichePro>) => setF(x => ({ ...x, ...c }))
  const allerA = (n: number) => {
    setTente(false); setErreur('')
    setEtape(n)
    try { haut.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); window.scrollTo({ top: 0 }) } catch { /* rien */ }
  }

  /** Ce qui manque pour avancer, par champ (affiche apres un premier essai). */
  const erreurs = useMemo(() => erreursEtape(etape, {
    prenom: perso.prenom, nom: perso.nom, email: f.email, tel: f.tel,
    entreprise: f.nom, adresse: f.adresse, codePostal: f.codePostal, ville: f.ville, mode,
    siretInvalide: recherche.trim() ? (erreurNumero(recherche) ?? (etatRecherche === 'vide' ? 'Aucune entreprise trouvée : vérifiez le numéro, ou « Pas de SIRET ».' : etatRecherche === 'indispo' || etatRecherche === 'erreur' ? messageRecherche : null)) : null,
    secteur: f.secteur, secteurAutre: f.secteurAutre ?? '', motdepasse: f.motdepasse,
  }), [etape, perso, f, mode, recherche, etatRecherche, messageRecherche])
  const ok = Object.keys(erreurs).length === 0
  const err = (k: string) => (tente && erreurs[k] ? <div className="pf-err" role="alert">{erreurs[k]}</div> : null)

  /* Mode demo (lib/demo.ts) : jamais bloque, l'ecran incomplet est complete de valeurs « Démo ». */
  function completerDemo(): Partial<FichePro> {
    if (etape === 0) {
      setPerso(x => ({ prenom: x.prenom.trim() || 'Prénom', nom: x.nom.trim() || 'Démo' }))
      const c: Partial<FichePro> = { email: EMAIL_OK(f.email) ? f.email : 'demo@demo.invalid' }
      if (mode === 'recherche') {
        setMode('manuel')
        Object.assign(c, { nom: 'Commerce Démo', adresse: '1 rue Démo', codePostal: '00000', ville: 'Ville Démo' })
      } else {
        Object.assign(c, {
          nom: f.nom.trim().length >= 2 ? f.nom : 'Commerce Démo', adresse: f.adresse.trim().length >= 3 ? f.adresse : '1 rue Démo',
          codePostal: CP_OK(f.codePostal) ? f.codePostal : '00000', ville: f.ville.trim().length >= 2 ? f.ville : 'Ville Démo',
        })
      }
      maj(c); return c
    }
    if (etape === 1) {
      const c: Partial<FichePro> = { secteur: f.secteur || SECTEURS_PRO[0], secteurAutre: nettoyerPrecision(f.secteurAutre).length >= 3 ? f.secteurAutre : 'Activité Démo' }
      maj(c); return c
    }
    const c: Partial<FichePro> = { motdepasse: f.motdepasse.length >= 8 ? f.motdepasse : 'demo-demo-2026', tel: TEL_OK(f.tel) ? f.tel : '' }
    maj(c); return c
  }

  function suivant() {
    let over: Partial<FichePro> = {}
    if (!ok) {
      if (estDemo()) over = completerDemo()
      else { setTente(true); return }
    }
    if (etape === NB_ECRANS - 1) { creer(over); return }
    allerA(etape + 1)
  }

  async function chercher(brut: string) {
    const q = brut.trim()
    const e = erreurNumero(q)
    if (e) { setEtatRecherche('erreur'); setMessageRecherche(e); return }
    if (natureRecherche(q) === 'invalide') { setEtatRecherche('erreur'); setMessageRecherche('Saisissez un SIRET (14 chiffres).'); return }
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
      if (r.length === 1) choisir(r[0])
    } catch {
      setEtatRecherche('indispo'); setMessageRecherche('Le service public ne répond pas : saisissez vos informations à la main.')
    }
  }

  /** Le SIRET complet (14 chiffres, cle valide) lance la recherche tout seul : un toucher de moins. */
  function surSiret(v: string) {
    setRecherche(v); setEtatRecherche('idle'); setMessageRecherche(''); setResultats([])
    const c = chiffres(v)
    if (c.length === 14 && /^[\d\s.-]+$/.test(v.trim()) && siretValide(c)) chercher(c)
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

  async function creer(over: Partial<FichePro> = {}) {
    setEnvoi('loading'); setErreur('')
    const fiche: FichePro = { ...f, ...over, contact: `${perso.prenom.trim()} ${perso.nom.trim()}`.trim(), siret: chiffres(f.siret) }
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
    /* Sécurité pros (21/11) : identifiant déjà pris ? par RPC (la table n'est plus lisible en anonyme, et la session peut manquer avant la confirmation e-mail). */
    const existe = await proIdExiste(supabase, idPro)
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
    setEtape(NB_ECRANS)
  }

  const suggere = secteurSuggere(f.codeNaf, f.formeJuridiqueCode)
  const adresseIncomplete = mode === 'prerempli' && (f.adresse.trim().length < 3 || !CP_OK(f.codePostal) || f.ville.trim().length < 2)

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

      {etape < NB_ECRANS && (
        <main className="pf-col" data-ecran={etape + 1}>
          <div className="pf-prog" role="group" aria-label={`Étape ${etape + 1} sur ${NB_ECRANS}`}>
            <div className="pf-gs">
              {ETAPES_INSCRIPTION.map((nom, n) => (
                <button key={nom} type="button" className={`pf-g${n < etape ? ' done' : n === etape ? ' cur' : ''}`} disabled={n >= etape} onClick={() => allerA(n)} aria-label={n < etape ? `Revenir à ${nom}` : nom}>
                  <i /><span>{n < etape && <Coche taille={13} />}{nom}</span>
                </button>
              ))}
            </div>
            <div className="pf-nn">{etape + 1}<small>/{NB_ECRANS}</small></div>
          </div>

          {brouillonTrouve && etape === 0 && (
            <div className="pf-brouillon" data-brouillon>
              <div><b>Vous aviez commencé.</b> Brouillon gardé sur cet appareil.</div>
              <div className="pf-row">
                <button className="pf-btn pf-petit" onClick={() => { setF(brouillonTrouve.f); setPerso(brouillonTrouve.perso ?? { prenom: '', nom: '' }); setMode(brouillonTrouve.mode ?? 'recherche'); const e = brouillonTrouve.etape; setBrouillonTrouve(null); allerA(e) }}>Reprendre</button>
                <button className="pf-btn2" onClick={() => { effacerBrouillon(); setBrouillonTrouve(null) }}>Recommencer</button>
              </div>
            </div>
          )}

          <div className="pf-corps">
            {etape === 0 && (
              <>
                <h1 className="pf-h2">Vous et votre commerce</h1>
                <div className="pf-g2">
                  <Champ label="Prénom" v={perso.prenom} set={v => setPerso(p => ({ ...p, prenom: v }))} auto="given-name" ko={tente && !!erreurs.prenom} />
                  <Champ label="Nom" v={perso.nom} set={v => setPerso(p => ({ ...p, nom: v }))} auto="family-name" ko={tente && !!erreurs.nom} />
                </div>
                {err('prenom')}{err('nom')}
                <Champ label="E-mail" v={f.email} set={v => maj({ email: v })} type="email" auto="email" ko={tente && !!erreurs.email} />
                {err('email')}

                {mode === 'recherche' && (
                  <>
                    <Champ label="SIRET · 14 chiffres" v={recherche} set={surSiret} inputMode="numeric" auto="off" ko={tente && !!erreurs.siret} />
                    {etatRecherche === 'loading' && <div className="pf-info" role="status">Recherche dans l’annuaire officiel…</div>}
                    {etatRecherche === 'erreur' && <div className="pf-err" role="alert">{messageRecherche}</div>}
                    {etatRecherche === 'vide' && <div className="pf-info">Aucune entreprise trouvée : vérifiez le numéro, ou « Pas de SIRET ».</div>}
                    {etatRecherche === 'indispo' && <div className="pf-info">{messageRecherche || 'L’annuaire officiel ne répond pas.'} Saisissez vos informations à la main.</div>}
                    {resultats.length > 1 && (
                      <div className="pf-resultats">
                        {resultats.map(r => (
                          <button key={r.siret || r.siren} type="button" className="pf-res" onClick={() => choisir(r)}>
                            <b>{r.nom || '[nom non communiqué]'}</b><span>{[r.codePostal, r.ville].filter(Boolean).join(' ')}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {tente && erreurs.siret && etatRecherche === 'idle' && <div className="pf-err" role="alert">{erreurs.siret}</div>}
                  </>
                )}

                {mode === 'prerempli' && (
                  <>
                    <div className="pf-carte-ok" data-entreprise-trouvee>
                      <span className="pf-c"><Coche taille={16} /></span>
                      <div>
                        <b>{f.nomCommercial || f.nom}</b>
                        <small>{[f.codePostal, f.ville].filter(Boolean).join(' ')}{f.adresse ? ' · adresse reprise de l’annuaire' : ''}</small>
                      </div>
                    </div>
                    {adresseIncomplete && (
                      <>
                        <Champ label="Adresse" v={f.adresse} set={v => maj({ adresse: v })} auto="street-address" ko={tente && !!erreurs.adresse} />
                        <div className="pf-g2 pf-cp">
                          <Champ label="Code postal" v={f.codePostal} set={v => maj({ codePostal: v })} inputMode="numeric" auto="postal-code" ko={tente && !!erreurs.codePostal} />
                          <Champ label="Ville" v={f.ville} set={v => maj({ ville: v })} auto="address-level2" ko={tente && !!erreurs.ville} />
                        </div>
                        {err('adresse')}{err('codePostal')}{err('ville')}
                      </>
                    )}
                    {suggere && <div className="pf-moment"><span className="pf-c"><Coche taille={15} /></span><span>Secteur suggéré : {suggere}</span></div>}
                  </>
                )}

                {mode === 'manuel' && (
                  <>
                    <Champ label="Nom de l’établissement" v={f.nom} set={v => maj({ nom: v })} auto="organization" ko={tente && !!erreurs.entreprise} />
                    {err('entreprise')}
                    <Champ label="Adresse" v={f.adresse} set={v => maj({ adresse: v })} auto="street-address" ko={tente && !!erreurs.adresse} />
                    {err('adresse')}
                    <div className="pf-g2 pf-cp">
                      <Champ label="Code postal" v={f.codePostal} set={v => maj({ codePostal: v })} inputMode="numeric" auto="postal-code" ko={tente && !!erreurs.codePostal} />
                      <Champ label="Ville" v={f.ville} set={v => maj({ ville: v })} auto="address-level2" ko={tente && !!erreurs.ville} />
                    </div>
                    {err('codePostal')}{err('ville')}
                  </>
                )}
                {selection && <div className="pf-aide">Votre sélection : <b>{resumeSelection(selection)}</b>. Elle sera reprise dans votre bon de commande.</div>}
              </>
            )}

            {etape === 1 && (
              <>
                <h1 className="pf-h2">Votre activité</h1>
                {f.secteur && (
                  <div className="pf-carte-ok pf-bleu" data-secteur-choisi>
                    <span className="pf-c"><Coche taille={16} /></span>
                    <div><b>{f.secteur}</b><small>{f.secteur === suggere ? `Suggéré d’après votre code NAF${f.codeNaf ? ` (${f.codeNaf})` : ''}` : 'Votre choix'}</small></div>
                  </div>
                )}
                {f.secteur === SECTEUR_COMMERCE && (
                  <div className="pf-champ-select">
                    <label className="pf-lbl" htmlFor="pf-activite">Votre activité (facultatif)</label>
                    <SelectActivite id="pf-activite" valeur={f.activite ?? ''} onChange={v => maj({ activite: v })} style={STYLE_SELECT} />
                    <PrecisionAutre secteur={f.activite ?? ''} valeur={f.secteurAutre ?? ''} onChange={v => maj({ secteurAutre: v })} id="pf-activite-autre" />
                  </div>
                )}
                <PrecisionAutre secteur={f.secteur} valeur={f.secteurAutre ?? ''} onChange={v => maj({ secteurAutre: v })} id="pf-secteur-autre" erreur={tente ? erreurs.secteurAutre : null} />
                <div className="pf-lbl">{f.secteur ? 'Autre secteur' : 'Choisissez votre secteur'}</div>
                <div className="pf-puces" role="group" aria-label="Secteur d’activité">
                  {(SECTEURS_PRO as readonly string[]).filter(s => s !== f.secteur).map(s => (
                    <button key={s} type="button" className="pf-puce" onClick={() => maj({ secteur: s, activite: s === SECTEUR_COMMERCE ? f.activite : '' })}>{s}</button>
                  ))}
                </div>
                {err('secteur')}
                <div className="pf-aide">Produits et points de vente : à compléter plus tard dans Mon profil.</div>
              </>
            )}

            {etape === 2 && (
              <>
                <h1 className="pf-h2">Votre compte</h1>
                <div className="pf-ch pf-ok" data-email-repris>
                  <span className="pf-ch-l">E-mail</span>
                  <span className="pf-val">{f.email}</span>
                </div>
                <Champ label="Mot de passe · 8 caractères minimum" v={f.motdepasse} set={v => maj({ motdepasse: v })} type={voirMdp ? 'text' : 'password'} auto="new-password" ko={tente && !!erreurs.motdepasse}
                  droite={<button type="button" className="pf-oeil" onClick={() => setVoirMdp(v => !v)} aria-label={voirMdp ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={voirMdp}><Oeil barre={voirMdp} /></button>} />
                {err('motdepasse')}
                <Champ label="Téléphone · facultatif" v={f.tel} set={v => maj({ tel: v })} type="tel" auto="tel" inputMode="tel" ko={tente && !!erreurs.tel} />
                {err('tel')}
                <div className="pf-moment"><span className="pf-c"><Coche taille={15} /></span><span>2 étapes faites</span></div>
                {erreur && <div className="pf-err" role="alert">{erreur} {/existe déjà/.test(erreur) && <Link href="/pro/connexion" className="pf-lien">Se connecter</Link>}</div>}
              </>
            )}
          </div>

          <div className="pf-pied">
            <button className="pf-btn pf-grand" onClick={suivant} disabled={envoi === 'loading'} data-suivant>
              {etape === NB_ECRANS - 1 ? (envoi === 'loading' ? 'Création…' : 'Créer mon compte') : 'Continuer'}
            </button>
            {etape === 0 && mode === 'recherche' && <button type="button" className="pf-lien-btn" onClick={() => { setMode('manuel'); setTente(false) }}>Pas de SIRET</button>}
            {etape === 0 && mode === 'manuel' && <button type="button" className="pf-lien-btn" onClick={() => { setMode('recherche'); setTente(false) }}>J’ai un SIRET</button>}
            {etape === 0 && mode === 'prerempli' && <button type="button" className="pf-lien-btn" onClick={() => { setMode('recherche'); setRecherche(''); setResultats([]); setEtatRecherche('idle'); setTente(false) }}>Ce n’est pas mon entreprise</button>}
            {etape > 0 && <button type="button" className="pf-lien-btn" onClick={() => allerA(etape - 1)} disabled={envoi === 'loading'}>← Retour</button>}
          </div>
        </main>
      )}

      {etape === NB_ECRANS && fin && (
        <main className="pf-col" data-ecran="fin">
          <div className="pf-corps pf-fin">
            <Celebration />
            <h1 className="pf-h2">Compte créé{perso.prenom ? `, ${perso.prenom}` : ''}</h1>
            <p className="pf-sous">Il reste à régler votre jeu. Flowin valide votre fiche en parallèle.</p>
            {!fin.session && <div className="pf-info">Un email de confirmation vient de vous être envoyé à <b>{f.email}</b>. Cliquez sur le lien qu’il contient, puis connectez-vous.</div>}
            {fin.degrade && <div className="pf-aide">Certaines informations seront à compléter dans votre profil.</div>}
          </div>
          <div className="pf-pied">
            {retour && (
              <a className="pf-btn pf-grand" href={fin.session ? retour : `/pro/connexion?retour=${encodeURIComponent(retour)}`}>Reprendre ma demande pour le super event</a>
            )}
            {/* Lot ergonomie 1 (AMEL-DES-02) : de la fin d'inscription au Configurateur en UN toucher. */}
            {fin.session
              ? <a className={retour ? 'pf-lien-btn pf-centre' : 'pf-btn pf-grand'} data-vers-configurateur href={`/pro/nouvelle?pro=${encodeURIComponent(fin.proId)}&type=animation`}>Configurer mon jeu</a>
              : <a className={retour ? 'pf-lien-btn pf-centre' : 'pf-btn pf-grand'} data-vers-configurateur href={`/pro/connexion?retour=${encodeURIComponent(`/pro/nouvelle?pro=${fin.proId}&type=animation`)}`}>Me connecter et configurer</a>}
            {fin.session && <a className="pf-lien-btn pf-centre" href={`/pro?pro=${encodeURIComponent(fin.proId)}&bienvenue=1`}>Aller à mon espace pro</a>}
          </div>
        </main>
      )}
    </div>
  )
}

const STYLE_SELECT = { width: '100%', minHeight: 54, padding: '12px 14px', borderRadius: 14, border: `1.5px solid ${C.bordure}`, fontSize: 16, fontFamily: 'inherit', background: '#fff', color: C.texte } as const

function Coche({ taille = 14 }: { taille?: number }) {
  return <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
}
function Oeil({ barre }: { barre: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />{barre && <path d="M4 4l16 16" />}
    </svg>
  )
}

/** Champ « etiquette dans la boite » de la maquette lot 3-1 : etiquette 13 px, valeur 17 px, boite >= 58 px. */
function Champ({ label, v, set, type = 'text', auto, inputMode, ko, droite }: {
  label: string; v: string; set: (v: string) => void; type?: string; auto?: string
  inputMode?: 'numeric' | 'text' | 'tel' | 'email'; ko?: boolean; droite?: React.ReactNode
}) {
  const idc = 'pf-' + label.replace(/[^a-zA-Z]/g, '').toLowerCase().slice(0, 18)
  return (
    <label className={`pf-ch${ko ? ' ko' : ''}${droite ? ' avec-droite' : ''}`} htmlFor={idc}>
      <span className="pf-ch-l">{label}</span>
      <input id={idc} type={type} value={v} autoComplete={auto} inputMode={inputMode} aria-invalid={ko ? true : undefined}
        autoCapitalize={type === 'email' ? 'none' : undefined} onChange={e => set(e.target.value)} />
      {droite}
    </label>
  )
}

const CSS = `
.pf{${VARIABLES_PRO_CSS}min-height:100dvh;display:flex;flex-direction:column;background:var(--fl-papier);color:var(--fl-encre);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;-webkit-text-size-adjust:100%}
.pf *{box-sizing:border-box}
.pf-top{display:flex;align-items:center;gap:8px;padding:6px 16px;width:100%;max-width:600px;margin:0 auto}
.pf-logo{display:inline-block;line-height:44px;white-space:nowrap;font-size:20px;font-weight:900;letter-spacing:-.02em;color:var(--fl-encre);text-decoration:none}
.pf-logo em{color:var(--fl-bleu);font-style:normal}
.pf-badge{font-size:12px;font-weight:800;letter-spacing:.06em;white-space:nowrap;text-transform:uppercase;color:var(--fl-bleu);background:var(--fl-violet-clair);border-radius:99px;padding:4px 9px}
.pf-lien{white-space:nowrap;color:var(--fl-bleu);font-weight:700;font-size:13.5px;text-decoration:none;display:inline-flex;align-items:center;min-height:44px}
.pf-col{flex:1;display:flex;flex-direction:column;width:100%;max-width:600px;margin:0 auto;padding:0 18px 0}
.pf-corps{flex:1 1 auto;display:flex;flex-direction:column;gap:10px;padding-top:6px}
.pf-pied{padding:14px 0 22px;display:flex;flex-direction:column;gap:2px}
.pf-h2{font-size:24px;font-weight:900;letter-spacing:-.01em;margin:2px 0 4px;line-height:1.15}
.pf-sous{font-size:14px;line-height:1.45;color:var(--fl-texte2);margin:0}
.pf-prog{display:flex;align-items:flex-end;gap:10px;padding-top:2px}
.pf-gs{flex:1;display:flex;gap:6px}
.pf-g{flex:1;min-height:44px;display:flex;flex-direction:column;justify-content:center;gap:5px;background:none;border:0;padding:0;font-family:inherit;cursor:default;text-align:left}
.pf-g i{display:block;height:6px;border-radius:6px;background:var(--fl-bordure);position:relative;overflow:hidden;width:100%}
.pf-g i::after{content:"";position:absolute;inset:0;background:var(--fl-bleu);transform-origin:left;opacity:0}
.pf-g.done i::after{background:var(--fl-ok);opacity:1}
.pf-g.cur i::after{opacity:1;right:50%}
.pf-g span{font-size:13px;font-weight:800;color:var(--fl-texte2);white-space:nowrap;display:flex;align-items:center;gap:4px}
.pf-g.cur span{color:var(--fl-bleu)}
.pf-g.done span{color:var(--fl-ok);cursor:pointer}
.pf-g.done{cursor:pointer}
.pf-nn{flex:none;font-size:20px;font-weight:900;color:var(--fl-bleu);line-height:1;padding-bottom:16px}
.pf-nn small{font-size:13px;color:var(--fl-texte2);font-weight:800}
.pf-ch{background:#fff;border:1.5px solid var(--fl-bordure);border-radius:14px;padding:7px 14px;min-height:58px;position:relative;display:block}
.pf-ch .pf-ch-l{display:block;font-size:13px;color:var(--fl-texte2);font-weight:700}
.pf-ch input{display:block;width:100%;border:0;outline:0;background:transparent;padding:0;font-size:17px;font-weight:700;font-family:inherit;color:var(--fl-encre);line-height:1.3;min-height:26px}
.pf-ch:focus-within{border-color:var(--fl-bleu);box-shadow:0 0 0 3px var(--fl-violet-clair)}
.pf-ch.ko{border-color:var(--fl-erreur)}
.pf-ch.pf-ok{border-color:var(--fl-ok)}
.pf-ch .pf-val{display:block;font-size:17px;font-weight:700;line-height:1.3;word-break:break-all}
.pf-ch.avec-droite input{padding-right:46px}
.pf-oeil{position:absolute;right:6px;top:7px;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;color:var(--fl-texte2);background:none;border:0;cursor:pointer}
.pf-g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pf-cp{grid-template-columns:1fr 2fr}
.pf-lbl{display:block;font-size:13px;font-weight:800;color:var(--fl-texte2);margin-top:2px}
.pf-champ-select{display:grid;gap:5px}
.pf-puces{display:flex;gap:8px;flex-wrap:wrap}
.pf-puce{display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border-radius:99px;background:#fff;border:1.5px solid var(--fl-bordure);font-size:15px;font-weight:800;color:var(--fl-encre);font-family:inherit;cursor:pointer}
.pf-puce:active{background:var(--fl-violet-clair);border-color:var(--fl-bleu)}
.pf-carte-ok{display:flex;gap:12px;align-items:center;background:#fff;border:2px solid var(--fl-ok);border-radius:18px;padding:10px 14px}
.pf-carte-ok.pf-bleu{border-color:var(--fl-bleu)}
.pf-carte-ok.pf-bleu .pf-c{background:var(--fl-bleu)}
.pf-carte-ok b{display:block;font-size:16.5px;line-height:1.2}
.pf-carte-ok small{font-size:13px;color:var(--fl-texte2);font-weight:600}
.pf-c{flex:none;width:28px;height:28px;border-radius:50%;background:var(--fl-ok);color:#fff;display:grid;place-items:center}
.pf-moment{display:flex;align-items:center;gap:10px;background:#E3F3EC;border:1.5px solid #B7DFCB;border-radius:16px;padding:10px 14px;font-size:15px;font-weight:800;color:var(--fl-ok)}
.pf-aide{font-size:13px;color:var(--fl-texte2);line-height:1.45}
.pf-err{font-size:13px;color:var(--fl-erreur);font-weight:700;margin:-4px 0 0}
.pf-info{background:#EEF2FB;color:var(--fl-encre);border-radius:12px;padding:10px 14px;font-size:13.5px;line-height:1.45}
.pf-resultats{display:grid;gap:8px}
.pf-res{text-align:left;background:#fff;border:1.5px solid var(--fl-bordure-champ);border-radius:14px;padding:10px 14px;min-height:44px;cursor:pointer;font-family:inherit;color:var(--fl-encre);display:flex;flex-direction:column}
.pf-res span{font-size:13px;color:var(--fl-texte2)}
.pf-brouillon{background:#fff;border:1.5px solid var(--fl-bleu);border-radius:16px;padding:10px 14px;font-size:14px;line-height:1.4;margin-top:6px}
.pf-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}
.pf-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:54px;background:linear-gradient(135deg,var(--fl-bleu),#5576DA);color:#fff;border:none;border-radius:100px;padding:13px 22px;font-size:17px;font-weight:900;cursor:pointer;text-decoration:none;font-family:inherit;box-shadow:0 12px 22px -12px rgba(59,92,196,.9)}
.pf-btn:disabled{opacity:.6;cursor:default}
.pf-petit{min-height:44px;font-size:15px;padding:10px 20px}
.pf-btn2{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;background:#fff;color:var(--fl-encre);border:1.5px solid var(--fl-bordure-champ);border-radius:100px;padding:10px 18px;min-height:44px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap}
.pf-grand{width:100%}
.pf-lien-btn{display:flex;align-items:center;justify-content:center;min-height:44px;background:none;border:none;color:var(--fl-bleu);font-weight:800;font-size:14px;text-decoration:underline;cursor:pointer;font-family:inherit;padding:0 8px}
.pf-centre{text-align:center}
.pf-fin{text-align:center;align-items:stretch;justify-content:center}
.pf-fin .pf-sous{text-align:center}
@media (prefers-reduced-motion:reduce){.pf *{animation:none!important;transition:none!important}}
`
