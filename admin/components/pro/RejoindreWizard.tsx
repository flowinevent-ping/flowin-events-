'use client'

/**
 * Rejoindre un super event — wizard 8 etapes, aligne sur le mockup valide en
 * session chat (persona commerce/annonceur, adresse+GPS, banque unique,
 * tirage au sort seul, packs de participation reels, diffusion, recap).
 * Remplace l'ancien formulaire une-page. Meme table demandes_rattachement_super_event
 * (colonnes persona/categorie/adresse/code_postal/ville/pack_id/diffusion_*
 * ajoutees), meme logique de validation manuelle SA en aval.
 *
 * Couleur orange/bleu volontairement DIFFERENTE du violet Pro (proPublicUI) :
 * un super event n'est pas une animation propre au pro, c'est une
 * participation a un evenement organise par quelqu'un d'autre — convention
 * deja etablie (orange reserve aux super events, cf REFONTE-SA-tonalite-graphique.md).
 */
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchBanquesPro, type Banque } from '@/lib/banques'
import { fetchPacksParticipation, type PackParticipation } from '@/lib/commercial'
import type { SuperEvent } from '@/lib/nds'
import { Ico } from '@/lib/proicons'
import { SECTEURS_PRO } from '@/lib/proCreation'
import ApercuApp, { type EcranApercu } from '@/components/dashboard/ApercuApp'

const ORANGE = '#C2410C'
const BLUE = '#2746A6'
const GREEN = '#0F9E73'
const ACCENT_D_LOCAL = '#7C2D92'

const CATEGORIES = ['Boulangerie', 'Restaurant', 'Bar · Café', 'Caviste', 'Fleuriste', 'Librairie', 'Épicerie fine', 'Mode', 'Beauté · Coiffure', 'Décoration', 'Autre']
/* 03/09 : reprend lib/proCreation.ts au lieu d'une liste locale — meme
   secteurs qu'a la creation du pro, confrontes aux valeurs reelles en base. */
const SECTEURS = SECTEURS_PRO

const input: React.CSSProperties = { width: '100%', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '11px 13px', fontSize: 14, fontFamily: 'inherit', marginBottom: 12 }
const label: React.CSSProperties = { fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }
const CARD: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 18, marginBottom: 14 }
const MUTED: React.CSSProperties = { color: '#64748B' }
const btnGhost: React.CSSProperties = { background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', color: '#0F172A' }

type Lot = { id: string; titre: string; valeur_euros: string; quantite: string; conditions: string }
const lotVide = (): Lot => ({ id: 'l' + Date.now(), titre: '', valeur_euros: '', quantite: '1', conditions: '' })

export default function RejoindreWizard({ proId, proNom, supers }: { proId: string; proNom: string; supers: SuperEvent[] }) {
  const [etape, setEtape] = useState(1)
  /* L APERCU DE L APP — Romain, 04/09 : « il faut la meme chose meme style pour
     integrer le super event ». Meme composant que le parcours SA et que
     « creer mon animation » : une seule visualisation du gabarit dans toute
     l app. Un commerce qui rejoint une operation est une STATION d un super
     event, donc multistation = true : la carte des stations et la carte
     partenaires font partie de ce qu il rejoint, et c est justement ce qu il
     doit voir avant de s engager. */
  const [ecranApercu, setEcranApercu] = useState<EcranApercu>('onboard')
  const [persona, setPersona] = useState<'commerce' | 'annonceur' | null>(null)
  const accent = persona === 'annonceur' ? GREEN : BLUE

  const [seId, setSeId] = useState('')
  const [nomCommerce, setNomCommerce] = useState('')
  const [categorie, setCategorie] = useState('')
  const [adresse, setAdresse] = useState('')
  const [codePostal, setCodePostal] = useState('')
  const [ville, setVille] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')

  const [banques, setBanques] = useState<Banque[]>([])
  const [lots, setLots] = useState<Lot[]>([lotVide()])

  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [offre, setOffre] = useState('')

  const [diffPhysique, setDiffPhysique] = useState(true)
  const [diffDigital, setDiffDigital] = useState(true)
  const [diffQr, setDiffQr] = useState(false)

  const [packs, setPacks] = useState<PackParticipation[]>([])
  const [packId, setPackId] = useState<string | null>(null)

  const [envoi, setEnvoi] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [erreur, setErreur] = useState('')

  useEffect(() => { fetchBanquesPro(proId).then(setBanques) }, [proId])
  useEffect(() => {
    fetchPacksParticipation().then(p => { setPacks(p); if (p.length && !packId) setPackId(p[0].id) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const seChoisi = supers.find(x => x.id === seId)
  const dApercu = {
    nom: nomCommerce || proNom,
    superEvent: seChoisi?.nom ?? null,
    multistation: true,
    /* Le lot du wizard porte `titre` / `valeur_euros` / `quantite` en TEXTE
       (champs de saisie). L apercu attend des nombres : on convertit ici, on ne
       change pas le type de saisie — un champ qui refuse une frappe en cours
       est pire qu une conversion a l affichage. */
    lots: lots.filter(l => l.titre.trim()).map(l => ({
      nom: l.titre,
      quantite: Number(l.quantite) || undefined,
      valeur: Number(l.valeur_euros) || undefined,
    })),
    logoUrl: seChoisi?.logo_url ?? null,
  }

  const banqueQuiz = banques.find(b => !(b.tags || []).includes('bonus'))
  const totalEtapes = 8
  const skip = (n: number) => persona === 'annonceur' && (n === 3 || n === 4)

  function suivant() { setEtape(e => { let n = e + 1; while (skip(n)) n++; return n }) }
  function precedent() { setEtape(e => { let n = e - 1; while (n > 1 && skip(n)) n--; return Math.max(1, n) }) }
  function ajouterLot() { setLots(l => [...l, lotVide()]) }
  function retirerLot(id: string) { setLots(l => l.length > 1 ? l.filter(x => x.id !== id) : l) }
  function majLot(id: string, champ: keyof Lot, v: string) { setLots(l => l.map(x => x.id === id ? { ...x, [champ]: v } : x)) }

  const step1Valide = !!persona
  const step2Valide = seId && (persona === 'annonceur' ? nomCommerce.trim() && categorie && ville.trim() : nomCommerce.trim() && categorie && adresse.trim() && ville.trim())

  async function envoyer() {
    setEnvoi('loading')
    setErreur('')
    const lotsPropres = persona === 'commerce'
      ? lots.filter(l => l.titre.trim()).map(l => ({ titre: l.titre, valeur_euros: Number(l.valeur_euros) || 0, quantite: Number(l.quantite) || 1, conditions: l.conditions }))
      : []
    const { error } = await supabase.from('demandes_rattachement_super_event').insert({
      pro_id: proId, super_event_id: seId,
      persona, categorie, adresse: persona === 'commerce' ? adresse : null,
      code_postal: persona === 'commerce' ? codePostal : null, ville,
      regle_jeu: persona === 'commerce' ? 'quiz' : null,
      offre, date_debut_souhaite: dateDebut || null, date_fin_souhaite: dateFin || null,
      lots: lotsPropres, pack_id: packId,
      diffusion_physique: diffPhysique, diffusion_digital: diffDigital, diffusion_qr_tracking: diffQr,
      lat: lat ? Number(lat) : null, lng: lng ? Number(lng) : null,
      statut: 'en_attente',
    })
    if (error) { setErreur(error.message); setEnvoi('error'); return }
    setEnvoi('ok')
  }

  if (envoi === 'ok') {
    return (
      <div style={CARD}>
        <div style={{ fontSize: 30, marginBottom: 8 }}>✅</div>
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>Demande envoyée</div>
        <p style={{ fontSize: 14, ...MUTED, lineHeight: 1.6 }}>L&apos;équipe Flowin va étudier votre participation et revient vers vous.</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ borderRadius: 18, padding: '18px 20px', color: '#fff', marginBottom: 18, background: `linear-gradient(135deg,#FF8A14,${ORANGE})` }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', opacity: 0.9 }}>REJOINDRE UN SUPER EVENT</div>
        <div style={{ fontSize: 20, fontWeight: 900, margin: '4px 0 2px' }}>Étape {etape} sur {totalEtapes}</div>
        <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
          {Array.from({ length: totalEtapes }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 5, borderRadius: 99, background: i < etape ? '#fff' : 'rgba(255,255,255,.3)' }} />
          ))}
        </div>
      </div>

      {/* Deux colonnes, meme grille que les parcours SA et que « creer mon
          animation » : la saisie a gauche, ce que le joueur verra a droite. */}
      <div className="sa-parc-avec-apercu">
      <div>

      {etape === 1 && (
        <div style={CARD}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Vous êtes…</div>
          <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 16 }}>Deux façons de participer à un super event.</div>
          <div
            onClick={() => setPersona('commerce')}
            style={{ border: persona === 'commerce' ? `2px solid ${BLUE}` : '1.5px solid #E2E8F0', background: persona === 'commerce' ? 'rgba(39,70,166,.05)' : '#fff', borderRadius: 14, padding: 16, cursor: 'pointer', marginBottom: 10 }}
          >
            <div style={{ fontWeight: 800, fontSize: 14.5 }}>Commerce participant</div>
            <div style={{ fontSize: 12, ...MUTED, marginBottom: 8 }}>Vous accueillez une station de jeu chez vous, vous offrez des lots.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Station jeu', 'Visibilité', 'Trafic', 'Contact'].map(b => (
                <span key={b} style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: 'rgba(39,70,166,.1)', color: BLUE }}>{b}</span>
              ))}
            </div>
          </div>
          <div
            onClick={() => setPersona('annonceur')}
            style={{ border: persona === 'annonceur' ? `2px solid ${GREEN}` : '1.5px solid #E2E8F0', background: persona === 'annonceur' ? 'rgba(15,158,115,.05)' : '#fff', borderRadius: 14, padding: 16, cursor: 'pointer' }}
          >
            <div style={{ fontWeight: 800, fontSize: 14.5 }}>Annonceur / sponsor</div>
            <div style={{ fontSize: 12, ...MUTED, marginBottom: 8 }}>Communiquer en local sans grand budget, sans tenir de station.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Audience locale', 'Impact', 'Choix de l\u2019event'].map(b => (
                <span key={b} style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: 'rgba(15,158,115,.1)', color: GREEN }}>{b}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button style={{ background: accent, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer', opacity: step1Valide ? 1 : 0.4 }} disabled={!step1Valide} onClick={suivant}>Suivant →</button>
          </div>
        </div>
      )}

      {etape === 2 && (
        <div style={CARD}>
          <label style={label}>Super event</label>
          <select style={input} value={seId} onChange={e => setSeId(e.target.value)}>
            <option value="">— Choisir —</option>
            {supers.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
          {supers.length === 0 && (
            <div style={{ fontSize: 11.5, color: '#B45309', marginTop: -8, marginBottom: 14 }}>Aucun super event disponible actuellement.</div>
          )}

          {persona === 'commerce' ? (
            <>
              <label style={label}>Nom du commerce</label>
              <input style={input} value={nomCommerce} onChange={e => setNomCommerce(e.target.value)} placeholder="Ex. Domaine de la Bergerie" />
              <label style={label}>Catégorie</label>
              <select style={input} value={categorie} onChange={e => setCategorie(e.target.value)}>
                <option value="">— Choisir —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <label style={label}>Adresse</label>
              <input style={input} value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="Ex. 12 place du Grand Jardin" />
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 110 }}><label style={label}>Code postal</label><input style={input} value={codePostal} onChange={e => setCodePostal(e.target.value)} placeholder="06140" /></div>
                <div style={{ flex: 2, minWidth: 140 }}><label style={label}>Ville</label><input style={input} value={ville} onChange={e => setVille(e.target.value)} placeholder="Vence" /></div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}><label style={label}>Latitude</label><input style={input} value={lat} onChange={e => setLat(e.target.value)} placeholder="43.7229" /></div>
                <div style={{ flex: 1 }}><label style={label}>Longitude</label><input style={input} value={lng} onChange={e => setLng(e.target.value)} placeholder="7.1138" /></div>
              </div>
              <div style={{ fontSize: 11, ...MUTED, marginTop: -8, marginBottom: 4 }}>Coordonnées trouvables sur Google Maps (clic droit sur l&apos;emplacement → copier les coordonnées).</div>
            </>
          ) : (
            <>
              <label style={label}>Nom de la structure</label>
              <input style={input} value={nomCommerce} onChange={e => setNomCommerce(e.target.value)} placeholder="Ex. Allianz Clarence Charvolin" />
              <label style={label}>Secteur d&apos;activité</label>
              <select style={input} value={categorie} onChange={e => setCategorie(e.target.value)}>
                <option value="">— Choisir —</option>
                {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <label style={label}>Ville</label>
              <input style={input} value={ville} onChange={e => setVille(e.target.value)} placeholder="Vence" />
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button style={btnGhost} onClick={precedent}>← Précédent</button>
            <button style={{ background: accent, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer', opacity: step2Valide ? 1 : 0.4 }} disabled={!step2Valide} onClick={suivant}>Suivant →</button>
          </div>
        </div>
      )}

      {etape === 3 && (
        <div style={CARD}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Votre banque de questions</div>
          <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 16 }}>Attribuée par Flowin à votre compte partenaire — pas de création ni de questions personnalisées sur les super events.</div>
          {banqueQuiz ? (
            <div style={{ border: `2px solid ${BLUE}`, background: 'rgba(39,70,166,.05)', borderRadius: 12, padding: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{banqueQuiz.nom}</div>
                <div style={{ fontSize: 11.5, ...MUTED }}>{(banqueQuiz.questions || []).length} questions</div>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: '#15803D' }}>VALIDÉE</span>
            </div>
          ) : (
            <div style={{ fontSize: 13, ...MUTED }}>Votre banque sera attribuée par l&apos;équipe Flowin.</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <button style={btnGhost} onClick={precedent}>← Précédent</button>
            <button style={{ background: accent, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }} onClick={suivant}>Suivant →</button>
          </div>
        </div>
      )}

      {etape === 4 && (
        <div style={CARD}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Quelle récompense ?</div>
          <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 16 }}>Tirage au sort uniquement sur les super events.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
            {lots.map(l => (
              <div key={l.id} style={{ border: '1.5px solid #E2E8F0', borderRadius: 12, padding: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 8 }}>
                  <div style={{ flex: 2, minWidth: 140 }}><label style={{ ...label, fontSize: 11 }}>Titre du lot</label><input style={{ ...input, marginBottom: 0 }} value={l.titre} onChange={e => majLot(l.id, 'titre', e.target.value)} placeholder="Ex. Bon d'achat 20€" /></div>
                  <div style={{ flex: 1, minWidth: 80 }}><label style={{ ...label, fontSize: 11 }}>Valeur €</label><input style={{ ...input, marginBottom: 0 }} value={l.valeur_euros} onChange={e => majLot(l.id, 'valeur_euros', e.target.value)} /></div>
                  <div style={{ flex: 1, minWidth: 70 }}><label style={{ ...label, fontSize: 11 }}>Qté</label><input style={{ ...input, marginBottom: 0 }} value={l.quantite} onChange={e => majLot(l.id, 'quantite', e.target.value)} /></div>
                  {lots.length > 1 && <button onClick={() => retirerLot(l.id)} style={{ background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 10, width: 40, height: 42, cursor: 'pointer', color: '#B91C1C', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>×</button>}
                </div>
                <label style={{ ...label, fontSize: 11 }}>Conditions du lot</label>
                <textarea style={{ ...input, minHeight: 54, resize: 'vertical', fontFamily: 'inherit', marginBottom: 0 }} value={l.conditions} onChange={e => majLot(l.id, 'conditions', e.target.value)} placeholder="Ex. Valable 1 exemplaire par client, sur présentation du billet" />
              </div>
            ))}
          </div>
          <button onClick={ajouterLot} style={{ ...btnGhost, fontSize: 12.5, padding: '9px 14px' }}>+ Ajouter un lot / sous-lot</button>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <button style={btnGhost} onClick={precedent}>← Précédent</button>
            <button style={{ background: accent, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }} onClick={suivant}>Suivant →</button>
          </div>
        </div>
      )}

      {etape === 5 && (
        <div style={CARD}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Dates et offre</div>
          <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 16 }}>Période souhaitée et description de votre participation.</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}><label style={label}>Date de début souhaitée</label><input style={input} type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} /></div>
            <div style={{ flex: 1 }}><label style={label}>Date de fin souhaitée</label><input style={input} type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} /></div>
          </div>
          <label style={label}>Votre offre (visibilité / animation / sponsor)</label>
          <textarea style={{ ...input, minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }} value={offre} onChange={e => setOffre(e.target.value)} placeholder="Décrivez ce que vous proposez" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button style={btnGhost} onClick={precedent}>← Précédent</button>
            <button style={{ background: accent, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }} onClick={suivant}>Suivant →</button>
          </div>
        </div>
      )}

      {etape === 6 && (
        <div style={CARD}>
          <div style={{ fontSize: 11, color: ACCENT_D_LOCAL, background: 'rgba(124,45,146,.06)', border: '1px solid rgba(124,45,146,.2)', borderRadius: 8, padding: '8px 10px', marginBottom: 12 }}>
            Catalogue réel (mêmes packs, mêmes prestations que les bons de commande NDS 2026) — modifiable côté SA sur /dashboard/nds-packs.
          </div>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Votre participation</div>
          <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 16 }}>Choisissez un pack.</div>
          {packs.map(p => (
            <div
              key={p.id}
              onClick={() => setPackId(p.id)}
              style={{ border: packId === p.id ? '2px solid #2563EB' : '1.5px solid #E2E8F0', background: packId === p.id ? 'rgba(37,99,235,.04)' : '#fff', borderRadius: 12, padding: 14, marginBottom: 10, cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <div style={{ fontWeight: 800, fontSize: 14.5 }}>{p.nom}{p.badge && <span style={{ fontSize: 9.5, fontWeight: 800, color: ORANGE, background: 'rgba(194,65,12,.1)', padding: '2px 6px', borderRadius: 99, marginLeft: 6 }}>{p.badge}</span>}</div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{p.prix_ht.toLocaleString('fr-FR')} € HT</div>
              </div>
              <div style={{ fontSize: 11.5, ...MUTED, marginBottom: 8 }}>{p.sous_titre}</div>
              <ul style={{ margin: '0 0 8px', paddingLeft: 18, fontSize: 12, color: '#334155' }}>
                {(p.inclusions || '').split('\n').filter(Boolean).map(line => <li key={line} style={{ marginBottom: 3 }}>{line}</li>)}
              </ul>
              {persona === 'commerce' && p.lot_valeur != null && (
                <div style={{ fontSize: 11.5, ...MUTED, fontWeight: 700 }}>Lot minimum à fournir : {p.lot_valeur} €</div>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button style={btnGhost} onClick={precedent}>← Précédent</button>
            <button style={{ background: accent, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer', opacity: packId ? 1 : 0.4 }} disabled={!packId} onClick={suivant}>Suivant →</button>
          </div>
        </div>
      )}

      {etape === 7 && (
        <div style={CARD}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Comment diffuser ?</div>
          <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 16 }}>Vous pouvez cocher plusieurs options.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
            {[
              { v: diffPhysique, set: setDiffPhysique, t: 'QR code physique', s: 'Généré par notre équipe — demande envoyée automatiquement' },
              { v: diffDigital, set: setDiffDigital, t: 'Lien digital', s: 'Un lien à usage unique, à insérer dans vos posts et réseaux' },
              { v: diffQr, set: setDiffQr, t: 'QR codes de tracking', s: 'Pour mesurer chaque support — demande envoyée à notre équipe' },
            ].map(o => (
              <label key={o.t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={o.v} onChange={e => o.set(e.target.checked)} style={{ marginTop: 3 }} />
                <div><div style={{ fontWeight: 700, fontSize: 13.5 }}>{o.t}</div><div style={{ fontSize: 11.5, ...MUTED }}>{o.s}</div></div>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <button style={btnGhost} onClick={precedent}>← Précédent</button>
            <button style={{ background: accent, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }} onClick={suivant}>Suivant →</button>
          </div>
        </div>
      )}

      {etape === 8 && (
        <div style={CARD}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Récapitulatif de votre demande</div>
          <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 16 }}>Soumise à validation de l&apos;équipe Flowin avant activation.</div>
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, marginBottom: 16 }}>
            {[
              ['Vous êtes', persona === 'commerce' ? 'Commerce participant' : 'Annonceur / sponsor'],
              ['Super event', supers.find(s => s.id === seId)?.nom ?? '— à choisir —'],
              ['Nom', nomCommerce || '—'],
              ...(persona === 'commerce' ? [['Lots', lots.filter(l => l.titre.trim()).map(l => `${l.titre} × ${l.quantite}`).join(', ') || '—']] : []),
              ['Pack', packs.find(p => p.id === packId) ? `${packs.find(p => p.id === packId)!.nom} — ${packs.find(p => p.id === packId)!.prix_ht.toLocaleString('fr-FR')} € HT` : '—'],
              ['Diffusion', [diffPhysique && 'QR physique', diffDigital && 'Lien digital', diffQr && 'QR tracking'].filter(Boolean).join(' · ') || 'Aucune'],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12.5, padding: '6px 0', borderBottom: '1px solid #E2E8F0' }}>
                <span style={MUTED}>{l}</span><span style={{ fontWeight: 700, textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>
          {erreur && <div style={{ background: '#FEECEC', color: '#B42318', borderRadius: 12, padding: '11px 14px', fontSize: 13.5, marginBottom: 14 }}>{erreur}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button style={btnGhost} onClick={precedent}>← Précédent</button>
            <button
              style={{ background: accent, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer', opacity: envoi === 'loading' ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 7 }}
              disabled={envoi === 'loading'} onClick={envoyer}
            >
              <Ico k="check" size={14} />{envoi === 'loading' ? 'Envoi…' : 'Envoyer ma demande'}
            </button>
          </div>
        </div>
      )}

      </div>
      <ApercuApp d={dApercu} ecran={ecranApercu} onEcran={setEcranApercu} />
      </div>
    </div>
  )
}
