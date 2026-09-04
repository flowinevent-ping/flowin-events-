'use client'

/**
 * APERCU — le gabarit marque blanche, rendu tel qu'il tourne.
 *
 * Romain, 03/09 : « on prend super events NDS 2026 comme support de reference
 * et realisons un template a partir de celui-ci "marque blanche" [...] les UX
 * et UI peuvent etre les memes que pour NDS 2026, tu peux simplement supprimer
 * le logo (laisse l'espace disponible) [...] Pour events le parcours est 100%
 * le meme a l'exception qu'il n'y a pas la carte de multistation jeux et la
 * carte partenaire. »
 *
 * D'OU VIENT CE QUI S'AFFICHE. De trois endroits, tous existants :
 *   - `NDS_CSS` + `NDS_CSS_APP` + `NDS_SPRITE` (lib/nds2026Design.ts) : la
 *     charte et les surcharges du parcours, aux memes octets.
 *   - le balisage des ecrans, releve dans app/parcours/nds2026/NDS2026Client.tsx.
 *   - `lib/gabarit.ts` pour ce qui depend de la portee.
 * Aucun ecran, aucune phrase, aucune couleur n'est invente ici.
 *
 * POURQUOI UN IFRAME. La charte NDS pose des regles sur `html`, `body` et
 * `:root`, et une douzaine de `@keyframes`. Les prefixer une par une pour les
 * confiner au dashboard, c'est les reecrire — donc s'en ecarter. L'iframe
 * donne un document a part : la feuille de style s'applique mot pour mot,
 * exactement comme sur le telephone du joueur, et ne peut rien repeindre du
 * dashboard.
 *
 * DEUX ECARTS, ASSUMES ET ECRITS A L'ECRAN. Le logo est retire, comme demande,
 * et sa place reste reservee. Le code ticket et les compteurs sont des
 * exemples : l'evenement n'existe pas encore.
 */

import { useMemo } from 'react'
import { NDS_CSS, NDS_CSS_APP, NDS_SPRITE } from '@/lib/nds2026Design'
/* La coque de l apercu voyage avec le composant : sans cet import, il sort sans
   telephone ni pastilles des qu il est pose hors du dashboard (l espace pro n a
   pas de layout chargeant app/dashboard/globals.css). */
import './apercu.css'

export type EcranApercu = 'onboard' | 'quiz' | 'resultats' | 'bonus' | 'inscription'

export const ECRANS_APERCU: { id: EcranApercu; label: string }[] = [
  { id: 'onboard', label: 'Accueil' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'resultats', label: 'Résultats' },
  { id: 'bonus', label: 'Bonus' },
  { id: 'inscription', label: 'Inscription' },
]

export interface BrouillonApercu {
  nom?: string
  /** Nom de l'operation, affiche en sous-titre du quiz. */
  superEvent?: string | null
  /** true = super event : les blocs multi-stations et partenaires existent. */
  multistation?: boolean
  /** Les lots saisis — les deux premiers occupent la carte « À gagner ». */
  lots?: { nom?: string; quantite?: number; valeur?: number }[]
  /** Nombre de questions quiz disponibles dans les banques cochees. */
  nbQuestions?: number
  /** Nombre de questions bonus disponibles dans les banques bonus cochees. */
  nbBonus?: number
  /** Nombre de stations de l'operation, pour la ligne « autres stations ». */
  nbStations?: number
  /** Nombre de pros rattaches, pour la carte partenaires. */
  nbPartenaires?: number
  /** Texte d'accueil libre : remplace « Comment jouer ? » quand il est rempli. */
  intro?: string | null
  /** Logo affiche en tete. Vide ou absent : la place reste reservee. */
  logoUrl?: string | null
}

/* Le viewport reel du parcours (`.phone { max-width: 480px }`) et la place
   disponible dans la maquette de telephone. On met a l'echelle, on ne
   redessine pas : ce qui est vu ici est ce qui sera vu la-bas. */
const LARGEUR_REELLE = 480
const LARGEUR_ECRAN = 254
const HAUTEUR_ECRAN = 508
const ECHELLE = LARGEUR_ECRAN / LARGEUR_REELLE
const HAUTEUR_REELLE = Math.round(HAUTEUR_ECRAN / ECHELLE)

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

const ic = (id: string, style = '') =>
  `<svg class="ic"${style ? ` style="${style}"` : ''}><use href="#${id}"/></svg>`

/* ── ACCUEIL — NDS2026Client, `screen === 'onboard'`, etat non joue ───────── */
function ecranOnboard(d: BrouillonApercu): string {
  const lots = (d.lots ?? []).filter(l => (l.nom ?? '').trim())
  const l1 = lots[0]
  const l2 = lots[1]
  const sq = 'background:linear-gradient(135deg,#E0218A,#8E2E9E)'

  /* Les trois etapes de « Comment jouer ? ». La premiere parle de la carte des
     stations : elle n'a pas de sens pour une station seule, elle disparait. */
  const etapes = [
    d.multistation ? { i: 'i-map', t: 'Rends-toi à une station jeux', s: 'Sur la carte — festival et partenaires' } : null,
    { i: 'i-scan', t: 'Flash le QR code', s: 'À la station' },
    { i: 'i-help', t: 'Réponds au quizz', s: 'Et gagne des tickets' },
  ].filter(Boolean) as { i: string; t: string; s: string }[]

  const bloc = d.intro?.trim()
    ? `<div style="background:#faf7fd;border:1px solid #ece7f2;border-radius:16px;padding:16px 18px;margin-bottom:14px;font-size:14.5px;line-height:1.55;color:#1a1226;font-weight:600;box-shadow:0 8px 22px rgba(30,16,46,.10)">${esc(d.intro)}</div>`
    : `<div style="text-align:center;margin-bottom:8px;margin-top:2px">
         <div style="font-size:17px;font-weight:800;color:#1a1226">Comment jouer&#8239;?</div>
       </div>
       <div style="background:#faf7fd;border:1px solid #ece7f2;border-radius:16px;padding:13px 16px;margin-bottom:12px;box-shadow:0 8px 22px rgba(30,16,46,.10)">
         ${etapes.map(s => `
           <div style="display:flex;align-items:center;gap:11px;padding:7px 0">
             <span style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,var(--purple),var(--magenta));display:flex;align-items:center;justify-content:center;flex-shrink:0">${ic(s.i, 'width:17px;height:17px;color:#fff')}</span>
             <span style="font-size:13.5px;color:#52455e;line-height:1.3"><b style="color:#1a1226">${esc(s.t)}</b><br><span style="font-size:12.5px;opacity:.85">${esc(s.s)}</span></span>
           </div>`).join('')}
       </div>
       <div style="background:linear-gradient(90deg,rgba(34,211,198,.16),rgba(224,33,138,.16));border:1px solid #ece7f2;border-radius:14px;padding:11px 14px;margin-bottom:14px;color:#1a1226;text-align:center">
         <div style="display:flex;align-items:center;justify-content:center;gap:8px;font-weight:800;font-size:14.5px">
           ${ic('i-layers', 'width:18px;height:18px;color:var(--magenta);flex-shrink:0')}
           <span>+ Vous jouez, + vos chances augmentent</span>
         </div>
         ${d.multistation ? `
         <div style="font-size:12.5px;line-height:1.4;color:#52455e;margin-top:5px">
           Tes tickets se <b>cumulent d&rsquo;une station &agrave; l&rsquo;autre</b>${(d.nbStations ?? 0) > 1 ? ` : ${d.nbStations} stations &agrave; jouer` : ''}, <b>chacune = 1 ticket de plus</b>.
         </div>` : ''}
       </div>`

  /* L'emplacement du logo : rempli des qu'une operation ou une station en a un,
     laisse libre sinon — c'est ce que Romain demande du gabarit. */
  const logo = (d.logoUrl ?? '').trim()
    ? `<img class="hlogo" src="${esc(d.logoUrl)}" alt="">`
    : '<div class="gab-logo"><span>Emplacement du logo</span></div>'

  return `<section class="scr on">
    <div class="hero">
      ${logo}
      <div class="prize">
        <div class="lbl">À gagner</div>
        <div class="prow">
          <span class="sq" style="${sq}">${ic('i-ticket')}</span>
          <div><div class="nm">${esc(l1?.nom || 'Premier lot')}</div><div class="vl">${l1 ? esc([l1.valeur ? l1.valeur + ' €' : '', l1.quantite ? '×' + l1.quantite : ''].filter(Boolean).join(' · ')) : 'À saisir à l’étape Lots'}</div></div>
        </div>
        <div class="div"></div>
        <div class="prow">
          <span class="sq" style="${sq}">${ic('i-voucher')}</span>
          <div><div class="nm">${esc(l2?.nom || 'Deuxième lot')}</div><div class="vl">${l2 ? esc([l2.valeur ? l2.valeur + ' €' : '', l2.quantite ? '×' + l2.quantite : ''].filter(Boolean).join(' · ')) : 'À saisir à l’étape Lots'}</div></div>
        </div>
      </div>
    </div>
    <div class="stage">
      ${bloc}
      <a class="btn">Je joue maintenant</a>
      <div class="foot">En participant, tu acceptes notre politique de confidentialité.</div>
    </div>
  </section>`
}

/* ── QUIZ — NDS2026Client, `screen === 'quiz'` ────────────────────────────── */
function ecranQuiz(d: BrouillonApercu): string {
  const n = d.nbQuestions ?? 0
  const total = Math.min(n || 4, 4)
  const vide = n === 0
  return `<section class="scr purple on"><div class="pad">
    <div class="dhead">
      <div class="back">${ic('i-arrowl')}</div>
      <div style="flex:1"><div class="dtitle">${esc(d.nom || 'Nom de l’événement')}</div><div class="dsub">Quiz · 1 / ${total}</div></div>
    </div>
    <div class="progress">${Array.from({ length: total }).map((_, k) => `<div class="pstep${k === 0 ? ' on' : ''}"></div>`).join('')}</div>
    <div class="qcard">
      <div class="qtxt">${vide ? 'Aucune banque de questions cochée — le quiz n’aurait rien à poser.' : 'La question tirée dans les banques cochées s’affiche ici.'}</div>
      ${vide ? '' : ['Première réponse', 'Deuxième réponse', 'Troisième réponse', 'Quatrième réponse']
        .map((o, i) => `<button class="opt${i === 1 ? ' sel' : ''}">${o}</button>`).join('')}
    </div>
    ${vide ? '' : `<div class="preview">${n} question${n > 1 ? 's' : ''} disponible${n > 1 ? 's' : ''} · ${total} posée${total > 1 ? 's' : ''} au hasard</div>`}
  </div></section>`
}

/* ── RESULTATS — NDS2026Client, `screen === 'resultats'` ──────────────────── */
function ecranResultats(d: BrouillonApercu): string {
  const lots = (d.lots ?? []).filter(l => (l.nom ?? '').trim())
  const total = Math.min(d.nbQuestions || 4, 4)
  const bonus = (d.nbBonus ?? 0) > 0
  return `<section class="scr on" style="background:#fff">
    <div class="res-head">
      <div class="res-ico">${ic('i-trophy')}</div>
      <div class="res-bravo disp">Wow, super&#8239;!</div>
      <div class="res-sub">Continue comme ça et cumule tes tickets&#8239;!</div>
    </div>
    <div class="res-body">
      <div class="score-card">
        <div class="score disp">${total}/${total}</div>
        <div class="score-line">Sans faute — 1 ticket</div>
      </div>
      ${bonus ? `<a class="cta cta-bonus"><span class="cta-badge">${ic('i-spark')}</span><span class="cta-txt"><span class="cta-t">Rattrape ton ticket</span><span class="cta-sub">${d.nbBonus} question${(d.nbBonus ?? 0) > 1 ? 's' : ''} bonus</span></span><span class="cta-go">›</span></a>` : ''}
      <div class="infocard b-magenta">${ic('i-gift')}<div>Lot : <b>${esc(lots[0]?.nom || 'à saisir à l’étape Lots')}</b></div></div>
      <div class="infocard b-green">${ic('i-checkc')}<div>Participation enregistrée&#8239;!</div></div>
      ${d.multistation ? `
      <div class="infocard b-magenta" style="flex-direction:column;gap:4px">
        <div><b>Continue comme ça&#8239;!</b> Chaque action = +1 ticket :</div>
        <div style="font-size:13.5px;color:#52455e">• Va dans les autres stations &nbsp;• Réponds aux questions bonus &nbsp;• Parraine tes amis</div>
      </div>
      <a class="cta cta-shop"><span class="cta-badge">${ic('i-store')}</span><span class="cta-txt"><span class="cta-t">Cumule tes tickets en boutique</span><span class="cta-sub">+1 ticket par commerce</span></span><span class="cta-go">›</span></a>
      <a class="double">${ic('i-map')} Voir la carte des partenaires</a>` : ''}
      <a class="btn" style="margin-top:10px">Valider et recevoir mon ticket →</a>
    </div>
  </section>`
}

/* ── BONUS — NDS2026Client, `screen === 'bonus'` ──────────────────────────── */
function ecranBonus(d: BrouillonApercu): string {
  const n = d.nbBonus ?? 0
  if (!n) {
    return `<section class="scr purple on"><div class="pad">
      <div class="dhead"><div class="back">${ic('i-arrowl')}</div><div style="flex:1"><div class="dtitle">Bonus</div><div class="dsub">aucune banque bonus cochée</div></div></div>
      <div class="qcard"><div class="qtxt">Sans banque bonus, cet écran n’existe pas : le joueur passe des résultats directement à l’inscription.</div></div>
    </div></section>`
  }
  return `<section class="scr purple on"><div class="pad">
    <div class="dhead"><div class="back">${ic('i-arrowl')}</div><div style="flex:1"><div class="dtitle">Bonus</div><div class="dsub">1 / ${n} · double tes chances</div></div></div>
    <div class="qcard">
      <div class="qtxt">La question bonus tirée dans les banques cochées s’affiche ici.</div>
      ${['Premier choix', 'Deuxième choix', 'Troisième choix'].map((o, i) => `<button class="opt${i === 0 ? ' sel' : ''}">${o}</button>`).join('')}
    </div>
    <a class="btn">Terminer →</a>
  </div></section>`
}

/* ── INSCRIPTION — NDS2026Client, `screen === 'inscription'` ──────────────── */
function ecranInscription(d: BrouillonApercu): string {
  const champ = (l: string, v = '') =>
    `<div><label class="label">${l}</label><input class="input" value="${esc(v)}" readonly></div>`
  return `<section class="scr purple on"><div class="pad">
    <div class="dhead">
      <div class="back">${ic('i-arrowl')}</div>
      <div><div class="dtitle">Bravo, ton ticket est là&nbsp;!</div><div class="dsub">Plus que tes coordonnées pour le valider.</div></div>
    </div>
    <div class="winban">
      <div class="winban-r"><span class="winban-ic">${ic('i-ticket')}</span><span class="winban-t">Bravo&nbsp;! Ton ticket<br>est enregistré</span></div>
      <div class="winban-s">Laisse-nous tes coordonnées : <b>on te prévient si tu gagnes</b>.${d.multistation ? ' Et n’oublie pas — d’autres stations t’attendent, <b>chacune = 1 ticket de plus</b>.' : ''}</div>
    </div>
    <div class="grid2" style="margin-bottom:12px">${champ('Prénom')}${champ('Nom')}</div>
    <div style="margin-bottom:12px">${champ('Email')}</div>
    <div style="margin-bottom:12px">${champ('Téléphone')}</div>
    <div class="grid2" style="margin-bottom:12px">${champ('Sexe')}${champ('Tranche d’âge')}</div>
    <div style="margin-bottom:12px">${champ('Code postal')}</div>
    <div><label class="label label-strong">Tu as connu ${esc(d.superEvent || d.nom || 'l’événement')} par…</label>
      <div class="chips">${['Instagram', 'Affiche', 'Bouche à oreille', 'Autre'].map((s, i) => `<span class="chip${i === 0 ? ' sel' : ''}">${s}</span>`).join('')}</div>
    </div>
    <div class="rgpd rgpd-check"><span class="rc"></span><div>Je souhaite rester en contact avec les infos de l’opération et de Flowin. Mes coordonnées ne sont ni vendues ni cédées.</div></div>
    <a class="btn">Valider mon ticket →</a>
  </div></section>`
}

/* CE QUE LE GABARIT RETIRE A LA CHARTE NDS — et rien d'autre.
 *
 * Deux elements de la charte portent la marque du festival, pas le gabarit :
 * le logo (`<img class="hlogo" src="/nds/logo_nds_blanc_hd.png">`) et la photo
 * de scene posee en fond du bandeau d'accueil
 * (`.ndsbody .scr.on .hero { background: url(/nds/bg-stage.webp) }`). Les deux
 * sont neutralises ici. La place reste : le bandeau garde sa hauteur et son
 * fond sombre, pret a recevoir le visuel de l'operation.
 *
 * Le reste ne bouge pas : c'est ce qui fait que l'apercu ressemble a ce qui
 * tourne. On fige seulement la hauteur du document, l'apercu n'ayant pas a
 * defiler comme un vrai telephone.
 */
const CSS_GABARIT = `
  html,body{height:${HAUTEUR_REELLE}px !important;min-height:0 !important;overflow:hidden !important}
  .ndsbody,.ndsbody .phone{min-height:${HAUTEUR_REELLE}px !important;height:${HAUTEUR_REELLE}px !important}
  .ndsbody .scr{padding-bottom:24px !important;overflow-y:auto}
  .ndsbody .scr.on .hero{background:#190a25 !important;background-image:none !important}
  .ndsbody .scr.on .hero::before{background:none !important}
  .gab-logo{height:78px;margin-bottom:10px;border:1.5px dashed rgba(255,255,255,.26);border-radius:14px;
    display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.03)}
  .gab-logo span{font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.45)}
`

export default function ApercuApp({
  d, ecran = 'onboard', onEcran,
}: {
  d: BrouillonApercu
  ecran?: EcranApercu
  onEcran?: (e: EcranApercu) => void
}) {
  const doc = useMemo(() => {
    const corps =
      ecran === 'quiz' ? ecranQuiz(d)
        : ecran === 'resultats' ? ecranResultats(d)
          : ecran === 'bonus' ? ecranBonus(d)
            : ecran === 'inscription' ? ecranInscription(d)
              : ecranOnboard(d)
    return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap">
<style>${NDS_CSS}${NDS_CSS_APP}${CSS_GABARIT}</style>
</head><body><div class="ndsbody">
<div style="display:none">${NDS_SPRITE}</div>
<div class="phone">${corps}</div>
</div></body></html>`
  }, [d, ecran])

  return (
    <div className="sa-apercu">
      <div className="sa-apercu-tete">
        <span className="t">Aperçu du parcours joueur</span>
        <span className="d">
          Gabarit <b>Quiz + bonus</b> — {d.multistation ? 'super event, multi-stations' : 'event, station seule'}
        </span>
      </div>

      <div className="sa-tel">
        {/* Pas d'encoche : le parcours occupe toute la page, il n'a pas de
            barre d'etat a lui. En dessiner une masquerait son en-tete. */}
        <div className="sa-tel-ecran">
          <iframe
            className="sa-vp"
            title="Aperçu du parcours joueur"
            sandbox=""
            srcDoc={doc}
            style={{
              width: LARGEUR_REELLE, height: HAUTEUR_REELLE, border: 0,
              transform: `scale(${ECHELLE})`, transformOrigin: 'top left',
            }}
          />
        </div>
      </div>

      {onEcran && (
        <div className="sa-apercu-pas">
          {ECRANS_APERCU.map(e => (
            /* `sa-btn` n existe que dans le CSS du dashboard. La classe
               `sa-apercu-btn`, portee par apercu.css, voyage avec le composant :
               les pastilles restent des boutons dans l espace pro. */
            <button key={e.id} className={`sa-btn sm sa-apercu-btn${ecran === e.id ? ' primary actif' : ''}`} onClick={() => onEcran(e.id)}>
              {e.label}
            </button>
          ))}
        </div>
      )}

      <p className="sa-apercu-note">
        Charte et écrans repris de <b>NDS 2026</b>, aux mêmes octets — c’est le
        gabarit de référence. Le logo est retiré et sa place laissée libre.
        {d.multistation
          ? ' En super event, la carte des stations et la carte partenaires font partie du parcours.'
          : ' En event, la carte des stations et la carte partenaires n’existent pas : une station seule n’a rien à cumuler.'}
      </p>
    </div>
  )
}
