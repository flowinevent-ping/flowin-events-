'use client'

/**
 * FICHE D UNE OPERATION (P1, 16/09) — tout ce qui concerne UNE operation
 * (event ou super event), au meme endroit, en onglets. Les contenus sont
 * ceux des blocs deja utilises cote SA et cote pro (BlocsOperations).
 *
 * Mise en page (16/09 soir, retour Romain « on ne voit rien ») : bandeau de
 * l operation avec ses chiffres, barre d onglets fixe en haut, contenu en
 * dessous. Aucune emoticone.
 */
import { useState } from 'react'
import { fetchOperationsPro, libelleDates, libelleModule, type OperationsPro } from '@/lib/operations'
import { ONGLETS_OP, LIBELLE_PERIODE, periodeOperation, type OngletOp } from '@/lib/ongletsOperation'
import { ContenuLots, ContenuComm, ContenuContrat, ContenuTracking } from '@/components/operations/BlocsOperations'
import CrmPro from '@/components/pro/CrmPro'
import type { ContactPro } from '@/lib/crmPro'
import { BlocGagnants } from '@/components/pro/GagnantsClient'
import ParcoursMobil from '@/components/pro/ParcoursMobil'
import { CHARTE_PRO as C } from '@/lib/charte'
import { CARD, MUTED, BTN2 } from '@/lib/proui'
import { COULEURS_ETAPES } from '@/components/parcours/BandeauEtapes'

export default function FicheOperationPro({ initial, cle, onglet: ongletInitial, contacts }: { initial: OperationsPro; cle: string; onglet: OngletOp; contacts: ContactPro[] }) {
  const [data, setData] = useState(initial)
  const [onglet, setOnglet] = useState<OngletOp>(ongletInitial)
  const recharger = () => { fetchOperationsPro(initial.proId).then(setData) }
  const op = data.operations.find(o => o.cle === cle)
  const q = `?pro=${encodeURIComponent(initial.proId)}`
  if (!op) return <div style={CARD}>Opération introuvable. <a href={`/pro${q}`} style={{ color: C.accent, fontWeight: 700 }}>Mes opérations</a></div>
  const pt = data.partenaire
  const st = op.stations[0]
  const parties = op.stations.reduce((n, s) => n + (s.participants ?? 0), 0)
  const remis = op.gagnants.filter(g => g.etat === 'retire').length
  const lotsTotal = op.lots.reduce((n, l) => n + (l.quantite || 0), 0)
  const periode = periodeOperation(op.dateD, op.dateF, op.status)
  /* Code couleur (18/09, « applique ces choses sur la totalite de
     l'environnement ») : le bandeau restait bleu meme pour un super event --
     COULEURS_ETAPES est deja la source unique du parcours de creation
     (components/parcours/BandeauEtapes.tsx), reprise ici a l'identique. */
  const [teinte1, teinte2] = COULEURS_ETAPES[op.type === 'super' ? 'super' : 'event']

  function changer(o: OngletOp) {
    setOnglet(o)
    try {
      const u = new URL(window.location.href)
      u.searchParams.set('onglet', o)
      window.history.replaceState(null, '', u.toString())
    } catch { /* rien */ }
  }

  const chiffre = (v: number | string, l: string) => (
    <div style={{ flex: '0 1 150px', background: 'rgba(255,255,255,.12)', borderRadius: 12, padding: '7px 12px' }}>
      <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.1 }}>{v}</div>
      <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.85 }}>{l}</div>
    </div>
  )

  return (
    <div>
      <a href={`/pro${q}`} style={{ fontSize: 13, fontWeight: 700, color: C.accent, textDecoration: 'none' }}>← Mes opérations</a>

      {/* Bandeau de l operation */}
      <div style={{ borderRadius: 20, overflow: 'hidden', marginTop: 10, background: `linear-gradient(135deg,${teinte1},${teinte2})`, color: '#fff', position: 'relative', boxShadow: '0 12px 30px rgba(43,16,54,.18)' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: C.filet }} />
        <div style={{ padding: '15px 20px 14px' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', background: 'rgba(255,255,255,.16)', borderRadius: 50, padding: '4px 10px' }}>
              {op.type === 'super' ? 'Super event' : 'Animation'}
            </span>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', background: periode === 'en_cours' ? C.magenta : 'rgba(255,255,255,.16)', borderRadius: 50, padding: '4px 10px' }}>
              {LIBELLE_PERIODE[periode]}
            </span>
          </div>
          <div style={{ fontSize: 21, fontWeight: 800, marginTop: 6, lineHeight: 1.15 }}>{op.nom}</div>
          <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>
            {libelleDates(op.dateD, op.dateF)} · {libelleModule(st?.module)}
            {op.type === 'super' ? ` · ${op.stations.length > 1 ? `${op.stations.length} stations` : `station : ${st?.nom ?? '—'}`}` : ''}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 11 }}>
            {chiffre(parties, op.type === 'super' ? 'parties sur votre station' : 'parties')}
            {chiffre(lotsTotal, 'lots engagés')}
            {chiffre(op.gagnants.length, 'gagnants')}
            {chiffre(op.gagnants.length - remis, 'lots à remettre')}
          </div>
        </div>
      </div>

      {/* Onglets : barre fixe en haut de la page */}
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: C.fond, padding: '10px 0 8px' }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', background: '#fff', border: `1px solid ${C.bordure}`, borderRadius: 14, padding: 5 }}>
          {ONGLETS_OP.map(o => (
            <button key={o.id} onClick={() => changer(o.id)}
              style={{ border: 'none', borderRadius: 12, padding: '8px 13px', fontWeight: 800, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                background: onglet === o.id ? C.degrade : 'transparent', color: onglet === o.id ? '#fff' : C.texte }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...CARD, padding: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>{ONGLETS_OP.find(o => o.id === onglet)?.label}</div>

        {onglet === 'jeu' && st && (
          <div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ flex: 1, minWidth: 220, fontSize: 13.5, ...MUTED }}>
                {op.type === 'super' ? 'Le jeu du super event, identique sur chaque station. Choisissez la vue « event » ou « super event ».' : 'Le jeu de votre animation, tel que vos clients le voient.'}
              </div>
              {op.type === 'super'
                ? <a href={`/pro/super${q}&se=${encodeURIComponent(op.id)}`} style={{ ...BTN2, display: 'inline-block', textDecoration: 'none' }}>Carte et bilan du super event</a>
                : <a href={`/pro/super/${encodeURIComponent(st.id)}${q}`} style={{ ...BTN2, display: 'inline-block', textDecoration: 'none' }}>Activité détaillée</a>}
            </div>
            {/* Parcours mobil d origine : parcours event + parcours super event, choix de la station. */}
            <ParcoursMobil events={op.stations.map(s => ({ id: s.id, module: s.module, nom: s.nom, super_event_id: s.super_event_id }))} showTitle={false} />
          </div>
        )}
        {onglet === 'lots' && <ContenuLots op={op} partenaire={pt} onChange={recharger} />}
        {onglet === 'diffusion' && <ContenuComm op={op} partenaireId={pt?.id ?? null} partenaireSe={pt?.super_event_id ?? null} mode="pro" />}
        {onglet === 'gagnants' && <BlocGagnants op={op} data={data} onChange={recharger} />}
        {onglet === 'trafic' && <ContenuTracking op={op} proId={data.proId} onStation={id => { window.location.href = `/pro/super/${encodeURIComponent(id)}${q}` }} masquerGlobal />}
        {onglet === 'crm' && <CrmPro proId={data.proId} proNom={data.proNom ?? ''} contacts={contacts} operations={[]} operationFixe={op.cle} />}
        {onglet === 'bons' && <ContenuContrat op={op} mode="pro" partenaireId={pt?.id ?? null} onChange={recharger} />}
      </div>
    </div>
  )
}
