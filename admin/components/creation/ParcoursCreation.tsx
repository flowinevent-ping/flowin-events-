'use client'

/**
 * PARCOURS DE CREATION — un seul composant pour le pro et pour le Super Admin.
 *
 * Romain, 29/10 : « si Super Admin crée une animation, c'est pour le
 * onboarding d'un pro. On doit retrouver la même interface chez le pro que
 * dans Super Admin, avec des droits différents, mais les deux doivent être
 * identiques. Même chose pour le Super Event. » Les codes visuels sont ceux
 * de la maquette « Parcours Pro Flowin » validee par Romain : pastilles
 * d'etapes numerotees, cartes a halo, apercu du vrai jeu en direct a droite,
 * tuiles QR a la fin.
 *
 *   0. Que voulez-vous faire ?
 *        pro : créer une animation · rejoindre un super event
 *              · proposer un super event a Flowin
 *        SA  : créer une animation · intégrer un super event
 *              · créer un super event
 *   1. L'animation / le super event   2. Jeu   3. Lots
 *   [4. Participants — super event, SA]   fin. Diffusion & QR
 *
 * Droits (seule difference entre les deux modes) :
 *   - le pro REJOINT un super event par une demande, validee ensuite par le SA ;
 *     il ne cree pas de super event : il en propose la creation a Flowin ;
 *   - le SA rattache directement (la demande est creee puis approuvee par la
 *     meme fonction que l'ecran Demandes de participation) et cree les super
 *     events, avec leurs lots et leurs pros participants.
 *
 * Ecritures : creerAnimation (lib/pro.ts), demandes_rattachement_super_event
 * (+ RPC approuver_demande_rattachement cote SA), creerSuperEvent (lib/nds.ts)
 * + se_lots, crm_retours (demandes adressees a Flowin). Aucune table nouvelle.
 */

import { useEffect, useMemo, useState } from 'react'
import { supabase, supabasePublic } from '@/lib/supabase'
import { creerAnimation, enregistrerDemandeQuiz, enregistrerDemandeSuperEvent } from '@/lib/pro'
import type { Banque, QuestionQuiz } from '@/lib/banques'
import { creerBanque, enregistrerBanque, nouvelleQuestionQuiz } from '@/lib/banques'
import { creerSuperEvent, slugSuperEvent, type SuperEvent } from '@/lib/nds'
import type { PackParticipation } from '@/lib/commercial'
import { GABARIT_MODULE, GABARIT_NOM, sorteBanque } from '@/lib/gabarit'
import { libelleModule, libelleDates } from '@/lib/operations'
import { SECTEURS_PRO } from '@/lib/proCreation'
import { CHARTE_PRO as C, ACCENT_ANIM, ACCENT_SUPER } from '@/lib/charte'
import { CARD, CHAMP, LABEL, BTN, BTN2, MUTED, choix } from '@/lib/proui'
import { Ico, IcoModule } from '@/lib/proicons'
import { uploaderLogo, redimensionnerImage } from '@/lib/upload'
import { geocoderAdresse } from '@/lib/geocodage'
import SuperEventMap from '@/app/se/_components/SuperEventMap'
import ConfigJeu from '@/components/dashboard/ConfigJeu'
import ApercuJeu from '@/components/parcours/ApercuJeu'
import BilletApercu from '@/components/parcours/BilletApercu'
import Diffusion from '@/components/dashboard/Diffusion'

type TypeOp = 'animation' | 'rejoindre' | 'super' | 'demande'
export type ModeParcours = 'pro' | 'sa'
type Lot = { id: string; nom: string; quantite: number; valeur: number; type: 'tirage' | 'instantane'; conditions: string }

export interface ProNouvelle {
  id: string; nom: string | null; secteur: string | null; adresse: string | null
  code_postal: string | null; ville: string | null; email: string | null; tel: string | null
  contact: string | null; partenaire_id: string | null; statut: string | null
}
export interface SuperOuvert extends SuperEvent { frais_pro?: number | null; station?: string | null; lat?: number | null; lng?: number | null }
/** Ligne du CRM pro proposee a l etape « Participants » d un super event (SA). */
export interface ProCatalogue { id: string; nom: string | null; contact: string | null; ville: string | null; tel: string | null; email: string | null; secteur: string | null }

/* GABARIT_MODULE vaut 'quiz' (lib/gabarit.ts) : une seule entree, avec le
   libelle du gabarit (le bonus est optionnel). */
const JEUX: { m: string; t: string; s: string; banque: boolean }[] = [
  { m: GABARIT_MODULE, t: GABARIT_NOM, s: 'Questions à choix multiple, bonus de rattrapage optionnel', banque: true },
  { m: 'spin', t: 'Roue de la fortune', s: 'Tirage instantané, segments = lots', banque: false },
  { m: 'tombola', t: 'Tombola', s: 'Inscription + grand tirage', banque: false },
  { m: 'vote', t: 'Vote', s: 'Vote produits / artistes', banque: false },
]
const CATEGORIES = ['Boulangerie', 'Restaurant', 'Bar · Café', 'Caviste', 'Fleuriste', 'Librairie', 'Épicerie fine', 'Mode', 'Beauté · Coiffure', 'Décoration', 'Autre']
const TEL_FLOWIN = '04 93 59 91 37'
const MAIL_FLOWIN = 'flowinevent@gmail.com'
const BASE = 'https://flowin-events.vercel.app'
/** Banques ecrites pour une seule station NDS2026 : rangees a part (PR #67). */
const BANQUES_STATION_NDS = ['bq-nds-bar', 'bq-nds-caisses', 'bq-nds-ecrans', 'bq-nds-tablette']
const lotVide = (type: Lot['type'] = 'tirage'): Lot => ({ id: 'l' + Math.random().toString(36).slice(2, 8), nom: '', quantite: 5, valeur: 0, type, conditions: '' })
const PRO_VIDE: ProNouvelle = { id: '', nom: null, secteur: null, adresse: null, code_postal: null, ville: null, email: null, tel: null, contact: null, partenaire_id: null, statut: null }

/* Volet C — 3 questions de depart : du texte-gabarit, JAMAIS une vraie
   question (aucun fait invente). */
function suggestionsExemples(): QuestionQuiz[] {
  const base = (texte: string): QuestionQuiz => ({ ...nouvelleQuestionQuiz(), texte, options: ['Réponse à corriger', 'Réponse à corriger', 'Réponse à corriger', 'Réponse à corriger'] })
  return [
    base('Exemple à modifier — une question sur votre commerce'),
    base('Exemple à modifier — une question sur votre quartier ou votre ville'),
    base('Exemple à modifier — une question sur vos produits ou votre savoir-faire'),
  ]
}

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: 'block', marginBottom: 14 }}><span style={LABEL}>{label}</span>{children}</label>
}
function Titre({ t, s }: { t: string; s?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 800 }}>{t}</div>
      {s && <div style={{ fontSize: 13, ...MUTED, marginTop: 3, lineHeight: 1.5 }}>{s}</div>}
    </div>
  )
}

/* Codes visuels de la maquette « Parcours Pro Flowin » : cartes a halo,
   pastilles d etapes numerotees, tuiles QR, bloc d aide. */
export const PC_CSS = `.nop-carte{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;text-align:center;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
  .nop-carte:hover{transform:translateY(-4px);box-shadow:0 16px 34px rgba(28,16,36,.12);border-color:var(--acc)}
  .nop-carte .nop-filet{position:absolute;top:0;left:0;right:0;height:3px;background:var(--acc)}
  .nop-carte .nop-halo{width:72px;height:72px;border-radius:999px;background:var(--acc-tint);color:var(--acc);display:flex;align-items:center;justify-content:center;margin-bottom:18px;transition:background .18s ease,color .18s ease}
  .nop-carte:hover .nop-halo{background:var(--acc);color:#fff}
  .nop-carte .nop-cta{margin-top:20px;padding:10px 22px;border-radius:999px;background:var(--acc-tint);color:var(--acc);font-weight:800;font-size:13.5px;display:inline-flex;align-items:center;gap:6px;transition:background .18s ease,color .18s ease}
  .nop-carte .nop-spacer{flex:1}
  .nop-carte:hover .nop-cta{background:var(--acc);color:#fff}
  .nop-carte .nop-fleche{transition:transform .18s ease}
  .nop-carte:hover .nop-fleche{transform:translateX(3px)}
  .nop-carte.nop-actif{border-color:var(--acc);background:var(--acc-tint)}
  .pc-steps{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
  .pc-step{padding:8px 14px;border-radius:99px;font-size:12.5px;font-weight:800;color:${C.attenue};background:#fff;border:1.5px solid ${C.bordure};display:inline-flex;align-items:center;gap:6px;font-family:inherit;white-space:nowrap}
  .pc-step .n{width:18px;height:18px;border-radius:50%;background:${C.bordure};color:#fff;font-size:10px;display:inline-flex;align-items:center;justify-content:center}
  .pc-step.active{background:${C.accent};border-color:${C.accent};color:#fff}
  .pc-step.active .n{background:rgba(255,255,255,.3)}
  .pc-step.done{color:#16a34a;cursor:pointer}
  .pc-step.done .n{background:#16a34a}
  .pc-grille{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:26px;align-items:start}
  @media (max-width:1020px){.pc-grille{grid-template-columns:1fr}}
  .pc-qr{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
  @media (max-width:720px){.pc-qr{grid-template-columns:1fr}}
  .pc-qr-tuile{background:#fff;border:1.5px solid ${C.bordure};border-radius:16px;padding:16px;text-align:center}
  .pc-aide{display:flex;align-items:center;gap:14px;background:#fff;border:1.5px solid ${C.bordure};border-radius:16px;padding:16px 18px;margin-top:22px;flex-wrap:wrap}
  .pc-aide .ico{width:42px;height:42px;border-radius:12px;background:rgba(14,165,233,.1);color:#0EA5E9;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .pc-aide .btns{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap}
  .pc-aide .ab{padding:10px 16px;border-radius:50px;font-size:12.5px;font-weight:800;text-decoration:none;font-family:inherit;border:none;cursor:pointer}
  .pc-aide .ab.appel{background:#dcfce7;color:#166534}
  .pc-aide .ab.msg{background:rgba(37,99,235,.1);color:${C.accent}}
  .pc-ligne-pro{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:#fff;border:1.5px solid ${C.bordure};border-radius:14px;padding:11px 14px;margin-bottom:8px;cursor:pointer;font-family:inherit;color:${C.texte}}
  .pc-ligne-pro.sel{border-color:${ACCENT_SUPER};background:${ACCENT_SUPER}10}`

/** Pastilles d etapes numerotees de la maquette. */
export function PastillesEtapes({ etapes, courante, onAller }: { etapes: string[]; courante: number; onAller?: (i: number) => void }) {
  return (
    <div className="pc-steps">
      {etapes.map((e, i) => {
        const etat = i === courante ? ' active' : i < courante ? ' done' : ''
        return (
          <button key={e} type="button" className={`pc-step${etat}`} disabled={i >= courante || !onAller} onClick={() => onAller?.(i)}>
            <span className="n">{i < courante ? <Ico k="check" size={10} /> : i + 1}</span>{e}
          </button>
        )
      })}
    </div>
  )
}

/** Bloc « Besoin d'aide ? » de la maquette — seuls contacts reels du fichier. */
export function BlocAide() {
  return (
    <div className="pc-aide">
      <span className="ico"><Ico k="phone" size={20} /></span>
      <span><b style={{ display: 'block', fontSize: 13.5 }}>Besoin d’aide ?</b><span style={{ fontSize: 12, ...MUTED }}>Un conseiller Flowin vous répond directement</span></span>
      <span className="btns">
        <a className="ab msg" href={`mailto:${MAIL_FLOWIN}`}>Message</a>
        <a className="ab appel" href={`tel:${TEL_FLOWIN.replace(/\s/g, '')}`}>Appeler le {TEL_FLOWIN}</a>
      </span>
    </div>
  )
}

export default function ParcoursCreation({ mode = 'pro', pro, banques, supers, packs, typeInitial, seInitial, prefill, prosCatalogue = [], onChangerPro }: {
  mode?: ModeParcours
  /** Le pro concerne. Peut etre absent seulement pour un super event cree par le SA. */
  pro: ProNouvelle | null
  banques: Banque[]
  supers: SuperOuvert[]
  packs: PackParticipation[]
  typeInitial?: TypeOp | null
  seInitial?: string | null
  prefill?: { nom?: string; dateD?: string; dateF?: string; module?: string }
  /** CRM pro : participants d un super event (SA). */
  prosCatalogue?: ProCatalogue[]
  /** SA : revenir au choix du pro. */
  onChangerPro?: () => void
}) {
  const sa = mode === 'sa'
  const p = pro ?? PRO_VIDE
  const [type, setType] = useState<TypeOp | null>(typeInitial ?? null)
  const [etape, setEtape] = useState(typeInitial && typeInitial !== 'demande' ? 1 : 0)
  const estSuper = type === 'super'
  const rejoindre = type === 'rejoindre'
  const ETAPE_PROS = 4
  const FIN = estSuper ? 5 : 4

  /* 1. L'animation / le super event */
  const [nom, setNom] = useState(prefill?.nom ?? '')
  const [dateD, setDateD] = useState(prefill?.dateD ?? '')
  const [dateF, setDateF] = useState(prefill?.dateF ?? '')
  const [seId, setSeId] = useState(seInitial ?? '')
  const [persona, setPersona] = useState<'commerce' | 'annonceur'>('commerce')
  const [nomCommerce, setNomCommerce] = useState(p.nom ?? '')
  const [categorie, setCategorie] = useState('')
  const [adresse, setAdresse] = useState(p.adresse ?? '')
  const [cp, setCp] = useState(p.code_postal ?? '')
  const [ville, setVille] = useState(p.ville ?? '')
  const [logoUrl, setLogoUrl] = useState('')
  const [uploadEnCours, setUploadEnCours] = useState(false)
  const [uploadErreur, setUploadErreur] = useState('')
  const se = supers.find(s => s.id === seId) ?? null

  /* 2. Jeu */
  const [module_, setModule] = useState<string | null>(prefill?.module && JEUX.some(j => j.m === prefill.module) ? prefill.module : null)
  const [cfgJeu, setCfgJeu] = useState<Record<string, unknown>>({})
  const [banqueId, setBanqueId] = useState<string | null>(null)
  const [bonusIds, setBonusIds] = useState<string[]>([])
  const [voieFlowin, setVoieFlowin] = useState(false)
  const [theme, setTheme] = useState('')
  const [contactNom, setContactNom] = useState(p.contact ?? '')
  const [contactTel, setContactTel] = useState(p.tel ?? '')
  const [contactEmail, setContactEmail] = useState(p.email ?? '')
  const [demandeFlowin, setDemandeFlowin] = useState<'' | 'ok' | 'echec'>('')
  const [panneauSuggestions, setPanneauSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<QuestionQuiz[]>(() => suggestionsExemples())
  const [banqueSuggeree, setBanqueSuggeree] = useState<Banque | null>(null)
  const [validationSuggestions, setValidationSuggestions] = useState<'' | 'enregistrement' | 'ok' | 'echec'>('')
  const jeu = JEUX.find(j => j.m === module_)
  const moduleActif = rejoindre ? (se?.module || GABARIT_MODULE) : module_

  /* 3. Lots */
  const [lots, setLots] = useState<Lot[]>([lotVide()])
  const [modeInstant, setModeInstant] = useState<'aleatoire' | 'tousLesX'>('aleatoire')
  const [probabilite, setProbabilite] = useState(15)
  const [everyX, setEveryX] = useState(10)
  const [lotsExistants, setLotsExistants] = useState<{ nom: string; valeur: number; conditions: string }[]>([])
  const [logoCommerce, setLogoCommerce] = useState<string | null>(null)

  /* 4. Participants (super event, SA) */
  const [participants, setParticipants] = useState<string[]>(pro?.id ? [pro.id] : [])
  const [recherchePro, setRecherchePro] = useState('')

  /* Diffusion */
  const [diffPhysique, setDiffPhysique] = useState(true)
  const [diffDigital, setDiffDigital] = useState(true)
  const [diffQr, setDiffQr] = useState(false)
  const [offre, setOffre] = useState('')
  const packsProposes = !sa && rejoindre && seId === 'se-nds-2026' ? packs : []
  const [packId, setPackId] = useState<string | null>(null)
  useEffect(() => { if (packsProposes.length && !packId) setPackId(packsProposes[0].id) }, [packsProposes, packId])

  /* Proposition de super event a Flowin (pro) */
  const [dNom, setDNom] = useState('')
  const [dDates, setDDates] = useState('')
  const [dDescription, setDDescription] = useState('')

  const [envoi, setEnvoi] = useState<'' | 'envoi' | 'echec'>('')
  const [erreur, setErreur] = useState('')
  const [fait, setFait] = useState<{ eventId: string | null; superId: string | null; info?: string } | null>(null)

  useEffect(() => {
    if (!p.id) return
    (async () => {
      const { data: evs } = await supabase.from('events').select('id').eq('pro_id', p.id)
      const ids = ((evs ?? []) as { id: string }[]).map(e => e.id)
      if (ids.length) {
        const { data } = await supabase.from('lots').select('titre,nom,valeur,valeur_euros,conditions').in('event_id', ids)
        const vus = new Set<string>()
        const l: { nom: string; valeur: number; conditions: string }[] = []
        ;((data ?? []) as { titre: string | null; nom: string | null; valeur: number | null; valeur_euros: number | null; conditions: string | null }[])
          .forEach(x => {
            const n = (x.titre || x.nom || '').trim()
            if (!n || vus.has(n.toLowerCase())) return
            vus.add(n.toLowerCase())
            l.push({ nom: n, valeur: Number(x.valeur_euros ?? x.valeur) || 0, conditions: x.conditions ?? '' })
          })
        setLotsExistants(l)
      }
      if (p.partenaire_id) {
        const { data } = await supabase.from('partenaires').select('image_url').eq('id', p.partenaire_id).maybeSingle()
        setLogoCommerce(((data as { image_url: string | null } | null)?.image_url) ?? null)
      }
    })()
  }, [p.id, p.partenaire_id])

  /* Rejoindre : le super event choisi donne le jeu et la periode par defaut. */
  useEffect(() => {
    if (!rejoindre || !se) return
    if (!dateD && se.date_d) setDateD(se.date_d)
    if (!dateF && se.date_f) setDateF(se.date_f)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seId, rejoindre])

  /* ── Regles de passage ─────────────────────────────────────────────── */
  const sansLots = rejoindre && persona === 'annonceur'
  const lotsNommes = lots.filter(l => l.nom.trim())
  const segmentsOk = ((cfgJeu.spinSegments as { label?: string }[]) ?? []).filter(x => (x.label ?? '').trim()).length >= 2
  const itemsOk = ((cfgJeu.voteItems as { nom?: string }[]) ?? []).filter(x => (x.nom ?? '').trim()).length >= 2
  const bloque: Record<number, string | null> = {
    1: rejoindre
      ? (!seId ? 'Choisissez le super event.'
        : !nomCommerce.trim() ? 'Indiquez le nom.'
        : !categorie ? 'Choisissez la catégorie.'
        : persona === 'commerce' && !adresse.trim() ? 'Indiquez l’adresse.'
        : !ville.trim() ? 'Indiquez la ville.' : null)
      : (!nom.trim() ? (estSuper ? 'Donnez un nom au super event.' : 'Donnez un nom à l’animation.')
        : estSuper && !dateD ? 'Indiquez la date de début.'
        : dateD && dateF && dateF < dateD ? 'La fin précède le début.' : null),
    2: rejoindre ? null
      : !module_ ? 'Choisissez un jeu.'
      : jeu?.banque && !banqueId && demandeFlowin !== 'ok' ? 'Choisissez une banque de questions, ou demandez-la à Flowin.'
      : module_ === 'spin' && !segmentsOk ? 'Ajoutez au moins deux segments.'
      : module_ === 'vote' && !itemsOk ? 'Ajoutez au moins deux éléments.' : null,
    3: sansLots ? null : !lotsNommes.length ? 'Ajoutez au moins un lot.' : null,
    [ETAPE_PROS]: null,
    [FIN]: packsProposes.length && !packId ? 'Choisissez un pack.' : null,
  }

  function aller(n: number) {
    if (n === 3 && module_ === 'spin') {
      /* Roue : un segment gagnant = un lot du meme nom. */
      const gagnants = ((cfgJeu.spinSegments as { label?: string; perdant?: boolean }[]) ?? []).filter(x => !x.perdant && (x.label ?? '').trim())
      setLots(ls => {
        const base = ls.filter(l => l.nom.trim())
        const noms = new Set(base.map(l => l.nom.trim().toLowerCase()))
        const ajout = gagnants.filter(g => !noms.has(g.label!.trim().toLowerCase())).map(g => ({ ...lotVide('instantane'), nom: g.label!.trim() }))
        const r = base.concat(ajout)
        return r.length ? r : ls
      })
    }
    if (n === 3 && sansLots) n = FIN
    setEtape(n)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const precedent = () => aller(etape === FIN && sansLots ? 2 : Math.max(etape - 1, 0))

  const majLot = (id: string, champ: keyof Lot, v: string | number) => setLots(ls => ls.map(l => (l.id === id ? { ...l, [champ]: v } : l)))

  const majSuggestion = (i: number, patch: Partial<QuestionQuiz>) => setSuggestions(qs => qs.map((q, qi) => (qi === i ? { ...q, ...patch } : q)))
  const majOptionSuggestion = (i: number, oi: number, v: string) => setSuggestions(qs => qs.map((q, qi) => (qi === i ? { ...q, options: q.options.map((o, oii) => (oii === oi ? v : o)) } : q)))
  const suggestionsCompletes = suggestions.every(s => s.texte.trim() && s.options.every(o => o.trim()))
  async function validerSuggestions() {
    setValidationSuggestions('enregistrement')
    const banque = banqueSuggeree ?? await creerBanque({ proId: p.id || 'flowin', nom: nom.trim() ? `Questions — ${nom.trim()}` : 'Questions suggérées', tags: ['quiz'] })
    if (!banque) { setValidationSuggestions('echec'); return }
    const ok = await enregistrerBanque(banque.id, suggestions, true)
    if (!ok) { setValidationSuggestions('echec'); return }
    setBanqueSuggeree(banque)
    setBanqueId(banque.id)
    setVoieFlowin(false)
    setValidationSuggestions('ok')
    setPanneauSuggestions(false)
  }
  const aUnInstant = !estSuper && !rejoindre && module_ !== 'spin' && lotsNommes.some(l => l.type === 'instantane')

  async function onFichierLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0]
    e.target.value = ''
    if (!fichier) return
    setUploadErreur(''); setUploadEnCours(true)
    const redim = await redimensionnerImage(fichier).catch(() => fichier)
    const res = await uploaderLogo(redim, `super-events/${slugSuperEvent(nom) || 'nouveau'}`)
    setUploadEnCours(false)
    if ('erreur' in res) { setUploadErreur(res.erreur); return }
    setLogoUrl(res.url)
  }

  /* ── Apercu ─────────────────────────────────────────────────────────── */
  const cfgContenu = useMemo(() => ({
    ...(module_ === 'spin' ? { spinSegments: cfgJeu.spinSegments ?? [] } : {}),
    ...(module_ === 'vote' ? { voteItems: cfgJeu.voteItems ?? [] } : {}),
    ...(jeu?.banque && banqueId ? { quizBanques: [banqueId] } : {}),
    ...(module_ === GABARIT_MODULE && bonusIds.length ? { bonusBanques: bonusIds } : {}),
  }), [module_, cfgJeu, jeu, banqueId, bonusIds])
  const saisie = useMemo(() => ({
    nom: rejoindre ? nomCommerce : nom,
    lots: lotsNommes.map(l => ({ nom: l.nom, quantite: l.quantite, valeur: l.valeur, conditions: l.conditions })),
    cfg: rejoindre ? undefined : { ...cfgContenu, ...(estSuper && logoUrl.trim() ? { logoUrl: logoUrl.trim() } : {}) },
  }), [rejoindre, nomCommerce, nom, lotsNommes, cfgContenu, estSuper, logoUrl])
  /* Station montree : celle du super event rejoint ; sinon la demo du module. */
  const stationApercu = rejoindre ? (se?.station ?? null) : null

  /* ── Envoi ──────────────────────────────────────────────────────────── */
  async function envoyer() {
    setEnvoi('envoi'); setErreur('')
    if (rejoindre) {
      const ligne = {
        pro_id: p.id, super_event_id: seId, persona,
        nom_commerce: nomCommerce.trim(), categorie,
        adresse: persona === 'commerce' ? adresse.trim() : null,
        code_postal: persona === 'commerce' ? (cp.trim() || null) : null, ville: ville.trim(),
        regle_jeu: persona === 'commerce' ? moduleActif : null,
        offre: offre.trim() || null,
        date_debut_souhaite: dateD || null, date_fin_souhaite: dateF || null,
        lots: persona === 'commerce' ? lotsNommes.map(l => ({ titre: l.nom.trim(), valeur_euros: Number(l.valeur) || 0, quantite: Number(l.quantite) || 1, conditions: l.conditions.trim() })) : [],
        pack_id: packId,
        diffusion_physique: diffPhysique, diffusion_digital: diffDigital, diffusion_qr_tracking: diffQr,
        statut: 'en_attente',
      }
      if (!sa) {
        const { error } = await supabase.from('demandes_rattachement_super_event').insert(ligne)
        if (error) { setEnvoi('echec'); setErreur(error.message); return }
        setFait({ eventId: null, superId: seId }); setEnvoi('')
        return
      }
      /* SA : rattachement direct. La demande est creee puis approuvee par la
         MEME fonction que l ecran Demandes de participation (station, jeu du
         super event, lots) -- un seul chemin de creation de station. */
      const coords = persona === 'commerce' ? await geocoderAdresse(ligne.adresse, ligne.code_postal, ligne.ville).catch(() => null) : null
      const { data: ins, error: eIns } = await supabasePublic.from('demandes_rattachement_super_event')
        .insert({ ...ligne, ...(coords ? { lat: coords.lat, lng: coords.lng } : {}) }).select('id').single()
      if (eIns || !ins) { setEnvoi('echec'); setErreur(eIns?.message ?? 'demande non enregistrée'); return }
      const { data, error } = await supabasePublic.rpc('approuver_demande_rattachement', { p_id: (ins as { id: number }).id })
      const r = (data ?? {}) as { ok?: boolean; erreur?: string; event_id?: string | null }
      if (error || !r.ok) {
        setEnvoi('echec')
        setErreur(`la demande est enregistrée mais le rattachement n’a pas abouti (${error?.message ?? r.erreur ?? 'erreur inconnue'}) : elle reste dans « Demandes de participation »`)
        return
      }
      setFait({ eventId: r.event_id ?? null, superId: seId }); setEnvoi('')
      return
    }

    if (estSuper) {
      const id = slugSuperEvent(nom)
      const cat = new Map(prosCatalogue.map(x => [x.id, x]))
      const r = await creerSuperEvent({
        id, nom: nom.trim(), dateD: dateD || null, dateF: dateF || null, description: null,
        geofenceM: null, tirageGlobal: true, logoUrl: logoUrl.trim() || null,
        module: module_ as string, cfgJeu: cfgContenu,
        pros: participants.map(pid => ({ pro_id: pid, nom: cat.get(pid)?.nom ?? (pid === p.id ? p.nom ?? pid : pid) })),
      })
      if (!r.ok) { setEnvoi('echec'); setErreur(r.erreur ?? ''); return }
      /* Lots du super event = lots du grand tirage (se_lots, lu par le tirage
         global et les pages /se). Une ligne par rang : quantite 3 = 3 rangs. */
      const lignes: { id: string; super_event_id: string; rang: number; valeur: number; libelle: string }[] = []
      lotsNommes.forEach(l => {
        for (let i = 0; i < Math.max(1, Number(l.quantite) || 1); i++) {
          const rang = lignes.length + 1
          lignes.push({ id: `${id}-lot-${rang}`, super_event_id: id, rang, valeur: Number(l.valeur) || 0, libelle: l.nom.trim() })
        }
      })
      let info = r.erreur
      if (lignes.length) {
        const { error } = await supabasePublic.from('se_lots').insert(lignes)
        if (error) info = `Super event créé, mais ses lots n’ont pas été enregistrés — ${error.message}`
      }
      setFait({ eventId: null, superId: id, info }); setEnvoi('')
      return
    }

    const r = await creerAnimation({
      proId: p.id, module: module_ as string, nom: nom.trim(), dateD: dateD || null, dateF: dateF || null,
      banqueId: jeu?.banque ? banqueId : null,
      cfgJeu: {
        ...(module_ === GABARIT_MODULE && bonusIds.length ? { bonusBanques: bonusIds } : {}),
        ...(module_ === 'spin' ? { spinSegments: cfgJeu.spinSegments ?? [] } : {}),
        ...(module_ === 'vote' ? { voteItems: cfgJeu.voteItems ?? [] } : {}),
      },
      lots: lotsNommes.map(l => ({
        nom: l.nom.trim(), quantite: Number(l.quantite) || 1, valeur: Number(l.valeur) || 0,
        type: module_ === 'spin' ? 'instantane' as const : l.type,
        conditions: l.conditions.trim(),
      })),
      regleRecompense: aUnInstant ? { mode: modeInstant, everyX, probabilite } : undefined,
      diffusionPhysique: diffPhysique, diffusionDigital: diffDigital, diffusionQrTracking: diffQr,
    })
    if (!r.ok) { setEnvoi('echec'); setErreur(r.error ?? ''); return }
    setFait({ eventId: r.eventId, superId: null }); setEnvoi('')
  }

  async function envoyerDemandeSuperEvent() {
    setEnvoi('envoi'); setErreur('')
    const r = await enregistrerDemandeSuperEvent({
      proId: p.id, proNom: p.nom ?? '', nom: dNom, dates: dDates, description: dDescription,
      contactNom, contactTel, contactEmail,
    })
    if (!r.ok) { setEnvoi('echec'); setErreur(r.error ?? ''); return }
    setFait({ eventId: null, superId: null }); setEnvoi('')
  }

  const q = `?pro=${encodeURIComponent(p.id)}`
  const btnSuivant = (n: number) => {
    const b = bloque[etape]
    return (
      <div style={{ marginTop: 22 }}>
        {b && <div style={{ fontSize: 12.5, color: '#B45309', fontWeight: 700, marginBottom: 10, textAlign: 'right' }}>{b}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <button style={BTN2} onClick={precedent}>← Précédent</button>
          <button style={{ ...BTN, opacity: b ? 0.45 : 1, cursor: b ? 'not-allowed' : 'pointer' }} disabled={!!b} onClick={() => aller(n)}>Suivant →</button>
        </div>
      </div>
    )
  }

  /* ── Ecran final ────────────────────────────────────────────────────── */
  if (fait) {
    if (type === 'demande') {
      return (
        <div style={{ maxWidth: 760 }}>
          <style dangerouslySetInnerHTML={{ __html: PC_CSS }} />
          <div style={{ ...CARD, textAlign: 'center', padding: 28 }}>
            <div style={{ width: 64, height: 64, borderRadius: 999, background: `${ACCENT_SUPER}17`, color: ACCENT_SUPER, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><Ico k="checkCircle" size={30} /></div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>Demande envoyée à Flowin</div>
            <div style={{ fontSize: 13.5, ...MUTED, marginTop: 6, lineHeight: 1.55 }}>
              L’équipe Flowin vous recontacte pour monter « {dNom.trim()} » avec vous. Une fois le super event créé, vous le rejoignez depuis cet écran.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 18 }}>
              <a style={{ ...BTN2, textDecoration: 'none' }} href={`/pro${q}`}>Mes opérations</a>
            </div>
          </div>
          <BlocAide />
        </div>
      )
    }
    const lien = fait.eventId && moduleActif ? `${BASE}/parcours/${moduleActif}?ev=${encodeURIComponent(fait.eventId)}` : ''
    const opCle = fait.eventId ? `ev:${fait.eventId}` : null
    const nomAffiche = rejoindre ? nomCommerce.trim() : nom.trim()
    const texte = [
      'Bonjour,', '',
      `Nous sommes heureux de vous inviter à jouer à « ${nomAffiche} »${dateD ? ` (${libelleDates(dateD, dateF || null)})` : ''} !`,
      lotsNommes.length ? `À gagner : ${lotsNommes.map(l => l.nom.trim()).join(', ')}.` : '',
      lien ? `Participez ici : ${lien}` : '', '', 'À très vite !',
    ].filter((x, i, a) => x !== '' || a[i - 1] !== '').join('\n')
    const titreFin = rejoindre ? (sa ? 'Station créée' : 'Demande envoyée') : estSuper ? 'Super event créé' : 'Animation créée'
    const sousTitreFin = rejoindre
      ? (sa ? `${nomCommerce.trim() || p.nom || 'Le pro'} est rattaché à ${se?.nom ?? 'l’opération'} : sa station est sur la carte.`
        : `Flowin valide votre participation à ${se?.nom ?? 'l’opération'} : votre station apparaîtra alors sur la carte.`)
      : estSuper ? `${participants.length} pro${participants.length > 1 ? 's' : ''} participant${participants.length > 1 ? 's' : ''}, ${lotsNommes.reduce((n, l) => n + Math.max(1, Number(l.quantite) || 1), 0)} lot(s) au grand tirage.`
      : sa ? `Animation créée pour ${p.nom ?? 'le pro'}.` : 'En attente de validation par Flowin avant mise en ligne.'
    return (
      <div style={{ maxWidth: 820 }}>
        <style dangerouslySetInnerHTML={{ __html: PC_CSS }} />
        <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
          <div style={{ background: `linear-gradient(180deg,${C.accent},${C.accentFonce})`, color: '#fff', padding: '26px 24px', position: 'relative', textAlign: 'center' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: C.filet }} />
            <div style={{ fontSize: 22, fontWeight: 800 }}>{titreFin}</div>
            <div style={{ fontSize: 13.5, opacity: 0.9, marginTop: 4 }}>{sousTitreFin}</div>
          </div>
          <div style={{ padding: 22 }}>
            {fait.info && <div style={{ fontSize: 13, color: '#B45309', fontWeight: 700, marginBottom: 14 }}>{fait.info}</div>}
            {estSuper && fait.superId && (
              <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                Les commerces le rejoignent depuis leur espace ou par ce lien :
                <div style={{ fontWeight: 800, wordBreak: 'break-all', color: C.accent }}>{BASE}/rejoindre/{fait.superId}</div>
              </div>
            )}
            {lien && (
              <>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Le jeu est en ligne : 3 QR, un par usage</div>
                <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 12, lineHeight: 1.5 }}>
                  Même jeu, une source différente sur chaque QR : les données (CRM, trafic) distinguent d’où viennent les joueurs.
                </div>
                <div className="pc-qr" style={{ marginBottom: 18 }}>
                  {[
                    { source: 'magasin', label: 'En magasin', sous: 'À imprimer, à afficher chez vous' },
                    { source: 'instagram', label: 'Réseaux sociaux', sous: 'Lien à partager sur vos posts et stories' },
                    { source: 'tracking', label: 'Tracking', sous: 'Pour mesurer un support précis (affiche, flyer…)' },
                  ].map(c => (
                    <div key={c.source} className="pc-qr-tuile">
                      <div style={{ fontSize: 13.5, fontWeight: 800 }}>{c.label}</div>
                      <div style={{ fontSize: 11.5, ...MUTED, margin: '3px 0 10px', lineHeight: 1.4 }}>{c.sous}</div>
                      <Diffusion compact url={`${lien}&source=${c.source}`} titre={`${nomAffiche} — ${c.label}`} sousTitre="Scannez pour jouer" />
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, margin: '18px 0 8px' }}>Le texte pour l’annoncer</div>
                <textarea readOnly value={texte} style={{ ...CHAMP, minHeight: 150, resize: 'vertical' }} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  <a style={{ ...BTN2, textDecoration: 'none' }} target="_blank" rel="noreferrer"
                    href={`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(nomAffiche)}&body=${encodeURIComponent(texte)}`}>Email</a>
                  <a style={{ ...BTN2, textDecoration: 'none' }} target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(texte)}`}>WhatsApp</a>
                  <button style={BTN2} onClick={() => navigator.clipboard?.writeText(texte)}>Copier (Instagram, SMS…)</button>
                </div>
              </>
            )}

            <BlocAide />

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>
              {sa ? (
                <>
                  {fait.superId && (estSuper || rejoindre) && <a style={{ ...BTN, textDecoration: 'none' }} href={`/dashboard/operations/${encodeURIComponent(fait.superId)}`}>Ouvrir le super event →</a>}
                  {!estSuper && !rejoindre && <a style={{ ...BTN, textDecoration: 'none' }} href="/dashboard/events">Voir les animations →</a>}
                  {p.id && <a style={{ ...BTN2, textDecoration: 'none' }} href={`/pro/historique${q}${opCle ? `&op=${encodeURIComponent(opCle)}` : ''}`}>Voir l’espace du pro</a>}
                </>
              ) : (
                <>
                  {opCle && <a style={{ ...BTN, textDecoration: 'none' }} href={`/pro/historique${q}&op=${encodeURIComponent(opCle)}`}>Ouvrir mon opération →</a>}
                  <a style={{ ...BTN2, textDecoration: 'none' }} href={`/pro${q}`}>Mes opérations</a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Etape 0 : que voulez-vous faire ? ──────────────────────────────── */
  if (!type || type === 'demande' || etape === 0) {
    /* Super event = orange, animation = bleu (lib/charte.ts). Memes cartes a
       halo des deux cotes ; seule la troisieme carte change selon les droits. */
    const cartes: { t: TypeOp; titre: string; texte: string; icone: string; accent: string; cta: string }[] = [
      { t: 'animation', titre: 'Créer une animation', texte: sa ? `Chez ${p.nom ?? 'ce pro'} : un jeu, ses lots, gain immédiat ou tirage au sort.` : 'Chez vous : un jeu, vos lots, gain immédiat ou tirage au sort.', icone: 'game', accent: ACCENT_ANIM, cta: 'Commencer' },
      { t: 'rejoindre', titre: sa ? 'Intégrer un super event' : 'Rejoindre un super event', texte: sa ? 'Le pro devient une station de l’opération, tout de suite : le jeu est déjà choisi, il apparaît sur la carte.' : 'Devenez une station d’un festival ou d’une opération de commerçants : le jeu est déjà choisi, vous apparaissez sur la carte.', icone: 'pin', accent: ACCENT_SUPER, cta: 'Voir la carte' },
      sa
        ? { t: 'super', titre: 'Créer un super event', texte: 'Festival, association, groupement : plusieurs commerces, un même jeu, un grand tirage au sort.', icone: 'sparkle', accent: ACCENT_SUPER, cta: 'Commencer' }
        : { t: 'demande', titre: 'Proposer un super event', texte: 'Vous organisez un festival ou une opération de commerçants ? Flowin la crée avec vous.', icone: 'handshake', accent: ACCENT_SUPER, cta: 'Demander à Flowin' },
    ]
    return (
      <div style={{ maxWidth: 1000 }}>
        <style dangerouslySetInnerHTML={{ __html: PC_CSS }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>Que voulez-vous faire ?</div>
            <div style={{ fontSize: 13.5, ...MUTED, marginTop: 4 }}>
              {sa ? <>Pour <b style={{ color: C.texte }}>{p.nom ?? 'ce pro'}</b> — exactement l’écran qu’il voit dans son espace.</> : 'Quatre étapes, avec à droite le jeu tel que vos clients le verront.'}
            </div>
          </div>
          {sa && onChangerPro && <button onClick={onChangerPro} style={{ ...BTN2, marginLeft: 'auto', padding: '9px 16px', fontSize: 13 }}>Changer de pro</button>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
          {cartes.map(c => (
            <button key={c.t} className={`nop-carte${type === c.t ? ' nop-actif' : ''}`}
              style={{ ...choix(false), padding: '34px 26px 28px', background: '#fff', ['--acc' as string]: c.accent, ['--acc-tint' as string]: `${c.accent}17` } as React.CSSProperties}
              onClick={() => { setType(c.t); setEtape(c.t === 'demande' ? 0 : 1); if (c.t === 'super' && module_ === 'spin') setModule(null) }}>
              <span className="nop-filet" />
              <div className="nop-halo"><Ico k={c.icone} size={32} /></div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{c.titre}</div>
              <div style={{ fontSize: 13, ...MUTED, marginTop: 8, lineHeight: 1.55, maxWidth: 260 }}>{c.texte}</div>
              <div className="nop-spacer" />
              <span className="nop-cta">{c.cta} <span className="nop-fleche">→</span></span>
            </button>
          ))}
        </div>
        {type === 'demande' && (
          <div style={{ ...CARD, marginTop: 22, border: `1.5px dashed ${C.or}`, background: 'linear-gradient(135deg,rgba(245,161,0,.06),rgba(14,165,233,.06))' }}>
            <Titre t="Proposer un super event à Flowin" s="Seul Flowin crée les super events. Décrivez votre projet : l’équipe vous recontacte et le monte avec vous." />
            <Champ label="Nom envisagé"><input style={CHAMP} value={dNom} onChange={e => setDNom(e.target.value)} placeholder="Ex. Fête des commerçants 2027" /></Champ>
            <Champ label="Période souhaitée"><input style={CHAMP} value={dDates} onChange={e => setDDates(e.target.value)} placeholder="Ex. du 12 au 20 juin 2027" /></Champ>
            <Champ label="Votre projet"><textarea style={{ ...CHAMP, minHeight: 84 }} value={dDescription} onChange={e => setDDescription(e.target.value)} placeholder="Le lieu, le nombre de commerces envisagés, le public…" /></Champ>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
              <Champ label="Personne à contacter"><input style={CHAMP} value={contactNom} onChange={e => setContactNom(e.target.value)} /></Champ>
              <Champ label="Téléphone"><input style={CHAMP} value={contactTel} onChange={e => setContactTel(e.target.value)} /></Champ>
              <Champ label="Email"><input style={CHAMP} value={contactEmail} onChange={e => setContactEmail(e.target.value)} /></Champ>
            </div>
            {envoi === 'echec' && <div style={{ fontSize: 13, color: '#B91C1C', fontWeight: 700, marginBottom: 10 }}>Demande non enregistrée{erreur ? ` — ${erreur}` : ''}. Appelez-nous ou réessayez.</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <button style={BTN2} onClick={() => setType(null)}>Annuler</button>
              <button style={{ ...BTN, opacity: dNom.trim() && contactNom.trim() && (contactTel.trim() || contactEmail.trim()) ? 1 : 0.45 }}
                disabled={!(dNom.trim() && contactNom.trim() && (contactTel.trim() || contactEmail.trim())) || envoi === 'envoi'}
                onClick={envoyerDemandeSuperEvent}>{envoi === 'envoi' ? 'Envoi…' : 'Envoyer ma demande à Flowin'}</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const titreParcours = rejoindre ? (sa ? 'Intégrer un super event' : 'Rejoindre un super event') : estSuper ? 'Créer un super event' : 'Créer une animation'
  const ETAPES = rejoindre
    ? ['Super event', 'Jeu', 'Lots', 'Diffusion & QR']
    : estSuper ? ['Super event', 'Jeu', 'Lots', 'Participants', 'Diffusion & QR']
    : ['Votre animation', 'Jeu', 'Lots', 'Diffusion & QR']
  const jeuxProposes = estSuper ? JEUX.filter(j => j.m !== 'spin') : JEUX
  const nonVide = (b: Banque) => (b.questions || []).length > 0
  const banquesQuizBase = banques.filter(b => !(b.tags || []).includes('bonus') && sorteBanque(b.questions) !== 'bonus' && (nonVide(b) || b.id === banqueId))
  const banquesQuizTout = banqueSuggeree && !banquesQuizBase.some(b => b.id === banqueSuggeree.id)
    ? banquesQuizBase.concat({ ...banqueSuggeree, questions: suggestions, statut: 'valide' })
    : banquesQuizBase
  const banquesQuiz = banquesQuizTout.filter(b => BANQUES_STATION_NDS.indexOf(b.id) < 0)
  const banquesQuizStation = banquesQuizTout.filter(b => BANQUES_STATION_NDS.indexOf(b.id) >= 0)
  const banquesBonus = banques.filter(b => nonVide(b) && (sorteBanque(b.questions) === 'bonus' || sorteBanque(b.questions) === 'mixte' || (b.tags || []).includes('bonus')))
  const lotPrincipal = lotsNommes[0] ?? null
  const accent = type === 'animation' ? ACCENT_ANIM : ACCENT_SUPER
  const prosFiltres = (() => {
    const t = recherchePro.trim().toLowerCase()
    const l = t ? prosCatalogue.filter(x => [x.nom, x.contact, x.ville, x.secteur].some(v => (v ?? '').toLowerCase().includes(t))) : prosCatalogue
    return l.slice().sort((a, b) => (a.nom ?? '').localeCompare(b.nom ?? '', 'fr'))
  })()
  const ligneBanque = (b: Banque) => (
    <button key={b.id} style={{ ...choix(banqueId === b.id), padding: '12px 14px' }}
      onClick={() => { setBanqueId(banqueId === b.id ? null : b.id); setVoieFlowin(false) }}>
      <b>{b.nom}</b> <span style={MUTED}>· {(b.questions || []).length} questions · {b.statut === 'valide' ? 'validée' : 'brouillon'}</span>
    </button>
  )

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: PC_CSS }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
        <span style={{ width: 38, height: 38, borderRadius: 999, background: `${accent}17`, color: accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ico k={type === 'animation' ? 'game' : rejoindre ? 'pin' : 'sparkle'} size={19} />
        </span>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{titreParcours}</div>
          {sa && p.id && <div style={{ fontSize: 12.5, ...MUTED }}>Pour {p.nom}</div>}
        </div>
        <button onClick={() => { setType(null); setEtape(0) }} style={{ marginLeft: 'auto', border: 'none', background: 'none', color: C.attenue, fontWeight: 700, cursor: 'pointer', fontSize: 12.5 }}>Changer de choix</button>
      </div>
      <div style={{ margin: '10px 0 20px' }}>
        <PastillesEtapes etapes={ETAPES} courante={etape - 1} onAller={i => aller(i + 1)} />
      </div>

      <div className="pc-grille">
        <div style={CARD}>

          {/* ── 1. L'ANIMATION / LE SUPER EVENT ── */}
          {etape === 1 && !rejoindre && (
            <>
              <Titre t={estSuper ? 'Le super event' : 'Votre animation'}
                s={estSuper ? 'Le nom que verront les joueurs et les commerces, et la période du jeu.' : 'Le nom que verront les clients et la période du jeu.'} />
              <Champ label={estSuper ? 'Nom du super event' : 'Nom de l’animation'}>
                <input style={CHAMP} value={nom} onChange={e => setNom(e.target.value)} placeholder={estSuper ? 'Ex. Fête des commerçants 2027' : 'Ex. Jeu d’été chez nous'} />
              </Champ>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Champ label="Du"><input style={CHAMP} type="date" value={dateD} onChange={e => { setDateD(e.target.value); if (dateF && e.target.value && dateF < e.target.value) setDateF(e.target.value) }} /></Champ>
                <Champ label="Au"><input style={CHAMP} type="date" value={dateF} min={dateD || undefined} onChange={e => setDateF(e.target.value)} /></Champ>
              </div>
              {estSuper ? (
                <Champ label="Logo du super event (facultatif)">
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    {logoUrl && <img src={logoUrl} alt="" style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 10, border: `1px solid ${C.bordure}`, background: '#fff' }} onError={() => setLogoUrl('')} />}
                    <span style={{ ...BTN2, padding: '9px 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                      <Ico k="upload" size={14} />{uploadEnCours ? 'Envoi…' : logoUrl ? 'Changer' : 'Choisir une image'}
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} disabled={uploadEnCours} onChange={onFichierLogo} />
                    </span>
                  </div>
                  {uploadErreur && <div style={{ fontSize: 12, color: '#B45309', fontWeight: 700, marginTop: 6 }}>{uploadErreur}</div>}
                  <div style={{ fontSize: 12, ...MUTED, marginTop: 6 }}>Il s’affiche en tête du jeu, sur toutes les stations.</div>
                </Champ>
              ) : (
                <div style={{ background: C.subtil, border: `1px solid ${C.bordure}`, borderRadius: 14, padding: '12px 14px', fontSize: 13 }}>
                  <div style={LABEL}>{sa ? 'Établissement du pro' : 'Votre établissement'}</div>
                  <b>{p.nom ?? '—'}</b>
                  <div style={MUTED}>{[p.adresse, [p.code_postal, p.ville].filter(Boolean).join(' ')].filter(Boolean).join(', ') || 'Adresse à compléter'}</div>
                  {!sa && <a href={`/pro/compte${q}`} style={{ fontSize: 12.5, fontWeight: 700, color: C.accent }}>Modifier mes coordonnées</a>}
                </div>
              )}
            </>
          )}

          {etape === 1 && rejoindre && (
            <>
              <Titre t="Quel super event ?" s="Choisissez l’opération : son jeu est déjà choisi par l’organisateur." />
              {supers.some(s => s.lat != null && s.lng != null) && (
                <div style={{ marginBottom: 14 }}>
                  <SuperEventMap
                    lieux={supers.map(s => ({ id: s.id, nom: s.nom, lat: s.lat ?? null, lng: s.lng ?? null, module: s.module, couleur: ACCENT_SUPER }))}
                    height={220}
                    onSelect={setSeId}
                  />
                </div>
              )}
              {supers.length === 0 && <div style={{ fontSize: 13, ...MUTED, marginBottom: 12 }}>Aucun super event ouvert aux inscriptions pour le moment.</div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10, marginBottom: 18 }}>
                {supers.map(s => {
                  const actif = seId === s.id
                  return (
                    <button key={s.id} type="button" className={`nop-carte${actif ? ' nop-actif' : ''}`}
                      style={{ ...choix(false), padding: '22px 18px 18px', background: '#fff', ['--acc' as string]: ACCENT_SUPER, ['--acc-tint' as string]: `${ACCENT_SUPER}17` } as React.CSSProperties}
                      onClick={() => setSeId(s.id)}>
                      <span className="nop-filet" />
                      <div className="nop-halo" style={{ width: 54, height: 54, marginBottom: 10 }}><IcoModule module={s.module || GABARIT_MODULE} size={24} /></div>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{s.nom}</div>
                      <div style={{ fontSize: 12.5, ...MUTED, marginTop: 3 }}>{libelleDates(s.date_d, s.date_f)}</div>
                      <div style={{ fontSize: 12.5, marginTop: 6, color: ACCENT_SUPER, fontWeight: 700 }}>{libelleModule(s.module || GABARIT_MODULE)}</div>
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {([['commerce', sa ? 'Il accueille une station de jeu' : 'J’accueille une station de jeu'], ['annonceur', sa ? 'Annonceur, sans station' : 'Je suis annonceur, sans station']] as const).map(([v, l]) => (
                  <button key={v} style={{ ...choix(persona === v), padding: '10px 14px', fontWeight: 700, fontSize: 13 }} onClick={() => setPersona(v)}>{l}</button>
                ))}
              </div>
              <Champ label={persona === 'commerce' ? 'Nom du commerce (affiché sur la carte)' : 'Nom de la structure'}>
                <input style={CHAMP} value={nomCommerce} onChange={e => setNomCommerce(e.target.value)} />
              </Champ>
              <Champ label={persona === 'commerce' ? 'Catégorie' : 'Secteur d’activité'}>
                <select style={CHAMP} value={categorie} onChange={e => setCategorie(e.target.value)}>
                  <option value="">— Choisir —</option>
                  {(persona === 'commerce' ? CATEGORIES : (SECTEURS_PRO as readonly string[])).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Champ>
              {persona === 'commerce' && (
                <Champ label="Adresse"><input style={CHAMP} value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="N°, rue" /></Champ>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: persona === 'commerce' ? '1fr 2fr' : '1fr', gap: 12 }}>
                {persona === 'commerce' && <Champ label="Code postal"><input style={CHAMP} value={cp} onChange={e => setCp(e.target.value)} /></Champ>}
                <Champ label="Ville"><input style={CHAMP} value={ville} onChange={e => setVille(e.target.value)} /></Champ>
              </div>
              {persona === 'commerce' && (
                <div style={{ fontSize: 12, ...MUTED, marginTop: -4, marginBottom: 12 }}>La station est placée sur la carte à partir de cette adresse.</div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Champ label="Participation du"><input style={CHAMP} type="date" value={dateD} onChange={e => setDateD(e.target.value)} /></Champ>
                <Champ label="Au"><input style={CHAMP} type="date" value={dateF} min={dateD || undefined} onChange={e => setDateF(e.target.value)} /></Champ>
              </div>
            </>
          )}
          {etape === 1 && btnSuivant(2)}

          {/* ── 2. JEU ── */}
          {etape === 2 && rejoindre && (
            <>
              <Titre t="Le jeu de l’opération" s="Choisi par l’organisateur : la station le propose, les gagnants sont tirés au sort." />
              <div style={{ ...choix(true), cursor: 'default', display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ width: 48, height: 48, borderRadius: 999, background: `${ACCENT_SUPER}17`, color: ACCENT_SUPER, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><IcoModule module={moduleActif || GABARIT_MODULE} size={22} /></span>
                <span><span style={{ display: 'block', fontSize: 17, fontWeight: 800 }}>{libelleModule(moduleActif)}</span><span style={{ fontSize: 13, ...MUTED }}>{se?.nom}</span></span>
              </div>
              <div style={{ fontSize: 12.5, ...MUTED, marginTop: 12 }}>Le jeu s’affiche à droite, tel que les clients le verront sur leur téléphone.</div>
            </>
          )}

          {etape === 2 && !rejoindre && (
            <>
              <Titre t="Quel jeu ?" s={estSuper ? 'Choisi une fois pour tout le super event : chaque station le propose. Tirage au sort uniquement.' : 'Touchez un jeu : il s’affiche à droite tel que les clients le verront.'} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, marginBottom: 18 }}>
                {jeuxProposes.map(g => (
                  <button key={g.m} style={{ ...choix(module_ === g.m), display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }} onClick={() => { if (module_ !== g.m) { setModule(g.m); setCfgJeu({}) } }}>
                    <span style={{ width: 40, height: 40, borderRadius: 999, background: module_ === g.m ? C.accent : `${C.accent}14`, color: module_ === g.m ? '#fff' : C.accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><IcoModule module={g.m} size={20} /></span>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>{g.t}</span>
                    <span style={{ fontSize: 12, ...MUTED }}>{g.s}</span>
                  </button>
                ))}
              </div>

              {(module_ === 'spin' || module_ === 'vote') && (
                <>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{module_ === 'spin' ? 'Les segments de la roue' : 'Les éléments soumis au vote'}</div>
                  <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 10 }}>
                    {module_ === 'spin' ? 'Un segment gagnant porte le nom du lot qu’il fait gagner ; cochez « perdant » pour les cases sans lot.' : 'Produits, plats, artistes… au moins deux.'}
                  </div>
                  <ConfigJeu module={module_} cfg={cfgJeu} onChange={setCfgJeu} />
                </>
              )}

              {jeu?.banque && (
                <>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>{sa ? 'Les questions' : 'Vos questions'}</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {banquesQuiz.map(ligneBanque)}
                    {banquesQuiz.length === 0 && <div style={{ fontSize: 13, ...MUTED }}>{sa ? 'Aucune banque de questions.' : 'Vous n’avez pas encore de banque de questions.'}</div>}
                    {banquesQuizStation.length > 0 && (
                      <details open={banquesQuizStation.some(b => b.id === banqueId)}>
                        <summary style={{ fontSize: 12.5, fontWeight: 700, cursor: 'pointer', ...MUTED, margin: '4px 0 8px' }}>Banques propres à une station NDS2026 ({banquesQuizStation.length})</summary>
                        <div style={{ display: 'grid', gap: 8 }}>{banquesQuizStation.map(ligneBanque)}</div>
                      </details>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                    <a href={sa ? '/dashboard/banques' : `/pro/banques/nouvelle${q}&tags=quiz&depuis=jeu`} target="_blank" rel="noreferrer" style={{ ...BTN2, textDecoration: 'none', padding: '9px 16px', fontSize: 13 }}>+ Créer une banque</a>
                    <button style={{ ...BTN2, padding: '9px 16px', fontSize: 13, ...(panneauSuggestions ? { borderColor: C.magenta } : {}) }} onClick={() => { setPanneauSuggestions(v => !v); setVoieFlowin(false) }}>3 questions suggérées, à adapter</button>
                    {!sa && <button style={{ ...BTN2, padding: '9px 16px', fontSize: 13, ...(voieFlowin ? { borderColor: C.magenta } : {}) }} onClick={() => { setVoieFlowin(true); setBanqueId(null); setPanneauSuggestions(false) }}>Je n’ai pas de questions : demander à Flowin</button>}
                  </div>

                  {panneauSuggestions && (
                    <div style={{ marginTop: 12, background: C.subtil, border: `1px solid ${C.bordure}`, borderRadius: 14, padding: 14 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 4 }}>3 questions suggérées</div>
                      <div style={{ fontSize: 12, ...MUTED, marginBottom: 12, lineHeight: 1.5 }}>
                        Des exemples à remplacer par de vraies questions. Modifiez l’intitulé et les 4 réponses, cochez la bonne, puis validez.
                      </div>
                      {suggestions.map((s, i) => (
                        <div key={s.id} style={{ border: `1.5px solid ${C.bordureChamp}`, borderRadius: 14, padding: 12, marginBottom: 10, background: '#fff' }}>
                          <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: C.attenue, marginBottom: 6 }}>Exemple {i + 1}/3 — à modifier</div>
                          <input style={CHAMP} value={s.texte} onChange={e => majSuggestion(i, { texte: e.target.value })} placeholder="Intitulé de la question" />
                          <div style={{ display: 'grid', gap: 7, marginTop: 8 }}>
                            {s.options.map((opt, oi) => (
                              <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input type="radio" name={`sugg-bonne-${s.id}`} checked={s.bonne === oi} onChange={() => majSuggestion(i, { bonne: oi })} title="Bonne réponse" />
                                <input style={{ ...CHAMP, flex: 1 }} value={opt} onChange={e => majOptionSuggestion(i, oi, e.target.value)} placeholder={`Réponse ${oi + 1}`} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <button style={{ ...BTN, padding: '11px 20px', fontSize: 14, opacity: suggestionsCompletes ? 1 : 0.45 }}
                          disabled={!suggestionsCompletes || validationSuggestions === 'enregistrement'}
                          onClick={validerSuggestions}>
                          {validationSuggestions === 'enregistrement' ? 'Enregistrement…' : 'Valider'}
                        </button>
                        {!suggestionsCompletes && <span style={{ fontSize: 12, color: '#B45309', fontWeight: 700 }}>Complétez l’intitulé et les 4 réponses des 3 questions.</span>}
                      </div>
                      {validationSuggestions === 'ok' && <div style={{ fontSize: 12.5, color: '#15803D', fontWeight: 700, marginTop: 8 }}>Questions enregistrées et sélectionnées pour ce jeu.</div>}
                      {validationSuggestions === 'echec' && <div style={{ fontSize: 12.5, color: '#B45309', fontWeight: 700, marginTop: 8 }}>Enregistrement impossible — réessayez.</div>}
                    </div>
                  )}

                  {voieFlowin && (
                    <div style={{ marginTop: 12, background: 'linear-gradient(135deg,rgba(245,161,0,.08),rgba(14,165,233,.08))', border: `1.5px dashed ${C.or}`, borderRadius: 14, padding: 14 }}>
                      <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 10, lineHeight: 1.5 }}>Dites-nous en quelques mots votre activité : Flowin vous propose un questionnaire prêt à l’emploi.</div>
                      <Champ label="Thème des questions"><textarea style={{ ...CHAMP, minHeight: 64 }} value={theme} onChange={e => setTheme(e.target.value)} placeholder="Ex. notre métier, l’histoire du quartier, nos produits…" /></Champ>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <Champ label="Personne à contacter"><input style={CHAMP} value={contactNom} onChange={e => setContactNom(e.target.value)} /></Champ>
                        <Champ label="Téléphone"><input style={CHAMP} value={contactTel} onChange={e => setContactTel(e.target.value)} /></Champ>
                      </div>
                      <Champ label="Email"><input style={CHAMP} value={contactEmail} onChange={e => setContactEmail(e.target.value)} /></Champ>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <button style={{ ...BTN, padding: '11px 20px', fontSize: 14, opacity: theme.trim() && contactNom.trim() && contactTel.trim() && contactEmail.trim() ? 1 : 0.45 }}
                          disabled={!(theme.trim() && contactNom.trim() && contactTel.trim() && contactEmail.trim())}
                          onClick={async () => {
                            const r = await enregistrerDemandeQuiz({ proId: p.id, proNom: p.nom ?? '', theme, contactNom, contactTel, contactEmail, animationNom: nom, jeu: jeu?.t, dateD: dateD || null, dateF: dateF || null })
                            setDemandeFlowin(r.ok ? 'ok' : 'echec')
                          }}>Envoyer ma demande à Flowin</button>
                        <a href={`tel:${TEL_FLOWIN.replace(/\s/g, '')}`} style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>ou appelez le {TEL_FLOWIN}</a>
                      </div>
                      {demandeFlowin === 'ok' && <div style={{ fontSize: 12.5, color: '#15803D', fontWeight: 700, marginTop: 8 }}>Demande envoyée : Flowin prépare votre questionnaire. Vous pouvez continuer.</div>}
                      {demandeFlowin === 'echec' && <div style={{ fontSize: 12.5, color: '#B45309', fontWeight: 700, marginTop: 8 }}>Demande non enregistrée : appelez-nous.</div>}
                    </div>
                  )}

                  {module_ === GABARIT_MODULE && (
                    <>
                      <div style={{ fontSize: 14, fontWeight: 800, margin: '18px 0 4px' }}>Questions bonus</div>
                      <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 8 }}>Le bonus rapporte un ticket de plus. Sans banque bonus, l’écran bonus n’apparaît pas.</div>
                      <div style={{ display: 'grid', gap: 8 }}>
                        {banquesBonus.map(b => {
                          const on = bonusIds.indexOf(b.id) >= 0
                          return (
                            <button key={b.id} style={{ ...choix(on), padding: '12px 14px' }} onClick={() => setBonusIds(ids => (on ? ids.filter(x => x !== b.id) : ids.concat(b.id)))}>
                              <b>{b.nom}</b> <span style={MUTED}>· {(b.questions || []).length} questions</span>
                            </button>
                          )
                        })}
                        {banquesBonus.length === 0 && <div style={{ fontSize: 13, ...MUTED }}>Aucune banque bonus.</div>}
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
          {etape === 2 && btnSuivant(3)}

          {/* ── 3. LOTS ── */}
          {etape === 3 && (
            <>
              <Titre t={estSuper ? 'Les lots du grand tirage' : sa ? 'Ses lots' : 'Vos lots'}
                s={estSuper ? 'Ce que le super event fait gagner. Chaque exemplaire est un rang du grand tirage au sort.'
                  : rejoindre ? 'Ce qui est mis en jeu dans la station. Les gagnants sont tirés au sort.'
                  : 'Une remise, un cadeau, une invitation : quantité, valeur et conditions. Gagné au tirage au sort, ou tout de suite.'} />
              {!estSuper && lotsExistants.filter(x => !lots.some(l => l.nom.trim().toLowerCase() === x.nom.toLowerCase())).length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={LABEL}>Reprendre un lot déjà créé</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {lotsExistants.filter(x => !lots.some(l => l.nom.trim().toLowerCase() === x.nom.toLowerCase())).map(x => (
                      <button key={x.nom} style={{ ...BTN2, padding: '7px 13px', fontSize: 12.5 }}
                        onClick={() => setLots(ls => ls.filter(l => l.nom.trim()).concat({ ...lotVide(module_ === 'spin' ? 'instantane' : 'tirage'), nom: x.nom, valeur: x.valeur, conditions: x.conditions }))}>
                        + {x.nom}{x.valeur ? ` · ${x.valeur} €` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {lots.map(l => (
                <div key={l.id} style={{ border: `1.5px solid ${C.bordureChamp}`, borderRadius: 16, padding: 14, marginBottom: 12, background: '#fff' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr) minmax(0,1fr) auto', gap: 10, alignItems: 'end' }}>
                    <Champ label="Lot"><input style={CHAMP} value={l.nom} onChange={e => majLot(l.id, 'nom', e.target.value)} placeholder="Ex. Café gourmand offert" /></Champ>
                    <Champ label="Quantité"><input style={CHAMP} type="number" min={1} value={l.quantite} onChange={e => majLot(l.id, 'quantite', Number(e.target.value))} /></Champ>
                    <Champ label="Valeur €"><input style={CHAMP} type="number" min={0} value={l.valeur} onChange={e => majLot(l.id, 'valeur', Number(e.target.value))} /></Champ>
                    <button aria-label="Retirer" disabled={lots.length < 2} onClick={() => setLots(ls => ls.filter(x => x.id !== l.id))}
                      style={{ ...BTN2, padding: '10px 12px', marginBottom: 14, opacity: lots.length < 2 ? 0.3 : 1, color: '#B91C1C', display: 'inline-flex' }}><Ico k="trash" size={15} /></button>
                  </div>
                  {!estSuper && !rejoindre && module_ !== 'spin' && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      {(['tirage', 'instantane'] as const).map(v => (
                        <button key={v} style={{ ...choix(l.type === v), flex: 1, padding: '9px 10px', textAlign: 'center', fontWeight: 700, fontSize: 13 }} onClick={() => majLot(l.id, 'type', v)}>
                          {v === 'tirage' ? 'Tirage au sort' : 'Gain immédiat'}
                        </button>
                      ))}
                    </div>
                  )}
                  {!estSuper && (
                    <Champ label="Conditions d’utilisation">
                      <input style={CHAMP} value={l.conditions} onChange={e => majLot(l.id, 'conditions', e.target.value)} placeholder="Ex. valable sur présentation du billet" />
                    </Champ>
                  )}
                </div>
              ))}
              <button style={BTN2} onClick={() => setLots(ls => ls.concat(lotVide(module_ === 'spin' ? 'instantane' : 'tirage')))}>+ Ajouter un lot</button>

              {aUnInstant && (
                <div style={{ marginTop: 16, background: C.subtil, border: `1px solid ${C.bordure}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Gain immédiat : quand le joueur gagne-t-il ?</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    {(['aleatoire', 'tousLesX'] as const).map(m => (
                      <button key={m} style={{ ...choix(modeInstant === m), flex: 1, padding: '9px 10px', textAlign: 'center', fontWeight: 700, fontSize: 13 }} onClick={() => setModeInstant(m)}>
                        {m === 'aleatoire' ? 'Au hasard' : '1 gagnant tous les X joueurs'}
                      </button>
                    ))}
                  </div>
                  {modeInstant === 'aleatoire'
                    ? <Champ label="Chances de gagner (%)"><input style={{ ...CHAMP, maxWidth: 140 }} type="number" min={1} max={100} value={probabilite} onChange={e => setProbabilite(Number(e.target.value))} /></Champ>
                    : <Champ label="Un gagnant tous les … joueurs"><input style={{ ...CHAMP, maxWidth: 140 }} type="number" min={2} value={everyX} onChange={e => setEveryX(Number(e.target.value))} /></Champ>}
                </div>
              )}

              {lotPrincipal && !estSuper && (
                <div style={{ marginTop: 22 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Le billet que recevra le gagnant</div>
                  <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 10 }}>Il le présente au commerce, qui le valide avec son code.</div>
                  <BilletApercu
                    commerce={(rejoindre ? nomCommerce : p.nom) || 'Votre commerce'}
                    adresse={[rejoindre ? adresse : p.adresse, rejoindre ? ville : p.ville].filter(Boolean).join(', ') || null}
                    logoCommerce={logoCommerce}
                    lot={lotPrincipal.nom.trim()} valeur={Number(lotPrincipal.valeur) || 0} conditions={lotPrincipal.conditions || null}
                    operation={rejoindre ? seId : null}
                    operationNom={rejoindre ? (se?.nom ?? null) : nom.trim() || null}
                    operationLogo={rejoindre ? (se?.logo_url ?? null) : null}
                  />
                </div>
              )}
            </>
          )}
          {etape === 3 && btnSuivant(estSuper ? ETAPE_PROS : FIN)}

          {/* ── 4. PARTICIPANTS (super event, SA) ── */}
          {estSuper && etape === ETAPE_PROS && (
            <>
              <Titre t="Les pros participants" s="Chaque pro coché reçoit sa station tout de suite, avec le jeu du super event. Vous pourrez en ajouter d’autres ensuite ; les commerces peuvent aussi demander à le rejoindre." />
              <input style={{ ...CHAMP, marginBottom: 10 }} value={recherchePro} onChange={e => setRecherchePro(e.target.value)} placeholder="Rechercher un pro (nom, contact, ville, secteur)…" />
              <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 10 }}>
                {participants.length === 0 ? 'Aucun pro sélectionné : le super event peut être créé vide.' : `${participants.length} pro${participants.length > 1 ? 's' : ''} sélectionné${participants.length > 1 ? 's' : ''}.`}
              </div>
              <div style={{ maxHeight: 460, overflowY: 'auto', paddingRight: 4 }}>
                {prosFiltres.map(x => {
                  const on = participants.indexOf(x.id) >= 0
                  return (
                    <button key={x.id} type="button" className={`pc-ligne-pro${on ? ' sel' : ''}`}
                      onClick={() => setParticipants(ps => (on ? ps.filter(i => i !== x.id) : ps.concat(x.id)))}>
                      <span style={{ width: 22, height: 22, borderRadius: 7, background: on ? ACCENT_SUPER : '#fff', border: on ? 'none' : `1.5px solid ${C.bordureChamp}`, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{on && <Ico k="check" size={13} />}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <b style={{ display: 'block', fontSize: 13.5 }}>{x.nom ?? x.id}</b>
                        <span style={{ fontSize: 12, ...MUTED }}>{[x.contact, x.ville, x.secteur].filter(Boolean).join(' · ') || '—'}</span>
                      </span>
                      <span style={{ fontSize: 12, ...MUTED, textAlign: 'right', flexShrink: 0 }}>{[x.tel, x.email].filter(Boolean).join(' · ')}</span>
                    </button>
                  )
                })}
                {prosFiltres.length === 0 && <div style={{ fontSize: 13, ...MUTED }}>Aucun pro ne correspond.</div>}
              </div>
            </>
          )}
          {estSuper && etape === ETAPE_PROS && btnSuivant(FIN)}

          {/* ── FIN. DIFFUSION & RECAP ── */}
          {etape === FIN && (
            <>
              <Titre t="Diffusion" s="Le QR et le lien du jeu sont créés automatiquement. Cochez ce que Flowin doit préparer en plus." />
              {!estSuper && [
                { v: diffPhysique, set: setDiffPhysique, t: 'QR code imprimé', s: 'Produit par Flowin, à afficher en magasin', i: 'shop' },
                { v: diffDigital, set: setDiffDigital, t: 'Lien pour les réseaux', s: 'À coller dans les posts, emails et messages', i: 'instagram' },
                { v: diffQr, set: setDiffQr, t: 'QR de suivi par support', s: 'Pour savoir d’où viennent les joueurs — préparé par Flowin', i: 'chart' },
              ].map(o => (
                <button key={o.t} style={{ ...choix(o.v), display: 'flex', gap: 12, alignItems: 'center', width: '100%', marginBottom: 8 }} onClick={() => o.set(!o.v)}>
                  <span style={{ width: 22, height: 22, borderRadius: 7, background: o.v ? C.degrade : '#fff', border: o.v ? 'none' : `1.5px solid ${C.bordureChamp}`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{o.v && <Ico k="check" size={13} />}</span>
                  <span style={{ color: C.accent, display: 'inline-flex' }}><Ico k={o.i} size={18} /></span>
                  <span><b style={{ display: 'block' }}>{o.t}</b><span style={{ fontSize: 12.5, ...MUTED }}>{o.s}</span></span>
                </button>
              ))}
              {estSuper && <div style={{ fontSize: 13, ...MUTED, lineHeight: 1.5 }}>Chaque station reçoit son QR de jeu à la création ; le lien d’inscription des commerces est donné à la fin.</div>}

              {rejoindre && !sa && (
                <Champ label="Un mot pour l’organisateur (facultatif)">
                  <textarea style={{ ...CHAMP, minHeight: 64 }} value={offre} onChange={e => setOffre(e.target.value)} />
                </Champ>
              )}

              {packsProposes.length > 0 && (
                <>
                  <div style={{ fontSize: 14, fontWeight: 800, margin: '14px 0 8px' }}>Votre participation</div>
                  {packsProposes.map(pk => (
                    <button key={pk.id} style={{ ...choix(packId === pk.id), width: '100%', marginBottom: 8 }} onClick={() => setPackId(pk.id)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                        <b>{pk.nom}</b><b>{pk.prix_ht.toLocaleString('fr-FR')} € HT</b>
                      </div>
                      {pk.sous_titre && <div style={{ fontSize: 12.5, ...MUTED }}>{pk.sous_titre}</div>}
                    </button>
                  ))}
                </>
              )}
              {rejoindre && !sa && !packsProposes.length && se?.frais_pro != null && (
                <div style={{ fontSize: 13, marginTop: 8 }}>Frais de participation : <b>{se.frais_pro} € HT</b></div>
              )}

              <div style={{ fontSize: 14, fontWeight: 800, margin: '20px 0 8px' }}>Récapitulatif</div>
              <div style={{ border: `1px solid ${C.bordure}`, borderRadius: 14, overflow: 'hidden' }}>
                {([
                  ['Opération', titreParcours],
                  ...(sa && p.id && !estSuper ? [['Pro', p.nom ?? p.id]] : []),
                  rejoindre ? ['Super event', se?.nom ?? '—'] : ['Nom', nom || '—'],
                  ...(rejoindre ? [['Nom affiché', nomCommerce || '—']] : []),
                  ...(estSuper ? [['Identifiant', slugSuperEvent(nom) || '—']] : []),
                  ['Dates', dateD ? libelleDates(dateD, dateF || null) : 'Non précisées'],
                  ['Jeu', libelleModule(moduleActif)],
                  ...(sansLots ? [] : [['Lots', lotsNommes.map(l => `${l.nom.trim()} × ${l.quantite}`).join(' · ') || '—']]),
                  ...(estSuper ? [['Pros participants', participants.length ? String(participants.length) : 'aucun pour l’instant']] : []),
                  ...(!estSuper ? [['Diffusion', [diffPhysique && 'QR imprimé', diffDigital && 'lien réseaux', diffQr && 'QR de suivi'].filter(Boolean).join(' · ') || 'Aucune']] : []),
                ] as string[][]).map(([k, v], i) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 14px', fontSize: 13.5, background: i % 2 ? '#fff' : C.subtil }}>
                    <span style={MUTED}>{k}</span><b style={{ textAlign: 'right' }}>{v}</b>
                  </div>
                ))}
              </div>

              {envoi === 'echec' && <div style={{ fontSize: 13, color: '#B91C1C', fontWeight: 700, marginTop: 12 }}>Enregistrement impossible{erreur ? ` — ${erreur.replace(/\.+$/, '')}` : ''}. Réessayez.</div>}
              {bloque[FIN] && <div style={{ fontSize: 12.5, color: '#B45309', fontWeight: 700, marginTop: 12, textAlign: 'right' }}>{bloque[FIN]}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 20 }}>
                <button style={BTN2} onClick={precedent}>← Précédent</button>
                <button style={{ ...BTN, opacity: envoi === 'envoi' || bloque[FIN] ? 0.5 : 1 }} disabled={envoi === 'envoi' || !!bloque[FIN]} onClick={envoyer}>
                  {envoi === 'envoi' ? 'Enregistrement…'
                    : rejoindre ? (sa ? 'Rattacher au super event' : 'Envoyer ma demande')
                    : estSuper ? 'Créer le super event'
                    : sa ? 'Créer l’animation' : 'Créer mon animation'}
                </button>
              </div>
            </>
          )}
        </div>

        <ApercuJeu module={moduleActif} eventId={stationApercu} saisie={saisie} titre="Aperçu en direct" />
      </div>
    </div>
  )
}
