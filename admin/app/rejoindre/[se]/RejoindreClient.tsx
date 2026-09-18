'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { libelleModule } from '@/lib/operations'
import { CHARTE, POLICE_ADMIN } from '@/lib/charte'
import { Ico } from '@/lib/proicons'

type SE = { id: string; nom: string; description?: string | null; date_d?: string | null; date_f?: string | null; frais_pro?: number | null; module?: string | null }

const CATEGORIES: { nom: string; icone: string }[] = [
  { nom: 'Boulangerie', icone: 'gift' },
  { nom: 'Restaurant', icone: 'gift' },
  { nom: 'Bar · Café', icone: 'gift' },
  { nom: 'Caviste', icone: 'gift' },
  { nom: 'Fleuriste', icone: 'gift' },
  { nom: 'Librairie', icone: 'gift' },
  { nom: 'Épicerie fine', icone: 'gift' },
  { nom: 'Mode', icone: 'gift' },
  { nom: 'Beauté · Coiffure', icone: 'gift' },
  { nom: 'Décoration', icone: 'gift' },
  { nom: 'Autre', icone: 'more' },
]

/* Refonte complete (18/09), demande explicite de Romain : le formulaire long
   en une seule page etait « pas du tout dans le style de ce qu'on a fait pour
   le jeu » -- il veut la MEME fluidite que le parcours joueur NDS 2026 (un
   ecran a la fois, une barre de progression, des choix en vignette plutot que
   des listes deroulantes) et la meme qualite que l'espace pro. On reprend
   donc le vocabulaire visuel deja etabli par lib/parcours.ts (parcoursCSS :
   .progress/.opt/.card) plutot que d'en inventer un nouveau -- transpose en
   theme clair, teinte orange (deja la couleur « super event » etablie).
   Rien ne change cote donnees : meme etat `f`, meme appel Supabase. */
const ORANGE = '#C2410C'
const ORANGE2 = '#FF8A14'

const ETAPES = ['commerce', 'contact', 'lot', 'recap'] as const
type Etape = typeof ETAPES[number] | 'intro'

function slug(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28)
}

export default function RejoindreClient({ se }: { se: SE }) {
  const frais = se.frais_pro ?? 49
  const [etape, setEtape] = useState<Etape>('intro')
  const [anim, setAnim] = useState(0)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')
  const [f, setF] = useState({
    commerce: '', categorie: '', adresse: '',
    prenom: '', nom: '', email: '', tel: '',
    lot: '', quantite: '1', conditions: '',
  })

  function set<K extends keyof typeof f>(k: K, v: string) { setF(p => ({ ...p, [k]: v })) }

  function aller(e: Etape) { setAnim(a => a + 1); setEtape(e) }

  function erreursEtape(e: Etape): string | null {
    if (e === 'commerce') {
      if (!f.commerce.trim()) return 'Le nom du commerce est nécessaire.'
      if (!f.categorie) return 'Choisissez une catégorie.'
      if (!f.adresse.trim()) return "L'adresse est nécessaire."
    }
    if (e === 'contact') {
      if (!f.prenom.trim() || !f.nom.trim()) return 'Prénom et nom sont nécessaires.'
      if (!f.email.includes('@')) return 'Cet email ne semble pas valide.'
      if (f.tel.replace(/\s/g, '').length < 8) return 'Ce téléphone ne semble pas valide.'
    }
    return null
  }

  function suivant() {
    const e = erreursEtape(etape)
    if (e) { setErr(e); return }
    setErr('')
    const i = ETAPES.indexOf(etape as typeof ETAPES[number])
    aller(ETAPES[i + 1] ?? 'recap')
  }
  function precedent() {
    setErr('')
    const i = ETAPES.indexOf(etape as typeof ETAPES[number])
    aller(i <= 0 ? 'intro' : ETAPES[i - 1])
  }

  async function submit() {
    setErr('')
    if (!f.commerce.trim() || !f.categorie || !f.adresse.trim() || !f.prenom.trim() || !f.nom.trim() || !f.email.includes('@') || f.tel.replace(/\s/g, '').length < 8) {
      setErr('Merci de remplir tous les champs obligatoires.')
      return
    }
    setSubmitting(true)
    try {
      const emailLower = f.email.toLowerCase().trim()
      const proId = 'pro-' + slug(emailLower)

      await supabase.from('pros').upsert({
        id: proId, nom: f.commerce.trim(), adresse: f.adresse.trim(), secteur: f.categorie,
        contact: `${f.prenom.trim()} ${f.nom.trim()}`, email: emailLower, tel: f.tel.trim(),
      }, { onConflict: 'id' })

      /* REFERENTIEL 24 — UN SEUL CHEMIN. Cette page creait directement une
         station avec un jeu choisi par le commerce (roue par defaut) : le jeu du
         super event etait ignore et la demande n apparaissait nulle part cote
         SA. Elle depose maintenant la meme demande que /pro/rejoindre ;
         l approbation SA cree la station avec le jeu du super event. */
      const { error: dErr } = await supabase.from('demandes_rattachement_super_event').insert({
        pro_id: proId, super_event_id: se.id, persona: 'commerce',
        nom_commerce: f.commerce.trim(), categorie: f.categorie, adresse: f.adresse.trim(),
        regle_jeu: se.module ?? 'nds2026',
        lots: f.lot.trim() ? [{ titre: f.lot.trim(), valeur_euros: 0, quantite: Number(f.quantite) || 1, conditions: f.conditions.trim() }] : [],
        statut: 'en_attente',
      })
      if (dErr) { setErr("Une erreur est survenue. Réessayez."); setSubmitting(false); return }

      setDone(true)
    } catch {
      setErr("Une erreur est survenue. Réessayez.")
    }
    setSubmitting(false)
  }

  const wrap: React.CSSProperties = { minHeight: '100dvh', width: '100%', boxSizing: 'border-box', background: CHARTE.fond, fontFamily: POLICE_ADMIN, color: CHARTE.texte }
  const surface: React.CSSProperties = { background: CHARTE.carte, border: `1px solid ${CHARTE.bordure}`, borderRadius: 16, padding: '22px 20px 26px', position: 'relative', overflow: 'hidden' }
  const label: React.CSSProperties = { fontSize: 11.5, fontWeight: 800, letterSpacing: '.05em', color: CHARTE.attenue, textTransform: 'uppercase', marginBottom: 6, display: 'block' }
  const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 12, border: `1.5px solid ${CHARTE.bordure}`, background: CHARTE.subtil, fontSize: 15, fontFamily: 'inherit', color: CHARTE.texte, outline: 'none' }
  const field: React.CSSProperties = { marginBottom: 14 }

  /* Desktop (>= 900px) : deux colonnes cote a cote (pitch + formulaire), le
     bandeau orange occupe toute la hauteur de la colonne de gauche. Mobile :
     empile, une colonne, hero en haut. Meme grille qu'avant la refonte. */
  const style = `
    @keyframes rjIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    .rj-page{min-height:100dvh}
    .rj-hero{background:linear-gradient(135deg,${ORANGE},${ORANGE2});color:#fff;padding:44px 24px;text-align:center}
    .rj-corps{padding:0 18px 40px}
    .rj-carte{max-width:540px;margin:-16px auto 0}
    .rj-step{animation:rjIn .28s ease}
    .rj-opt{display:flex;align-items:center;gap:9px;background:${CHARTE.subtil};border:1.5px solid ${CHARTE.bordure};border-radius:12px;padding:11px 13px;cursor:pointer;font-size:13.5px;font-weight:700;color:${CHARTE.texte};text-align:left;font-family:inherit;transition:border-color .12s,background .12s}
    .rj-opt.sel{border-color:${ORANGE};background:rgba(194,65,12,.08);color:${ORANGE}}
    .rj-opt-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}
    @media (min-width:520px){.rj-opt-grid{grid-template-columns:repeat(3,1fr)}}
    .rj-progress{display:flex;gap:6px;margin-bottom:22px}
    .rj-progress-step{flex:1;height:4px;border-radius:2px;background:${CHARTE.bordure}}
    .rj-progress-step.on{background:linear-gradient(90deg,${ORANGE},${ORANGE2})}
    .rj-back{width:34px;height:34px;border-radius:50%;background:${CHARTE.subtil};border:1px solid ${CHARTE.bordure};display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;color:${CHARTE.texte}}
    .rj-nav{display:flex;gap:10px;margin-top:20px}
    .rj-btn{flex:1;background:${ORANGE};color:#fff;font-weight:800;font-size:15.5px;padding:14px;border-radius:12px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}
    .rj-btn:disabled{opacity:.6;cursor:default}
    .rj-btn-ghost{background:none;border:1.5px solid ${CHARTE.bordure};color:${CHARTE.texte};font-weight:700;font-size:14px;padding:14px 18px;border-radius:12px;cursor:pointer}
    @media (min-width:900px){
      .rj-page{display:grid;grid-template-columns:minmax(320px,1fr) minmax(460px,620px)}
      .rj-hero{min-height:100dvh;display:flex;flex-direction:column;justify-content:center;text-align:left;padding:56px}
      .rj-corps{min-height:100dvh;padding:56px 48px;display:flex;align-items:center}
      .rj-carte{margin:0;max-width:100%;width:100%}
    }
  `

  const Titre = ({ icone, titre, sous }: { icone: string; titre: string; sous?: string }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(194,65,12,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORANGE, marginBottom: 10 }}>
        <Ico k={icone} size={20} />
      </div>
      <div style={{ fontSize: 19, fontWeight: 800 }}>{titre}</div>
      {sous && <div style={{ fontSize: 13, color: CHARTE.attenue, marginTop: 4, lineHeight: 1.5 }}>{sous}</div>}
    </div>
  )

  const Progression = () => {
    const i = Math.max(0, ETAPES.indexOf(etape as typeof ETAPES[number]))
    return (
      <div className="rj-progress">
        {ETAPES.map((e, k) => <div key={e} className={`rj-progress-step${k <= i ? ' on' : ''}`} />)}
      </div>
    )
  }

  const Nav = ({ suite = 'Continuer', surSuite = suivant, desactive = false }: { suite?: string; surSuite?: () => void; desactive?: boolean }) => (
    <div className="rj-nav">
      <button className="rj-back" onClick={precedent} aria-label="Précédent"><Ico k="chevronLeft" size={17} /></button>
      <button className="rj-btn" onClick={surSuite} disabled={desactive}>{suite} <Ico k="chevronRight" size={16} /></button>
    </div>
  )

  if (done) {
    return (
      <div style={wrap}>
        <style>{style}</style>
        <div className="rj-page">
          <div className="rj-hero">
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Ico k="check" size={30} style={{ color: '#fff' }} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>Demande envoyée !</div>
          </div>
          <div className="rj-corps">
            <div className="rj-carte">
              <div style={surface} className="rj-step">
                <div style={{ fontSize: 15, lineHeight: 1.6 }}>
                  Merci <strong>{f.prenom}</strong> ! La demande de <strong>{f.commerce}</strong> pour l&apos;opération <strong>{se.nom}</strong> est enregistrée.
                </div>
                <div style={{ background: 'rgba(194,65,12,.07)', borderRadius: 12, padding: '15px 16px', margin: '18px 0', fontSize: 14, lineHeight: 1.6, color: CHARTE.texte }}>
                  Nous validons votre commerce sous 24–48h. Votre <strong>QR à afficher en boutique</strong> et votre <strong>tableau de bord</strong> seront activés à ce moment-là.
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', border: `1px solid ${CHARTE.bordure}`, borderRadius: 12 }}>
                  <span style={{ fontSize: 13.5, color: CHARTE.attenue }}>Frais de participation</span>
                  <span style={{ fontSize: 18, fontWeight: 800 }}>{frais} € HT</span>
                </div>
                <div style={{ fontSize: 12.5, color: CHARTE.attenue, marginTop: 10, lineHeight: 1.5 }}>
                  Déductible si vous souscrivez ensuite à un abonnement Flowin. Les modalités de règlement vous seront communiquées par email.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={wrap}>
      <style>{style}</style>
      <div className="rj-page">
        <div className="rj-hero">
          <div style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.9, letterSpacing: '.05em', textTransform: 'uppercase' }}>Devenez commerce partenaire</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 10, lineHeight: 1.15 }}>{se.nom}</div>
          <div style={{ fontSize: 15, opacity: 0.92, marginTop: 10, maxWidth: 420 }}>
            Animez votre boutique, captez de nouveaux clients et offrez-leur une chance de gagner.
          </div>
        </div>

        <div className="rj-corps">
        <div className="rj-carte">
        <div style={surface} key={anim} className="rj-step">

          {etape === 'intro' && (
            <div style={{ textAlign: 'center', padding: '8px 4px' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(194,65,12,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORANGE, margin: '0 auto 16px' }}>
                <Ico k="shop" size={26} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Rejoindre en 4 étapes</div>
              <div style={{ fontSize: 13.5, color: CHARTE.attenue, lineHeight: 1.6, marginBottom: 22 }}>
                Votre commerce, votre contact, votre lot pour le tirage — moins de deux minutes,
                validé par l&apos;équipe Flowin sous 24–48h.
              </div>
              <button className="rj-btn" style={{ width: '100%' }} onClick={() => aller('commerce')}>
                Commencer <Ico k="chevronRight" size={16} />
              </button>
              <div style={{ fontSize: 12, color: CHARTE.attenue, marginTop: 12 }}>Sans engagement · {frais} € HT de participation</div>
            </div>
          )}

          {etape === 'commerce' && (<>
            <Progression />
            <Titre icone="shop" titre="Votre commerce" sous="Comment s'appelle-t-il, et où le trouve-t-on ?" />
            <div style={field}><label style={label}>Nom du commerce *</label><input style={input} value={f.commerce} onChange={e => set('commerce', e.target.value)} autoFocus /></div>
            <div style={field}>
              <label style={label}>Catégorie *</label>
              <div className="rj-opt-grid">
                {CATEGORIES.map(c => (
                  <button key={c.nom} type="button" className={`rj-opt${f.categorie === c.nom ? ' sel' : ''}`} onClick={() => set('categorie', c.nom)}>
                    {c.nom}
                  </button>
                ))}
              </div>
            </div>
            <div style={field}><label style={label}>Adresse *</label><input style={input} value={f.adresse} onChange={e => set('adresse', e.target.value)} placeholder="N°, rue, code postal, ville" /></div>
            {err && <div style={{ background: '#FEECEC', color: '#B42318', borderRadius: 10, padding: '11px 14px', fontSize: 13.5, marginBottom: 4 }}>{err}</div>}
            <Nav />
          </>)}

          {etape === 'contact' && (<>
            <Progression />
            <Titre icone="user" titre="Votre contact" sous="Pour vous transmettre votre accès et vos billets." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
              <div style={field}><label style={label}>Prénom *</label><input style={input} value={f.prenom} onChange={e => set('prenom', e.target.value)} autoFocus /></div>
              <div style={field}><label style={label}>Nom *</label><input style={input} value={f.nom} onChange={e => set('nom', e.target.value)} /></div>
            </div>
            <div style={field}><label style={label}>Email *</label><input style={input} type="email" inputMode="email" autoCapitalize="none" value={f.email} onChange={e => set('email', e.target.value)} /></div>
            <div style={field}><label style={label}>Téléphone *</label><input style={input} type="tel" inputMode="tel" value={f.tel} onChange={e => set('tel', e.target.value)} /></div>
            {err && <div style={{ background: '#FEECEC', color: '#B42318', borderRadius: 10, padding: '11px 14px', fontSize: 13.5, marginBottom: 4 }}>{err}</div>}
            <Nav />
          </>)}

          {etape === 'lot' && (<>
            <Progression />
            <Titre icone="gift" titre="Votre lot pour le tirage" sous="Facultatif : vous pourrez le compléter avec l'équipe Flowin." />
            <div style={{ ...field, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(194,65,12,.07)', borderRadius: 10, padding: '10px 14px', fontSize: 13.5 }}>
              <Ico k="game" size={16} style={{ color: ORANGE, flexShrink: 0 }} />
              <div>
                <strong>{libelleModule(se.module ?? 'nds2026')}</strong>
                <div style={{ fontSize: 12, marginTop: 2, color: CHARTE.attenue }}>Jeu choisi par l&apos;organisateur, gagnants désignés par tirage au sort.</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 11 }}>
              <div style={field}><label style={label}>Lot offert</label><input style={input} value={f.lot} onChange={e => set('lot', e.target.value)} placeholder="ex : 1 bon d'achat de 20 €" autoFocus /></div>
              <div style={field}><label style={label}>Quantité</label><input style={input} inputMode="numeric" value={f.quantite} onChange={e => set('quantite', e.target.value)} /></div>
            </div>
            <div style={field}>
              <label style={label}>Conditions d&apos;utilisation</label>
              <input style={input} value={f.conditions} onChange={e => set('conditions', e.target.value)} placeholder="ex : valable sur présentation du billet" />
            </div>
            <Nav suite="Voir le récapitulatif" />
          </>)}

          {etape === 'recap' && (<>
            <Progression />
            <Titre icone="check" titre="Tout est bon ?" sous="Vérifiez, puis envoyez votre demande." />
            {([
              ['Commerce', `${f.commerce || '—'} · ${f.categorie || '—'}`],
              ['Adresse', f.adresse || '—'],
              ['Contact', `${f.prenom} ${f.nom} · ${f.email}`],
              ['Téléphone', f.tel || '—'],
              ['Lot', f.lot ? `${f.lot} × ${f.quantite || 1}` : 'À compléter avec Flowin'],
            ] as const).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: `1px solid ${CHARTE.bordure}`, fontSize: 13.5 }}>
                <span style={{ color: CHARTE.attenue, fontWeight: 700 }}>{k}</span>
                <span style={{ fontWeight: 700, textAlign: 'right' }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0 4px', marginTop: 8 }}>
              <span style={{ fontSize: 13.5, color: CHARTE.attenue }}>Frais de participation</span>
              <span style={{ fontSize: 18, fontWeight: 800 }}>{frais} € HT</span>
            </div>
            {err && <div style={{ background: '#FEECEC', color: '#B42318', borderRadius: 10, padding: '11px 14px', fontSize: 13.5, margin: '10px 0 0' }}>{err}</div>}
            <div className="rj-nav">
              <button className="rj-back" onClick={precedent} aria-label="Précédent"><Ico k="chevronLeft" size={17} /></button>
              <button className="rj-btn" onClick={submit} disabled={submitting}>
                {submitting ? 'Envoi…' : `Rejoindre l'opération →`}
              </button>
            </div>
            <div style={{ fontSize: 12, color: CHARTE.attenue, textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
              Sans engagement. Validation sous 24–48h. Données jamais cédées.
            </div>
          </>)}

        </div>
        </div>
        </div>
      </div>
    </div>
  )
}
