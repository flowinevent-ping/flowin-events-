'use client'

/**
 * NOUVELLE OPERATION (P2 + P5, 16/09) — un seul parcours pour le pro.
 *
 *   0. Que voulez-vous faire ?  créer une animation · rejoindre un super event
 *                                · créer un super event
 *   1. Établissement            2. Jeu            3. Lots            4. Diffusion & récap
 *
 * A droite, toujours : le VRAI jeu tel que le verra le client (ApercuJeu),
 * mis a jour avec la saisie. A l etape Lots : le VRAI billet du gagnant
 * (BilletApercu). Charte de l application joueur (lib/proui.ts).
 *
 * Remplace CreerAnimationWizard et RejoindreWizard. Les ecritures sont
 * celles qui existaient : creerAnimation / creerSuperEventPro (lib/pro.ts),
 * demande de participation (demandes_rattachement_super_event), demande de
 * quiz a Flowin (enregistrerDemandeQuiz).
 */

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { creerAnimation, creerSuperEventPro, enregistrerDemandeQuiz } from '@/lib/pro'
import type { Banque } from '@/lib/banques'
import type { SuperEvent } from '@/lib/nds'
import type { PackParticipation } from '@/lib/commercial'
import { GABARIT_MODULE, GABARIT_NOM, sorteBanque } from '@/lib/gabarit'
import { libelleModule, libelleDates } from '@/lib/operations'
import { SECTEURS_PRO } from '@/lib/proCreation'
import { CHARTE_PRO as C, ACCENT_ANIM, ACCENT_SUPER } from '@/lib/charte'
import { CARD, CHAMP, LABEL, BTN, BTN2, MUTED, choix } from '@/lib/proui'
import { Ico } from '@/lib/proicons'
import ConfigJeu from '@/components/dashboard/ConfigJeu'
import BandeauEtapes from '@/components/parcours/BandeauEtapes'
import ApercuJeu from '@/components/parcours/ApercuJeu'
import BilletApercu from '@/components/parcours/BilletApercu'
import Diffusion from '@/components/dashboard/Diffusion'

type TypeOp = 'animation' | 'rejoindre' | 'super'
type Lot = { id: string; nom: string; quantite: number; valeur: number; type: 'tirage' | 'instantane'; conditions: string }

export interface ProNouvelle {
  id: string; nom: string | null; secteur: string | null; adresse: string | null
  code_postal: string | null; ville: string | null; email: string | null; tel: string | null
  contact: string | null; partenaire_id: string | null; statut: string | null
}
export interface SuperOuvert extends SuperEvent { frais_pro?: number | null; station?: string | null }

const JEUX: { m: string; t: string; s: string; banque: boolean }[] = [
  { m: GABARIT_MODULE, t: GABARIT_NOM, s: 'Le gabarit de référence — quiz, bonus, ticket', banque: true },
  { m: 'quiz', t: 'Quiz', s: 'Questions à choix multiple', banque: true },
  { m: 'spin', t: 'Roue de la fortune', s: 'Tirage instantané, segments = lots', banque: false },
  { m: 'tombola', t: 'Tombola', s: 'Inscription + grand tirage', banque: false },
  { m: 'vote', t: 'Vote', s: 'Vote produits / artistes', banque: false },
]
const CATEGORIES = ['Boulangerie', 'Restaurant', 'Bar · Café', 'Caviste', 'Fleuriste', 'Librairie', 'Épicerie fine', 'Mode', 'Beauté · Coiffure', 'Décoration', 'Autre']
const TEL_FLOWIN = '04 93 59 91 37'
const MAIL_FLOWIN = 'flowinevent@gmail.com'
const BASE = 'https://flowin-events.vercel.app'
const ETAPES = ['Établissement', 'Jeu', 'Lots', 'Diffusion & récap']
const lotVide = (type: Lot['type'] = 'tirage'): Lot => ({ id: 'l' + Math.random().toString(36).slice(2, 8), nom: '', quantite: 5, valeur: 0, type, conditions: '' })

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

export default function NouvelleOperation({ pro, banques, supers, packs, typeInitial, seInitial }: {
  pro: ProNouvelle
  banques: Banque[]
  supers: SuperOuvert[]
  packs: PackParticipation[]
  typeInitial?: TypeOp | null
  seInitial?: string | null
}) {
  const [type, setType] = useState<TypeOp | null>(typeInitial ?? null)
  const [etape, setEtape] = useState(typeInitial ? 1 : 0)
  const estSuper = type === 'super'
  const rejoindre = type === 'rejoindre'

  /* 1. Établissement */
  const [nom, setNom] = useState('')
  const [dateD, setDateD] = useState('')
  const [dateF, setDateF] = useState('')
  const [seId, setSeId] = useState(seInitial ?? '')
  const [persona, setPersona] = useState<'commerce' | 'annonceur'>('commerce')
  const [nomCommerce, setNomCommerce] = useState(pro.nom ?? '')
  const [categorie, setCategorie] = useState('')
  const [adresse, setAdresse] = useState(pro.adresse ?? '')
  const [cp, setCp] = useState(pro.code_postal ?? '')
  const [ville, setVille] = useState(pro.ville ?? '')
  const se = supers.find(s => s.id === seId) ?? null

  /* 2. Jeu */
  const [module_, setModule] = useState<string | null>(null)
  const [cfgJeu, setCfgJeu] = useState<Record<string, unknown>>({})
  const [banqueId, setBanqueId] = useState<string | null>(null)
  const [bonusIds, setBonusIds] = useState<string[]>([])
  const [voieFlowin, setVoieFlowin] = useState(false)
  const [theme, setTheme] = useState('')
  const [contactNom, setContactNom] = useState(pro.contact ?? '')
  const [contactTel, setContactTel] = useState(pro.tel ?? '')
  const [contactEmail, setContactEmail] = useState(pro.email ?? '')
  const [demandeFlowin, setDemandeFlowin] = useState<'' | 'ok' | 'echec'>('')
  const jeu = JEUX.find(j => j.m === module_)
  const moduleActif = rejoindre ? (se?.module || GABARIT_MODULE) : module_

  /* 3. Lots */
  const [lots, setLots] = useState<Lot[]>([lotVide()])
  const [modeInstant, setModeInstant] = useState<'aleatoire' | 'tousLesX'>('aleatoire')
  const [probabilite, setProbabilite] = useState(15)
  const [everyX, setEveryX] = useState(10)
  const [lotsExistants, setLotsExistants] = useState<{ nom: string; valeur: number; conditions: string }[]>([])
  const [logoCommerce, setLogoCommerce] = useState<string | null>(null)

  /* 4. Diffusion */
  const [diffPhysique, setDiffPhysique] = useState(true)
  const [diffDigital, setDiffDigital] = useState(true)
  const [diffQr, setDiffQr] = useState(false)
  const [offre, setOffre] = useState('')
  const packsProposes = rejoindre && seId === 'se-nds-2026' ? packs : []
  const [packId, setPackId] = useState<string | null>(null)
  useEffect(() => { if (packsProposes.length && !packId) setPackId(packsProposes[0].id) }, [packsProposes, packId])

  const [envoi, setEnvoi] = useState<'' | 'envoi' | 'echec'>('')
  const [erreur, setErreur] = useState('')
  const [fait, setFait] = useState<{ eventId: string | null; superId: string | null } | null>(null)

  useEffect(() => {
    (async () => {
      const { data: evs } = await supabase.from('events').select('id').eq('pro_id', pro.id)
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
      if (pro.partenaire_id) {
        const { data } = await supabase.from('partenaires').select('image_url').eq('id', pro.partenaire_id).maybeSingle()
        setLogoCommerce(((data as { image_url: string | null } | null)?.image_url) ?? null)
      }
    })()
  }, [pro.id, pro.partenaire_id])

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
    4: packsProposes.length && !packId ? 'Choisissez un pack.' : null,
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
    if (n === 3 && sansLots) n = 4
    setEtape(n)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const precedent = () => aller(etape === 4 && sansLots ? 2 : Math.max(etape - 1, 0))

  const majLot = (id: string, champ: keyof Lot, v: string | number) => setLots(ls => ls.map(l => (l.id === id ? { ...l, [champ]: v } : l)))
  const aUnInstant = !estSuper && !rejoindre && module_ !== 'spin' && lotsNommes.some(l => l.type === 'instantane')

  /* ── Apercu ─────────────────────────────────────────────────────────── */
  const saisie = useMemo(() => ({
    nom: rejoindre ? nomCommerce : nom,
    lots: lotsNommes.map(l => ({ nom: l.nom, quantite: l.quantite, valeur: l.valeur, conditions: l.conditions })),
    cfg: rejoindre ? undefined : {
      ...(module_ === 'spin' ? { spinSegments: cfgJeu.spinSegments ?? [] } : {}),
      ...(module_ === 'vote' ? { voteItems: cfgJeu.voteItems ?? [] } : {}),
      ...(jeu?.banque && banqueId ? { quizBanques: [banqueId] } : {}),
      ...(module_ === GABARIT_MODULE && bonusIds.length ? { bonusBanques: bonusIds } : {}),
    },
  }), [rejoindre, nomCommerce, nom, lotsNommes, module_, cfgJeu, jeu, banqueId, bonusIds])
  /* Station montree : celle du super event rejoint ; pour un super event cree
     sur le gabarit, une station du gabarit (carte multi-stations) ; sinon la demo. */
  const stationApercu = rejoindre ? (se?.station ?? null)
    : estSuper && module_ === GABARIT_MODULE ? 'ev-master-superevent-bar' : null

  /* ── Envoi ──────────────────────────────────────────────────────────── */
  async function envoyer() {
    setEnvoi('envoi'); setErreur('')
    if (rejoindre) {
      const { error } = await supabase.from('demandes_rattachement_super_event').insert({
        pro_id: pro.id, super_event_id: seId, persona,
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
      })
      if (error) { setEnvoi('echec'); setErreur(error.message); return }
      setFait({ eventId: null, superId: seId }); setEnvoi('')
      return
    }
    const params = {
      proId: pro.id, module: module_ as string, nom: nom.trim(), dateD: dateD || null, dateF: dateF || null,
      banqueId: jeu?.banque ? banqueId : null,
      cfgJeu: {
        ...(module_ === GABARIT_MODULE && bonusIds.length ? { bonusBanques: bonusIds } : {}),
        ...(module_ === 'spin' ? { spinSegments: cfgJeu.spinSegments ?? [] } : {}),
        ...(module_ === 'vote' ? { voteItems: cfgJeu.voteItems ?? [] } : {}),
      },
      lots: lotsNommes.map(l => ({
        nom: l.nom.trim(), quantite: Number(l.quantite) || 1, valeur: Number(l.valeur) || 0,
        type: estSuper ? 'tirage' as const : module_ === 'spin' ? 'instantane' as const : l.type,
        conditions: l.conditions.trim(),
      })),
      regleRecompense: aUnInstant ? { mode: modeInstant, everyX, probabilite } : undefined,
      diffusionPhysique: diffPhysique, diffusionDigital: diffDigital, diffusionQrTracking: diffQr,
    }
    if (estSuper) {
      const r = await creerSuperEventPro(params)
      if (!r.ok) { setEnvoi('echec'); setErreur(r.error ?? ''); return }
      setFait({ eventId: r.eventId, superId: r.superEventId })
    } else {
      const r = await creerAnimation(params)
      if (!r.ok) { setEnvoi('echec'); setErreur(r.error ?? ''); return }
      setFait({ eventId: r.eventId, superId: null })
    }
    setEnvoi('')
  }

  const q = `?pro=${encodeURIComponent(pro.id)}`
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
    const opCle = fait.superId && estSuper ? `se:${fait.superId}` : fait.eventId ? `ev:${fait.eventId}` : null
    const lien = fait.eventId && module_ ? `${BASE}/parcours/${module_}?ev=${encodeURIComponent(fait.eventId)}` : ''
    const texte = [
      'Bonjour,', '',
      `Nous sommes heureux de vous inviter à jouer à « ${nom.trim()} »${dateD ? ` (${libelleDates(dateD, dateF || null)})` : ''} !`,
      lotsNommes.length ? `À gagner : ${lotsNommes.map(l => l.nom.trim()).join(', ')}.` : '',
      lien ? `Participez ici : ${lien}` : '', '', 'À très vite !',
    ].filter((x, i, a) => x !== '' || a[i - 1] !== '').join('\n')
    return (
      <div style={{ maxWidth: 760 }}>
        <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
          <div style={{ background: `linear-gradient(180deg,${C.accent},${C.accentFonce})`, color: '#fff', padding: '26px 24px', position: 'relative', textAlign: 'center' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: C.filet }} />
            <div style={{ fontSize: 22, fontWeight: 800 }}>
              {rejoindre ? 'Demande envoyée' : estSuper ? 'Super event créé' : 'Animation créée'}
            </div>
            <div style={{ fontSize: 13.5, opacity: 0.9, marginTop: 4 }}>
              {rejoindre
                ? `Flowin valide votre participation à ${se?.nom ?? 'l’opération'} : votre station apparaîtra alors sur la carte.`
                : 'En attente de validation par Flowin avant mise en ligne.'}
            </div>
          </div>
          <div style={{ padding: 22 }}>
            {estSuper && fait.superId && (
              <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                Une fois validé, les commerces le rejoignent depuis leur espace ou par ce lien :
                <div style={{ fontWeight: 800, wordBreak: 'break-all', color: C.accent }}>{BASE}/rejoindre/{fait.superId}</div>
              </div>
            )}
            {!rejoindre && lien && (
              <>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Le QR de votre jeu</div>
                <Diffusion compact url={lien} titre={nom.trim()} sousTitre="Scannez pour jouer" />
                <div style={{ fontSize: 13, fontWeight: 800, margin: '18px 0 8px' }}>Le texte pour l’annoncer</div>
                <textarea readOnly value={texte} style={{ ...CHAMP, minHeight: 150, resize: 'vertical' }} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  <a style={{ ...BTN2, textDecoration: 'none' }} target="_blank" rel="noreferrer"
                    href={`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(nom.trim())}&body=${encodeURIComponent(texte)}`}>Email</a>
                  <a style={{ ...BTN2, textDecoration: 'none' }} target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(texte)}`}>WhatsApp</a>
                  <button style={BTN2} onClick={() => navigator.clipboard?.writeText(texte)}>Copier (Instagram, SMS…)</button>
                </div>
              </>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>
              {opCle && <a style={{ ...BTN, textDecoration: 'none' }} href={`/pro/operation${q}&op=${encodeURIComponent(opCle)}`}>Ouvrir mon opération →</a>}
              <a style={{ ...BTN2, textDecoration: 'none' }} href={`/pro${q}`}>Mes opérations</a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Etape 0 : le choix ─────────────────────────────────────────────── */
  if (!type || etape === 0) {
    /* Code couleur (lib/charte.ts, 18/09) : super event = orange, event/
       animation = bleu -- « rejoindre » ET « créer » un super event sont
       tous deux de la famille super event, meme accent.
       Pictogrammes + badge colore + liseré au survol : « moins plat, plus
       vivant » (Romain, 18/09), meme registre que la Vignette d'operation
       (components/pro/GrilleOperations.tsx) -- pas une esthetique inventee
       pour cet ecran seul. */
    const cartes: { t: TypeOp; titre: string; texte: string; icone: string; accent: string }[] = [
      { t: 'animation', titre: 'Créer une animation', texte: 'Chez vous : un jeu, vos lots, gain immédiat ou tirage au sort.', icone: 'game', accent: ACCENT_ANIM },
      { t: 'rejoindre', titre: 'Rejoindre un super event', texte: 'Devenez une station d’un festival ou d’une opération de commerçants : le jeu est déjà choisi, vous apparaissez sur la carte.', icone: 'handshake', accent: ACCENT_SUPER },
      { t: 'super', titre: 'Créer un super event', texte: 'Festival, association, franchise, groupement : plusieurs commerces, un même jeu, tirage au sort.', icone: 'sparkle', accent: ACCENT_SUPER },
    ]
    /* Deuxieme passe (18/09, retour sur premiere version) : « des pictos plus
       gros, pas obligé d'encadré, textes alignés, pictos centrés, esthétique
       plus léchée ». Halo rond (pas de tuile carrée) qui se remplit de la
       couleur au survol, contenu centre de bout en bout, CTA en vraie pastille
       plutot qu'un lien texte + fleche. */
    return (
      <div style={{ maxWidth: 980 }}>
        <style>{`.nop-carte{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;text-align:center;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
          .nop-carte:hover{transform:translateY(-4px);box-shadow:0 16px 34px rgba(28,16,36,.12);border-color:var(--acc)}
          .nop-carte .nop-filet{position:absolute;top:0;left:0;right:0;height:3px;background:var(--acc)}
          .nop-carte .nop-halo{width:72px;height:72px;border-radius:999px;background:var(--acc-tint);color:var(--acc);display:flex;align-items:center;justify-content:center;margin-bottom:18px;transition:background .18s ease,color .18s ease}
          .nop-carte:hover .nop-halo{background:var(--acc);color:#fff}
          .nop-carte .nop-cta{margin-top:20px;padding:10px 22px;border-radius:999px;background:var(--acc-tint);color:var(--acc);font-weight:800;font-size:13.5px;display:inline-flex;align-items:center;gap:6px;transition:background .18s ease,color .18s ease}
          .nop-carte:hover .nop-cta{background:var(--acc);color:#fff}
          .nop-carte .nop-fleche{transition:transform .18s ease}
          .nop-carte:hover .nop-fleche{transform:translateX(3px)}`}</style>
        <div style={{ fontSize: 24, fontWeight: 800 }}>Nouvelle opération</div>
        <div style={{ fontSize: 13.5, ...MUTED, margin: '4px 0 20px' }}>Quatre étapes, avec à droite le jeu tel que vos clients le verront.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
          {cartes.map(c => (
            <button key={c.t} className="nop-carte"
              style={{ ...choix(false), padding: '34px 26px 28px', background: '#fff', ['--acc' as string]: c.accent, ['--acc-tint' as string]: `${c.accent}17` } as React.CSSProperties}
              onClick={() => { setType(c.t); setEtape(1); if (c.t === 'super' && module_ === 'spin') setModule(null) }}>
              <span className="nop-filet" />
              <div className="nop-halo"><Ico k={c.icone} size={32} /></div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{c.titre}</div>
              <div style={{ fontSize: 13, ...MUTED, marginTop: 8, lineHeight: 1.55, maxWidth: 260 }}>{c.texte}</div>
              <span className="nop-cta">Commencer <span className="nop-fleche">→</span></span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const titreParcours = rejoindre ? 'Rejoindre un super event' : estSuper ? 'Créer un super event' : 'Créer une animation'
  const jeuxProposes = estSuper ? JEUX.filter(j => j.m !== 'spin') : JEUX
  const banquesQuiz = banques.filter(b => !(b.tags || []).includes('bonus') && sorteBanque(b.questions) !== 'bonus')
  const banquesBonus = banques.filter(b => sorteBanque(b.questions) === 'bonus' || sorteBanque(b.questions) === 'mixte' || (b.tags || []).includes('bonus'))
  const lotPrincipal = lotsNommes[0] ?? null

  return (
    <div>
      <BandeauEtapes titre={titreParcours} i={etape - 1} total={ETAPES.length} teinte={type === 'animation' ? 'event' : 'super'} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '-6px 0 18px' }}>
        {ETAPES.map((e, i) => {
          const n = i + 1
          const atteinte = n <= etape
          return (
            <button key={e} disabled={!atteinte || n === etape} onClick={() => aller(n)}
              style={{ border: 'none', borderRadius: 50, padding: '7px 14px', fontWeight: 800, fontSize: 12.5, cursor: atteinte ? 'pointer' : 'default',
                background: n === etape ? C.accent : atteinte ? '#fff' : 'transparent', color: n === etape ? '#fff' : atteinte ? C.accent : C.attenue,
                boxShadow: atteinte && n !== etape ? `inset 0 0 0 1.5px ${C.bordureChamp}` : 'none' }}>
              {n}. {e}
            </button>
          )
        })}
        <button onClick={() => { setType(null); setEtape(0) }} style={{ marginLeft: 'auto', border: 'none', background: 'none', color: C.attenue, fontWeight: 700, cursor: 'pointer', fontSize: 12.5 }}>Changer de type</button>
      </div>

      <div className="nop-grille">
        <style>{`.nop-grille{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:26px;align-items:start}
          @media (max-width:1020px){.nop-grille{grid-template-columns:1fr}}`}</style>
        <div style={CARD}>

          {/* ── 1. ÉTABLISSEMENT ── */}
          {etape === 1 && !rejoindre && (
            <>
              <Titre t={estSuper ? 'Votre super event' : 'Votre animation'}
                s={estSuper ? 'Le nom que verront les joueurs et les commerces, et la période du jeu.' : 'Le nom que verront vos clients et la période du jeu.'} />
              <Champ label={estSuper ? 'Nom du super event' : 'Nom de l’animation'}>
                <input style={CHAMP} value={nom} onChange={e => setNom(e.target.value)} placeholder={estSuper ? 'Ex. Fête des commerçants 2027' : 'Ex. Jeu d’été chez nous'} />
              </Champ>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Champ label="Du"><input style={CHAMP} type="date" value={dateD} onChange={e => { setDateD(e.target.value); if (dateF && e.target.value && dateF < e.target.value) setDateF(e.target.value) }} /></Champ>
                <Champ label="Au"><input style={CHAMP} type="date" value={dateF} min={dateD || undefined} onChange={e => setDateF(e.target.value)} /></Champ>
              </div>
              <div style={{ background: C.subtil, border: `1px solid ${C.bordure}`, borderRadius: 14, padding: '12px 14px', fontSize: 13 }}>
                <div style={LABEL}>{estSuper ? 'Organisateur' : 'Votre établissement'}</div>
                <b>{pro.nom ?? '—'}</b>
                <div style={MUTED}>{[pro.adresse, [pro.code_postal, pro.ville].filter(Boolean).join(' ')].filter(Boolean).join(', ') || 'Adresse à compléter'}</div>
                <a href={`/pro/compte${q}`} style={{ fontSize: 12.5, fontWeight: 700, color: C.accent }}>Modifier mes coordonnées</a>
              </div>
            </>
          )}

          {etape === 1 && rejoindre && (
            <>
              <Titre t="Quel super event ?" s="Choisissez l’opération : son jeu est déjà choisi par l’organisateur." />
              {supers.length === 0 && <div style={{ fontSize: 13, ...MUTED, marginBottom: 12 }}>Aucun super event ouvert aux inscriptions pour le moment.</div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10, marginBottom: 18 }}>
                {supers.map(s => (
                  <button key={s.id} style={choix(seId === s.id)} onClick={() => setSeId(s.id)}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{s.nom}</div>
                    <div style={{ fontSize: 12.5, ...MUTED, marginTop: 3 }}>{libelleDates(s.date_d, s.date_f)}</div>
                    <div style={{ fontSize: 12.5, marginTop: 6, color: C.accent, fontWeight: 700 }}>{libelleModule(s.module || GABARIT_MODULE)}</div>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {([['commerce', 'J’accueille une station de jeu'], ['annonceur', 'Je suis annonceur, sans station']] as const).map(([v, l]) => (
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
                <div style={{ fontSize: 12, ...MUTED, marginTop: -4, marginBottom: 12 }}>Flowin place votre station sur la carte à partir de cette adresse, à la validation.</div>
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
              <Titre t="Le jeu de l’opération" s="Choisi par l’organisateur : votre station le propose, les gagnants sont tirés au sort." />
              <div style={{ ...choix(true), cursor: 'default' }}>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{libelleModule(moduleActif)}</div>
                <div style={{ fontSize: 13, ...MUTED, marginTop: 4 }}>{se?.nom}</div>
              </div>
              <div style={{ fontSize: 12.5, ...MUTED, marginTop: 12 }}>Le jeu s’affiche à droite, tel que vos clients le verront sur leur téléphone.</div>
            </>
          )}

          {etape === 2 && !rejoindre && (
            <>
              <Titre t="Quel jeu ?" s={estSuper ? 'Choisi une fois pour tout le super event : chaque station le propose. Tirage au sort uniquement.' : 'Touchez un jeu : il s’affiche à droite tel que vos clients le verront.'} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, marginBottom: 18 }}>
                {jeuxProposes.map(g => (
                  <button key={g.m} style={choix(module_ === g.m)} onClick={() => { if (module_ !== g.m) { setModule(g.m); setCfgJeu({}) } }}>
                    <div style={{ fontWeight: 800, fontSize: 15, marginTop: 6 }}>{g.t}</div>
                    <div style={{ fontSize: 12, ...MUTED, marginTop: 3 }}>{g.s}</div>
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
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Vos questions</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {banquesQuiz.map(b => (
                      <button key={b.id} style={{ ...choix(banqueId === b.id), padding: '12px 14px' }}
                        onClick={() => { setBanqueId(banqueId === b.id ? null : b.id); setVoieFlowin(false) }}>
                        <b>{b.nom}</b> <span style={MUTED}>· {(b.questions || []).length} questions · {b.statut === 'valide' ? 'validée' : 'brouillon'}</span>
                      </button>
                    ))}
                    {banquesQuiz.length === 0 && <div style={{ fontSize: 13, ...MUTED }}>Vous n’avez pas encore de banque de questions.</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                    <a href={`/pro/banques/nouvelle${q}&tags=quiz&depuis=jeu`} target="_blank" rel="noreferrer" style={{ ...BTN2, textDecoration: 'none', padding: '9px 16px', fontSize: 13 }}>+ Créer une banque</a>
                    <button style={{ ...BTN2, padding: '9px 16px', fontSize: 13, ...(voieFlowin ? { borderColor: C.magenta } : {}) }} onClick={() => { setVoieFlowin(true); setBanqueId(null) }}>Demander à Flowin d’écrire le quiz</button>
                  </div>

                  {voieFlowin && (
                    <div style={{ marginTop: 12, background: C.subtil, border: `1px solid ${C.bordure}`, borderRadius: 14, padding: 14 }}>
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
                            const r = await enregistrerDemandeQuiz({ proId: pro.id, proNom: pro.nom ?? '', theme, contactNom, contactTel, contactEmail, animationNom: nom, jeu: jeu?.t, dateD: dateD || null, dateF: dateF || null })
                            setDemandeFlowin(r.ok ? 'ok' : 'echec')
                            window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${MAIL_FLOWIN}&su=${encodeURIComponent(`Demande de quiz — ${pro.nom ?? ''}`)}&body=${encodeURIComponent(`Bonjour,\n\n${pro.nom ?? ''} souhaite que l'équipe Flowin réalise les questions de « ${nom.trim()} ».\n\nThème : ${theme.trim()}\nContact : ${contactNom.trim()} · ${contactTel.trim()} · ${contactEmail.trim()}`)}`, '_blank', 'noopener')
                          }}>Envoyer la demande</button>
                        <a href={`tel:${TEL_FLOWIN.replace(/\s/g, '')}`} style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>ou appelez le {TEL_FLOWIN}</a>
                      </div>
                      {demandeFlowin === 'ok' && <div style={{ fontSize: 12.5, color: '#15803D', fontWeight: 700, marginTop: 8 }}>Demande enregistrée : vous pouvez continuer.</div>}
                      {demandeFlowin === 'echec' && <div style={{ fontSize: 12.5, color: '#B45309', fontWeight: 700, marginTop: 8 }}>Demande non enregistrée : envoyez le mail ou appelez-nous.</div>}
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
              <Titre t="Vos lots" s={estSuper || rejoindre ? 'Ce que vous mettez en jeu. Les gagnants sont tirés au sort.' : 'Une remise, un cadeau, une invitation : quantité, valeur et conditions. Gagné au tirage au sort, ou tout de suite.'} />
              {lotsExistants.filter(x => !lots.some(l => l.nom.trim().toLowerCase() === x.nom.toLowerCase())).length > 0 && (
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
                      style={{ ...BTN2, padding: '10px 14px', marginBottom: 14, opacity: lots.length < 2 ? 0.3 : 1, color: '#B91C1C' }}>×</button>
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
                  <Champ label="Conditions d’utilisation">
                    <input style={CHAMP} value={l.conditions} onChange={e => majLot(l.id, 'conditions', e.target.value)} placeholder="Ex. valable sur présentation du billet" />
                  </Champ>
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

              {lotPrincipal && (
                <div style={{ marginTop: 22 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Le billet que recevra le gagnant</div>
                  <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 10 }}>Il le présente chez vous ; vous le validez avec votre code.</div>
                  <BilletApercu
                    commerce={(rejoindre ? nomCommerce : pro.nom) || 'Votre commerce'}
                    adresse={[rejoindre ? adresse : pro.adresse, rejoindre ? ville : pro.ville].filter(Boolean).join(', ') || null}
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
          {etape === 3 && btnSuivant(4)}

          {/* ── 4. DIFFUSION & RECAP ── */}
          {etape === 4 && (
            <>
              <Titre t="Diffusion" s="Le QR et le lien de votre jeu sont créés automatiquement. Cochez ce que Flowin doit préparer en plus." />
              {[
                { v: diffPhysique, set: setDiffPhysique, t: 'QR code imprimé', s: 'Produit par Flowin, à afficher chez vous' },
                { v: diffDigital, set: setDiffDigital, t: 'Lien pour vos réseaux', s: 'À coller dans vos posts, emails et messages' },
                { v: diffQr, set: setDiffQr, t: 'QR de suivi par support', s: 'Pour savoir d’où viennent vos joueurs — préparé par Flowin' },
              ].map(o => (
                <button key={o.t} style={{ ...choix(o.v), display: 'flex', gap: 12, alignItems: 'center', width: '100%', marginBottom: 8 }} onClick={() => o.set(!o.v)}>
                  <span style={{ width: 22, height: 22, borderRadius: 7, background: o.v ? C.degrade : '#fff', border: o.v ? 'none' : `1.5px solid ${C.bordureChamp}`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>{o.v ? '✓' : ''}</span>
                  <span><b style={{ display: 'block' }}>{o.t}</b><span style={{ fontSize: 12.5, ...MUTED }}>{o.s}</span></span>
                </button>
              ))}

              {rejoindre && (
                <Champ label="Un mot pour l’organisateur (facultatif)">
                  <textarea style={{ ...CHAMP, minHeight: 64 }} value={offre} onChange={e => setOffre(e.target.value)} />
                </Champ>
              )}

              {packsProposes.length > 0 && (
                <>
                  <div style={{ fontSize: 14, fontWeight: 800, margin: '14px 0 8px' }}>Votre participation</div>
                  {packsProposes.map(p => (
                    <button key={p.id} style={{ ...choix(packId === p.id), width: '100%', marginBottom: 8 }} onClick={() => setPackId(p.id)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                        <b>{p.nom}</b><b>{p.prix_ht.toLocaleString('fr-FR')} € HT</b>
                      </div>
                      {p.sous_titre && <div style={{ fontSize: 12.5, ...MUTED }}>{p.sous_titre}</div>}
                    </button>
                  ))}
                </>
              )}
              {rejoindre && !packsProposes.length && se?.frais_pro != null && (
                <div style={{ fontSize: 13, marginTop: 8 }}>Frais de participation : <b>{se.frais_pro} € HT</b></div>
              )}

              <div style={{ fontSize: 14, fontWeight: 800, margin: '20px 0 8px' }}>Récapitulatif</div>
              <div style={{ border: `1px solid ${C.bordure}`, borderRadius: 14, overflow: 'hidden' }}>
                {([
                  ['Opération', titreParcours],
                  rejoindre ? ['Super event', se?.nom ?? '—'] : ['Nom', nom || '—'],
                  ...(rejoindre ? [['Nom affiché', nomCommerce || '—']] : []),
                  ['Dates', dateD ? libelleDates(dateD, dateF || null) : 'Non précisées'],
                  ['Jeu', libelleModule(moduleActif)],
                  ...(sansLots ? [] : [['Lots', lotsNommes.map(l => `${l.nom.trim()} × ${l.quantite}`).join(' · ') || '—']]),
                  ['Diffusion', [diffPhysique && 'QR imprimé', diffDigital && 'lien réseaux', diffQr && 'QR de suivi'].filter(Boolean).join(' · ') || 'Aucune'],
                ] as string[][]).map(([k, v], i) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 14px', fontSize: 13.5, background: i % 2 ? '#fff' : C.subtil }}>
                    <span style={MUTED}>{k}</span><b style={{ textAlign: 'right' }}>{v}</b>
                  </div>
                ))}
              </div>

              {envoi === 'echec' && <div style={{ fontSize: 13, color: '#B91C1C', fontWeight: 700, marginTop: 12 }}>Enregistrement impossible{erreur ? ` — ${erreur}` : ''}. Réessayez.</div>}
              {bloque[4] && <div style={{ fontSize: 12.5, color: '#B45309', fontWeight: 700, marginTop: 12, textAlign: 'right' }}>{bloque[4]}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 20 }}>
                <button style={BTN2} onClick={precedent}>← Précédent</button>
                <button style={{ ...BTN, opacity: envoi === 'envoi' || bloque[4] ? 0.5 : 1 }} disabled={envoi === 'envoi' || !!bloque[4]} onClick={envoyer}>
                  {envoi === 'envoi' ? 'Enregistrement…' : rejoindre ? 'Envoyer ma demande' : estSuper ? 'Créer le super event' : 'Créer mon animation'}
                </button>
              </div>
            </>
          )}
        </div>

        <ApercuJeu module={moduleActif} eventId={stationApercu} saisie={saisie} />
      </div>
    </div>
  )
}
