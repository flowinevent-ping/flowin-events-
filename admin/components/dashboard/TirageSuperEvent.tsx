'use client'

/**
 * TIRAGE AU SORT D UN SUPER EVENT — referentiel 34 et 35.
 *
 * « Super event : tirage au sort uniquement », piloté par le SA. Le tirage
 * n existait que dans tirage-nds.html, ecrit pour Nuits du Sud. Ici, depuis la
 * fiche du super event : ses lots, rangés par station, ce qu il en reste, et
 * un bouton de tirage (RPC tirage_super_event). Les gagnants sortent « a
 * confirmer » : le SA les appelle, puis confirme depuis la liste des gagnants.
 */

import { useEffect, useState } from 'react'
import { supabase, sessionPourTirage, MESSAGE_CONNEXION_TIRAGE } from '@/lib/supabase'
import { SectionHeader } from './DashboardUI'
import { Ico } from '@/lib/proicons'
import { lirePhases, phaseDuLot, periodePhase, LIBELLE_PHASE, ORANGE_SE, type Phase, type PhasesSE } from '@/lib/superEventPhases'

interface LotSE { id: string; event_id: string; titre: string | null; nom: string | null; quantite: number | null; valeur: number | null; phase?: string | null; orga?: boolean }
interface Station { id: string; nom: string | null }
interface Tire { id: number; joueur_nom: string | null; lot_nom: string | null; event_id: string | null; statut: string | null }

export default function TirageSuperEvent({ seId, stations }: { seId: string; stations: Station[] }) {
  const [global, setGlobal] = useState<boolean | null>(null)
  /* Deux phases (19/11) : actives seulement si cfg_jeu.phases et la colonne phase (SQL du 19/11) existent. */
  const [phases, setPhases] = useState<PhasesSE | null>(null)
  const [lots, setLots] = useState<LotSE[]>([])
  const [tires, setTires] = useState<Tire[]>([])
  const [nb, setNb] = useState<Record<string, number>>({})
  const [occupe, setOccupe] = useState<string | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null)
  const ids = stations.map(s => s.id)
  const cle = ids.join(',')

  async function charger() {
    const [{ data: t }, { data: se }, orga] = await Promise.all([
      supabase.from('tirages').select('id,joueur_nom,lot_nom,event_id,statut').eq('super_event_id', seId).neq('statut', 'annule'),
      supabase.from('super_events').select('id,tirage_global,date_d,date_f,cfg_jeu').eq('id', seId).maybeSingle(),
      supabase.from('se_lots').select('id,libelle,valeur,phase').eq('super_event_id', seId).order('rang'),
    ])
    let l: LotSE[] = []
    if (ids.length) {
      let r = await supabase.from('lots').select('id,event_id,titre,nom,quantite,valeur,phase').in('event_id', ids)
      if (r.error) r = await supabase.from('lots').select('id,event_id,titre,nom,quantite,valeur').in('event_id', ids) as typeof r
      l = (r.data ?? []) as LotSE[]
    }
    setGlobal((se as { tirage_global: boolean | null } | null)?.tirage_global ?? null)
    const ph = lirePhases(se as { id: string; date_d: string | null; date_f: string | null; cfg_jeu: unknown } | null)
    /* orga.error = colonne phase absente : SQL du 19/11 non applique -> une seule phase. */
    const actif = ph.actif && !orga.error
    setPhases(actif ? ph : null)
    if (actif) {
      /* Lots de l'organisateur (se_lots, un rang = un exemplaire) regroupes par libelle. */
      const m = new Map<string, LotSE>()
      ;((orga.data ?? []) as { id: string; libelle: string | null; valeur: number | null; phase: string | null }[]).forEach(x => {
        const k = x.libelle ?? 'Lot'
        const e = m.get(k)
        if (e) e.quantite = (e.quantite ?? 1) + 1
        else m.set(k, { id: x.id, event_id: '', titre: x.libelle, nom: x.libelle, quantite: 1, valeur: x.valeur, phase: x.phase, orga: true })
      })
      l = Array.from(m.values()).concat(l)
    }
    setLots(l)
    setTires((t ?? []) as Tire[])
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { charger() }, [seId, cle])

  const nomLot = (l: LotSE) => (l.titre || l.nom || 'Lot')
  /* 18/11 : le SQL corrige enregistre lots.nom d'abord ; on compte les deux libelles. */
  const dejaTires = (l: LotSE) => tires.filter(t => (l.orga ? !t.event_id : t.event_id === l.event_id) && (t.lot_nom === l.nom || t.lot_nom === l.titre)).length
  const phaseLot = (l: LotSE): Phase => phaseDuLot({ phase: l.phase, source: l.orga ? 'organisateur' : 'station' })

  async function tirer(l: LotSE) {
    const n = Math.max(1, nb[l.id] ?? 1)
    setOccupe(l.id); setMessage(null)
    if (!await sessionPourTirage()) { setOccupe(null); setMessage({ ok: false, texte: MESSAGE_CONNEXION_TIRAGE }); return }
    const { data, error } = await supabase.rpc('tirage_super_event', { p_lot_id: l.id, p_nb: n })
    setOccupe(null)
    if (error) { setMessage({ ok: false, texte: `Tirage impossible — ${error.message}` }); return }
    const sortis = (data ?? []) as Tire[]
    setMessage(sortis.length
      ? { ok: true, texte: `${sortis.length} gagnant${sortis.length > 1 ? 's' : ''} tiré${sortis.length > 1 ? 's' : ''} pour « ${nomLot(l)} » : ${sortis.map(s => s.joueur_nom).join(', ')}. À appeler puis confirmer dans la liste des gagnants.` }
      : { ok: false, texte: 'Aucun gagnant tiré : lot épuisé, ou plus aucun joueur éligible.' })
    charger()
  }

  /* Fin du tirage : chaque participant voit son resultat (gagne / pas tire) dans son profil
     (sql/10-resultats-tirage.sql). Sans cette fonction en base : message clair, rien ne casse. */
  async function terminer() {
    setOccupe('fin'); setMessage(null)
    const { data, error } = await supabase.rpc('enregistrer_resultats_tirage_super', { p_super_event_id: seId })
    setOccupe(null)
    if (error) { setMessage({ ok: false, texte: 'Enregistrement des résultats indisponible pour le moment (la fonction n’est pas encore en base).' }); return }
    setMessage(Number(data) > 0
      ? { ok: true, texte: `Tirage terminé : ${data} résultat${Number(data) > 1 ? 's' : ''} enregistré${Number(data) > 1 ? 's' : ''} (gagné / pas tiré). Les joueurs le voient dans leur profil.` }
      : { ok: false, texte: 'Rien à enregistrer : aucun gagnant tiré depuis le dernier tirage terminé.' })
  }

  const ligne = (l: LotSE) => {
            const reste = Math.max(0, (l.quantite ?? 1) - dejaTires(l))
            return (
              <div key={l.id} className="sa-list-item">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{nomLot(l)}{l.orga ? ' · organisateur' : ''}</div>
                  <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>
                    {l.valeur ? `${l.valeur} € · ` : ''}{dejaTires(l)} tiré{dejaTires(l) > 1 ? 's' : ''} sur {l.quantite ?? 1} · {reste} restant{reste > 1 ? 's' : ''}
                  </div>
                </div>
                {reste > 0 && (
                  <>
                    <input
                      className="sa-input" type="number" min={1} max={reste} style={{ width: 70 }}
                      value={Math.min(nb[l.id] ?? 1, reste)}
                      onChange={e => setNb(x => ({ ...x, [l.id]: Math.max(1, Math.min(reste, parseInt(e.target.value) || 1)) }))}
                    />
                    <button className="sa-btn sm primary" disabled={occupe === l.id} onClick={() => tirer(l)}>
                      {occupe === l.id ? '…' : 'Tirer'}
                    </button>
                  </>
                )}
              </div>
            )
  }

  return (
    <>
      <SectionHeader>Tirage au sort</SectionHeader>
      <div style={{ fontSize: 12, color: 'var(--sa-muted)', marginBottom: 10, lineHeight: 1.5 }}>
        {global === false
          ? 'Tirage par station : chaque lot est tiré parmi les joueurs de sa station.'
          : 'Tirage global : chaque lot est tiré parmi tous les joueurs de l’opération.'}
        {' '}Chances proportionnelles aux tickets · un joueur ne gagne qu’une fois par opération · comptes de test exclus.{phases ? ' Chaque phase est tirée parmi les joueurs de sa période.' : ''}
      </div>
      {message && (
        <div className={`sa-alert ${message.ok ? 'info' : 'warn'}`} style={{ fontSize: 12.5, marginBottom: 10 }}>{message.texte}</div>
      )}
      {lots.length === 0 && (
        <div style={{ fontSize: 12.5, color: 'var(--sa-muted)' }}>Aucun lot enregistré sur les stations de ce super event.</div>
      )}
      {(phases ? (['avant', 'pendant'] as Phase[]) : [null]).map(ph => {
        const dans = (l: LotSE) => ph === null || phaseLot(l) === ph
        return (
          <div key={ph ?? 'unique'} data-tirage-phase={ph ?? undefined}>
            {ph && phases && (
              <div style={{ fontSize: 12.5, fontWeight: 900, color: ORANGE_SE, margin: '14px 0 2px' }}>
                {LIBELLE_PHASE[ph]}{periodePhase(phases, ph) ? ` · ${periodePhase(phases, ph)}` : ''}
              </div>
            )}
            {lots.filter(l => l.orga && dans(l)).map(l => ligne(l))}
            {stations.filter(s => lots.some(l => !l.orga && l.event_id === s.id && dans(l))).map(s => (
              <div key={s.id} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--sa-muted)', margin: '10px 0 2px' }}>
                  <Ico k="pin" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />{s.nom ?? s.id}
                </div>
                {lots.filter(l => !l.orga && l.event_id === s.id && dans(l)).map(l => ligne(l))}
              </div>
            ))}
          </div>
        )
      })}
      {tires.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--sa-border)' }}>
          <div style={{ fontSize: 12, color: 'var(--sa-muted)', marginBottom: 8, lineHeight: 1.5 }}>
            Tirage terminé ? Chaque participant verra son résultat dans l’application ; ceux qui n’ont pas été tirés reçoivent un e-mail de service (réglage de l’opération).
          </div>
          <button className="sa-btn sm" disabled={occupe === 'fin'} onClick={terminer}>{occupe === 'fin' ? '…' : 'Terminer le tirage et prévenir les participants'}</button>
        </div>
      )}
    </>
  )
}
